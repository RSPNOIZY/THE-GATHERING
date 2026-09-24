#!/usr/bin/env node
/**
 * bytes — read binary files the way an agent can actually afford to.
 *
 * A hex DUMP is the obvious thing to build here and very nearly the least
 * useful: 4KB of `48 8B 05 …` is ~16k tokens of the lowest-density text there
 * is, and the answer the caller wanted was three numbers. So the verbs here are
 * the ones whose OUTPUT is small — find a pattern, overlay a struct, diff two
 * files, list strings — and the raw dump is deliberately ranged and capped.
 *
 * Exists because modding runs into binary constantly: ROM images, save files,
 * asset archives (.rpa/.pak/.love), and signature scanning where the offsets
 * move every patch. All of that is "read a few fields at a known offset", not
 * "show me the file".
 *
 * Zero dependencies, streams in chunks — a 2GB ROM must not be loaded to answer
 * a question about 16 bytes of it.
 */
import { openSync, readSync, closeSync, statSync, existsSync, copyFileSync, writeSync } from 'node:fs'
import { basename } from 'node:path'

const argv = process.argv.slice(2)
const VALUE_FLAGS = new Set(['--at', '--len', '--struct', '--find', '--find-text', '--mask',
  '--diff', '--patch', '--min', '--max-hits', '--skip'])
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : (VALUE_FLAGS.has(n) ? argv[i + 1] ?? d : true) }
const has = (n) => argv.includes(n)
const file = argv.find((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(argv[i - 1]))
const die = (m) => { console.error(m); process.exit(1) }

/** Accepts 0x1F, 1F, 31 — hex is the norm for offsets, decimal the exception. */
const num = (v, d) => {
  if (v === undefined || v === null) return d
  const s = String(v).trim()
  if (/^0x/i.test(s)) return parseInt(s, 16)
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  if (/^[0-9a-f]+$/i.test(s)) return parseInt(s, 16)
  return d
}
const hex = (n, w = 8) => '0x' + n.toString(16).toUpperCase().padStart(w, '0')

const CHUNK = 1 << 20

function readAt(path, at, len) {
  const fd = openSync(path, 'r')
  try {
    const size = statSync(path).size
    const start = Math.max(0, Math.min(at, size))
    const n = Math.max(0, Math.min(len, size - start))
    const buf = Buffer.alloc(n)
    readSync(fd, buf, 0, n, start)
    return buf
  } finally { closeSync(fd) }
}

/**
 * Scan the whole file in chunks, overlapping by the needle length so a match
 * that straddles a chunk boundary is not silently missed — the classic bug in
 * hand-rolled scanners, and one that produces a confident "not found".
 */
function scan(path, needleLen, onChunk) {
  const fd = openSync(path, 'r')
  try {
    const size = statSync(path).size
    const overlap = Math.max(0, needleLen - 1)
    let pos = 0
    let prev = Buffer.alloc(0)
    while (pos < size) {
      const n = Math.min(CHUNK, size - pos)
      const buf = Buffer.alloc(n)
      readSync(fd, buf, 0, n, pos)
      const joined = prev.length ? Buffer.concat([prev, buf]) : buf
      const base = pos - prev.length
      if (onChunk(joined, base) === false) return
      prev = joined.subarray(Math.max(0, joined.length - overlap))
      pos += n
    }
  } finally { closeSync(fd) }
}

/** "48 8B 05 ?? ?? ?? ??" → bytes + wildcard mask. Also accepts 488B05 runs. */
function parsePattern(spec, maskSpec) {
  const toks = spec.trim().split(/\s+/).flatMap((t) =>
    /^([0-9a-f?]{2})+$/i.test(t) && t.length > 2 ? t.match(/.{2}/g) : [t])
  const bytes = []
  const wild = []
  for (const t of toks) {
    if (/^(\?\?|\?|\*|xx)$/i.test(t) && t !== 'xx') { bytes.push(0); wild.push(true); continue }
    const v = parseInt(t, 16)
    if (Number.isNaN(v)) die(`bad byte in pattern: "${t}"`)
    bytes.push(v & 0xff); wild.push(false)
  }
  // Separate mask form, as used by most published signatures: "xxx????"
  if (maskSpec) {
    if (maskSpec.length !== bytes.length) die(`mask length ${maskSpec.length} != pattern length ${bytes.length}`)
    for (let i = 0; i < maskSpec.length; i++) wild[i] = maskSpec[i] !== 'x'
  }
  return { bytes: Buffer.from(bytes), wild }
}

function cmdFind() {
  const raw = flag('--find')
  const text = flag('--find-text')
  const maxHits = num(flag('--max-hits'), 20)
  let needle, wild, label
  if (text) { needle = Buffer.from(String(text), 'utf8'); wild = new Array(needle.length).fill(false); label = JSON.stringify(text) }
  else { const p = parsePattern(String(raw), flag('--mask')); needle = p.bytes; wild = p.wild; label = String(raw) }
  if (!needle.length) die('empty pattern')

  const hits = []
  scan(file, needle.length, (buf, base) => {
    outer: for (let i = 0; i + needle.length <= buf.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (!wild[j] && buf[i + j] !== needle[j]) continue outer
      }
      const off = base + i
      if (!hits.includes(off)) hits.push(off)
      if (hits.length >= maxHits) return false
    }
  })
  console.log(`${basename(file)}: ${hits.length} match(es) for ${label}${hits.length >= maxHits ? ' (capped)' : ''}`)
  for (const h of hits) {
    // One row of context, always — a match list is a list, not a dump.
    const from = Math.max(0, h - 4)
    const ctx = readAt(file, from, 16)
    const bytesHex = [...ctx].map((b, i) => (from + i === h ? '[' : '') +
      b.toString(16).padStart(2, '0').toUpperCase() + (from + i === h + needle.length - 1 ? ']' : '')).join(' ')
    console.log(`  ${hex(h)}  ${bytesHex}`)
  }
  if (!hits.length) {
    console.log('  (nothing — check byte order, and that the pattern is for THIS build:')
    console.log('   signatures published for one game version rarely survive a patch)')
  }
}

