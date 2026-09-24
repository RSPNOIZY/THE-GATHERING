#!/usr/bin/env node
/**
 * game-development — close the edit → build → run → LOOK AT IT → fix loop for
 * games, without leaving the editor.
 *
 * The problem this exists to solve is not "the agent cannot write Lua". It is
 * that the agent cannot SEE the game: it edits, and then a human has to build,
 * launch, play to the right screen, read the console and paraphrase what broke.
 * Every hop through that human is where a session stalls. browser-automation
 * closed the same loop for web apps; this is the same idea pointed at a process
 * that renders to a window instead of a DOM.
 *
 * Engine-agnostic by construction. What differs between Fabric, FiveM, Balatro,
 * Stride and a Godot project is not the CAPABILITY — build, install, launch,
 * tail, look, poke — it is the COORDINATES: which command builds, where the
 * artifact has to be copied, where the log lands, what "ready" looks like. Those
 * live in a per-project manifest (.codegpt-game.json), so supporting a new
 * target is a data change, not a code change. Presets seed the common ones.
 *
 * Zero dependencies on purpose: this has to run from a seeded skill directory
 * on a user's machine, where `npm install` is not a thing that happened.
 */
import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync,
  appendFileSync, openSync, closeSync, statSync, readSync, copyFileSync, rmSync,
} from 'node:fs'
import { homedir, platform, tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import net from 'node:net'

// ─────────────────────────────────────────────────────────────────────────────
// args
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const cmd = argv.find((a) => !a.startsWith('--')) ?? 'help'
const VALUE_FLAGS = new Set([
  '--session', '--manifest', '--preset', '--out', '--grep', '--lines',
  '--timeout', '--dir', '--to', '--window', '--wait',
])
const flag = (name, fallback) => {
  const i = argv.indexOf(name)
  if (i === -1) return fallback
  return VALUE_FLAGS.has(name) ? argv[i + 1] ?? fallback : true
}
const has = (name) => argv.includes(name)
/** Positional args after the subcommand, minus flag values. */
const positionals = (() => {
  const out = []
  let seenCmd = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) { if (VALUE_FLAGS.has(a)) i++; continue }
    if (!seenCmd) { seenCmd = true; continue }
    out.push(a)
  }
  return out
})()

const WORKSPACE = resolve(flag('--dir', process.cwd()))
const SESSION = flag('--session', 'default')

const die = (msg, code = 1) => { console.error(msg); process.exit(code) }
const isWSL = () =>
  platform() === 'linux' &&
  (() => { try { return /microsoft/i.test(readFileSync('/proc/version', 'utf8')) } catch { return false } })()

// ─────────────────────────────────────────────────────────────────────────────
// presets — the per-engine coordinates, as DATA
//
// Each preset is a partial manifest. Detection is a file that could only exist
// in that kind of project; when two match, the more specific one wins by being
// earlier in the list. Nothing here is authoritative — it is a starting point
// the user is expected to edit, which is why `init` writes it to disk rather
// than keeping it internal.
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS = {
  fabric: {
    detect: (d) => existsSync(join(d, 'gradle.properties')) &&
      /loom|fabric/i.test(safeRead(join(d, 'build.gradle')) + safeRead(join(d, 'gradle.properties'))),
    manifest: {
      engine: 'fabric',
      build: { cmd: isWin() ? 'gradlew.bat build' : './gradlew build' },
      launch: { cmd: isWin() ? 'gradlew.bat runClient' : './gradlew runClient' },
      log: { format: 'java', paths: ['run/logs/latest.log'] },
      ready: 'Sound engine started|Done \\(\\d',
      window: 'Minecraft',
      sourceRoots: ['src/main/java', 'src/main/resources'],
    },
  },
  neoforge: {
    detect: (d) => /neoforge|minecraftforge/i.test(safeRead(join(d, 'build.gradle')) + safeRead(join(d, 'gradle.properties'))),
    manifest: {
      engine: 'neoforge',
      build: { cmd: isWin() ? 'gradlew.bat build' : './gradlew build' },
      launch: { cmd: isWin() ? 'gradlew.bat runClient' : './gradlew runClient' },
      log: { format: 'java', paths: ['run/logs/latest.log'] },
      ready: 'Sound engine started|Done \\(\\d',
      window: 'Minecraft',
      sourceRoots: ['src/main/java', 'src/main/resources'],
    },
  },
  fivem: {
    detect: (d) => existsSync(join(d, 'fxmanifest.lua')) || existsSync(join(d, '__resource.lua')),
    manifest: {
      engine: 'fivem',
      // A resource is not "built"; it is dropped into the server's resources dir
      // and the server is told to restart it. That is why `install` + `rcon`
      // matter far more than `build` here.
      install: [{ from: '.', to: '${FIVEM_SERVER}/resources/${NAME}' }],
      launch: { cmd: '${FIVEM_SERVER}/run.sh', args: ['+exec', 'server.cfg'], cwd: '${FIVEM_SERVER}' },
      log: { format: 'lua', stdout: true },
      ready: 'Server started|Started resource',
      rcon: { host: '127.0.0.1', port: 30120, password: '${RCON_PASSWORD}' },
      reload: 'restart ${NAME}',
      sourceRoots: ['.'],
    },
  },
  balatro: {
    detect: (d) => {
      const m = safeRead(join(d, 'manifest.json'))
      return /steamodded|smods/i.test(m) || readdirSyncSafe(d).some((f) => f.endsWith('.lovely.toml'))
    },
    manifest: {
      engine: 'balatro',
      install: [{ from: '.', to: '${BALATRO_MODS}/${NAME}' }],
      launch: { cmd: '${BALATRO_EXE}' },
      // Steamodded writes its own log; love2d prints to stdout on Linux/macOS
      // but on Windows it goes nowhere useful, hence the explicit path.
      log: { format: 'lua', stdout: true, paths: ['${BALATRO_MODS}/../lovely/log/latest.log'] },
      ready: 'SMODS.*loaded|LOVELY.*injected',
      window: 'Balatro',
      sourceRoots: ['.'],
    },
  },
  love2d: {
    detect: (d) => existsSync(join(d, 'main.lua')) && existsSync(join(d, 'conf.lua')),
    manifest: {
      engine: 'love2d',
      launch: { cmd: 'love', args: ['.'] },
      log: { format: 'lua', stdout: true },
      sourceRoots: ['.'],
    },
  },
  godot: {
    detect: (d) => existsSync(join(d, 'project.godot')),
    manifest: {
      engine: 'godot',
      // --headless is the agent's friend for tests; the default run wants a window
      // because the whole point is to look at it.
      launch: { cmd: 'godot', args: ['--path', '.'] },
      log: { format: 'godot', stdout: true },
      ready: 'Godot Engine v',
      sourceRoots: ['.'],
    },
  },
  unity: {
    detect: (d) => existsSync(join(d, 'ProjectSettings', 'ProjectVersion.txt')),
    manifest: {
      engine: 'unity',
      // Unity's own Player.log is the real signal; stdout from the editor is noise.
      launch: { cmd: '${UNITY_EXE}', args: ['-projectPath', '.'] },
      log: {
        format: 'unity',
        paths: [unityLogDefault()],
      },
      sourceRoots: ['Assets'],
    },
  },
  unreal: {
    detect: (d) => readdirSyncSafe(d).some((f) => f.endsWith('.uproject')),
    manifest: {
      engine: 'unreal',
      launch: { cmd: '${UE_EDITOR}', args: ['${PROJECT}.uproject'] },
      log: { format: 'unreal', paths: ['Saved/Logs/${NAME}.log'] },
      sourceRoots: ['Source'],
    },
  },
  stride: {
    detect: (d) => readdirSyncSafe(d).some((f) => f.endsWith('.sdpkg')) ||
      /Stride\./.test(readdirSyncSafe(d).filter((f) => f.endsWith('.csproj')).map((f) => safeRead(join(d, f))).join('')),
    manifest: {
      engine: 'stride',
      build: { cmd: 'dotnet build' },
      launch: { cmd: 'dotnet', args: ['run'] },
      log: { format: 'dotnet', stdout: true },
      sourceRoots: ['.'],
    },
  },
  renpy: {
    detect: (d) => existsSync(join(d, 'game')) && readdirSyncSafe(join(d, 'game')).some((f) => f.endsWith('.rpy')),
    manifest: {
      engine: 'renpy',
      launch: { cmd: '${RENPY_SDK}/renpy.sh', args: ['.'] },
      log: { format: 'python', stdout: true, paths: ['log.txt'] },
      sourceRoots: ['game'],
    },
  },
  generic: {
    detect: () => false,
    manifest: {
      engine: 'generic',
      launch: { cmd: 'echo set launch.cmd in .codegpt-game.json' },
      log: { format: 'generic', stdout: true },
      sourceRoots: ['.'],
    },
  },
}

