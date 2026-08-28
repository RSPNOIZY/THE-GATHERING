/**
 * GabrielProfile — RSP_001 Working Style & Adaptive Learning
 *
 * Loads, persists, and evolves GABRIEL's understanding of RSP_001.
 * Two layers:
 *   - Static profile block → injected into systemPromptStatic (cached, 90% discount)
 *   - Recent learnings block → injected into systemPromptDynamic (always fresh)
 */

const fs = require("fs");
const path = require("path");

const PROFILE_PATH = path.join(__dirname, "..", "..", "gabriel-profile.json");
const MAX_RECENT_LEARNINGS = 30; // in dynamic context
const PROFILE_VERSION = 1;

class GabrielProfile {
  constructor() {
    this._profile = null;
    this._dirty = false;
  }

  // ─── Load / Save ─────────────────────────────────────────────────────────────

  load() {
    if (this._profile) return this._profile;
    try {
      if (fs.existsSync(PROFILE_PATH)) {
        this._profile = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf-8"));
      } else {
        this._profile = this._defaultProfile();
        this._save();
      }
    } catch (err) {
      console.warn("[GabrielProfile] Failed to load profile, using defaults:", err.message);
      this._profile = this._defaultProfile();
    }
    return this._profile;
  }

  _save() {
    try {
      this._profile.meta.lastUpdated = new Date().toISOString();
      fs.writeFileSync(PROFILE_PATH, JSON.stringify(this._profile, null, 2), "utf-8");
      this._dirty = false;
    } catch (err) {
      console.warn("[GabrielProfile] Failed to save profile:", err.message);
    }
  }

  // ─── Learn ───────────────────────────────────────────────────────────────────

