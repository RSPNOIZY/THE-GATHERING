#!/usr/bin/env node
/**
 * archive — read inside the containers modding actually ships in.
 *
 * `.jar` (Minecraft mods), `.love` (LÖVE/Balatro), `.apk`, and many `.pak` and
 * asset bundles are ZIP. Reading another mod's source is one of the most common
 * things a modder does, and without this it means leaving the editor for
 * unzip/7z/a decompiler GUI — or worse, the agent searching GitHub for a copy of
 * code that is sitting right there on disk.
 *
 * The verb that earns this file is `find`: grep every entry at once. "Which of
 * these 400 classes registers the block" is one call, where the alternative is
 * listing, guessing, and reading entries one at a time.
 *
 * Zero dependencies — zlib's inflateRaw ships with node, and the ZIP central
 * directory is a few struct reads (same idea as bytes.mjs, pointed at a format
 * we happen to know).
 */
import { openSync, readSync, closeSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve, normalize } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const argv = process.argv.slice(2)
const cmd = argv.find((a) => !a.startsWith('--')) ?? 'help'
const VALUE_FLAGS = new Set(['--to', '--in', '--max', '--max-size', '--filter'])
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1] ?? d }
const has = (n) => argv.includes(n)
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
const die = (m) => { console.error(m); process.exit(1) }

// ── ZIP central directory ───────────────────────────────────────────────────

const EOCD_SIG = 0x06054b50
const CEN_SIG = 0x02014b50
const LOC_SIG = 0x04034b50
const SPANNED_SIG = 0x08074b50
const ZIP64_LOCATOR_SIG = 0x07064b50

function readChunk(fd, at, len) {
  const buf = Buffer.alloc(Math.max(0, len))
  if (buf.length) readSync(fd, buf, 0, buf.length, at)
  return buf
}

/**
 * Find the End Of Central Directory record.
 *
 * It sits at the very end UNLESS the archive has a comment, so scan backwards
 * over the maximum comment size rather than assuming the last 22 bytes. An
 * archive with a comment is not corrupt and must not be reported as one.
 */
function findEOCD(fd, size) {
  const span = Math.min(size, 0xffff + 22)
  const buf = readChunk(fd, size - span, span)
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return { buf, i }
  }
  return null
}

const printableHead = (buf) =>
  [...buf].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')

function openZip(path) {
  const size = statSync(path).size
  const fd = openSync(path, 'r')
  const magic = readChunk(fd, 0, 4)
  const sig = size >= 4 ? magic.readUInt32LE(0) : 0
  if (sig !== LOC_SIG && sig !== SPANNED_SIG) {
    // Be explicit: several modding containers look like archives and are not.
    closeSync(fd)
    die(`${basename(path)} is not a ZIP (starts with "${printableHead(magic)}").\n` +
        `Ren'Py .rpa, Unreal .pak and Quake .pak are custom formats — use bytes.mjs --struct on those.`)
  }
  const eocd = findEOCD(fd, size)
  if (!eocd) { closeSync(fd); die(`${basename(path)}: no end-of-central-directory record — truncated or not a ZIP`) }

  let count = eocd.buf.readUInt16LE(eocd.i + 10)
  let cenSize = eocd.buf.readUInt32LE(eocd.i + 12)
  let cenOff = eocd.buf.readUInt32LE(eocd.i + 16)

  // ZIP64: the 32-bit fields saturate. Follow the locator instead of reading a
  // garbage offset, which is how a "corrupt archive" report gets invented.
  if (cenOff === 0xffffffff || cenSize === 0xffffffff || count === 0xffff) {
    let locIdx = -1
    for (let i = eocd.i - 20; i >= 0; i--) {
      if (eocd.buf.readUInt32LE(i) === ZIP64_LOCATOR_SIG) { locIdx = i; break }
    }
    if (locIdx === -1) { closeSync(fd); die('ZIP64 archive without a locator record — cannot read') }
    const z64Off = Number(eocd.buf.readBigUInt64LE(locIdx + 8))
    const z64 = readChunk(fd, z64Off, 56)
    count = Number(z64.readBigUInt64LE(32))
    cenSize = Number(z64.readBigUInt64LE(40))
    cenOff = Number(z64.readBigUInt64LE(48))
  }

  const cen = readChunk(fd, cenOff, cenSize)
  const entries = []
  let p = 0
  while (p + 46 <= cen.length && entries.length < count) {
    if (cen.readUInt32LE(p) !== CEN_SIG) break
    const method = cen.readUInt16LE(p + 10)
    const compSize = cen.readUInt32LE(p + 20)
    const uncompSize = cen.readUInt32LE(p + 24)
    const nameLen = cen.readUInt16LE(p + 28)
    const extraLen = cen.readUInt16LE(p + 30)
    const commentLen = cen.readUInt16LE(p + 32)
    const localOff = cen.readUInt32LE(p + 42)
    const name = cen.subarray(p + 46, p + 46 + nameLen).toString('utf8')
    entries.push({ name, method, compSize, size: uncompSize, localOff, dir: name.endsWith('/') })
    p += 46 + nameLen + extraLen + commentLen
  }
  return { fd, entries, path }
}