function isWin() { return platform() === 'win32' }
function safeRead(p) { try { return readFileSync(p, 'utf8') } catch { return '' } }
function readdirSyncSafe(p) { try { return readdirSync(p) } catch { return [] } }
function unityLogDefault() {
  if (platform() === 'darwin') return '~/Library/Logs/Unity/Editor.log'
  if (isWin()) return '${LOCALAPPDATA}/Unity/Editor/Editor.log'
  return '~/.config/unity3d/Editor.log'
}

// ─────────────────────────────────────────────────────────────────────────────
// manifest
// ─────────────────────────────────────────────────────────────────────────────

const MANIFEST_NAME = '.codegpt-game.json'
const manifestPath = () => resolve(flag('--manifest', join(WORKSPACE, MANIFEST_NAME)))

function detectEngine(dir) {
  for (const [key, p] of Object.entries(PRESETS)) {
    if (key === 'generic') continue
    try { if (p.detect(dir)) return key } catch { /* a bad probe must not stop detection */ }
  }
  return null
}

function loadManifest({ required = true } = {}) {
  const p = manifestPath()
  if (!existsSync(p)) {
    if (!required) return null
    const guess = detectEngine(WORKSPACE)
    die(
      `No ${MANIFEST_NAME} in ${WORKSPACE}.\n` +
      (guess
        ? `This looks like a "${guess}" project — run:\n  node ${selfPath()} init --preset ${guess}`
        : `Could not detect the engine. Run:\n  node ${selfPath()} init --preset generic\nand fill in build/launch/log. See engines.md beside this script.`),
    )
  }
  let m
  try { m = JSON.parse(readFileSync(p, 'utf8')) } catch (e) { die(`${p} is not valid JSON: ${e.message}`) }
  return expandManifest(m)
}

/**
 * Substitute ${VARS} from the manifest's own `vars` block, then the environment.
 *
 * Paths like a Balatro mods folder or a FiveM server root differ per machine and
 * MUST NOT be committed into a shared manifest. Keeping them as variables means
 * the manifest is checkable into the repo and the machine-specific half lives in
 * `vars` (gitignored) or the environment.
 */
function expandManifest(m) {
  const vars = { NAME: m.name ?? basename(WORKSPACE), PROJECT: basename(WORKSPACE), ...(m.vars ?? {}) }
  const missing = new Set()
  const sub = (v) => {
    if (typeof v === 'string') {
      return v.replace(/\$\{(\w+)\}/g, (_, k) => {
        const val = vars[k] ?? process.env[k]
        if (val === undefined) { missing.add(k); return `\${${k}}` }
        return val
      }).replace(/^~(?=\/|$)/, homedir())
    }
    if (Array.isArray(v)) return v.map(sub)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sub(x)]))
    return v
  }
  const out = sub(m)
  out.name = vars.NAME
  out._missingVars = [...missing]
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// session state
//
// Every invocation is a separate node process — the agent calls this script
// once per thought — so anything that must survive between calls lives on disk.
// That includes the log read offsets, which is what makes `logs` return only
// what is NEW instead of re-dumping a 40k-line file into the context window.
// ─────────────────────────────────────────────────────────────────────────────