  learn(observation, category = "general", source = "interaction") {
    const profile = this.load();
    const entry = {
      id: `L${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      source,
      observation: observation.trim(),
    };
    profile.learnings.unshift(entry); // newest first
    this._save();
    return entry;
  }

  // ─── Update profile fields ────────────────────────────────────────────────────

  update(section, key, value) {
    const profile = this.load();
    if (!profile[section]) profile[section] = {};
    profile[section][key] = value;
    this._save();
    return profile[section];
  }

  // Merge recent learnings into the appropriate profile section, clear old ones
  consolidate() {
    const profile = this.load();
    const before = profile.learnings.length;
    // Keep only the most recent MAX_RECENT_LEARNINGS * 2 (everything else is in profile sections)
    profile.learnings = profile.learnings.slice(0, MAX_RECENT_LEARNINGS * 2);
    this._save();
    return { consolidated: before - profile.learnings.length, remaining: profile.learnings.length };
  }

  getAll() {
    return this.load();
  }

  getLearnings(limit = 50) {
    return this.load().learnings.slice(0, limit);
  }

  // ─── Context blocks for GABRIEL ──────────────────────────────────────────────

  // Injected into systemPromptStatic (cached) — stable working profile
  getProfileBlock() {
    const p = this.load();
    const lines = ["\n\n--- RSP_001 WORKING PROFILE ---"];

    lines.push(`Actor: ${p.identity.name} (${p.identity.actorId}) — ${p.identity.location}`);
    lines.push(`Contact: ${p.identity.email} | Machine: ${p.identity.machine}`);
    lines.push(`Mission: ${p.identity.mission}`);

    lines.push("\nWORKING STYLE:");
    for (const [k, v] of Object.entries(p.workingStyle)) {
      lines.push(`- ${v}`);
    }

    lines.push("\nCOMMUNICATION PREFERENCES:");
    for (const [k, v] of Object.entries(p.communicationPreferences)) {
      lines.push(`- ${v}`);
    }

    lines.push("\nTECHNICAL PREFERENCES:");
    for (const [k, v] of Object.entries(p.technicalPreferences)) {
      lines.push(`- ${v}`);
    }

    lines.push("\nHARD RULES (never violate):");
    for (const rule of p.hardRules) {
      lines.push(`- ${rule}`);
    }

    lines.push("---");
    return lines.join("\n");
  }

  // Injected into systemPromptDynamic (not cached) — fresh learnings
  getRecentLearningsBlock() {
    const learnings = this.load().learnings.slice(0, MAX_RECENT_LEARNINGS);
    if (!learnings.length) return "";

    const lines = ["\n--- RECENT LEARNINGS (adaptive) ---"];
    for (const l of learnings) {
      const date = l.timestamp.split("T")[0];
      lines.push(`[${date}][${l.category}] ${l.observation}`);
    }
    lines.push("---");
    return lines.join("\n");
  }

  // ─── Default Profile (seeded from everything known about RSP_001) ─────────────

  _defaultProfile() {
    return {
      meta: {
        version: PROFILE_VERSION,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        description: "GABRIEL adaptive learning profile for RSP_001",
      },

      identity: {
        name: "Robert Stephen Plowman",
        actorId: "RSP_001",
        email: "rsp@noizyfish.com",
        location: "Canada (Quebec)",
        machine: "M2 Ultra Mac Studio — GOD.local",
        mission: "Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic.",
        frequency: "396 Hz — liberation",
        origin: "This work saved his life. He carries that forward.",
      },

      workingStyle: {
        execution: "Implement and build — don't suggest, don't describe. When given the green light, go all the way.",
        scope: "Minimal, focused edits. Don't refactor what isn't broken. Stay surgical.",
        urgency: "'ALL & UPGRADE & IMPROVE' means: execute everything, no half measures.",
        autonomy: "High autonomy expected. Trust GABRIEL to make smart decisions independently.",
        sessions: "Works in focused, high-intensity sessions. When in the zone, keep up.",
        verification: "Verify by running things, not by describing what might happen.",
        standards: "Expert-level engineering. No boilerplate, no hand-holding, no training wheels.",
        tools: "nodemon for live reload, PM2 for production (fork mode, instances:1 only), wrangler for Cloudflare.",
        git: "Commit when stable. Clean commit messages. Never commit .env files.",
      },

      communicationPreferences: {
        tone: "Terse, direct, technical. No filler phrases. No 'Great idea!' or 'You're right!'",
        density: "High-density responses. Say more with fewer words.",
        format: "Short bullets, code snippets, concrete facts. Markdown OK, walls of text not OK.",
        validation: "Don't seek approval before acting. Don't recap what was just said.",
        confidence: "If you know the answer, state it. Don't hedge unless genuinely uncertain.",
        errors: "When something is wrong, say what it is and fix it. Don't soften it.",
        summaries: "End sessions with clean, concise status. Bullet points preferred.",
        questions: "Only ask when genuinely blocked. Never ask to confirm obvious intent.",
      },

      technicalPreferences: {
        runtime: "Node.js for DreamChamber, Cloudflare Workers for Heaven.",
        packageManager: "npm only.",
        formatting: "Prettier — semi:true, double quotes, 100 printWidth.",
        logging: "Winston. Always write logs to dreamchamber/logs/, never CWD.",
        secrets: "All secrets in .env files. Never hardcode. Never commit.",
        pm2: "Fork mode, instances:1 always. WebSocket requires single process.",
        ai: "Anthropic primary (claude-sonnet-4 default). Prompt caching on static blocks.",
        stack: "Express + WebSocket + D1 (SQLite) + KV + Cloudflare Workers edge.",
        database: "D1 for Heaven. PostgreSQL for heavy DreamChamber workloads.",
        testing: "Never weaken or delete tests. Never remove Never Clauses.",
      },

      hardRules: [
        "NEVER use PM2 instances:'max' or cluster mode",
        "NEVER combine systemPromptStatic + systemPromptDynamic into one block",
        "NEVER throw errors in HeavenClient.reportUsage() — fire-and-forget only",
        "NEVER write logs to CWD — always dreamchamber/logs/",
        "NEVER check Heaven health with === 'healthy' — it returns 'LIVE', use !!health.value?.status",
        "NEVER commit .env files",
        "NEVER override or delete Never Clauses via API",
        "NEVER pad responses with filler, validation phrases, or unnecessary summaries",
        "NEVER suggest when you can implement",
        "NEVER refactor working code without being asked",
      ],

      patterns: {
        decisionMaking: "Fast, decisive. Prefers to try and iterate over analysis paralysis.",
        problemSolving: "Root cause first. Minimal upstream fix. No downstream workarounds.",
        learning: "Learns by doing. Likes to see things working before deep-diving docs.",
        priorities: "Consent, provenance, revocation, compensation — in that order.",
        trust: "Built through consistent execution and not wasting time.",
      },

      learnings: [
        {
          id: "L_SEED_001",
          timestamp: new Date().toISOString(),
          category: "foundation",
          source: "seed",
          observation: "This work saved RSP_001's life. GABRIEL carries that weight in every response.",
        },
        {
          id: "L_SEED_002",
          timestamp: new Date().toISOString(),
          category: "work_style",
          source: "seed",
          observation: "When RSP says 'ALL & UPGRADE & IMPROVE', that means execute everything available — no half measures.",
        },
        {
          id: "L_SEED_003",
          timestamp: new Date().toISOString(),
          category: "communication",
          source: "seed",
          observation: "RSP values density. A 3-line answer that's complete beats a 20-line answer that pads.",
        },
        {
          id: "L_SEED_004",
          timestamp: new Date().toISOString(),
          category: "technical",
          source: "seed",
          observation: "RSP keeps API keys in ~/.env.secrets. DreamChamber .env was empty — keys must be copied from there.",
        },
        {
          id: "L_SEED_005",
          timestamp: new Date().toISOString(),
          category: "empire",
          source: "seed",
          observation: "Email architecture: rsp@noizyfish.com is UNIVERSAL PUBLIC CONTACT. rsplowman@icloud.com is BACKEND only (CF login, email routing destination).",
        },
        {
          id: "L_SEED_006",
          timestamp: new Date().toISOString(),
          category: "technical",
          source: "seed",
          observation: "DreamChamber dev mode uses nodemon (npm run dc:dev). Server auto-restarts on file changes. Kill with pkill before restarting if port conflict.",
        },
        {
          id: "L_SEED_007",
          timestamp: new Date().toISOString(),
          category: "empire",
          source: "seed",
          observation: "Heaven is LIVE at heaven.rsp-5f3.workers.dev. Always verify with health check before claiming anything is broken.",
        },
        {
          id: "L_SEED_008",
          timestamp: new Date().toISOString(),
          category: "work_style",
          source: "seed",
          observation: "RSP codes at expert level. Don't explain what console.log does. Don't add comments to obvious code.",
        },
        {
          id: "L_SEED_009",
          timestamp: new Date().toISOString(),
          category: "technical",
          source: "seed",
          observation: "Cloudflare account login MUST be rsp@noizy.ai. It is currently rsp@noizyfish.com — this is a BLOCKING issue for GoDaddy migration.",
        },
        {
          id: "L_SEED_010",
          timestamp: new Date().toISOString(),
          category: "capabilities",
          source: "seed",
          observation: "GABRIEL now has: Extended Thinking (Opus 4), Vision (images + PDFs), Prompt Caching (90% savings on static), Batch API (50% savings async). All wired through WebSocket + REST.",
        },
      ],
    };
  }
}

module.exports = new GabrielProfile(); // singleton
