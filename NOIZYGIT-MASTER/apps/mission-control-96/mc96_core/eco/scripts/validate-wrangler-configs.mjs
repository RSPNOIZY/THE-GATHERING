/**
 * NOIZY Wrangler Config Validator
 *
 * Hard-fail if:
 *   - No wrangler.toml / wrangler.jsonc found anywhere in the repo
 *   - Any wrangler config contains placeholder tokens
 *
 * Usage: node scripts/validate-wrangler-configs.mjs
 */

import fs   from 'node:fs';
import path from 'node:path';

const PLACEHOLDER_RE = /PLACEHOLDER|REPLACE_ME|TODO_KV_ID|PLACEHOLDER_KV_ID/;

const candidates = [];

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // skip unreadable dirs
  }
  for (const item of entries) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(p);
    } else if (item.name === 'wrangler.toml' || item.name === 'wrangler.jsonc') {
      candidates.push(p);
    }
  }
}

walk(process.cwd());

if (candidates.length === 0) {
  console.error('BLOCKED: no wrangler.toml or wrangler.jsonc found in repo');
  process.exit(1);
}

console.log(`Found ${candidates.length} wrangler config(s):`);
candidates.forEach(p => console.log(`  ${p}`));

const dirty = candidates.filter(p => {
  const content = fs.readFileSync(p, 'utf8');
  return PLACEHOLDER_RE.test(content);
});

if (dirty.length > 0) {
  console.error('\nFAIL: placeholder tokens found in wrangler config(s):');
  dirty.forEach(p => console.error(`  ${p}`));
  process.exit(1);
}

console.log('\nPASS: wrangler configs present and placeholder-clean');