const sessionRoot = () =>
  join(process.env.CODEGPT_HOME || join(homedir(), '.codegpt'), 'game-sessions')
const sessionDir = () => join(sessionRoot(), sanitize(SESSION))
const sanitize = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, '_')
const statePath = () => join(sessionDir(), 'state.json')
const stdoutLog = () => join(sessionDir(), 'stdout.log')

function readState() {
  try { return JSON.parse(readFileSync(statePath(), 'utf8')) } catch { return null }
}
function writeState(s) {
  mkdirSync(sessionDir(), { recursive: true })
  writeFileSync(statePath(), JSON.stringify(s, null, 2) + '\n')
}
function alive(pid) {
  if (!pid) return false
  try { process.kill(pid, 0); return true } catch { return false }
}

// ─────────────────────────────────────────────────────────────────────────────
// log parsing
//
// The single highest-value thing in this script. A game console is the primary
// feedback channel and today it reaches the agent as an undifferentiated wall of
// text that a human paraphrases. What the agent actually needs is: what is NEW,
// which of it is an error, and WHICH FILE IN THIS WORKSPACE it points at.
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_START = [
  /\b(FATAL|ERROR|SEVERE)\b/,
  /^\s*(Unhandled )?[A-Za-z_.]*(Exception|Error)\b/,
  /\bCaused by:/,
  /^\s*Traceback \(most recent call last\)/,
  /lua:\s*\d+:/i,
  /^\s*\[error\]/i,
  /^\s*SCRIPT ERROR/i,        // Godot
  /^\s*Assertion failed/i,
]
const CONTINUATION = [
  /^\s+at\s/,                 // java / .NET
  /^\s*\.\.\./,
  /^\s*Caused by:/,
  /^\s+File "/,               // python / Ren'Py
  /^\s+\w+\.lua:\d+:/,        // lua traceback frames
  /^\s*\[C\]:/,               // lua C frames
  /\bstack traceback:/i,       // lua: always follows the error it belongs to
  /^\s*>\s/,                  // lua handler frames ("> handler (@res/x.lua:88)")
  /^\s{2,}\S/,                // generically indented
]
const WARN = /\b(WARN|WARNING)\b/

/** Source references, per language family. Order matters — most specific first. */
const SOURCE_REFS = [
  /in\s+(\S+?):line\s+(\d+)/g,                    // .NET
  /\(([\w.$-]+\.(?:java|kt|scala)):(\d+)\)/g,     // JVM
  /([\w./\\-]+\.(?:lua|py|rpy|gd|cs|cpp|h|hpp|js|ts)):(\d+)/g, // generic path:line
]

function classify(line) {
  if (ERROR_START.some((re) => re.test(line))) return 'error'
  if (WARN.test(line)) return 'warn'
  return 'info'
}

/** Group raw lines into events, so a 30-frame stack trace is ONE finding. */
function groupEvents(lines, { maxFrames = 12 } = {}) {
  const events = []
  let cur = null
  for (const line of lines) {
    const kind = classify(line)
    if (kind === 'error' || kind === 'warn') {
      // "Caused by:" continues the exception above it rather than starting a new one.
      if (cur && /^\s*Caused by:/.test(line)) { cur.lines.push(line); continue }
      cur = { kind, lines: [line] }
      events.push(cur)
      continue
    }
    if (cur && CONTINUATION.some((re) => re.test(line))) {
      if (cur.lines.length < maxFrames) cur.lines.push(line)
      else if (cur.lines.length === maxFrames) cur.lines.push('    … (frames truncated)')
      continue
    }
    cur = null
  }
  return events
}

/**
 * Index the workspace by basename so a bare `Foo.java:123` can be turned into
 * `src/main/java/com/x/Foo.java:123` — a path the agent can actually open.
 *
 * Ambiguity is reported rather than guessed at: two files named Config.lua means
 * the agent should look, not that we should pick one.
 */
function indexWorkspace(roots) {
  const index = new Map()
  const SKIP = new Set(['node_modules', '.git', 'build', 'bin', 'obj', '.gradle', 'target', '.idea', '.vs', 'Library', 'Temp'])
  const walk = (dir, depth) => {
    if (depth > 12) return
    for (const e of readdirSyncSafe(dir)) {
      if (SKIP.has(e) || e.startsWith('.')) continue
      const full = join(dir, e)
      let st
      try { st = statSync(full) } catch { continue }
      if (st.isDirectory()) walk(full, depth + 1)
      else {
        const list = index.get(e) ?? []
        list.push(relative(WORKSPACE, full))
        index.set(e, list)
      }
    }
  }
  for (const r of roots?.length ? roots : ['.']) {
    const abs = resolve(WORKSPACE, r)
    if (existsSync(abs)) walk(abs, 0)
  }
  return index
}

function mapRefs(text, index) {
  const refs = []
  for (const re of SOURCE_REFS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const raw = m[1]
      const line = m[2]
      const base = basename(raw.replace(/\\/g, '/'))
      const hits = index.get(base) ?? []
      if (hits.length === 1) refs.push(`${hits[0]}:${line}`)
      else if (hits.length > 1) refs.push(`${base}:${line} (ambiguous: ${hits.length} matches)`)
    }
  }
  return [...new Set(refs)]
}

/** Read only the bytes we have not read before; remember where we stopped. */
function readNew(path, offsets) {
  let st
  try { st = statSync(path) } catch { return { text: '', size: 0 } }
  const prev = offsets[path] ?? 0
  // A rotated/truncated log (size went backwards) must reset, or we read garbage.
  const from = st.size < prev ? 0 : prev
  if (st.size === from) { offsets[path] = st.size; return { text: '', size: st.size } }
  const fd = openSync(path, 'r')
  try {
    const len = st.size - from
    const buf = Buffer.allocUnsafe(len)
    readSync(fd, buf, 0, len, from)
    offsets[path] = st.size
    return { text: buf.toString('utf8'), size: st.size }
  } finally { closeSync(fd) }
}

