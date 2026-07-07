#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// CONSENT ORACLE MCP SERVER — NOIZY.AI
// Wraps gabriel_db 20 HVS tables via D1 HTTP API
// Exposes: can_i_do · grant_consent · revoke_consent ·
//          query_grants · audit_trail · voice_registry
// Port: 7778 (or stdio for MCP clients)
// RSP_001 · DAZEFLOW · 2026-03-28
// ═══════════════════════════════════════════════════════════

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ── D1 CONFIG ──────────────────────────────────────────────
const D1 = {
  accountId: '5f36aa9795348ea681d0b21910dfc82a',
  databaseId: '7b813205-fd12-4a23-84a6-ce83bc49ec70',
  dbName: 'agent-memory',
};

// CF API token from env — never hardcode
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '';

async function d1Query(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${D1.accountId}/d1/database/${D1.databaseId}/query`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });
    const data = await res.json();
    if (!data.success) return { ok: false, error: data.errors?.[0]?.message || 'D1 query failed', rows: [] };
    return { ok: true, rows: data.result?.[0]?.results || [], meta: data.result?.[0]?.meta };
  } catch (err) {
    return { ok: false, error: err.message, rows: [] };
  }
}

// ── INIT DB TABLES ─────────────────────────────────────────
async function ensureTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS consent_grants (
      id TEXT PRIMARY KEY,
      voice_id TEXT NOT NULL,
      grantor TEXT NOT NULL,
      grantee TEXT,
      use_cases TEXT NOT NULL DEFAULT '[]',
      restrictions TEXT DEFAULT '[]',
      royalty_rate REAL DEFAULT 0.75,
      royalty_split TEXT DEFAULT '{"creator":0.75,"platform":0.25}',
      status TEXT DEFAULT 'active',
      granted_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      revoked_at TEXT,
      revocation_reason TEXT,
      metadata TEXT DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS voice_registry (
      voice_id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      display_name TEXT,
      voice_dna_hash TEXT,
      spectral_signature TEXT,
      emotional_signature TEXT,
      registration_date TEXT DEFAULT (datetime('now')),
      c2pa_manifest TEXT,
      consent_status TEXT DEFAULT 'registered',
      allowed_mutations TEXT DEFAULT '["synthesis","cloning","style-transfer"]',
      blocked_mutations TEXT DEFAULT '[]',
      royalty_default REAL DEFAULT 0.75,
      metadata TEXT DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS consent_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now')),
      action TEXT NOT NULL,
      voice_id TEXT,
      operator TEXT NOT NULL,
      requester TEXT,
      use_case TEXT,
      decision TEXT NOT NULL,
      reasoning TEXT,
      risk_level TEXT DEFAULT 'LOW',
      mutation_type TEXT,
      input_hash TEXT,
      output_hash TEXT,
      session_id TEXT,
      metadata TEXT DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS mutation_codex (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now')),
      asset_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      operator TEXT NOT NULL,
      consent_id TEXT,
      input_description TEXT,
      output_description TEXT,
      input_hash TEXT,
      output_hash TEXT,
      risk_level TEXT DEFAULT 'LOW',
      reasoning TEXT,
      quality_metrics TEXT DEFAULT '{}',
      c2pa_ref TEXT,
      session_id TEXT
    )`,
  ];
  for (const sql of tables) {
    await d1Query(sql);
  }
}

// ── MCP SERVER ─────────────────────────────────────────────
const server = new McpServer({
  name: 'consent-oracle',
  version: '1.0.0',
});