// ── struct overlay ──────────────────────────────────────────────────────────
// The highest-value verb: turns "what is at 0x10" into named fields with values,
// which is what the caller actually wanted from a hex view.

const READERS = {
  u8: [1, (b, o) => b.readUInt8(o)], i8: [1, (b, o) => b.readInt8(o)],
  u16le: [2, (b, o) => b.readUInt16LE(o)], u16be: [2, (b, o) => b.readUInt16BE(o)],
  i16le: [2, (b, o) => b.readInt16LE(o)], i16be: [2, (b, o) => b.readInt16BE(o)],
  u32le: [4, (b, o) => b.readUInt32LE(o)], u32be: [4, (b, o) => b.readUInt32BE(o)],
  i32le: [4, (b, o) => b.readInt32LE(o)], i32be: [4, (b, o) => b.readInt32BE(o)],
  u64le: [8, (b, o) => b.readBigUInt64LE(o).toString()], u64be: [8, (b, o) => b.readBigUInt64BE(o).toString()],
  f32le: [4, (b, o) => b.readFloatLE(o)], f64le: [8, (b, o) => b.readDoubleLE(o)],
}

function parseSpec(spec) {
  // "magic:char[8],version:u32le,index:u64le" — inline so a one-off overlay
  // needs no file on disk.
  return spec.split(',').map((f) => {
    const m = /^\s*([\w.-]+)\s*:\s*(\w+)(?:\[(\d+)\])?\s*(?:@\s*(\w+))?\s*$/.exec(f)
    if (!m) die(`bad field spec: "${f}" (want name:type or name:char[8] or name:u32le@0x10)`)
    return { name: m[1], type: m[2], count: m[3] ? parseInt(m[3], 10) : null, at: m[4] ? num(m[4]) : null }
  })
}