// ─────────────────────────────────────────────────────────────────────────────
// commands
// ─────────────────────────────────────────────────────────────────────────────

function selfPath() {
  try { return new URL(import.meta.url).pathname } catch { return 'game.mjs' }
}

function cmdDetect() {
  const guess = detectEngine(WORKSPACE)
  const evidence = []
  for (const f of ['gradle.properties', 'build.gradle', 'fxmanifest.lua', 'manifest.json',
    'project.godot', 'main.lua', 'ProjectSettings/ProjectVersion.txt']) {
    if (existsSync(join(WORKSPACE, f))) evidence.push(f)
  }
  const extras = readdirSyncSafe(WORKSPACE).filter((f) => /\.(uproject|sdpkg|csproj|sln|lovely\.toml)$/.test(f))
  console.log(`workspace: ${WORKSPACE}`)
  console.log(`engine:    ${guess ?? 'unknown'}`)
  console.log(`evidence:  ${[...evidence, ...extras].join(', ') || '(none)'}`)
  if (existsSync(manifestPath())) console.log(`manifest:  ${manifestPath()} (already exists)`)
  else console.log(`next:      node ${selfPath()} init${guess ? ` --preset ${guess}` : ''}`)
}

function cmdInit() {
  const preset = flag('--preset', detectEngine(WORKSPACE) ?? 'generic')
  const p = PRESETS[preset]
  if (!p) die(`Unknown preset "${preset}". Known: ${Object.keys(PRESETS).join(', ')}`)
  const target = manifestPath()
  if (existsSync(target) && !has('--force')) die(`${target} exists. Pass --force to overwrite.`)
  const m = {
    name: basename(WORKSPACE),
    ...structuredClone(p.manifest),
    vars: {},
  }
  writeFileSync(target, JSON.stringify(m, null, 2) + '\n')
  console.log(`wrote ${target} (preset: ${preset})`)
  const needs = JSON.stringify(m).match(/\$\{(\w+)\}/g)
  if (needs) {
    console.log(`\nFill these in under "vars" (or set as env vars) before \`run\`:`)
    for (const v of [...new Set(needs)]) console.log(`  ${v}`)
  }
}

function resolveInstalls(m) {
  const out = []
  for (const rule of m.install ?? []) {
    const from = resolve(WORKSPACE, rule.from)
    const to = resolve(WORKSPACE, rule.to)
    out.push({ from, to, glob: rule.from.includes('*') })
  }
  return out
}

function doInstall(m, log = console.log) {
  const rules = m.install ?? []
  if (!rules.length) return { copied: [] }
  const copied = []
  for (const rule of rules) {
    const to = resolve(WORKSPACE, rule.to)
    if (rule.from.includes('*')) {
      // Only the simple `dir/*.ext` shape — enough for "the jar gradle just built"
      // without dragging in a glob dependency.
      const dir = resolve(WORKSPACE, dirname(rule.from))
      const pat = basename(rule.from).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
      const re = new RegExp(`^${pat}$`)
      const hits = readdirSyncSafe(dir).filter((f) => re.test(f))
      if (!hits.length) { log(`install: no match for ${rule.from}`); continue }
      mkdirSync(to, { recursive: true })
      for (const h of hits) { copyFileSync(join(dir, h), join(to, h)); copied.push(join(to, h)) }
    } else {
      const from = resolve(WORKSPACE, rule.from)
      if (!existsSync(from)) { log(`install: missing ${from}`); continue }
      if (statSync(from).isDirectory()) { copyTree(from, to, rule.exclude); copied.push(to + sep) }
      else { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); copied.push(to) }
    }
  }
  return { copied }
}

function copyTree(from, to, exclude = []) {
  const SKIP = new Set(['.git', 'node_modules', '.gradle', 'build', ...exclude])
  mkdirSync(to, { recursive: true })
  for (const e of readdirSyncSafe(from)) {
    if (SKIP.has(e) || e === MANIFEST_NAME) continue
    const src = join(from, e)
    const dst = join(to, e)
    let st
    try { st = statSync(src) } catch { continue }
    if (st.isDirectory()) copyTree(src, dst, exclude)
    else copyFileSync(src, dst)
  }
}

