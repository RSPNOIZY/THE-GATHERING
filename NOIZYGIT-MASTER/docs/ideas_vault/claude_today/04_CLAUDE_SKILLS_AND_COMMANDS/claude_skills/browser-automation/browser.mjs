#!/usr/bin/env node
/**
 * browser-automation — load a page, report what actually happened.
 *
 * Text-first by economy: console errors, failed requests and the accessibility
 * tree catch most breakage for a fraction of the tokens a frame costs, and they
 * answer questions about structure and state that a picture cannot. Screenshots
 * ARE readable now (see core/engine/image-read.ts) — they are just the expensive
 * instrument, kept for the questions that are actually visual.
 */
import { createRequire } from 'node:module'
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

/**
 * Never hardcode the extension version directory — it is rewritten on every
 * update, which is exactly how the CLI shim breaks when something pins it.
 * Glob and take the highest version present.
 */
function resolveChromium() {
  const roots = []
  for (const base of [
    join(homedir(), '.vscode-server/extensions'),
    join(homedir(), '.vscode/extensions'),
  ]) {
    if (!existsSync(base)) continue
    const dirs = readdirSync(base)
      .filter((d) => d.startsWith('danielsanmedium.dscodegpt-'))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      )
    const newest = dirs[dirs.length - 1]
    if (newest) roots.push(join(base, newest, 'standalone') + '/')
  }
  roots.push('/home/mike/src/codegpt/codegpt-nextjs/', process.cwd() + '/')
  for (const root of roots) {
    try {
      const mod = createRequire(root)('patchright')
      const chromium = mod?.chromium ?? mod?.default?.chromium
      if (chromium) return { chromium, root }
    } catch {}
  }
  throw new Error(
    'Could not resolve patchright. Checked:\n  ' + roots.join('\n  '),
  )
}

const args = process.argv.slice(2)
const flag = (n) => {
  const i = args.indexOf(n)
  return i === -1 ? undefined : args[i + 1]
}
/**
 * The positional url is the first bare arg — but NOT the value that belongs to a
 * value-taking flag. Without this, `--session my-id` makes `my-id` look like the
 * url and the tool tries to navigate to it. Boolean flags (--snapshot/--full/
 * --close) consume no value, so their following bare arg IS the url.
 */
const VALUE_FLAGS = new Set([
  '--wait',
  '--eval',
  '--script',
  '--screenshot',
  '--timeout',
  '--session',
])
const url = (() => {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a.startsWith('--')) {
      if (VALUE_FLAGS.has(a)) i++
      continue
    }
    return a
  }
  return undefined
})()

/**
 * Session mode. A one-shot launch is the right default — most QA is "load this,
 * tell me what broke" — but a live-app loop (drive a form, think, drive more)
 * needs the SAME page to survive between invocations, because the whole ref
 * scheme dies on a fresh context. `--session <id>` keeps a detached chromium
 * alive across calls; each call reconnects to it over CDP, acts on the page it
 * left open, and exits WITHOUT killing the browser. `--close` tears it down.
 *
 * Why a detached chrome + CDP rather than launchServer(): launchServer ties the
 * browser's lifetime to THIS node process, which exits after every call. We want
 * the browser to outlive the call, so chrome is spawned as its own detached
 * process and every invocation just connects to its debugging port.
 */
const sessionId = flag('--session')
const closing = args.includes('--close')
const sessionMode = !!sessionId

const sessionDir = join(homedir(), '.codegpt', 'ab-sessions')
const sessionFile = (id) => join(sessionDir, `${id}.json`)
const sessionProfile = (id) => join(sessionDir, `${id}-profile`)

// url is required in the classic one-shot; in session mode it is optional
// (omit it to act on the page the session already has open).
if (!url && !sessionMode) {
  console.error(
    'usage: browser.mjs <url> [--snapshot [--full]] [--wait sel] [--eval js]' +
      ' [--script f] [--screenshot p] [--timeout ms]\n' +
      '       browser.mjs [url] --session <id> [ ...actions ]   # persistent page across calls\n' +
      '       browser.mjs --session <id> --close                # tear the session down',
  )
  process.exit(2)
}
const timeout = Number(flag('--timeout') ?? 30000)