function cmdStruct() {
  const fields = parseSpec(String(flag('--struct')))
  let cursor = num(flag('--at'), 0)
  const rows = []
  for (const f of fields) {
    const off = f.at ?? cursor
    if (f.type === 'char' || f.type === 'bytes') {
      const n = f.count ?? 1
      const b = readAt(file, off, n)
      rows.push([f.name, `${f.type}[${n}]`, hex(off),
        f.type === 'char' ? JSON.stringify(b.toString('latin1')) : b.toString('hex').toUpperCase()])
      cursor = off + n
    } else if (f.type === 'cstr') {
      const b = readAt(file, off, f.count ?? 256)
      const end = b.indexOf(0)
      const s = b.subarray(0, end === -1 ? b.length : end).toString('latin1')
      rows.push([f.name, 'cstr', hex(off), JSON.stringify(s)])
      cursor = off + s.length + 1
    } else {
      const r = READERS[f.type]
      if (!r) die(`unknown type "${f.type}". Known: ${Object.keys(READERS).join(', ')}, char[N], bytes[N], cstr`)
      const [size, read] = r
      const n = f.count ?? 1
      const vals = []
      for (let i = 0; i < n; i++) {
        const b = readAt(file, off + i * size, size)
        if (b.length < size) { vals.push('(past EOF)'); break }
        vals.push(read(b, 0))
      }
      rows.push([f.name, f.type + (f.count ? `[${n}]` : ''), hex(off),
        vals.map((v) => typeof v === 'number' && Number.isInteger(v) ? `${v} (${hex(v, 2)})` : String(v)).join(', ')])
      cursor = off + size * n
    }
  }
  const w = [0, 1, 2].map((i) => Math.max(...rows.map((r) => r[i].length)))
  for (const r of rows) console.log(`${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2].padEnd(w[2])}  ${r[3]}`)
}

// ── diff ────────────────────────────────────────────────────────────────────
// How you find an unknown offset: save, change one thing in-game, save again,
// diff. The changed ranges ARE the answer.

function cmdDiff() {
  const other = String(flag('--diff'))
  if (!existsSync(other)) die(`no such file: ${other}`)
  const aSize = statSync(file).size
  const bSize = statSync(other).size
  const fa = openSync(file, 'r'); const fb = openSync(other, 'r')
  const ranges = []
  try {
    const n = Math.min(aSize, bSize)
    let pos = 0
    let run = null
    while (pos < n) {
      const len = Math.min(CHUNK, n - pos)
      const ba = Buffer.alloc(len); const bb = Buffer.alloc(len)
      readSync(fa, ba, 0, len, pos); readSync(fb, bb, 0, len, pos)
      for (let i = 0; i < len; i++) {
        if (ba[i] !== bb[i]) {
          if (run && pos + i === run.end + 1) run.end = pos + i
          else { run = { start: pos + i, end: pos + i }; ranges.push(run) }
        }
      }
      pos += len
    }
  } finally { closeSync(fa); closeSync(fb) }

  console.log(`${basename(file)} (${aSize}) vs ${basename(other)} (${bSize})`)
  if (aSize !== bSize) console.log(`  sizes differ by ${Math.abs(aSize - bSize)} byte(s)`)
  console.log(`  ${ranges.length} differing range(s)`)
  const show = ranges.slice(0, num(flag('--max-hits'), 30))
  for (const r of show) {
    const len = r.end - r.start + 1
    const a = readAt(file, r.start, Math.min(len, 16))
    const b = readAt(other, r.start, Math.min(len, 16))
    console.log(`  ${hex(r.start)} +${len}  ${a.toString('hex').toUpperCase()} → ${b.toString('hex').toUpperCase()}${len > 16 ? ' …' : ''}`)
  }
  if (ranges.length > show.length) console.log(`  … ${ranges.length - show.length} more`)
  if (ranges.length > 200) console.log('\n  Hundreds of ranges usually means the format is compressed or re-serialised;\n  diffing raw bytes will not isolate a field. Decompress first.')
}

// ── strings ─────────────────────────────────────────────────────────────────