function runSync(cmdline, cwd, label) {
  const shell = isWin() ? 'cmd' : 'sh'
  const shellFlag = isWin() ? '/c' : '-c'
  const r = spawnSync(shell, [shellFlag, cmdline], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
  return { ok: r.status === 0, code: r.status, out, label }
}

async function cmdRun() {
  const m = loadManifest()
  if (m._missingVars.length) {
    die(`Manifest has unset variables: ${m._missingVars.join(', ')}\n` +
        `Set them under "vars" in ${manifestPath()} or in the environment.`)
  }

  const prev = readState()
  if (prev && alive(prev.pid) && !has('--restart')) {
    die(`Session "${SESSION}" is already running (pid ${prev.pid}).\n` +
        `Use --restart to relaunch, \`logs\` to read it, or \`stop\` to end it.`)
  }
  if (prev && alive(prev.pid)) killTree(prev.pid)

  // 1. build ────────────────────────────────────────────────────────────────
  if (m.build?.cmd && !has('--no-build')) {
    const r = runSync(m.build.cmd, resolve(WORKSPACE, m.build.cwd ?? '.'), 'build')
    if (!r.ok) {
      // A failed build is the answer — do not launch a stale binary and then
      // report confusing runtime behaviour.
      console.log(`BUILD FAILED (exit ${r.code}): ${m.build.cmd}\n`)
      console.log(tailText(r.out, Number(flag('--lines', 60))))
      process.exit(1)
    }
    console.log(`build ok: ${m.build.cmd}`)
  }

  // 2. install ──────────────────────────────────────────────────────────────
  const inst = doInstall(m)
  if (inst.copied.length) console.log(`installed: ${inst.copied.join(', ')}`)

  // 3. launch ───────────────────────────────────────────────────────────────
  if (!m.launch?.cmd) die('manifest has no launch.cmd')
  mkdirSync(sessionDir(), { recursive: true })
  try { rmSync(stdoutLog()) } catch {}
  const outFd = openSync(stdoutLog(), 'a')
  const cwd = resolve(WORKSPACE, m.launch.cwd ?? '.')
  const child = spawn(m.launch.cmd, m.launch.args ?? [], {
    cwd,
    env: { ...process.env, ...(m.launch.env ?? {}) },
    // detached so the game survives THIS process exiting — the agent's next call
    // is a brand new node process and must find the game still running.
    detached: true,
    stdio: ['pipe', outFd, outFd],
    shell: (m.launch.args ?? []).length === 0,
  })
  child.unref()
  closeSync(outFd)

  // A detached child we spawned is still OUR child until reaped, so a crashed
  // game lingers as a zombie and process.kill(pid, 0) happily reports it alive.
  // The exit event is the only truthful signal while this process is running.
  let exitInfo = null
  child.on('exit', (code, signal) => { exitInfo = { code, signal } })

  const state = {
    session: SESSION,
    pid: child.pid,
    startedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    manifest: manifestPath(),
    engine: m.engine,
    logPaths: (m.log?.paths ?? []).map((p) => resolve(WORKSPACE, p)),
    stdout: m.log?.stdout !== false ? stdoutLog() : null,
    window: m.window ?? null,
    rcon: m.rcon ?? null,
    format: m.log?.format ?? 'generic',
    sourceRoots: m.sourceRoots ?? ['.'],
    offsets: {},
  }
  writeState(state)
  console.log(`launched: ${m.launch.cmd} ${(m.launch.args ?? []).join(' ')} (pid ${child.pid}, session "${SESSION}")`)

  // 4. wait for ready, then report what happened ────────────────────────────
  const timeout = Number(flag('--timeout', 90)) * 1000
  const readyRe = m.ready ? new RegExp(m.ready, 'i') : null
  const started = Date.now()
  let sawReady = false
  while (Date.now() - started < timeout) {
    await sleepAsync(700)
    if (exitInfo) break
    const { text } = peekAll(state)
    if (readyRe && readyRe.test(text)) { sawReady = true; break }
    if (!readyRe && Date.now() - started > 5000) break
  }
  // Ready and crashed are not exclusive: a server can print its ready banner and
  // then die on the next line. Exit status wins.
  const crashed = !!exitInfo || !alive(child.pid)
  console.log(
    crashed ? `PROCESS EXITED (${exitInfo ? `code ${exitInfo.code}${exitInfo.signal ? ` signal ${exitInfo.signal}` : ''}` : 'gone'}) after ${((Date.now() - started) / 1000).toFixed(1)}s${sawReady ? ' — it DID reach ready first, so the failure is after startup' : ''}`
      : sawReady ? `ready (matched /${m.ready}/) after ${((Date.now() - started) / 1000).toFixed(1)}s`
      : m.ready ? `still running; ready pattern /${m.ready}/ not seen within ${timeout / 1000}s`
      : `running`,
  )
  console.log('')
  reportLogs(state, { onlyErrors: !has('--all'), lines: Number(flag('--lines', 40)) })
  writeState(state)
  if (crashed) process.exit(1)
}

/** Non-destructive read of every log source (does not advance offsets). */
function peekAll(state) {
  const tmp = { ...state.offsets }
  let text = ''
  for (const p of logSources(state)) text += readNew(p, tmp).text
  return { text }
}

/**
 * Expand a `dir/*.txt` pattern to the NEWEST match.
 *
 * Minecraft writes the useful post-mortem to crash-reports/crash-<timestamp>.txt
 * — not to latest.log — and Unity/Unreal rotate. A fixed path misses all of it,
 * and the file does not exist until the crash, so this has to re-resolve on
 * every read rather than once at launch.
 */
function expandGlob(pattern) {
  if (!pattern.includes('*')) return existsSync(pattern) ? [pattern] : []
  const dir = dirname(pattern)
  const pat = basename(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  const re = new RegExp(`^${pat}$`)
  const hits = readdirSyncSafe(dir)
    .filter((f) => re.test(f))
    .map((f) => join(dir, f))
    .filter((f) => { try { return statSync(f).isFile() } catch { return false } })
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return hits.slice(0, 3)   // newest few; a crash dir accumulates forever
}

function logSources(state) {
  const out = []
  if (state.stdout && existsSync(state.stdout)) out.push(state.stdout)
  for (const p of state.logPaths ?? []) out.push(...expandGlob(p))
  return [...new Set(out)]
}

function tailText(text, n) {
  const lines = text.split('\n')
  return lines.slice(Math.max(0, lines.length - n)).join('\n')
}

function reportLogs(state, { onlyErrors, lines, grep }) {
  let raw = ''
  for (const p of logSources(state)) raw += readNew(p, state.offsets).text
  if (!raw.trim()) { console.log('(no new log output)'); return { events: [] } }

  const all = raw.split('\n').filter((l) => l.length)
  const filtered = grep ? all.filter((l) => new RegExp(grep, 'i').test(l)) : all
  const events = groupEvents(all)
  const errors = events.filter((e) => e.kind === 'error')
  const warns = events.filter((e) => e.kind === 'warn')

  console.log(`${all.length} new line(s), ${errors.length} error(s), ${warns.length} warning(s)`)

  let firstRef = null
  if (errors.length) {
    const index = indexWorkspace(state.sourceRoots)
    console.log('\nERRORS')
    for (const e of errors.slice(0, 10)) {
      const text = e.lines.join('\n')
      console.log('  ' + e.lines.join('\n  '))
      const refs = mapRefs(text, index)
      if (refs.length) {
        console.log(`  → workspace: ${refs.join(', ')}`)
        firstRef ??= refs[0]
      }
      console.log('')
    }
    if (errors.length > 10) console.log(`  … ${errors.length - 10} more error(s)\n`)

    // Put the human on the failing line. Cheap, and it means the user is looking
    // at the same place you are before you start explaining.
    if (has('--open') && firstRef && !/ambiguous/.test(firstRef)) {
      const r = spawnSync(process.execPath, [join(dirname(selfPath()), 'ide.mjs'), 'open', firstRef],
        { cwd: WORKSPACE, encoding: 'utf8' })
      process.stdout.write(r.stdout ?? '')
    }
  }

  if (!onlyErrors) {
    console.log('\nTAIL')
    console.log(tailText(filtered.join('\n'), lines))
  } else if (!errors.length) {
    console.log('\nTAIL (no errors; showing last lines)')
    console.log(tailText(filtered.join('\n'), Math.min(lines, 20)))
  }
  return { events }
}

async function cmdLogs() {
  const state = readState()
  if (!state) die(`No session "${SESSION}". Run \`run\` first, or pass --session <id>.`)
  if (has('--reset')) state.offsets = {}

  // `reload` then sleep-and-hope is the usual shape and it is unreliable —
  // sometimes the resource has not restarted yet, sometimes it restarted and
  // already failed. Waiting on the line that PROVES it works removes the guess.
  const waitFor = flag('--wait')
  if (waitFor) {
    const re = new RegExp(waitFor, 'i')
    const limit = Number(flag('--timeout', 30)) * 1000
    const started = Date.now()
    let seen = ''
    while (Date.now() - started < limit) {
      for (const p of logSources(state)) seen += readNew(p, state.offsets).text
      const hit = seen.split('\n').find((l) => re.test(l))
      if (hit) {
        writeState(state)
        console.log(`matched /${waitFor}/ after ${((Date.now() - started) / 1000).toFixed(1)}s:`)
        console.log(`  ${hit.trim()}`)
        const errs = groupEvents(seen.split('\n')).filter((e) => e.kind === 'error')
        if (errs.length) console.log(`\n(${errs.length} error(s) also appeared while waiting — run \`logs --reset --errors\` to see them)`)
        return
      }
      if (!alive(state.pid)) break
      await sleepAsync(500)
    }
    writeState(state)
    console.log(`did NOT see /${waitFor}/ within ${limit / 1000}s${alive(state.pid) ? '' : ' (process exited)'}`)
    reportLogs({ ...state, offsets: {} }, { onlyErrors: true, lines: 20 })
    process.exit(1)
  }
  reportLogs(state, {
    onlyErrors: has('--errors'),
    lines: Number(flag('--lines', 60)),
    grep: flag('--grep'),
  })
  writeState(state)
  if (!alive(state.pid)) console.log(`\n(process ${state.pid} is no longer running)`)
}

function cmdStatus() {
  mkdirSync(sessionRoot(), { recursive: true })
  const ids = readdirSyncSafe(sessionRoot())
  if (!ids.length) { console.log('no game sessions'); return }
  for (const id of ids) {
    let s
    try { s = JSON.parse(readFileSync(join(sessionRoot(), id, 'state.json'), 'utf8')) } catch { continue }
    const up = alive(s.pid)
    console.log(`${up ? '●' : '○'} ${id}  engine=${s.engine}  pid=${s.pid}${up ? '' : ' (dead)'}  started=${s.startedAt}`)
    console.log(`   workspace: ${s.workspace}`)
    for (const p of logSources(s)) console.log(`   log: ${p}`)
  }
}

function killTree(pid) {
  if (!pid) return
  try {
    if (isWin()) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'])
    else process.kill(-pid, 'SIGTERM')   // detached ⇒ own process group
  } catch {
    try { process.kill(pid, 'SIGTERM') } catch {}
  }
}

function cmdStop() {
  const state = readState()
  if (!state) die(`No session "${SESSION}".`)
  killTree(state.pid)
  sleep(400)
  console.log(alive(state.pid) ? `pid ${state.pid} still alive after SIGTERM` : `stopped session "${SESSION}" (pid ${state.pid})`)
}

// ─────────────────────────────────────────────────────────────────────────────
// looking at it — screenshots
//
// Deliberately best-effort with an honest failure. A screenshot that silently
// captures the wrong window is worse than none: the agent will confidently
// describe a desktop it was never asked about.
// ─────────────────────────────────────────────────────────────────────────────

function which(bin) {
  const r = spawnSync(isWin() ? 'where' : 'which', [bin], { encoding: 'utf8' })
  return r.status === 0 ? (r.stdout || '').trim().split('\n')[0] : null
}

function cmdShot() {
  const state = readState()
  const out = resolve(flag('--out', join(sessionDir(), `frame-${Date.now()}.png`)))
  mkdirSync(dirname(out), { recursive: true })
  const title = flag('--window', state?.window ?? null)
  const attempts = []

  const tryRun = (bin, args, note) => {
    if (!bin) return false
    const r = spawnSync(bin, args, { encoding: 'utf8' })
    attempts.push(`${note}: ${r.status === 0 ? 'ok' : (r.stderr || '').trim().slice(0, 120) || `exit ${r.status}`}`)
    return r.status === 0 && existsSync(out) && statSync(out).size > 0
  }

  let ok = false
  if (isWSL()) {
    // The game runs on the Windows host; a Linux screenshot tool would capture
    // an X server the game is not drawing to.
    const ps = winCaptureScript(out, title)
    ok = tryRun('powershell.exe', ['-NoProfile', '-Command', ps], 'powershell.exe (WSL→host)')
  } else if (platform() === 'darwin') {
    ok = tryRun('screencapture', ['-x', '-o', out], 'screencapture')
  } else if (isWin()) {
    ok = tryRun('powershell', ['-NoProfile', '-Command', winCaptureScript(out, title)], 'powershell')
  } else {
    // X11 first (window-targeted if we can find the window), then wayland.
    const xdo = which('xdotool')
    if (xdo && title && which('import')) {
      const r = spawnSync(xdo, ['search', '--name', title], { encoding: 'utf8' })
      const id = (r.stdout || '').trim().split('\n').filter(Boolean).pop()
      if (id) ok = tryRun('import', ['-window', id, out], `import -window ${title}`)
    }
    if (!ok) ok = tryRun(which('import'), ['-window', 'root', out], 'import root')
    if (!ok) ok = tryRun(which('grim'), [out], 'grim (wayland)')
    if (!ok) ok = tryRun(which('gnome-screenshot'), ['-f', out], 'gnome-screenshot')
    if (!ok) ok = tryRun(which('spectacle'), ['-b', '-n', '-o', out], 'spectacle')
  }

  if (ok) {
    console.log(`wrote ${out}`)
    // Readable as of the image-read path (core/engine/image-read.ts): a .png
    // read now returns the picture. Not on every host though — an older
    // extension, or one of the other IDE drivers, still answers with the binary
    // placeholder, so the caller is told to check rather than assume.
    console.log('Read this file to look at it. If the read returns "[binary file: png …]"')
    console.log('instead of the picture, this host has no image path — ask the user what they see.')
    if (has('--show')) {
      const r = spawnSync(process.execPath, [join(dirname(selfPath()), 'ide.mjs'), 'show', out], { encoding: 'utf8' })
      process.stdout.write(r.stdout ?? '')
    }
  } else {
    console.log('could not capture a frame. Attempts:')
    for (const a of attempts) console.log(`  ${a}`)
    console.log('\nInstall one of: imagemagick (import) / grim / gnome-screenshot / spectacle,')
    console.log('or ask the user for a screenshot. Do not guess at what is on screen.')
    process.exit(1)
  }
}

function winCaptureScript(out, title) {
  // Full-screen capture; window-targeted capture on Windows needs P/Invoke that
  // is not worth the fragility in a first pass.
  const p = out.replace(/'/g, "''")
  const winPath = isWSL()
    ? (spawnSync('wslpath', ['-w', out], { encoding: 'utf8' }).stdout || '').trim() || p
    : p
  return [
    'Add-Type -AssemblyName System.Windows.Forms,System.Drawing;',
    '$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;',
    '$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height;',
    '$g=[System.Drawing.Graphics]::FromImage($bmp);',
    '$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size);',
    `$bmp.Save('${winPath.replace(/\\/g, '\\\\').replace(/'/g, "''")}');`,
  ].join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// poking it — stdin, RCON, keystrokes
// ─────────────────────────────────────────────────────────────────────────────

function cmdSend() {
  const state = readState()
  if (!state) die(`No session "${SESSION}".`)
  const text = positionals.join(' ')
  if (!text) die('nothing to send: game.mjs send "<text>"')
  // stdin of a detached child is not reachable from a new process, so this is
  // only meaningful for servers that read a FIFO or for `rcon`. Say so plainly
  // rather than pretending it worked.
  die('send: stdin of a detached process cannot be reached from a new invocation.\n' +
      'Use `rcon` (configure manifest.rcon) for servers, or `key`/`type` for a windowed game.')
}

/** Source RCON — what Minecraft servers and FiveM both speak. */
function rcon(host, port, password, command) {
  return new Promise((res, rej) => {
    const sock = net.connect({ host, port })
    let buf = Buffer.alloc(0)
    let authed = false
    const pack = (id, type, body) => {
      const payload = Buffer.from(body, 'utf8')
      const b = Buffer.alloc(14 + payload.length)
      b.writeInt32LE(10 + payload.length, 0)
      b.writeInt32LE(id, 4)
      b.writeInt32LE(type, 8)
      payload.copy(b, 12)
      return b
    }
    const timer = setTimeout(() => { sock.destroy(); rej(new Error('rcon timeout')) }, 8000)
    sock.on('error', (e) => { clearTimeout(timer); rej(e) })
    sock.on('connect', () => sock.write(pack(1, 3, password)))   // 3 = auth
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d])
      while (buf.length >= 12) {
        const size = buf.readInt32LE(0)
        if (buf.length < size + 4) break
        const id = buf.readInt32LE(4)
        const body = buf.subarray(12, size + 2).toString('utf8')
        buf = buf.subarray(size + 4)
        if (!authed) {
          if (id === -1) { clearTimeout(timer); sock.destroy(); return rej(new Error('rcon auth failed')) }
          authed = true
          sock.write(pack(2, 2, command))                        // 2 = exec
        } else {
          clearTimeout(timer)
          sock.destroy()
          return res(body)
        }
      }
    })
  })
}

