#!/usr/bin/env node
/**
 * ide — the one channel a skill script has back into the editor UI.
 *
 * The extension host runs an unauthenticated HTTP driver on loopback
 * (portfinder, 54113–54500; see codegpt/src/extension.js getPort). That is the
 * ONLY way a standalone script can put something on the user's screen: there is
 * no push channel, no stdin/stdout IPC to the sidecar, and the `code` CLI is
 * unreachable from here (the sidecar does not inherit VSCODE_IPC_HOOK_CLI, so
 * remote-cli refuses with "only available inside a Visual Studio Code
 * terminal").
 *
 * Note this is about showing things to a PERSON. You can read an image yourself
 * now — a .png read returns the picture (core/engine/image-read.ts) — so `show`
 * is not how you look at a frame, it is how you and the user end up looking at
 * the same frame while you talk about it.
 *
 * Degrades to a plain message when no driver answers — which is the normal case
 * for the standalone CLI, JetBrains and Visual Studio hosts. A skill that hard
 * fails because a panel could not open would be worse than one that never tried.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, extname, resolve, join } from 'node:path'
import { homedir } from 'node:os'
import { spawn } from 'node:child_process'

const argv = process.argv.slice(2)
const cmd = argv.find((a) => !a.startsWith('--')) ?? 'help'
const rest = argv.filter((a) => !a.startsWith('--')).slice(1)
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1] ?? d }
const has = (n) => argv.includes(n)

const PORT_LO = 54113
const PORT_HI = 54500
const cacheFile = () =>
  join(process.env.CODEGPT_HOME || join(homedir(), '.codegpt'), 'game-sessions', '.driver-port')

const req = async (port, path, body) => {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(1500),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

/**
 * Find the driver.
 *
 * The port is chosen at runtime and exported nowhere — not to the environment,
 * not to a file — so scanning is the only option. With several VS Code windows
 * open there are several drivers, and the right one is the one whose workspace
 * contains us; /rootPath is what distinguishes them.
 */
async function discover({ quiet = false } = {}) {
  const want = resolve(flag('--dir', process.cwd()))
  const tryPort = async (p) => {
    try {
      const v = await req(p, '/version')
      if (!v.ok) return null
      let root = ''
      try { root = (await req(p, '/rootPath')).text.replace(/^"|"$/g, '').trim() } catch {}
      return { port: p, version: v.text.replace(/^"|"$/g, '').trim(), root }
    } catch { return null }
  }

  // Cached port first — a hit turns a 90-port scan into one request.
  try {
    const cached = Number(readFileSync(cacheFile(), 'utf8').trim())
    if (cached) { const hit = await tryPort(cached); if (hit) return hit }
  } catch {}

  const found = []
  const BATCH = 24
  for (let start = PORT_LO; start <= PORT_HI; start += BATCH) {
    const ports = []
    for (let p = start; p < Math.min(start + BATCH, PORT_HI + 1); p++) ports.push(p)
    const hits = (await Promise.all(ports.map(tryPort))).filter(Boolean)
    found.push(...hits)
    // Stop early once we have a window that owns this workspace; scanning the
    // remaining 400 ports to find nothing is pure latency.
    const owner = found.find((h) => h.root && (want === h.root || want.startsWith(h.root + '/')))
    if (owner) { cache(owner.port); return owner }
    if (found.length && start > PORT_LO + BATCH * 2) break
  }
  if (found.length) { cache(found[0].port); return found[0] }
  if (!quiet) {
    console.error(
      'No CodeGPT editor driver answered on 127.0.0.1:54113-54500.\n' +
      'That is expected outside the VS Code host (standalone CLI, JetBrains, Visual Studio),\n' +
      'or if the extension is not running. Nothing was shown to the user.',
    )
  }
  return null
}

function cache(port) {
  try { mkdirSync(join(cacheFile(), '..'), { recursive: true }); writeFileSync(cacheFile(), String(port)) } catch {}
}

async function cmdPort() {
  const d = await discover()
  if (!d) process.exit(1)
  console.log(`driver on :${d.port}  version=${d.version}  rootPath=${d.root || '(none)'}`)
}

