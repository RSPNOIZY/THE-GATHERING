/**
 * NOIZY KV Batch Writer
 * Consolidates multiple KV updates into a single write.
 * Replaces all direct kv.put() calls across Lucy PWA and GABRIEL.
 *
 * Usage (in Workers / MCP servers):
 *   import { batchWrite, batchRead } from "./batch-writer.mjs";
 *   await batchWrite(env.LUCY_CONFIG, { tab, user, view });
 *   const state = await batchRead(env.LUCY_CONFIG, "state");
 *
 * Author: Robert Stephen Plowman / RSP_001
 */

/**
 * Write multiple key-value pairs as a single consolidated KV entry.
 * Reads existing state, merges updates, writes once.
 *
 * @param {KVNamespace} namespace - Cloudflare KV namespace binding
 * @param {Record<string, any>} updates - Key-value pairs to merge
 * @param {string} [stateKey="state"] - The KV key holding the JSON blob
 * @param {number} [ttl=300] - TTL in seconds (0 = no TTL)
 */
export async function batchWrite(namespace, updates, stateKey = "state", ttl = 300) {
  let current = {};
  try {
    const existing = await namespace.get(stateKey, { type: "json" });
    if (existing) current = existing;
  } catch {
    // Key doesn't exist yet — start fresh
  }

  const merged = { ...current, ...updates, _updated_at: new Date().toISOString() };
  const opts = ttl > 0 ? { expirationTtl: ttl } : {};
  await namespace.put(stateKey, JSON.stringify(merged), opts);
  return merged;
}

/**
 * Read a specific field from a consolidated KV state blob.
 *
 * @param {KVNamespace} namespace
 * @param {string} field - Field name within the state blob
 * @param {string} [stateKey="state"]
 * @returns {any}
 */
export async function batchRead(namespace, field, stateKey = "state") {
  const state = await namespace.get(stateKey, { type: "json" });
  if (!state) return null;
  return field ? state[field] : state;
}

/**
 * Lucy PWA state helpers — D1-first, KV as cache only.
 * Write state to D1 via GABRIEL API; cache in KV with short TTL.
 */
export async function lucyStateWrite(env, key, value, userId = "RSP_001") {
  // Primary: D1 via GABRIEL API (permanent, queryable)
  // D1 write is handled by gabriel-mcp gabriel_note tool
  // This function handles the KV cache layer only

  const cacheKey = `lucy:${userId}:${key}`;
  await env.LUCY_CONFIG.put(cacheKey, JSON.stringify(value), { expirationTtl: 300 });
}

export async function lucyStateRead(env, key, userId = "RSP_001") {
  const cacheKey = `lucy:${userId}:${key}`;
  const cached = await env.LUCY_CONFIG.get(cacheKey, { type: "json" });
  return cached;
  // Cache miss: fetch from D1 via GABRIEL API and re-cache
}