async function cmdRcon(explicit) {
  const state = readState()
  const m = existsSync(manifestPath()) ? loadManifest({ required: false }) : null
  const cfg = state?.rcon ?? m?.rcon
  if (!cfg?.password) die('No rcon config. Add {"rcon":{"host","port","password"}} to the manifest.')
  const command = explicit ?? positionals.join(' ')
  if (!command) die('game.mjs rcon "<command>"')
  try {
    const out = await rcon(cfg.host ?? '127.0.0.1', Number(cfg.port), cfg.password, command)
    console.log(out.trim() || '(empty response)')
  } catch (e) {
    die(`rcon failed: ${e.message}`)
  }
}

function cmdKey() {
  const state = readState()
  const title = flag('--window', state?.window)
  const keys = positionals.join(' ')
  if (!keys) die('game.mjs key "<keys>"   e.g. Escape, ctrl+r, "Return"')
  if (platform() === 'linux' && !isWSL()) {
    const xdo = which('xdotool')
    if (!xdo) die('xdotool not installed — cannot send input on X11.')
    if (title) spawnSync(xdo, ['search', '--name', title, 'windowactivate', '--sync'], { encoding: 'utf8' })
    const r = spawnSync(xdo, [cmd === 'type' ? 'type' : 'key', '--clearmodifiers', keys], { encoding: 'utf8' })
    console.log(r.status === 0 ? `sent: ${keys}` : `failed: ${(r.stderr || '').trim()}`)
    return
  }
  if (platform() === 'darwin') {
    const script = cmd === 'type'
      ? `tell application "System Events" to keystroke ${JSON.stringify(keys)}`
      : `tell application "System Events" to key code ${JSON.stringify(keys)}`
    const r = spawnSync('osascript', ['-e', script], { encoding: 'utf8' })
    console.log(r.status === 0 ? `sent: ${keys}` : `failed: ${(r.stderr || '').trim()}`)
    return
  }
  const psExe = isWSL() ? 'powershell.exe' : 'powershell'
  const activate = title ? `$w=New-Object -ComObject WScript.Shell; $w.AppActivate('${title}'); Start-Sleep -m 300;` : ''
  const r = spawnSync(psExe, ['-NoProfile', '-Command',
    `${activate} Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys.replace(/'/g, "''")}')`,
  ], { encoding: 'utf8' })
  console.log(r.status === 0 ? `sent: ${keys}` : `failed: ${(r.stderr || '').trim()}`)
}

