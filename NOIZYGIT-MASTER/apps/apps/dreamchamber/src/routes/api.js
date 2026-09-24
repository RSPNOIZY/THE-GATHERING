const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const ProviderFactory = require("../providers");
const { chatRequestSchema, compareRequestSchema } = require("../schemas/conversation.schema");

// Get all models with status
router.get("/models", (req, res) => {
  const models = [
    {
      id: "claude-opus-4",
      name: "Claude Opus 4",
      provider: "anthropic",
      contextLimit: 200000,
      costPer1M: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
      features: [
        "reasoning",
        "coding",
        "analysis",
        "creative",
        "extended-thinking",
        "vision",
        "prompt-caching",
        "batch-api",
      ],
      status: "active",
    },
    {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
      provider: "anthropic",
      contextLimit: 200000,
      costPer1M: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
      features: ["coding", "analysis", "fast", "vision", "prompt-caching", "batch-api"],
      status: "active",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      contextLimit: 128000,
      costPer1M: { input: 2.5, output: 10 },
      features: ["multimodal", "fast", "coding", "vision"],
      status: "active",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      contextLimit: 128000,
      costPer1M: { input: 10, output: 30 },
      features: ["vision", "reasoning", "coding"],
      status: "active",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      contextLimit: 1000000,
      costPer1M: { input: 0.075, output: 0.3 },
      features: ["cheap", "huge-context", "fast"],
      status: "active",
    },
    {
      id: "gemini-pro",
      name: "Gemini 1.5 Pro",
      provider: "google",
      contextLimit: 2000000,
      costPer1M: { input: 1.25, output: 5.0 },
      features: ["huge-context", "multilingual", "balanced"],
      status: "active",
    },
    {
      id: "llama-3.3-70b",
      name: "Llama 3.3 70B",
      provider: "together",
      contextLimit: 128000,
      costPer1M: { input: 0.88, output: 0.88 },
      features: ["open-source", "coding", "reasoning"],
      status: "active",
    },
    {
      id: "mistral-large",
      name: "Mistral Large",
      provider: "mistral",
      contextLimit: 128000,
      costPer1M: { input: 2, output: 6 },
      features: ["european", "multilingual", "coding"],
      status: "active",
    },
    {
      id: "command-r-plus",
      name: "Command R+",
      provider: "cohere",
      contextLimit: 128000,
      costPer1M: { input: 3, output: 15 },
      features: ["rag-optimized", "citations", "grounded"],
      status: "active",
    },
    {
      id: "perplexity-online",
      name: "Perplexity Online",
      provider: "perplexity",
      contextLimit: 127072,
      costPer1M: { input: 0, output: 0 },
      features: ["search-augmented", "current-events", "free"],
      status: "active",
    },
    {
      id: "gemma-3-27b",
      name: "Gemma 3 27B (Shirley)",
      provider: "google",
      contextLimit: 128000,
      costPer1M: { input: 0.1, output: 0.2 },
      features: ["code-management", "file-organization", "open-source", "fast"],
      status: "active",
      persona: "Shirley — Code & File Manager for the NOIZY Empire",
    },
  ];

  res.json({ models });
});

// Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    // Validate request
    const { error, value } = chatRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { conversationId, message, model, temperature, maxTokens, systemPrompt, apiKeys } = value;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = req.stateManager.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = req.stateManager.createConversation("user"); // TODO: real user ID
    }

    // Add user message
    const userMessage = req.stateManager.addMessage(conversation.id, {
      role: "user",
      content: message,
      model: model,
    });

    // Get provider and make request
    const provider = ProviderFactory.getProviderForModel(model, apiKeys);

    // Prepare messages for context
    const contextMessages = conversation.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    // Make AI request
    const response = await provider.chat(contextMessages, {
      model,
      temperature,
      maxTokens,
      systemPrompt,
    });

    // Add assistant message
    const assistantMessage = req.stateManager.addMessage(conversation.id, {
      role: "assistant",
      content: response.content,
      model: model,
      metadata: response.metadata,
    });

    // Report AI usage to Heaven ledger (fire-and-forget)
    if (req.heaven) {
      req.heaven
        .reportUsage({
          model,
          provider: response.metadata?.provider || model.split("-")[0],
          tokens: response.metadata?.tokens?.total || 0,
          cost: response.metadata?.cost?.total || 0,
          conversationId: conversation.id,
        })
        .catch(() => {});
    }

    // Update conversation title if first exchange
    if (conversation.messages.length === 2) {
      const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
      req.stateManager.updateConversation(conversation.id, { title });
    }

    res.json({
      conversationId: conversation.id,
      message: assistantMessage,
      stats: {
        totalCost: conversation.metadata.totalCost,
        totalTokens: conversation.metadata.totalTokens,
        messageCount: conversation.metadata.messageCount,
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Compare models endpoint
router.post("/compare", async (req, res) => {
  try {
    // Validate request
    const { error, value } = compareRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message, models, temperature, maxTokens, systemPrompt, apiKeys } = value;

    // Create comparison conversation
    const conversation = req.stateManager.createConversation("user");
    conversation.metadata.isComparison = true;
    conversation.metadata.comparisonModels = models;

    // Add user message
    req.stateManager.addMessage(conversation.id, {
      role: "user",
      content: message,
      model: "comparison",
    });

    // Make requests to all models in parallel
    const promises = models.map(async (model) => {
      try {
        const provider = ProviderFactory.getProviderForModel(model, apiKeys);
        const response = await provider.chat([{ role: "user", content: message }], {
          model,
          temperature,
          maxTokens,
          systemPrompt,
        });

        return {
          model,
          success: true,
          content: response.content,
          metadata: response.metadata,
        };
      } catch (err) {
        return {
          model,
          success: false,
          error: err.message,
        };
      }
    });

    const results = await Promise.all(promises);

    // Add results as messages + report usage
    results.forEach((result) => {
      if (result.success) {
        req.stateManager.addMessage(conversation.id, {
          role: "assistant",
          content: result.content,
          model: result.model,
          metadata: result.metadata,
        });
        if (req.heaven) {
          req.heaven
            .reportUsage({
              model: result.model,
              provider: result.metadata?.provider || result.model.split("-")[0],
              tokens: result.metadata?.tokens?.total || 0,
              cost: result.metadata?.cost?.total || 0,
              conversationId: conversation.id,
            })
            .catch(() => {});
        }
      }
    });

    res.json({
      conversationId: conversation.id,
      results,
      stats: {
        totalCost: conversation.metadata.totalCost,
        totalTokens: conversation.metadata.totalTokens,
      },
    });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get conversation
router.get("/conversations/:id", (req, res) => {
  const conversation = req.stateManager.getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.json({ conversation });
});

// List conversations
router.get("/conversations", (req, res) => {
  const userId = "user"; // TODO: real user ID from auth
  const conversations = req.stateManager.getAllConversations(userId);
  res.json({ conversations });
});

// Get stats
router.get("/stats", (req, res) => {
  const stats = req.stateManager.getStats();
  res.json(stats);
});

// ── Anthropic Batch API ─────────────────────────────────────────────────────────────────
// 50% cost reduction for async batch processing

router.post("/batch", async (req, res) => {
  try {
    const { requests, apiKeys } = req.body;
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: "requests array is required" });
    }
    const ProviderFactory = require("../providers");
    const provider = ProviderFactory.getProvider("anthropic", apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY);
    const result = await provider.createBatch(requests);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/batch/:batchId", async (req, res) => {
  try {
    const ProviderFactory = require("../providers");
    const apiKey = req.query.apiKey || process.env.ANTHROPIC_API_KEY;
    const provider = ProviderFactory.getProvider("anthropic", apiKey);
    const result = await provider.getBatchStatus(req.params.batchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/batch/:batchId/results", async (req, res) => {
  try {
    const ProviderFactory = require("../providers");
    const apiKey = req.query.apiKey || process.env.ANTHROPIC_API_KEY;
    const provider = ProviderFactory.getProvider("anthropic", apiKey);
    const results = await provider.getBatchResults(req.params.batchId);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/batch/:batchId/cancel", async (req, res) => {
  try {
    const ProviderFactory = require("../providers");
    const apiKey = req.body.apiKey || process.env.ANTHROPIC_API_KEY;
    const provider = ProviderFactory.getProvider("anthropic", apiKey);
    const result = await provider.cancelBatch(req.params.batchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Heaven Proxy Routes ─────────────────────────────────────────────────────

router.get("/heaven/health", async (req, res) => {
  const data = await req.heaven.health();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/stats", async (req, res) => {
  const data = await req.heaven.stats();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/actors", async (req, res) => {
  const data = await req.heaven.getActors();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/actors/:id", async (req, res) => {
  const data = await req.heaven.getActor(req.params.id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/actors/:id/never-clauses", async (req, res) => {
  const data = await req.heaven.getNeverClauses(req.params.id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/rate-table", async (req, res) => {
  const data = await req.heaven.getRateTable();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/ledger", async (req, res) => {
  const data = await req.heaven.getLedger(req.query.actor_id, req.query.limit);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/union-tiers", async (req, res) => {
  const data = await req.heaven.getUnionTiers();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/estates", async (req, res) => {
  const data = await req.heaven.getEstates();
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/actors/:id/estate", async (req, res) => {
  const data = await req.heaven.getActorEstate(req.params.id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/actors/:id/voice-dna", async (req, res) => {
  const data = await req.heaven.getVoiceDNA(req.params.id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.get("/heaven/premis", async (req, res) => {
  const data = await req.heaven.getPremisEvents(req.query.actor_id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

// ── Consent Tokens ────────────────────────────────────────────────────────────

router.get("/heaven/actors/:id/consent-tokens", async (req, res) => {
  const data = await req.heaven.getConsentTokens(req.params.id);
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

router.post("/heaven/consent-tokens/:id/revoke", async (req, res) => {
  const { reason } = req.body || {};
  const data = await req.heaven.revokeToken(req.params.id, reason || "revoked via DreamChamber");
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

// ── KPI Endpoints ─────────────────────────────────────────────────────────────

["trust", "safety", "revenue", "quality", "risk"].forEach((kpi) => {
  router.get(`/heaven/kpi/${kpi}`, async (req, res) => {
    const data = await req.heaven.request(`/api/v1/kpi/${kpi}`);
    if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
    res.json(data);
  });
});

// ── Enterprise Audit ──────────────────────────────────────────────────────────

router.get("/heaven/enterprise/audit", async (req, res) => {
  const data = await req.heaven.request("/api/v1/enterprise/audit");
  if (!data) return res.status(503).json({ error: "Heaven kernel unreachable" });
  res.json(data);
});

// ── Gabriel Edge Status Proxy ─────────────────────────────────────────────────

router.get("/heaven/gabriel", async (req, res) => {
  try {
    const r = await fetch(
      `${process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev"}/gabriel`,
    );
    if (!r.ok) return res.status(r.status).json({ error: `Heaven ${r.status}` });
    res.json(await r.json());
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
