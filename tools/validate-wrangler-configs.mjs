import fs from "node:fs";
import path from "node:path";

const found = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "wrangler.toml" || e.name === "wrangler.jsonc") found.push(p);
  }
}
walk(process.cwd());

if (found.length === 0) throw new Error("BLOCKED: no wrangler.toml/jsonc found");

const bad = found.filter(p => /PLACEHOLDER|PLACEHOLDER_KV_ID|REPLACE_ME|TODO_KV_ID/.test(fs.readFileSync(p, "utf8")));
if (bad.length) {
  console.error("FAIL: placeholder tokens in wrangler config(s):\n" + bad.join("\n"));
  process.exit(1);
}

console.log("PASS: wrangler configs present and clean");