const { chromium, root } = resolveChromium()

/** Ask the OS for a free TCP port by binding :0 and reading it back. */
const freePort = () =>
  new Promise((res, rej) => {
    const srv = createServer()
    srv.on('error', rej)
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port
      srv.close(() => res(p))
    })
  })

/** Is a chrome DevTools endpoint answering on this port? */
const cdpReachable = async (port) => {
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), 800)
    const r = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: c.signal })
    clearTimeout(t)
    return r.ok
  } catch {
    return false
  }
}

/**
 * Connect to the session's browser, launching a fresh detached chrome the first
 * time (or if the recorded one is gone). Returns a connected Browser plus the
 * page to act on — the one the session left open, or a new blank one.
 */
async function acquireSession(id) {
  mkdirSync(sessionDir, { recursive: true })
  let meta = null
  try {
    meta = JSON.parse(readFileSync(sessionFile(id), 'utf8'))
  } catch {}

  if (!meta || !(await cdpReachable(meta.port))) {
    // Stale or first run — spawn a new detached chrome that outlives us.
    const port = await freePort()
    const child = spawn(
      chromium.executablePath(),
      [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${sessionProfile(id)}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        // opt into software WebGL so headless Chromium doesn't warn about the
        // deprecated automatic SwiftShader fallback on WebGL/canvas pages
        '--enable-unsafe-swiftshader',
        'about:blank',
      ],
      { detached: true, stdio: 'ignore' },
    )
    child.unref()
    meta = { port, pid: child.pid, id }
    // Wait for the debugging port to come up before we try to connect.
    const start = Date.now()
    while (Date.now() - start < 10000) {
      if (await cdpReachable(port)) break
      await new Promise((r) => setTimeout(r, 100))
    }
    writeFileSync(sessionFile(id), JSON.stringify(meta))
  }

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${meta.port}`)
  const context = browser.contexts()[0] ?? (await browser.newContext({ locale: 'en-US' }))
  const page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage())
  return { browser, page, meta }
}

// --close: kill the detached chrome and forget the session. No page work.
if (sessionMode && closing) {
  let meta = null
  try {
    meta = JSON.parse(readFileSync(sessionFile(sessionId), 'utf8'))
  } catch {}
  // Kill the process GROUP, not the pid. chrome's launcher process exec's/exits
  // right after startup, so meta.pid is usually already gone while the real
  // browser lives on — but because we spawned detached, the browser is in the
  // group led by meta.pid, so -pid reaches it. SIGKILL follows as a backstop.
  if (meta?.pid) {
    try { process.kill(-meta.pid, 'SIGTERM') } catch {}
    try { process.kill(meta.pid, 'SIGTERM') } catch {}
    const t = setTimeout(() => {
      try { process.kill(-meta.pid, 'SIGKILL') } catch {}
    }, 1500)
    if (typeof t.unref === 'function') t.unref()
  }
  try {
    rmSync(sessionFile(sessionId), { force: true })
  } catch {}
  console.log(`session    ${sessionId}  closed${meta?.pid ? ` (pgid ${meta.pid})` : ''}`)
  // Give SIGTERM a moment to land before we exit (the SIGKILL timer is unref'd).
  await new Promise((r) => setTimeout(r, 300))
  process.exit(0)
}

let browser, ctx, page
if (sessionMode) {
  ;({ browser, page } = await acquireSession(sessionId))
} else {
  browser = await chromium.launch({
    headless: true,
    channel: 'chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
  })
  ctx = await browser.newContext({ locale: 'en-US' })
  page = await ctx.newPage()
}

const consoleMsgs = []
const failures = []
/**
 * Headless Chromium's software-WebGL fallback (SwiftShader) emits deprecation
 * and context-lost warnings that say nothing about the page under test — they
 * fire on any page that touches a <canvas>/WebGL context. SwiftShader is opted
 * into via the launch flags above; these residual lines are pure host noise.
 */
const CONSOLE_NOISE = /GroupMarkerNotSet|Automatic fallback to software WebGL|CONTEXT_LOST_WEBGL|Failed to create WebGL|swiftshader/i
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    const text = m.text()
    if (CONSOLE_NOISE.test(text)) return
    consoleMsgs.push(`[${m.type()}] ${text.slice(0, 300)}`)
  }
})
page.on('pageerror', (e) => consoleMsgs.push(`[uncaught] ${String(e).slice(0, 300)}`))
/**
 * Third-party analytics/ads are blocked in most environments and drown the
 * signal — a first run against the CodeGPT sidebar reported 8 "failures", 6 of
 * which were doubleclick and google-analytics beacons. Only same-origin and
 * unknown hosts are worth the reader's attention.
 */
const NOISE = /(^|\.)(google|googletagmanager|google-analytics|doubleclick|facebook|segment|sentry|posthog|mixpanel)\./
const noisy = (u) => { try { return NOISE.test(new URL(u).hostname) } catch { return false } }
page.on('requestfailed', (r) => {
  if (!noisy(r.url())) failures.push(`${r.failure()?.errorText ?? 'failed'} ${r.url().slice(0, 140)}`)
})
page.on('response', (r) => {
  if (r.status() >= 400 && !noisy(r.url())) failures.push(`HTTP ${r.status()} ${r.url().slice(0, 140)}`)
})

const t0 = Date.now()
let status = 0
let navError = null
try {
  // In session mode the url is optional: without it, act on whatever page the
  // session already has open instead of navigating.
  if (url) {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
    status = resp?.status() ?? 0
  }
  const wait = flag('--wait')
  if (wait) await page.waitForSelector(wait, { timeout })
  /**
   * Wait for CONTENT, not for a fixed delay. A flat 1200ms sleep reported
   * bodyChars 0 on one run of the CodeGPT sidebar and 169 on the next — same
   * URL, same build. A client-rendered app that is merely slow is
   * indistinguishable from one that is broken unless you actually wait for it.
   */
  await page
    .waitForFunction(() => (document.body?.innerText || '').trim().length > 0, {
      timeout: Math.min(timeout, 15000),
    })
    .catch(() => {})
} catch (e) {
  navError = String(e).split('\n')[0]
}


/**
 * Accessibility snapshot with clickable refs.
 *
 * WHY REFS. Driving a page by CSS selector means AUTHORING a selector from a
 * DOM you cannot see, and a selector that matches nothing fails exactly like an
 * element that is absent — the single most expensive failure mode in practice.
 * A snapshot that hands back `@e7 button "Run"` removes the authoring step: you
 * click what the page says is there.
 *
 * Rolled by hand because patchright 1.61's ariaSnapshot() has no refs —
 * `{ref: true}` returns the identical string, and `_snapshotForAI` (what
 * Playwright's own MCP server uses) is not exposed. The structure ariaSnapshot
 * gives is still the best readable view of the page, so `full` returns that
 * instead; refs are for acting, the aria tree is for reading.
 *
 * The ref is stamped as a data attribute IN the page, so it dies on navigation
 * or a re-render. That is why re-snapshotting after anything that changes the
 * page is part of the contract rather than an optimisation.
 */
const REF_ATTR = 'data-ab-ref'
const MAX_SNAPSHOT_CHARS = 15000

const snapshotWithRefs = async (page, { full = false } = {}) => {
  if (full) {
    const aria = await page.locator('body').ariaSnapshot().catch(() => '')
    return aria.length > MAX_SNAPSHOT_CHARS
      ? aria.slice(0, MAX_SNAPSHOT_CHARS) + `\n… [truncated at ${MAX_SNAPSHOT_CHARS} chars]`
      : aria
  }

  return await page.evaluate(
    ({ attr, cap }) => {
      const INTERACTIVE =
        'button, a[href], input, select, textarea, summary, [contenteditable="true"],' +
        '[role=button], [role=link], [role=checkbox], [role=radio], [role=tab],' +
        '[role=menuitem], [role=option], [role=switch], [role=textbox], [role=combobox]'

      // Accessible name, in roughly the order the accname spec resolves it.
      // Deliberately not a full implementation — enough that a human-readable
      // label comes out for the things one actually clicks.
      const nameOf = (el) => {
        const byLabelled = el.getAttribute('aria-labelledby')
        if (byLabelled) {
          const t = byLabelled
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.innerText || '')
            .join(' ')
            .trim()
          if (t) return t
        }
        const aria = el.getAttribute('aria-label')
        if (aria?.trim()) return aria.trim()
        if (el.id) {
          const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
          if (lbl?.innerText?.trim()) return lbl.innerText.trim()
        }
        const own = (el.innerText || '').replace(/\s+/g, ' ').trim()
        if (own) return own
        for (const a of ['placeholder', 'title', 'alt', 'value', 'name']) {
          const v = el.getAttribute(a)
          if (v?.trim()) return v.trim()
        }
        // Icon-only controls have no text and no label — and they are exactly
        // the ones a name-based locator cannot find, so anything that
        // distinguishes them is worth more here than elsewhere.
        const inner = el.querySelector('[aria-label], img[alt], svg[data-icon], [data-testid]')
        const hint =
          inner?.getAttribute('aria-label') ||
          inner?.getAttribute('alt') ||
          inner?.getAttribute('data-icon') ||
          inner?.getAttribute('data-testid')
        if (hint?.trim()) return hint.trim()
        return ''
      }

      const roleOf = (el) => {
        const explicit = el.getAttribute('role')
        if (explicit) return explicit
        const tag = el.tagName.toLowerCase()
        if (tag === 'a') return 'link'
        if (tag === 'input') return el.type === 'checkbox' || el.type === 'radio' ? el.type : 'textbox'
        if (tag === 'textarea') return 'textbox'
        return tag
      }

      // Clear stale refs so numbering restarts and a dead ref cannot resolve.
      for (const old of document.querySelectorAll(`[${attr}]`)) old.removeAttribute(attr)

      const lines = []
      let n = 0
      for (const el of document.querySelectorAll(INTERACTIVE)) {
        const r = el.getBoundingClientRect()
        // Zero-area or display:none elements are not clickable and would only
        // pad the list; an offscreen-but-scrollable one still counts.
        if (r.width === 0 || r.height === 0) continue
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden' || style.display === 'none') continue

        const ref = `e${++n}`
        el.setAttribute(attr, ref)
        const name = nameOf(el).slice(0, 80)
        const state = [
          el.disabled ? 'disabled' : '',
          el.getAttribute('aria-checked') === 'true' || el.checked ? 'checked' : '',
          el.getAttribute('aria-expanded') === 'true' ? 'expanded' : '',
          // The tell that a nameless button opens something.
          el.getAttribute('aria-haspopup') ? `haspopup=${el.getAttribute('aria-haspopup')}` : '',
        ]
          .filter(Boolean)
          .join(' ')
        lines.push(`@${ref} ${roleOf(el)}${name ? ` "${name}"` : ''}${state ? ` [${state}]` : ''}`)
        if (lines.join('\n').length > cap) {
          lines.push(`… [truncated at ${cap} chars — pass full:true or narrow the page]`)
          break
        }
      }
      return lines.join('\n')
    },
    { attr: REF_ATTR, cap: MAX_SNAPSHOT_CHARS },
  )
}

/** Resolve a `@e3` (or bare `e3`) ref to a locator. */
const byRef = (page, ref) => page.locator(`[${REF_ATTR}="${String(ref).replace(/^@/, '')}"]`)

const info = await page
  .evaluate(() => ({
    title: document.title || '',
    bodyChars: (document.body?.innerText || '').trim().length,
    head: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200),
  }))
  .catch(() => ({ title: '', bodyChars: 0, head: '' }))

/**
 * Script mode. The useful QA actions are sequences — click, wait, assert — and a
 * fixed set of --click/--type flags would be a worse Playwright than Playwright.
 * The file default-exports async (page) => result; we own the browser, the
 * reporting and the teardown.
 */
let scriptResult
const scriptPath = flag('--script')
if (scriptPath) {
  try {
    // Resolve to an absolute path, then to a file:// URL. A bare path handed
    // to import() is parsed as a URL, so a Windows absolute path like
    // `c:\qa\test.mjs` fails with ERR_UNSUPPORTED_ESM_URL_SCHEME ("Received
    // protocol 'c:'") — the old `startsWith('/')` test never recognised it as
    // absolute either, so it was also wrongly prefixed with cwd. Field-hit
    // 2026-08-16 (Zone A s15, gpt-5.6-luna on Windows): two failed attempts
    // before the model gave up on --script and fell back to --eval.
    const mod = await import(pathToFileURL(resolve(scriptPath)).href)
    /**
     * Second argument: ref-based helpers. `page` stays first and unchanged, so
     * every script written before these existed keeps working.
     */
    const ui = {
      snapshot: (opts) => snapshotWithRefs(page, opts),
      ref: (r) => byRef(page, r),
      click: (r, opts) => byRef(page, r).click(opts),
      fill: (r, text, opts) => byRef(page, r).fill(text, opts),
      text: (r) => byRef(page, r).innerText(),
    }
    scriptResult = await (mod.default ?? mod.run)(page, ui)
  } catch (e) {
    scriptResult = `SCRIPT ERROR: ${String(e?.stack ?? e).split('\n').slice(0, 4).join(' | ')}`
  }
}

let evalResult
const expr = flag('--eval')
if (expr) {
  try {
    evalResult = await page.evaluate(`(() => (${expr}))()`)
  } catch (e) {
    evalResult = `EVAL ERROR: ${String(e).split('\n')[0]}`
  }
}
let snapshotOut
if (args.includes('--snapshot')) {
  snapshotOut = await snapshotWithRefs(page, { full: args.includes('--full') }).catch(
    (e) => `SNAPSHOT ERROR: ${String(e).split('\n')[0]}`,
  )
}

const shot = flag('--screenshot')
if (shot) await page.screenshot({ path: shot, fullPage: true }).catch(() => {})

console.log(`url        ${url}`)
console.log(`http       ${status}${navError ? `  NAV ERROR: ${navError}` : ''}`)
console.log(`load       ${Date.now() - t0}ms`)
console.log(`title      ${JSON.stringify(info.title)}`)
console.log(`bodyChars  ${info.bodyChars}`)
console.log(`patchright ${root}`)
if (info.head) console.log(`text       ${info.head}`)
if (expr) console.log(`eval       ${JSON.stringify(evalResult)}`)
if (scriptPath) console.log(`script     ${JSON.stringify(scriptResult, null, 1)}`)
if (shot) console.log(`screenshot ${shot}  (read this file to look at it)`)
if (snapshotOut !== undefined) console.log(`\nsnapshot:\n${snapshotOut}`)
console.log(`\nconsole errors/warnings (${consoleMsgs.length}):`)
for (const m of consoleMsgs.slice(0, 15)) console.log(`  ${m}`)
console.log(`\nrequests failed (${failures.length}):`)
for (const f of [...new Set(failures)].slice(0, 15)) console.log(`  ${f}`)

if (sessionMode) {
  // Leave the detached chrome running for the next call. Dropping our CDP client
  // (by exiting) does NOT kill it — chrome is its own detached process, not a
  // child of ours. Flush the last write first so nothing is lost on exit, since
  // the live websocket would otherwise keep the event loop from ending on its own.
  await new Promise((r) => process.stdout.write('\n', r))
  process.exit(0)
} else {
  await browser.close()
}
process.exit(navError ? 1 : 0)
