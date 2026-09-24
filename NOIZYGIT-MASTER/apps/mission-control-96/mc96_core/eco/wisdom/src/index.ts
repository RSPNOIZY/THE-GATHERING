/**
 * wisdom.noizy.ai — Wisdom Project Strategy & Content API
 * Cloudflare Worker for AGI strategy, MC96 universe, GORUNFREE governance
 */

export interface Env {
  WISDOM_DB: D1Database;
  NOTION_API_KEY: string;
  NOTION_DATABASE_ID: string;
}

interface StrategyBrief {
  id: string;
  title: string;
  category: "agi_alignment" | "mc96_universe" | "gorunfree" | "policy" | "governance" | "empire_strategy";
  status: "draft" | "review" | "published" | "archived";
  summary: string;
  content: string;
  author: string;
  tags: string;          // comma-separated
  target_audience: string;
  created_at: string;
  updated_at: string;
}

interface GovernanceVote {
  id: string;
  proposal_id: string;
  proposal_title: string;
  vote: "approve" | "reject" | "abstain";
  voter: string;
  reason: string;
  voted_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function err(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // ── Health ──
      if (path === "/health") {
        return json({
          service: "wisdom.noizy.ai",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          capabilities: ["strategy-briefs", "mc96-universe", "gorunfree", "governance", "policy"],
        });
      }

      // ── Strategy Briefs ──
      if (path === "/briefs" && method === "GET") {
        return await listBriefs(env, url);
      }
      if (path === "/briefs" && method === "POST") {
        return await createBrief(env, request);
      }
      if (path.match(/^\/briefs\/[^/]+$/) && method === "GET") {
        const id = path.split("/")[2];
        return await getBrief(env, id);
      }
      if (path.match(/^\/briefs\/[^/]+$/) && method === "PUT") {
        const id = path.split("/")[2];
        return await updateBrief(env, id, request);
      }
      if (path.match(/^\/briefs\/[^/]+\/publish$/) && method === "POST") {
        const id = path.split("/")[2];
        return await publishBrief(env, id);
      }

      // ── MC96 Universe ──
      if (path === "/mc96/lore" && method === "GET") {
        return mc96Lore();
      }
      if (path === "/mc96/characters" && method === "GET") {
        return mc96Characters();
      }

      // ── GORUNFREE ──
      if (path === "/gorunfree/principles") {
        return gorunfreePrinciples();
      }
      if (path === "/gorunfree/gini" && method === "GET") {
        return await getGiniStatus(env);
      }

      // ── Governance ──
      if (path === "/governance/votes" && method === "GET") {
        return await listVotes(env, url);
      }
      if (path === "/governance/votes" && method === "POST") {
        return await castVote(env, request);
      }

      // ── Policy Briefs ──
      if (path === "/policy/targets") {
        return policyTargets();
      }

      // ── Empire Dashboard ──
      if (path === "/empire/status") {
        return empireStatus();
      }

      return err("Not Found", 404);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal Server Error";
      return err(message, 500);
    }
  },
};

// ── Strategy Brief Handlers ─────────────────────────────────────────

async function listBriefs(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status") || "published";

  let query = "SELECT * FROM strategy_briefs WHERE status = ? ORDER BY updated_at DESC LIMIT ?";
  const binds: unknown[] = [status, limit];

  if (category) {
    query = "SELECT * FROM strategy_briefs WHERE status = ? AND category = ? ORDER BY updated_at DESC LIMIT ?";
    binds.splice(1, 0, category);
  }

  const result = await env.WISDOM_DB.prepare(query).bind(...binds).all<StrategyBrief>();
  return json({ ok: true, briefs: result.results, count: result.results.length });
}

async function getBrief(env: Env, id: string): Promise<Response> {
  const brief = await env.WISDOM_DB.prepare(
    "SELECT * FROM strategy_briefs WHERE id = ?"
  ).bind(id).first<StrategyBrief>();
  if (!brief) return err("Brief not found", 404);
  return json({ ok: true, brief });
}

async function createBrief(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Partial<StrategyBrief>>();
  if (!body.title || !body.category || !body.content) {
    return err("title, category, and content are required");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.WISDOM_DB.prepare(
    `INSERT INTO strategy_briefs (id, title, category, status, summary, content, author, tags, target_audience, created_at, updated_at)
     VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.title, body.category, body.summary || "",
    body.content, body.author || "RSP", body.tags || "",
    body.target_audience || "internal", now, now
  ).run();

  return json({ ok: true, id, status: "draft", created_at: now }, 201);
}

async function updateBrief(env: Env, id: string, request: Request): Promise<Response> {
  const body = await request.json<Partial<StrategyBrief>>();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (["title", "category", "status", "summary", "content", "tags", "target_audience"].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return err("No valid fields to update");

  fields.push("updated_at = ?");
  values.push(now, id);
  await env.WISDOM_DB.prepare(`UPDATE strategy_briefs SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ ok: true, id, updated_at: now });
}

async function publishBrief(env: Env, id: string): Promise<Response> {
  const now = new Date().toISOString();
  await env.WISDOM_DB.prepare(
    "UPDATE strategy_briefs SET status = 'published', updated_at = ? WHERE id = ?"
  ).bind(now, id).run();
  return json({ ok: true, id, status: "published", published_at: now });
}

// ── MC96 Universe ───────────────────────────────────────────────────

function mc96Lore(): Response {
  return json({
    ok: true,
    universe: "MC96 ECO",
    tagline: "Where music meets ecology meets sovereignty",
    lore: {
      setting: "A decentralized creative ecosystem where 96 interconnected communities govern their own artistic destiny",
      core_mechanic: "Creators earn through genuine engagement, not exploitation. The Gini coefficient enforces fair distribution.",
      pillars: [
        "Artist sovereignty — creators own their voice, data, and revenue",
        "Ecological balance — the ecosystem self-regulates via DAO governance",
        "Consent as constitution — every interaction requires explicit consent",
        "Proof of creation — C2PA provenance for all artifacts",
      ],
    },
    creator: "Rob S. Plowman (RSP)",
    ip_notice: "MC96 ECO Universe is Rob's creative IP. Respect the vision.",
  });
}