function cmdStrings() {
  const min = num(flag('--min'), 6)
  const max = num(flag('--max-hits'), 100)
  const out = []
  scan(file, 1, (buf, base) => {
    let start = -1
    for (let i = 0; i < buf.length; i++) {
      const c = buf[i]
      const printable = c >= 0x20 && c < 0x7f
      if (printable) { if (start === -1) start = i }
      else {
        if (start !== -1 && i - start >= min) {
          const off = base + start
          if (!out.some((o) => o.off === off)) out.push({ off, s: buf.subarray(start, i).toString('latin1') })
        }
        start = -1
      }
    }
    if (out.length >= max) return false
  })
  console.log(`${basename(file)}: ${out.length} string(s) ≥${min} chars${out.length >= max ? ' (capped)' : ''}`)
  for (const o of out.slice(0, max)) console.log(`  ${hex(o.off)}  ${JSON.stringify(o.s)}`)
}

// ── view / patch ────────────────────────────────────────────────────────────

function dumpLine(buf, base) {
  const parts = []
  for (let i = 0; i < buf.length; i += 16) {
    const row = buf.subarray(i, i + 16)
    const h = [...row].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ').padEnd(47)
    const a = [...row].map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.')).join('')
    parts.push(`${hex(base + i)}  ${h}  |${a}|`)
  }
  return parts.join('\n')
}

const MAX_VIEW = 1024

function cmdView() {
  const at = num(flag('--at'), 0)
  let len = num(flag('--len'), 128)
  if (len > MAX_VIEW) {
    // Capped on purpose. If you need more than a kilobyte of hex you almost
    // certainly want --find, --struct or --strings instead.
    console.log(`(--len ${len} capped to ${MAX_VIEW}; use --find/--struct/--strings for whole-file questions)`)
    len = MAX_VIEW
  }
  const buf = readAt(file, at, len)
  console.log(`${basename(file)}  size=${statSync(file).size} (${hex(statSync(file).size)})  showing ${buf.length} @ ${hex(at)}`)
  console.log(dumpLine(buf, at))
}

function cmdPatch() {
  // "0x1234=90 90" — write bytes, keeping a .bak. Modding is destructive by
  // nature; losing someone's only ROM to a typo is not an acceptable failure.
  const spec = String(flag('--patch'))
  const m = /^\s*(\S+)\s*=\s*(.+)$/.exec(spec)
  if (!m) die('--patch "0x1234=90 90"')
  const at = num(m[1])
  const { bytes } = parsePattern(m[2])
  if (!has('--no-backup')) {
    const bak = file + '.bak'
    if (!existsSync(bak)) { copyFileSync(file, bak); console.log(`backup: ${bak}`) }
  }
  const before = readAt(file, at, bytes.length)
  const fd = openSync(file, 'r+')
  try { writeSync(fd, bytes, 0, bytes.length, at) } finally { closeSync(fd) }
  console.log(`patched ${hex(at)}: ${before.toString('hex').toUpperCase()} → ${bytes.toString('hex').toUpperCase()}`)
}

function help() {
  console.log(`bytes — inspect binary files (ROMs, saves, archives, assets)

  bytes <file> --at 0x100 --len 128        ranged hex + ascii (capped at ${MAX_VIEW})
  bytes <file> --struct "magic:char[8],ver:u32le,index:u64le" [--at 0]
                                           overlay named fields; @0x10 pins one
  bytes <file> --find "48 8B 05 ?? ?? ?? ??" [--mask xxx????] [--max-hits n]
  bytes <file> --find-text "RPA-3.2"
  bytes <file> --diff other.sav            changed ranges — how you locate a field
  bytes <file> --strings [--min 6]
  bytes <file> --patch "0x1234=90 90" [--no-backup]

types: ${Object.keys(READERS).join(' ')} char[N] bytes[N] cstr
offsets: 0x1F, 1F and 31 all work (bare hex is assumed for non-decimal)`)
}

if (!file || has('--help') || has('-h')) { help(); process.exit(file ? 0 : 1) }
if (!existsSync(file)) die(`no such file: ${file}`)
if (flag('--find') || flag('--find-text')) cmdFind()
else if (flag('--struct')) cmdStruct()
else if (flag('--diff')) cmdDiff()
else if (has('--strings')) cmdStrings()
else if (flag('--patch')) cmdPatch()
else cmdView()
