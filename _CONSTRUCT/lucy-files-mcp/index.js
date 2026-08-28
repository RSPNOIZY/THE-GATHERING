#!/usr/bin/env node
/**
 * lucy-files-mcp  ·  File Management MCP Server
 * macOS · Claude Desktop (Cowork)
 * Operations: scan · rename · retag · dedupe · reorganize
 *
 * Safety model:
 *   1. All paths validated against allowedRoots in lucy-files-config.json
 *   2. Destructive operations (rename, move, delete) require a two-step
 *      preview → execute_plan flow with a short-lived confirmation token
 *   3. TagSpaces sidecars (.ts/*.json) travel with their files on every move
 */

const { Server }               = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, 'lucy-files-config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { allowedRoots: [], tagspacesMetaDir: '.ts' };
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot parse lucy-files-config.json: ${e.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Safety: path allowlist
// ─────────────────────────────────────────────────────────────────────────────

function isAllowed(targetPath, config) {
  const resolved = path.resolve(targetPath);
  return config.allowedRoots.some(root => {
    const r = path.resolve(root);
    return resolved === r || resolved.startsWith(r + path.sep);
  });
}

function requireAllowed(targetPath, config) {
  if (!isAllowed(targetPath, config)) {
    throw new Error(
      `Blocked — path is outside the allowlist:\n  ${targetPath}\n` +
      `Allowed roots: ${config.allowedRoots.join(', ') || '(none configured)'}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan store  (preview → confirm → execute)
// ─────────────────────────────────────────────────────────────────────────────

const plans = new Map();   // planId → { type, operations, token, expiresAt }
const PLAN_TTL = 10 * 60 * 1000;  // 10 minutes

function savePlan(type, operations) {
  const planId = crypto.randomUUID();
  const token  = crypto.randomBytes(4).toString('hex').toUpperCase();
  plans.set(planId, { type, operations, token, expiresAt: Date.now() + PLAN_TTL });
  setTimeout(() => plans.delete(planId), PLAN_TTL);
  return { planId, confirmationToken: token };
}

function getPlan(planId, token) {
  const plan = plans.get(planId);
  if (!plan)            throw new Error(`Plan not found or expired: ${planId}`);
  if (Date.now() > plan.expiresAt) { plans.delete(planId); throw new Error('Plan expired'); }
  if (plan.token !== token)         throw new Error('Invalid confirmation token');
  return plan;
}

// ─────────────────────────────────────────────────────────────────────────────
// File utilities
// ─────────────────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(['.git', 'node_modules', '.Trash', '.ts', '.DS_Store']);

function walk(dir, recursive = true) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }

  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory() && recursive) { out.push(...walk(full, true)); }
    else if (e.isFile())              { out.push(full); }
  }
  return out;
}

function fileHash(p, alg = 'md5') {
  return crypto.createHash(alg).update(fs.readFileSync(p)).digest('hex');
}

function fmtBytes(n) {
  if (n < 1024)       return `${n} B`;
  if (n < 1048576)    return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

const EXT_MAP = {
  audio:    ['.mp3','.wav','.flac','.aiff','.m4a','.ogg','.opus','.alac'],
  video:    ['.mp4','.mov','.avi','.mkv','.m4v','.webm','.mts'],
  image:    ['.jpg','.jpeg','.png','.gif','.webp','.heic','.tiff','.svg','.raw','.cr2'],
  document: ['.pdf','.doc','.docx','.txt','.md','.pages','.rtf','.odt'],
  code:     ['.js','.ts','.py','.rb','.go','.rs','.swift','.sh','.bash','.zsh','.json','.yaml','.yml'],
  data:     ['.csv','.tsv','.xml','.sqlite','.db','.parquet'],
  archive:  ['.zip','.tar','.gz','.7z','.rar','.dmg'],
};
const EXT_LOOKUP = Object.fromEntries(
  Object.entries(EXT_MAP).flatMap(([cat, exts]) => exts.map(e => [e, cat]))
);
function classify(p) { return EXT_LOOKUP[path.extname(p).toLowerCase()] || 'other'; }

// ─────────────────────────────────────────────────────────────────────────────
// TagSpaces metadata  (.ts/<filename>.json)
// ─────────────────────────────────────────────────────────────────────────────

function metaPath(filePath, config) {
  const dir  = path.dirname(filePath);
  const base = path.basename(filePath);
  return path.join(dir, config.tagspacesMetaDir || '.ts', `${base}.json`);
}

function readMeta(filePath, config) {
  const mp = metaPath(filePath, config);
  if (!fs.existsSync(mp)) return null;
  try { return JSON.parse(fs.readFileSync(mp, 'utf8')); } catch { return null; }
}

function writeMeta(filePath, meta, config) {
  const mp  = metaPath(filePath, config);
  const dir = path.dirname(mp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(mp, JSON.stringify(meta, null, 2));
}

function moveMeta(oldPath, newPath, config) {
  const src = metaPath(oldPath, config);
  if (!fs.existsSync(src)) return;
  const dst    = metaPath(newPath, config);
  const dstDir = path.dirname(dst);
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
  fs.renameSync(src, dst);
}

// ─────────────────────────────────────────────────────────────────────────────
// tscmd detection  (TagSpaces CLI)
// ─────────────────────────────────────────────────────────────────────────────

let tscmdReady = null;
async function hasTscmd() {
  if (tscmdReady !== null) return tscmdReady;
  try { await execAsync('tscmd --version'); tscmdReady = true; }
  catch { tscmdReady = false; }
  return tscmdReady;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool handlers
// ─────────────────────────────────────────────────────────────────────────────

async function scanFolder({ folder, recursive = true }) {
  const cfg   = loadConfig();
  requireAllowed(folder, cfg);

  const files  = walk(folder, recursive);
  const inv    = [];
  let totalSz  = 0;
  const byCat  = {};
  let noTags   = 0;

  for (const f of files) {
    let st;
    try { st = fs.statSync(f); } catch { continue; }
    const cat  = classify(f);
    const meta = readMeta(f, cfg);
    const tags = (meta?.tags || []).map(t => (typeof t === 'string' ? t : t.title));

    totalSz += st.size;
    byCat[cat] = (byCat[cat] || 0) + 1;
    if (!tags.length) noTags++;

    inv.push({
      path: f,
      name: path.basename(f),
      category: cat,
      sizeHuman: fmtBytes(st.size),
      size: st.size,
      modified: st.mtime.toISOString().slice(0, 10),
      tags,
      hasTags: tags.length > 0,
    });
  }

  return {
    folder,
    stats: {
      totalFiles: files.length,
      totalSize: fmtBytes(totalSz),
      byCategory: byCat,
      filesWithoutTags: noTags,
    },
    inventory: inv,
  };
}

async function findDuplicates({ folders, algorithm = 'md5' }) {
  const cfg = loadConfig();
  for (const f of folders) requireAllowed(f, cfg);

  const allFiles = folders.flatMap(f => walk(f, true));
  const hashes   = new Map();

  for (const f of allFiles) {
    let h;
    try { h = fileHash(f, algorithm); } catch { continue; }
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(f);
  }

  let wasted = 0;
  const groups = [];
  for (const [hash, paths] of hashes) {
    if (paths.length < 2) continue;
    const sz = fs.statSync(paths[0]).size;
    wasted  += sz * (paths.length - 1);
    groups.push({
      hash,
      copies: paths.length,
      sizeEach: fmtBytes(sz),
      wastedSpace: fmtBytes(sz * (paths.length - 1)),
      files: paths,
    });
  }
  groups.sort((a, b) => b.copies - a.copies);

  return {
    scanned: allFiles.length,
    duplicateGroups: groups.length,
    totalWastedSpace: fmtBytes(wasted),
    groups,
  };
}

async function previewRename({ folder, rules }) {
  const cfg = loadConfig();
  requireAllowed(folder, cfg);

  const files   = walk(folder, true);
  const changes = [];

  for (const f of files) {
    let name    = path.basename(f);
    let changed = false;

    for (const rule of rules) {
      const rgx = new RegExp(rule.pattern, 'g');
      const scope = rule.scope || 'name';
      let target;

      if (scope === 'name') target = path.basename(name, path.extname(name));
      else if (scope === 'ext') target = path.extname(name).slice(1);
      else target = name;

      const next = target.replace(rgx, rule.replacement);
      if (next !== target) {
        if (scope === 'name')      name = next + path.extname(name);
        else if (scope === 'ext')  name = path.basename(name, path.extname(name)) + '.' + next;
        else                       name = next;
        changed = true;
      }
    }

    if (changed) {
      changes.push({ action: 'rename', from: f, to: path.join(path.dirname(f), name) });
    }
  }

  const { planId, confirmationToken } = savePlan('rename', changes);
  return {
    changeCount: changes.length,
    planId,
    confirmationToken,
    message: `Review the preview below, then call execute_plan with planId + confirmationToken to apply.`,
    preview: changes.slice(0, 30),
    moreChanges: changes.length > 30 ? changes.length - 30 : 0,
  };
}

async function previewReorganize({ folder, structure }) {
  const cfg = loadConfig();
  requireAllowed(folder, cfg);

  const files = walk(folder, false);   // shallow — one level at a time is safer
  const ops   = [];

  for (const f of files) {
    const cat  = classify(f);
    const name = path.basename(f);
    const ext  = path.extname(f).toLowerCase();

    for (const rule of structure) {
      let ok = true;
      if (rule.match.category    && rule.match.category    !== cat)  ok = false;
      if (rule.match.extension   && rule.match.extension   !== ext)  ok = false;
      if (rule.match.namePattern && !new RegExp(rule.match.namePattern, 'i').test(name)) ok = false;

      if (ok) {
        const dst = path.join(folder, rule.targetFolder, name);
        if (dst !== f) ops.push({ action: 'move', from: f, to: dst });
        break;
      }
    }
  }

  const { planId, confirmationToken } = savePlan('reorganize', ops);
  return {
    operationCount: ops.length,
    planId,
    confirmationToken,
    message: `Review, then call execute_plan to apply. Plans expire in 10 minutes.`,
    preview: ops.slice(0, 30),
  };
}

async function applyTags({ files, tags, description }) {
  const cfg     = loadConfig();
  for (const f of files) requireAllowed(f, cfg);

  const useTscmd = await hasTscmd();
  const results  = [];

  for (const f of files) {
    if (!fs.existsSync(f)) { results.push({ file: f, status: 'not_found' }); continue; }

    if (useTscmd) {
      // tscmd format: tscmd --tag "/path/to/file.mp3" tag1 tag2
      const tagArgs = tags.map(t => `"${t}"`).join(' ');
      try {
        await execAsync(`tscmd --tag "${f}" ${tagArgs}`);
        results.push({ file: f, status: 'tagged', via: 'tscmd', tags });
      } catch (e) {
        results.push({ file: f, status: 'error', error: e.message });
      }
    } else {
      // Direct sidecar write (TagSpaces-compatible format)
      const existing = readMeta(f, cfg) || {};
      const oldTags  = (existing.tags || []).map(t => (typeof t === 'string' ? t : t.title));
      const merged   = [...new Set([...oldTags, ...tags])];

      const meta = {
        ...existing,
        tags: merged.map(t => ({ title: t })),
        description: description ?? existing.description ?? '',
        lastModified: new Date().toISOString(),
      };
      writeMeta(f, meta, cfg);
      results.push({ file: f, status: 'tagged', via: 'sidecar', tags: merged });
    }
  }

  return { tagged: results.filter(r => r.status === 'tagged').length, results };
}

async function executePlan({ planId, confirmationToken }) {
  const cfg     = loadConfig();
  const plan    = getPlan(planId, confirmationToken);
  const done    = [];
  const failed  = [];

  for (const op of plan.operations) {
    try {
      requireAllowed(op.from, cfg);
      if (op.to) requireAllowed(op.to, cfg);

      if (op.action === 'rename' || op.action === 'move') {
        const dstDir = path.dirname(op.to);
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        fs.renameSync(op.from, op.to);
        moveMeta(op.from, op.to, cfg);   // carry sidecar
        done.push(op);

      } else if (op.action === 'delete') {
        fs.unlinkSync(op.from);
        done.push(op);
      }
    } catch (e) {
      failed.push({ ...op, error: e.message });
    }
  }

  plans.delete(planId);
  return {
    planId,
    planType: plan.type,
    total: plan.operations.length,
    succeeded: done.length,
    failed: failed.length,
    failures: failed,
  };
}

async function repairMetadata({ folder }) {
  const cfg     = loadConfig();
  requireAllowed(folder, cfg);

  const metaDir = path.join(folder, cfg.tagspacesMetaDir || '.ts');
  if (!fs.existsSync(metaDir)) {
    return { folder, orphans: 0, message: 'No .ts directory found — nothing to repair.' };
  }

  const sidecars = fs.readdirSync(metaDir).filter(f => f.endsWith('.json'));
  const orphans  = sidecars
    .map(s => path.join(metaDir, s))
    .filter(sp => {
      const original = path.join(folder, path.basename(sp, '.json'));
      return !fs.existsSync(original);
    });

  const ops = orphans.map(f => ({ action: 'delete', from: f }));
  const { planId, confirmationToken } = savePlan('delete_orphans', ops);

  return {
    folder,
    totalSidecars: sidecars.length,
    orphans: orphans.length,
    orphanPaths: orphans,
    planId,
    confirmationToken,
    message: orphans.length
      ? `Found ${orphans.length} orphaned sidecar(s). Call execute_plan to delete them.`
      : 'No orphaned sidecars found.',
  };
}

async function generateIndex({ folder, outputPath }) {
  const cfg = loadConfig();
  requireAllowed(folder, cfg);
  if (outputPath) requireAllowed(outputPath, cfg);

  const files = walk(folder, true);
  let totalSz = 0;
  const index = [];

  for (const f of files) {
    let st;
    try { st = fs.statSync(f); } catch { continue; }
    const meta = readMeta(f, cfg);
    const tags = (meta?.tags || []).map(t => (typeof t === 'string' ? t : t.title));

    totalSz += st.size;
    index.push({
      path:        path.relative(folder, f),
      category:    classify(f),
      size:        st.size,
      sizeHuman:   fmtBytes(st.size),
      modified:    st.mtime.toISOString().slice(0, 10),
      tags,
      description: meta?.description || '',
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    root:        folder,
    totalFiles:  index.length,
    totalSize:   fmtBytes(totalSz),
    files:       index,
  };

  const dest = outputPath || path.join(folder, 'lucy-index.json');
  fs.writeFileSync(dest, JSON.stringify(manifest, null, 2));

  return {
    indexPath:  dest,
    totalFiles: index.length,
    totalSize:  fmtBytes(totalSz),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'scan_folder',
    description: 'Scan a folder and return a file inventory: categories, sizes, tag status, missing metadata.',
    inputSchema: {
      type: 'object',
      required: ['folder'],
      properties: {
        folder:    { type: 'string', description: 'Absolute path to scan' },
        recursive: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'find_duplicates',
    description: 'Detect exact duplicate files by content hash across one or more folders.',
    inputSchema: {
      type: 'object',
      required: ['folders'],
      properties: {
        folders:   { type: 'array', items: { type: 'string' } },
        algorithm: { type: 'string', enum: ['md5', 'sha256'], default: 'md5' },
      },
    },
  },
  {
    name: 'preview_rename',
    description: 'Preview filename normalization using regex rules. Returns a plan_id + confirmationToken. No files are changed until execute_plan is called.',
    inputSchema: {
      type: 'object',
      required: ['folder', 'rules'],
      properties: {
        folder: { type: 'string' },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            required: ['pattern', 'replacement'],
            properties: {
              pattern:     { type: 'string', description: 'Regex pattern (JS syntax)' },
              replacement: { type: 'string' },
              scope:       { type: 'string', enum: ['name', 'ext', 'full'], default: 'name' },
            },
          },
        },
      },
    },
  },
  {
    name: 'preview_reorganize',
    description: 'Preview a folder restructure. Files are matched by category/extension/name and moved to sub-folders you define. Returns a plan_id + confirmationToken.',
    inputSchema: {
      type: 'object',
      required: ['folder', 'structure'],
      properties: {
        folder: { type: 'string' },
        structure: {
          type: 'array',
          items: {
            type: 'object',
            required: ['match', 'targetFolder'],
            properties: {
              match: {
                type: 'object',
                properties: {
                  category:    { type: 'string', description: 'audio | video | image | document | code | data | archive | other' },
                  extension:   { type: 'string', description: 'e.g. .mp3' },
                  namePattern: { type: 'string', description: 'Regex applied to filename' },
                },
              },
              targetFolder: { type: 'string', description: 'Sub-path relative to folder root, e.g. "Audio/2024"' },
            },
          },
        },
      },
    },
  },
  {
    name: 'apply_tags',
    description: 'Apply TagSpaces-compatible tags (and optional description) to files. Uses tscmd CLI if installed; otherwise writes .ts/*.json sidecars directly.',
    inputSchema: {
      type: 'object',
      required: ['files', 'tags'],
      properties: {
        files:       { type: 'array', items: { type: 'string' } },
        tags:        { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
      },
    },
  },
  {
    name: 'execute_plan',
    description: 'Execute a previewed plan (rename / reorganize / delete_orphans). Requires planId and confirmationToken from the preview step. TagSpaces sidecars travel with their files.',
    inputSchema: {
      type: 'object',
      required: ['planId', 'confirmationToken'],
      properties: {
        planId:            { type: 'string' },
        confirmationToken: { type: 'string' },
      },
    },
  },
  {
    name: 'repair_metadata',
    description: 'Find orphaned TagSpaces sidecar files (.ts/*.json) whose originals no longer exist. Returns a delete plan.',
    inputSchema: {
      type: 'object',
      required: ['folder'],
      properties: {
        folder: { type: 'string' },
      },
    },
  },
  {
    name: 'generate_index',
    description: 'Write a lucy-index.json manifest for a folder: all files with category, size, tags, and description.',
    inputSchema: {
      type: 'object',
      required: ['folder'],
      properties: {
        folder:     { type: 'string' },
        outputPath: { type: 'string', description: 'Custom output path (defaults to <folder>/lucy-index.json)' },
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MCP server bootstrap
// ─────────────────────────────────────────────────────────────────────────────

const HANDLERS = {
  scan_folder:        scanFolder,
  find_duplicates:    findDuplicates,
  preview_rename:     previewRename,
  preview_reorganize: previewReorganize,
  apply_tags:         applyTags,
  execute_plan:       executePlan,
  repair_metadata:    repairMetadata,
  generate_index:     generateIndex,
};

const server = new Server(
  { name: 'lucy-files-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const handler = HANDLERS[name];
  if (!handler) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    const result = await handler(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[lucy-files-mcp] ready');
}

main().catch(err => { console.error(err); process.exit(1); });