const sleepAsync = (ms) => new Promise((r) => setTimeout(r, ms))

function sleep(ms) {
  // Synchronous by design: every command here is a short-lived CLI run and the
  // control flow reads far better without threading async through the launcher.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

async function cmdDoctor() {
  const m = loadManifest()
  const ok = []
  const bad = []
  const note = (good, msg) => (good ? ok : bad).push(msg)

  if (m._missingVars.length) bad.push(`unset variables: ${m._missingVars.join(', ')} — set under "vars" or in the environment`)
  else ok.push('all ${VARS} resolve')

  if (m.build?.cmd) note(existsSync(resolve(WORKSPACE, m.build.cwd ?? '.')), `build.cwd ${m.build.cwd ?? '.'}`)

  if (m.launch?.cmd) {
    // A launch command is either a path to a binary or a name on PATH; both are
    // worth checking, because "command not found" arrives *after* a build.
    const c = m.launch.cmd
    const isPath = c.includes('/') || c.includes('\\')
    const found = isPath ? existsSync(resolve(WORKSPACE, c)) : !!which(c.split(' ')[0])
    note(found, `launch.cmd ${c}${found ? '' : isPath ? ' — no such file' : ' — not on PATH'}`)
  } else bad.push('no launch.cmd')

  for (const rule of m.install ?? []) {
    const to = resolve(WORKSPACE, rule.to)
    const parent = dirname(to)
    note(existsSync(parent), `install target parent ${parent}${existsSync(parent) ? '' : ' — does not exist'}`)
    if (!rule.from.includes('*')) note(existsSync(resolve(WORKSPACE, rule.from)), `install source ${rule.from}`)
  }

  for (const p of m.log?.paths ?? []) {
    const abs = resolve(WORKSPACE, p)
    const hits = expandGlob(abs)
    // Absence is not failure: most of these are written by the game at runtime.
    if (hits.length) ok.push(`log ${p} → ${hits[0]}`)
    else note(existsSync(dirname(abs)), `log ${p} — not present yet${existsSync(dirname(abs)) ? ' (its directory exists, fine before first run)' : ', and its directory is missing'}`)
  }

  for (const r of m.sourceRoots ?? []) note(existsSync(resolve(WORKSPACE, r)), `sourceRoot ${r}`)

  if (m.rcon?.port) {
    const reachable = await new Promise((res) => {
      const sock = net.connect({ host: m.rcon.host ?? '127.0.0.1', port: Number(m.rcon.port) })
      const done = (v) => { sock.destroy(); res(v) }
      sock.setTimeout(1500)
      sock.on('connect', () => done(true))
      sock.on('error', () => done(false))
      sock.on('timeout', () => done(false))
    })
    note(reachable, `rcon ${m.rcon.host ?? '127.0.0.1'}:${m.rcon.port}${reachable ? '' : ' — not listening (start the server first, or check the port)'}`)
  }

  for (const line of ok) console.log(`  ok    ${line}`)
  for (const line of bad) console.log(`  FAIL  ${line}`)
  console.log(bad.length ? `\n${bad.length} problem(s) — fix these before \`run\`` : '\nmanifest looks runnable')
  if (bad.length) process.exit(1)
}

function cmdHelp() {
  console.log(`game-development — run a game, read its log, look at it, poke it.

  detect                     what kind of project is this?
  init [--preset <name>]     write ${MANIFEST_NAME}
  run [--restart] [--no-build] [--timeout s] [--all]
                             build → install → launch → wait for ready → report
  logs [--errors] [--all] [--grep re] [--lines n] [--reset]
                             NEW log output since last call, errors grouped and
                             mapped to workspace files
  logs --wait "<regex>" [--timeout s]
                             block until that line appears (use after reload)
  doctor                     check the manifest against the machine
  install                    just do the manifest's install/copy step
  reload                     rcon the manifest's reload command
  shot [--out f] [--window t] capture a frame; then READ the png
  rcon "<cmd>"               Source RCON (Minecraft, FiveM)
  key "<keys>" | type "<s>"  send input to the game window
  status                     all sessions
  stop                       end this session

Common flags: --session <id> (default "default"), --dir <workspace>, --manifest <path>
Presets: ${Object.keys(PRESETS).join(', ')}
Per-engine recipes: see engines.md beside this script.`)
}

const COMMANDS = {
  detect: cmdDetect, init: cmdInit, run: cmdRun, logs: cmdLogs, log: cmdLogs, doctor: cmdDoctor,
  status: cmdStatus, stop: cmdStop, shot: cmdShot, screenshot: cmdShot,
  send: cmdSend, rcon: cmdRcon, key: cmdKey, type: cmdKey, help: cmdHelp,
  install: () => { const m = loadManifest(); const r = doInstall(m); console.log(r.copied.length ? `installed: ${r.copied.join(', ')}` : 'nothing to install') },
  reload: async () => {
    const m = loadManifest()
    if (!m.reload) die('manifest has no "reload" command')
    await cmdRcon(m.reload)
  },
}

const handler = COMMANDS[cmd] ?? (() => die(`Unknown command "${cmd}". Try: ${Object.keys(COMMANDS).join(', ')}`))
await handler()