// ── TOOL: can_i_do ─────────────────────────────────────────
// The core question: "Can I do X with voice Y?"
server.tool(
  'can_i_do',
  {
    voice_id: z.string().describe('Voice ID to check consent for'),
    use_case: z.string().describe('What you want to do: synthesis, cloning, style-transfer, commercial, research'),
    requester: z.string().describe('Who is requesting (operator ID)'),
  },
  async ({ voice_id, use_case, requester }) => {
    // 1. Check voice exists
    const voice = await d1Query('SELECT * FROM voice_registry WHERE voice_id = ?', [voice_id]);
    if (!voice.ok || voice.rows.length === 0) {
      await logAudit('can_i_do', voice_id, requester, use_case, 'DENIED', 'Voice not registered', 'HIGH');
      return result({ allowed: false, reason: 'Voice not registered in registry', voice_id, risk: 'HIGH' });
    }

    const v = voice.rows[0];
    
    // 2. Check blocked mutations
    const blocked = JSON.parse(v.blocked_mutations || '[]');
    if (blocked.includes(use_case)) {
      await logAudit('can_i_do', voice_id, requester, use_case, 'DENIED', `Mutation "${use_case}" is explicitly blocked`, 'HIGH');
      return result({ allowed: false, reason: `Mutation "${use_case}" is explicitly blocked by voice owner`, voice_id, risk: 'BLOCKED' });
    }

    // 3. Check allowed mutations
    const allowed = JSON.parse(v.allowed_mutations || '[]');
    if (!allowed.includes(use_case) && !allowed.includes('*')) {
      await logAudit('can_i_do', voice_id, requester, use_case, 'DENIED', `Mutation "${use_case}" not in allowed list`, 'MEDIUM');
      return result({ allowed: false, reason: `Mutation "${use_case}" not in allowed list: [${allowed.join(', ')}]`, voice_id, risk: 'MEDIUM' });
    }

    // 4. Check active consent grants
    const grants = await d1Query(
      `SELECT * FROM consent_grants WHERE voice_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      [voice_id]
    );

    if (!grants.ok || grants.rows.length === 0) {
      await logAudit('can_i_do', voice_id, requester, use_case, 'DENIED', 'No active consent grants found', 'HIGH');
      return result({ allowed: false, reason: 'No active consent grants for this voice', voice_id, risk: 'HIGH' });
    }

    // 5. Find matching grant
    const matching = grants.rows.find(g => {
      const cases = JSON.parse(g.use_cases || '[]');
      return cases.includes(use_case) || cases.includes('*');
    });

    if (!matching) {
      await logAudit('can_i_do', voice_id, requester, use_case, 'DENIED', `No grant covers use case "${use_case}"`, 'MEDIUM');
      return result({ allowed: false, reason: `No consent grant covers "${use_case}"`, voice_id, risk: 'MEDIUM' });
    }

    // 6. Check restrictions
    const restrictions = JSON.parse(matching.restrictions || '[]');
    
    // 7. ALLOWED
    await logAudit('can_i_do', voice_id, requester, use_case, 'ALLOWED', 'Consent verified', 'LOW');
    return result({
      allowed: true,
      voice_id,
      use_case,
      grant_id: matching.id,
      royalty_rate: matching.royalty_rate,
      royalty_split: JSON.parse(matching.royalty_split || '{}'),
      restrictions,
      expires_at: matching.expires_at,
      owner: v.owner,
      risk: 'NONE',
    });
  }
);

// ── TOOL: grant_consent ────────────────────────────────────
server.tool(
  'grant_consent',
  {
    voice_id: z.string().describe('Voice ID to grant consent for'),
    grantor: z.string().describe('Voice owner granting consent'),
    use_cases: z.array(z.string()).describe('Allowed use cases: synthesis, cloning, style-transfer, commercial, research'),
    royalty_rate: z.number().min(0).max(1).default(0.75).describe('Creator royalty rate (default 0.75 = 75%)'),
    restrictions: z.array(z.string()).optional().describe('Optional restrictions'),
    expires_at: z.string().optional().describe('Expiry date (ISO 8601)'),
    grantee: z.string().optional().describe('Specific grantee (or null for universal)'),
  },
  async ({ voice_id, grantor, use_cases, royalty_rate, restrictions, expires_at, grantee }) => {
    const id = `consent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const split = JSON.stringify({ creator: royalty_rate, platform: 1 - royalty_rate });

    await d1Query(
      `INSERT INTO consent_grants (id, voice_id, grantor, grantee, use_cases, restrictions, royalty_rate, royalty_split, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, voice_id, grantor, grantee || null, JSON.stringify(use_cases), JSON.stringify(restrictions || []), royalty_rate, split, expires_at || null]
    );

    await logAudit('grant_consent', voice_id, grantor, use_cases.join(','), 'GRANTED', `New consent: ${use_cases.join(', ')} @ ${royalty_rate * 100}%`, 'LOW');

    return result({ ok: true, grant_id: id, voice_id, use_cases, royalty_rate, royalty_split: { creator: royalty_rate, platform: 1 - royalty_rate }, expires_at });
  }
);

// ── TOOL: revoke_consent ───────────────────────────────────
server.tool(
  'revoke_consent',
  {
    grant_id: z.string().describe('Consent grant ID to revoke'),
    reason: z.string().describe('Reason for revocation'),
    operator: z.string().describe('Who is revoking'),
  },
  async ({ grant_id, reason, operator }) => {
    const existing = await d1Query('SELECT * FROM consent_grants WHERE id = ?', [grant_id]);
    if (!existing.ok || existing.rows.length === 0) {
      return result({ ok: false, error: 'Grant not found' });
    }

    await d1Query(
      `UPDATE consent_grants SET status = 'revoked', revoked_at = datetime('now'), revocation_reason = ? WHERE id = ?`,
      [reason, grant_id]
    );

    const grant = existing.rows[0];
    await logAudit('revoke_consent', grant.voice_id, operator, '', 'REVOKED', reason, 'HIGH');

    return result({ ok: true, revoked: grant_id, voice_id: grant.voice_id, reason, timestamp: new Date().toISOString() });
  }
);

// ── TOOL: register_voice ───────────────────────────────────
server.tool(
  'register_voice',
  {
    voice_id: z.string().describe('Unique voice identifier'),
    owner: z.string().describe('Voice owner (e.g. RSP_001)'),
    display_name: z.string().describe('Human-readable name'),
    allowed_mutations: z.array(z.string()).default(['synthesis', 'cloning', 'style-transfer']).describe('Allowed mutation types'),
    royalty_default: z.number().min(0).max(1).default(0.75).describe('Default royalty rate'),
  },
  async ({ voice_id, owner, display_name, allowed_mutations, royalty_default }) => {
    await d1Query(
      `INSERT OR REPLACE INTO voice_registry (voice_id, owner, display_name, allowed_mutations, royalty_default)
       VALUES (?, ?, ?, ?, ?)`,
      [voice_id, owner, display_name, JSON.stringify(allowed_mutations), royalty_default]
    );

    await logAudit('register_voice', voice_id, owner, '', 'REGISTERED', `Voice registered: ${display_name}`, 'LOW');

    return result({ ok: true, voice_id, owner, display_name, allowed_mutations, royalty_default });
  }
);

// ── TOOL: query_grants ─────────────────────────────────────
server.tool(
  'query_grants',
  {
    voice_id: z.string().optional().describe('Filter by voice ID'),
    status: z.string().default('active').describe('Filter by status: active, revoked, expired, all'),
  },
  async ({ voice_id, status }) => {
    let sql = 'SELECT * FROM consent_grants';
    const params = [];
    const conditions = [];

    if (voice_id) { conditions.push('voice_id = ?'); params.push(voice_id); }
    if (status !== 'all') { conditions.push('status = ?'); params.push(status); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY granted_at DESC LIMIT 50';

    const res = await d1Query(sql, params);
    return result({ ok: res.ok, grants: res.rows, count: res.rows.length });
  }
);

// ── TOOL: audit_trail ──────────────────────────────────────
server.tool(
  'audit_trail',
  {
    voice_id: z.string().optional().describe('Filter by voice ID'),
    action: z.string().optional().describe('Filter by action type'),
    limit: z.number().default(25).describe('Max results'),
  },
  async ({ voice_id, action, limit }) => {
    let sql = 'SELECT * FROM consent_audit_log';
    const params = [];
    const conditions = [];

    if (voice_id) { conditions.push('voice_id = ?'); params.push(voice_id); }
    if (action) { conditions.push('action = ?'); params.push(action); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY timestamp DESC LIMIT ${Math.min(limit, 100)}`;

    const res = await d1Query(sql, params);
    return result({ ok: res.ok, entries: res.rows, count: res.rows.length });
  }
);

// ── TOOL: log_mutation ─────────────────────────────────────
server.tool(
  'log_mutation',
  {
    asset_id: z.string().describe('Asset being mutated'),
    operation: z.string().describe('Type of mutation: synthesis, cloning, style-transfer, mix, master'),
    operator: z.string().describe('Who performed the mutation'),
    consent_id: z.string().optional().describe('Consent grant ID authorizing this'),
    input_description: z.string().describe('What went in'),
    output_description: z.string().describe('What came out'),
    risk_level: z.string().default('LOW').describe('Risk level: LOW, MEDIUM, HIGH, CRITICAL'),
    reasoning: z.string().describe('Why this mutation was performed'),
  },
  async ({ asset_id, operation, operator, consent_id, input_description, output_description, risk_level, reasoning }) => {
    const res = await d1Query(
      `INSERT INTO mutation_codex (asset_id, operation, operator, consent_id, input_description, output_description, risk_level, reasoning, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset_id, operation, operator, consent_id || null, input_description, output_description, risk_level, reasoning, `session_${Date.now()}`]
    );

    await logAudit('mutation', asset_id, operator, operation, 'LOGGED', reasoning, risk_level);

    return result({ ok: res.ok, asset_id, operation, risk_level, logged_at: new Date().toISOString() });
  }
);

// ── TOOL: voice_registry_list ──────────────────────────────
server.tool(
  'voice_registry_list',
  {
    owner: z.string().optional().describe('Filter by owner'),
  },
  async ({ owner }) => {
    let sql = 'SELECT * FROM voice_registry';
    const params = [];
    if (owner) { sql += ' WHERE owner = ?'; params.push(owner); }
    sql += ' ORDER BY registration_date DESC';

    const res = await d1Query(sql, params);
    return result({ ok: res.ok, voices: res.rows, count: res.rows.length });
  }
);

// ── HELPERS ────────────────────────────────────────────────
function result(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

async function logAudit(action, voice_id, operator, use_case, decision, reasoning, risk_level) {
  await d1Query(
    `INSERT INTO consent_audit_log (action, voice_id, operator, use_case, decision, reasoning, risk_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [action, voice_id, operator, use_case, decision, reasoning, risk_level]
  ).catch(() => {}); // Never let audit logging block operations
}

// ── BOOT ───────────────────────────────────────────────────
async function main() {
  if (CF_TOKEN) {
    console.error('[consent-oracle] Initializing D1 tables…');
    await ensureTables();
    console.error('[consent-oracle] D1 tables ready');
  } else {
    console.error('[consent-oracle] WARNING: No CF API token — running in offline/demo mode');
  }

  console.error('[consent-oracle] Starting MCP server…');
  console.error('[consent-oracle] Tools: can_i_do · grant_consent · revoke_consent · register_voice · query_grants · audit_trail · log_mutation · voice_registry_list');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error('[consent-oracle] Fatal:', err);
  process.exit(1);
});