/** Open a file in the editor, optionally revealing a line — `path` or `path:line`. */
async function cmdOpen() {
  const target = rest[0]
  if (!target) { console.error('ide.mjs open <file>[:line]'); process.exit(1) }
  const m = /^(.*?):(\d+)(?::(\d+))?$/.exec(target)
  const filePath = resolve(flag('--dir', process.cwd()), m ? m[1] : target)
  const line = m ? Number(m[2]) : undefined
  if (!existsSync(filePath)) { console.error(`no such file: ${filePath}`); process.exit(1) }
  if (/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(filePath)) {
    console.error(`${basename(filePath)} is an image — openFile would load it as text. Use \`ide.mjs show\`.`)
    process.exit(1)
  }
  const d = await discover()
  if (!d) process.exit(1)
  const r = await req(d.port, '/openFile', {
    filePath, absolutePath: true,
    ...(line ? { startLine: line, endLine: line } : {}),
  })
  console.log(r.ok ? `opened ${filePath}${line ? `:${line}` : ''} in the editor` : `driver refused: ${r.status} ${r.text.slice(0, 120)}`)
}

/**
 * Show an image to the user in a beside-column webview.
 *
 * The webview frames a URL, so the picture needs an http origin — a file:// URL
 * does not load. The image is inlined as a data: URI rather than served as a
 * second request, because the panel's CSP allows `img-src https: data:` and an
 * http image would be blocked under the strict reading.
 */
async function cmdShow() {
  const img = resolve(flag('--dir', process.cwd()), rest[0] ?? '')
  if (!existsSync(img)) { console.error(`no such file: ${img}`); process.exit(1) }
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }[extname(img).toLowerCase()] ?? 'image/png'
  const b64 = readFileSync(img).toString('base64')
  const html = `<!doctype html><meta charset="utf-8"><title>${basename(img)}</title>
<style>html,body{margin:0;height:100%;background:#1e1e1e;color:#ccc;font:12px system-ui}
.wrap{height:100%;display:flex;flex-direction:column}
figcaption{padding:6px 10px;border-bottom:1px solid #333}
.img{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto}
img{max-width:100%;max-height:100%;image-rendering:pixelated}</style>
<div class="wrap"><figcaption>${basename(img)} — captured ${new Date().toLocaleTimeString()}</figcaption>
<div class="img"><img src="data:${mime};base64,${b64}"></div></div>`

  const d = await discover()
  if (!d) { console.log(`frame is at ${img} — open it yourself to look at it`); process.exit(1) }

  // The page has to still be there when the panel asks for it. An unref'd
  // server plus a detached timer exits this process immediately after the POST,
  // and the webview opens blank — which looks exactly like a broken capture.
  let served = 0
  let closeTimer = null
  const server = createServer((_, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
    served++
    // Loaded. Hold a moment for a reload/devtools fetch, then let go.
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => server.close(), 1200)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${server.address().port}/`
  const r = await req(d.port, '/openWebviewUrl', { url })
  if (!r.ok) {
    console.log(`driver refused /openWebviewUrl: ${r.status}. Frame is at ${img}`)
    server.close(); process.exit(1)
  }
  // Cap the wait so a panel that never loads cannot hang the agent's turn.
  const cap = setTimeout(() => server.close(), Number(flag('--hold', 8000)))
  await new Promise((r) => server.on('close', r))
  clearTimeout(cap)
  console.log(served
    ? `showing ${basename(img)} in a panel beside the editor`
    : `panel did not load the frame within ${Number(flag('--hold', 8000))}ms — it is at ${img}`)
}

/** Drop a text report into an untitled editor — better than a wall of terminal. */
async function cmdReport() {
  const text = rest.join(' ') || readFileSync(0, 'utf8')
  const d = await discover()
  if (!d) { console.log(text); process.exit(1) }
  const r = await req(d.port, '/newFileWithCode', { code: text })
  console.log(r.ok ? 'opened report in a new editor tab' : `driver refused: ${r.status}`)
}

async function cmdSay() {
  const message = rest.join(' ')
  if (!message) { console.error('ide.mjs say "<message>"'); process.exit(1) }
  const d = await discover()
  if (!d) process.exit(1)
  const r = await req(d.port, '/showInformationMessage', { message })
  console.log(r.ok ? 'shown' : `driver refused: ${r.status}`)
}

function help() {
  console.log(`ide — put something in front of the USER (never in front of yourself)

  ide.mjs port                    find the editor driver
  ide.mjs open <file>[:line]      open + reveal a line in the editor
  ide.mjs show <image.png>        display an image in a panel beside the editor
  ide.mjs report "<text>"         open text in a new untitled editor
  ide.mjs say "<message>"         notification toast

Every command here is for a human looking at the screen — to READ an image
yourself, just read the file. If no driver answers (JetBrains, Visual Studio, or
a plain terminal) each command says so and does nothing.`)
}

const CMDS = { port: cmdPort, open: cmdOpen, show: cmdShow, report: cmdReport, say: cmdSay, help }
await (CMDS[cmd] ?? help)()
