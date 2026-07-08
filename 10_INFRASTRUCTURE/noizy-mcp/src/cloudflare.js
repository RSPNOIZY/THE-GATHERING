/**
 * Cloudflare D1 REST client — minimal, no dependencies beyond fetch.
 *
 * Env required:
 *   CLOUDFLARE_ACCOUNT_ID   — Fishmusicinc account
 *   CLOUDFLARE_API_TOKEN    — token with D1:Edit scope
 *   CLOUDFLARE_D1_DATABASE_ID — agent-memory UUID (b5b58cc9-...)
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DB_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;

function requireEnv() {
  const missing = [];
  if (!ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!API_TOKEN) missing.push('CLOUDFLARE_API_TOKEN');
  if (!DB_ID) missing.push('CLOUDFLARE_D1_DATABASE_ID');
  if (missing.length) {
    throw new Error(
      `NOIZY MCP: missing environment variables: ${missing.join(', ')}. ` +
      `Set them in your MCP client config (Claude Desktop: mcpServers.*.env).`
    );
  }
}

/**
 * Execute a D1 query. Returns the first result set's rows.
 * Throws on HTTP errors or D1-level errors.
 *
 * @param {string} sql
 * @param {Array<string|number>} [params]
 * @returns {Promise<{rows: Array<Record<string, unknown>>, meta: object}>}
 */
export async function query(sql, params = []) {
  requireEnv();
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudflare D1 HTTP ${res.status}: ${body}`);
  }
  const json = await res.json();
  if (!json.success) {
    const errs = (json.errors || []).map(e => `${e.code || '?'}: ${e.message || 'unknown'}`).join('; ');
    throw new Error(`D1 error: ${errs || 'unknown'}`);
  }
  // D1 returns result as an array (one per statement). Our callers send one statement.
  const first = Array.isArray(json.result) ? json.result[0] : json.result;
  return {
    rows: first?.results || [],
    meta: first?.meta || {},
  };
}

/**
 * Shorthand for single-row reads.
 * @returns {Promise<Record<string, unknown>|null>}
 */
export async function queryOne(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] || null;
}