function mc96Characters(): Response {
  return json({
    ok: true,
    characters: [
      { name: "GABRIEL", role: "The voice of the system — AI command intelligence", voice: "Daniel" },
      { name: "The Aquarium", role: "Living dashboard — shows ecosystem health in real-time" },
      { name: "The DreamChamber", role: "Creative sanctum — where briefs become reality" },
      { name: "The Mirror", role: "Reflection engine — generates strategic insights from data" },
    ],
  });
}

// ── GORUNFREE ───────────────────────────────────────────────────────

function gorunfreePrinciples(): Response {
  return json({
    ok: true,
    initiative: "GORUNFREE",
    mission: "Artist sovereignty is non-negotiable",
    principles: [
      { id: 1, name: "Ownership", desc: "Creators own 100% of their voice, likeness, and creative output" },
      { id: 2, name: "Consent", desc: "Every use of creator content requires explicit, revocable consent" },
      { id: 3, name: "Transparency", desc: "Revenue splits, algorithms, and data usage are fully transparent" },
      { id: 4, name: "Fair Distribution", desc: "Gini coefficient capped at 0.35 — enforced by DAO governance" },
      { id: 5, name: "Right to Exit", desc: "Creators can leave and take all their data at any time" },
      { id: 6, name: "No Exploitation", desc: "No dark patterns, no engagement farming, no attention extraction" },
    ],
    constitutional: true,
  });
}

async function getGiniStatus(env: Env): Promise<Response> {
  // In production this would query real payout data
  return json({
    ok: true,
    gini_coefficient: 0.34,
    target_max: 0.35,
    dao_intervention_threshold: 0.37,
    status: "HEALTHY",
    top_10_pct_share: 0.34,
    industry_comparison: {
      spotify: 0.72,
      youtube_music: 0.68,
      noizy_empire: 0.34,
    },
    last_calculated: new Date().toISOString(),
  });
}

// ── Governance ──────────────────────────────────────────────────────

async function listVotes(env: Env, url: URL): Promise<Response> {
  const proposalId = url.searchParams.get("proposal_id");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  let query = "SELECT * FROM governance_votes ORDER BY voted_at DESC LIMIT ?";
  const binds: unknown[] = [limit];

  if (proposalId) {
    query = "SELECT * FROM governance_votes WHERE proposal_id = ? ORDER BY voted_at DESC LIMIT ?";
    binds.unshift(proposalId);
  }

  const result = await env.WISDOM_DB.prepare(query).bind(...binds).all<GovernanceVote>();

  // Tally if filtered by proposal
  let tally = null;
  if (proposalId && result.results.length > 0) {
    const approve = result.results.filter((v) => v.vote === "approve").length;
    const reject = result.results.filter((v) => v.vote === "reject").length;
    const abstain = result.results.filter((v) => v.vote === "abstain").length;
    tally = { approve, reject, abstain, total: result.results.length, passed: approve > reject };
  }

  return json({ ok: true, votes: result.results, count: result.results.length, tally });
}

async function castVote(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Partial<GovernanceVote>>();
  if (!body.proposal_id || !body.vote || !body.voter) {
    return err("proposal_id, vote, and voter are required");
  }
  if (!["approve", "reject", "abstain"].includes(body.vote)) {
    return err("vote must be approve, reject, or abstain");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.WISDOM_DB.prepare(
    `INSERT INTO governance_votes (id, proposal_id, proposal_title, vote, voter, reason, voted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.proposal_id, body.proposal_title || "", body.vote, body.voter, body.reason || "", now).run();

  return json({ ok: true, id, voted_at: now }, 201);
}

// ── Policy Targets ──────────────────────────────────────────────────

function policyTargets(): Response {
  return json({
    ok: true,
    targets: [
      { institution: "CRTC", jurisdiction: "Canada", focus: "AI-generated content labeling" },
      { institution: "SOCAN", jurisdiction: "Canada", focus: "AI music royalty frameworks" },
      { institution: "Canadian Heritage", jurisdiction: "Canada", focus: "Creator sovereignty in AI era" },
      { institution: "EU AI Act", jurisdiction: "EU", focus: "C2PA provenance compliance" },
      { institution: "Copyright Board of Canada", jurisdiction: "Canada", focus: "Voice likeness rights" },
    ],
    note: "Policy briefs target real institutions — actionable, not theoretical",
  });
}

// ── Empire Dashboard ────────────────────────────────────────────────

function empireStatus(): Response {
  return json({
    ok: true,
    empire: "NOIZY",
    brands: [
      { name: "FishMusicInc", domain: "fish.noizy.ai", focus: "Audio catalogue + streaming" },
      { name: "NOIZYLAB", domain: "lab.noizy.ai", focus: "DevOps + infrastructure" },
      { name: "NOIZYVOX", domain: "vox.noizy.ai", focus: "Voice engine + TTS/STT" },
      { name: "Wisdom Project", domain: "wisdom.noizy.ai", focus: "AGI strategy + governance" },
      { name: "NOIZY App", domain: "app.noizy.ai", focus: "DreamChamber + control UI" },
      { name: "HooksHQ", domain: "hooks.noizy.ai", focus: "Integrations + webhooks" },
    ],
    constitutional_principles: ["consent", "sovereignty", "transparency", "fair-distribution"],
    gini_target: 0.35,
    founder: "RSP (Ottawa)",
  });
}