/**
 * Decompress one entry.
 *
 * The local header repeats the name and extra-field lengths and they can DIFFER
 * from the central directory's, so they must be re-read here — using the
 * central values is the classic way to land a few bytes into the payload.
 */
function readEntry(zip, e) {
  const loc = readChunk(zip.fd, e.localOff, 30)
  if (loc.readUInt32LE(0) !== LOC_SIG) throw new Error(`bad local header for ${e.name}`)
  const nameLen = loc.readUInt16LE(26)
  const extraLen = loc.readUInt16LE(28)
  const dataAt = e.localOff + 30 + nameLen + extraLen
  const raw = readChunk(zip.fd, dataAt, e.compSize)
  if (e.method === 0) return raw
  if (e.method === 8) return inflateRawSync(raw)
  throw new Error(`${e.name}: unsupported compression method ${e.method}`)
}

/**
 * Glob to RegExp, with gitignore/ripgrep semantics for the common case.
 *
 * A pattern with no slash matches at ANY depth: "*.json" should find
 * data/mod/recipes/x.json, not just top-level files. Anchoring to the root is
 * technically correct glob behaviour and reliably the wrong answer here, since
 * everything interesting in a jar sits several packages deep. A pattern that
 * DOES contain a slash stays anchored to the full entry path.
 *
 * Built character by character rather than by chained .replace() with a
 * placeholder: a sentinel character is exactly how a stray control byte gets
 * baked into a source file, and this one shipped a literal NUL before it was
 * caught.
 */
const globToRe = (g) => {
  const one = (t) => {
    let out = ''
    for (let i = 0; i < t.length; i++) {
      const c = t[i]
      if (c === '*') {
        if (t[i + 1] === '*') { out += '.*'; i++ } else { out += '[^/]*' }
      } else if (c === '?') {
        out += '[^/]'
      } else if ('.+^${}()|[]\\'.includes(c)) {
        out += '\\' + c
      } else {
        out += c
      }
    }
    return t.includes('/') ? out : '(?:.*/)?' + out
  }
  return new RegExp('^' + g.split('|').map((p) => one(p.trim())).join('|') + '$')
}

const human = (n) =>
  n < 1024 ? `${n}B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)}K` : `${(n / 1048576).toFixed(1)}M`

const TEXTUAL = /\.(java|kt|lua|py|rpy|cs|c|cpp|h|hpp|js|ts|json|toml|yml|yaml|xml|txt|md|cfg|properties|gradle|mcmeta|fsh|vsh|glsl|csv|ini|accesswidener)$/i

function archivePath() {
  const f = positionals[0]
  if (!f) die('archive.mjs <command> <file.jar|.love|.apk> …')
  const p = resolve(f)
  if (!existsSync(p)) die(`no such file: ${p}`)
  return p
}

function cmdList() {
  const zip = openZip(archivePath())
  const filter = flag('--filter') ? globToRe(flag('--filter')) : null
  const max = Number(flag('--max', 60))
  const files = zip.entries.filter((e) => !e.dir).filter((e) => !filter || filter.test(e.name))
  console.log(`${basename(zip.path)}: ${zip.entries.length} entries${filter ? `, ${files.length} match the filter` : ''}`)
  for (const e of files.slice(0, max)) console.log(`  ${human(e.size).padStart(6)}  ${e.name}`)
  if (files.length > max) {
    console.log(`  … ${files.length - max} more — narrow with --filter "*.java", or use \`find\``)
    // A flat listing of a 400-entry jar is rarely the actual question, so show
    // the shape of the archive instead of trailing off mid-alphabet.
    const dirs = new Map()
    for (const e of files) { const d = dirname(e.name); dirs.set(d, (dirs.get(d) ?? 0) + 1) }
    const top = [...dirs].sort((a, b) => b[1] - a[1]).slice(0, 8)
    console.log('\n  busiest directories:')
    for (const [d, n] of top) console.log(`    ${String(n).padStart(4)}  ${d}/`)
  }
  closeSync(zip.fd)
}

