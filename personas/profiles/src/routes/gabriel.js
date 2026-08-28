const express = require("express");
const router = express.Router();

function getGabriel(req) {
  if (!req.gabriel) throw new Error("GABRIEL not initialized on this server");
  return req.gabriel;
}

// POST /api/gabriel/speak — primary endpoint
// Body: { input, voice?, model?, history?, thinking?, thinkingBudget?, images? }
router.post("/speak", async (req, res) => {
  try {
    const {
      input,
      voice = false,
      model,
      history,
      thinking = false,
      thinkingBudget,
      images,
      documents,
    } = req.body;
    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ error: "input is required" });
    }

    const gabriel = getGabriel(req);
    const result = await gabriel.speak(input.trim(), {
      voice,
      model,
      history,
      thinking,
      thinkingBudget,
      images,
      documents,
    });

    res.json({
      gabriel: result.response,
      thinking: result.thinking || null,
      metadata: result.metadata,
      context: result.context,
    });
  } catch (err) {
    const safeMsg = err.message?.replace(/sk-[\w-]+/g, "[REDACTED]") || "Gabriel speak failed";
    res.status(500).json({ error: safeMsg });
  }
});

// GET /api/gabriel/status — Gabriel's current awareness + health
router.get("/status", async (req, res) => {
  try {
    const gabriel = getGabriel(req);
    const status = await gabriel.status();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message || "Gabriel status failed" });
  }
});

// POST /api/gabriel/announce — TTS only, no AI generation
// Body: { text: string }
router.post("/announce", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const gabriel = getGabriel(req);
    await gabriel.announce(text.trim());

    res.json({ announced: true, text: text.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message || "Announce failed" });
  }
});

// POST /api/gabriel/refresh — force context refresh from Heaven
router.post("/refresh", async (req, res) => {
  try {
    const gabriel = getGabriel(req);
    const context = await gabriel.refreshContext(true);
    res.json({ refreshed: true, context });
  } catch (err) {
    res.status(500).json({ error: err.message || "Refresh failed" });
  }
});

// POST /api/gabriel/learn — add an observation to GABRIEL's adaptive profile
// Body: { observation: string, category?: string, source?: string, meta?: object }
// Categories: general | work_style | communication | technical | empire | capabilities | preference | correction | consent
// Consent-related learns automatically include prompt_version + never_clause_checked for audit trail
router.post("/learn", (req, res) => {
  try {
    const { observation, category = "general", source = "interaction", meta } = req.body;
    if (!observation || typeof observation !== "string" || !observation.trim()) {
      return res.status(400).json({ error: "observation is required" });
    }

    // Audit trail: consent decisions MUST carry prompt_version
    let obs = observation.trim();
    if (category === "consent" && meta) {
      const auditTag = `[prompt:GABRIEL_EXECUTOR_v1.0][actor:${meta.actor_id || "?"}][token:${meta.token_id || "?"}][outcome:${meta.outcome || "?"}]`;
      obs = `${auditTag} ${obs}`;
    }

    const gabriel = getGabriel(req);
    const entry = gabriel.learn(obs, category, source);
    res.json({ learned: true, entry, prompt_version: "GABRIEL_EXECUTOR_v1.0" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Learn failed" });
  }
});

// GET /api/gabriel/profile — view full profile + all learnings
router.get("/profile", (req, res) => {
  try {
    const gabriel = getGabriel(req);
    const p = gabriel.getProfile();
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message || "Profile fetch failed" });
  }
});

// GET /api/gabriel/profile/learnings — recent learnings only
router.get("/profile/learnings", (req, res) => {
  try {
    const gabriel = getGabriel(req);
    const limit = parseInt(req.query.limit || "50", 10);
    const learnings = gabriel.getLearnings(limit);
    res.json({ learnings, count: learnings.length });
  } catch (err) {
    res.status(500).json({ error: err.message || "Learnings fetch failed" });
  }
});

// PATCH /api/gabriel/profile — update a profile section field
// Body: { section: string, key: string, value: string }
router.patch("/profile", (req, res) => {
  try {
    const { section, key, value } = req.body;
    if (!section || !key || value === undefined) {
      return res.status(400).json({ error: "section, key, and value are required" });
    }
    const gabriel = getGabriel(req);
    const updated = gabriel.updateProfile(section, key, value);
    res.json({ updated: true, section, updated: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Profile update failed" });
  }
});

// POST /api/gabriel/profile/consolidate — trim old learnings, keep profile lean
router.post("/profile/consolidate", (req, res) => {
  try {
    const gabriel = getGabriel(req);
    const result = gabriel.consolidateLearnings();
    res.json({ consolidated: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Consolidate failed" });
  }
});

module.exports = router;