function cmdCat() {
  const zip = openZip(archivePath())
  const want = positionals[1]
  if (!want) die('archive.mjs cat <file.jar> <entry/path>')
  let e = zip.entries.find((x) => x.name === want)
  if (!e) {
    // Basename fallback: the caller usually knows the class, not the package.
    const hits = zip.entries.filter((x) => !x.dir && basename(x.name) === want)
    if (hits.length === 1) e = hits[0]
    else if (hits.length > 1) {
      console.log(`${hits.length} entries named ${want} — name one:`)
      for (const h of hits.slice(0, 20)) console.log(`  ${h.name}`)
      closeSync(zip.fd); process.exit(1)
    }
  }
  if (!e) { closeSync(zip.fd); die(`no entry "${want}" — try: archive.mjs list ${basename(zip.path)} --filter "*${want}*"`) }

  let buf
  try { buf = readEntry(zip, e) } catch (err) { closeSync(zip.fd); die(String(err.message)) }
  const cap = Number(flag('--max-size', 200000))
  const looksBinary = !TEXTUAL.test(e.name) && buf.subarray(0, 8000).includes(0)
  if (looksBinary) {
    console.log(`${e.name} is binary (${human(buf.length)}). Extract it, then use bytes.mjs:`)
    console.log(`  archive.mjs extract ${basename(zip.path)} ${e.name} --to ./out`)
  } else if (buf.length > cap) {
    console.log(`${e.name} is ${human(buf.length)} — showing the first ${human(cap)} (raise with --max-size)`)
    console.log(buf.subarray(0, cap).toString('utf8'))
  } else {
    console.log(buf.toString('utf8'))
  }
  closeSync(zip.fd)
}

/** grep across every entry — the reason this file exists. */
function cmdFind() {
  const zip = openZip(archivePath())
  const pattern = positionals[1]
  if (!pattern) die('archive.mjs find <file.jar> "<regex>" [--in "*.java"]')
  const re = new RegExp(pattern, has('--case') ? '' : 'i')
  const inGlob = flag('--in')
  const inRe = inGlob && inGlob !== '*' ? globToRe(inGlob) : null
  const searchAll = inGlob === '*'
  const max = Number(flag('--max', 40))
  const maxSize = Number(flag('--max-size', 4 * 1024 * 1024))
  const hits = []
  let scanned = 0
  let skipped = 0

  for (const e of zip.entries) {
    if (e.dir || hits.length >= max) continue
    if (inRe && !inRe.test(e.name)) continue
    if (e.size > maxSize) { skipped++; continue }
    // Without an explicit --in, only look at extensions that are plausibly
    // source. Inflating every .png in a resource pack to regex it is pure cost.
    if (!inRe && !searchAll && !TEXTUAL.test(e.name)) { skipped++; continue }
    let text
    try { text = readEntry(zip, e).toString('utf8') } catch { skipped++; continue }
    scanned++
    const lines = text.split('\n')
    for (let i = 0; i < lines.length && hits.length < max; i++) {
      if (re.test(lines[i])) hits.push({ name: e.name, line: i + 1, text: lines[i].trim().slice(0, 160) })
    }
  }

  console.log(
    `${basename(zip.path)}: ${hits.length} hit(s) for /${pattern}/ in ${scanned} entr${scanned === 1 ? 'y' : 'ies'}` +
    `${skipped ? `, ${skipped} skipped (binary or over ${human(maxSize)})` : ''}${hits.length >= max ? ' — capped' : ''}`,
  )
  for (const h of hits) console.log(`  ${h.name}:${h.line}  ${h.text}`)
  if (!hits.length && !inRe && !searchAll) {
    console.log('  (only source-like extensions were scanned — pass --in "*" to search everything)')
  }
  closeSync(zip.fd)
}

function cmdExtract() {
  const zip = openZip(archivePath())
  const want = positionals[1]
  const to = resolve(flag('--to', './extracted'))
  const filter = flag('--filter') ? globToRe(flag('--filter')) : null
  const targets = want
    ? zip.entries.filter((e) => !e.dir && (e.name === want || basename(e.name) === want))
    : zip.entries.filter((e) => !e.dir && (!filter || filter.test(e.name)))
  if (!targets.length) { closeSync(zip.fd); die('nothing matched') }

  let n = 0
  for (const e of targets) {
    // Zip-slip: an entry named ../../../etc/passwd must not escape the output
    // directory. Archives from the internet are exactly the untrusted input
    // this attack was designed for.
    const cleaned = normalize(e.name).replace(/^(\.\.[/\\])+/, '')
    const dest = join(to, cleaned)
    if (!resolve(dest).startsWith(resolve(to))) { console.log(`refused unsafe entry ${e.name}`); continue }
    try {
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, readEntry(zip, e))
      n++
    } catch (err) { console.log(`failed ${e.name}: ${err.message}`) }
  }
  console.log(`extracted ${n} entr${n === 1 ? 'y' : 'ies'} → ${to}`)
  closeSync(zip.fd)
}

function help() {
  console.log(`archive — read inside .jar / .love / .apk / zip-based .pak

  archive.mjs find <file> "<regex>" [--in "*.lua"] [--case] [--max n]
       grep every entry at once — usually the question you actually have
  archive.mjs list <file> [--filter "*.java"] [--max n]
  archive.mjs cat <file> <entry|basename> [--max-size n]
  archive.mjs extract <file> [<entry>] [--filter "*.png"] --to <dir>

Ren'Py .rpa, Unreal .pak and Quake .pak are NOT zip — use bytes.mjs --struct.`)
}

const CMDS = { find: cmdFind, grep: cmdFind, list: cmdList, ls: cmdList, cat: cmdCat, extract: cmdExtract, help }
;(CMDS[cmd] ?? help)()
