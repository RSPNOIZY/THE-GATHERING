const Joi = require("joi");

// Message schema - single message in conversation
const messageSchema = Joi.object({
  id: Joi.string().uuid().required(),
  conversationId: Joi.string().uuid().required(),
  role: Joi.string().valid("user", "assistant", "system").required(),
  content: Joi.string().required(),
  model: Joi.string()
    .valid(
      "claude-opus-4",
      "claude-sonnet-4",
      "gpt-4o",
      "gpt-4-turbo",
      "gemini-2.0-flash",
      "gemini-pro",
      "llama-3.3-70b",
      "mistral-large",
      "command-r-plus",
      "perplexity-online",
    )
    .required(),
  timestamp: Joi.date().iso().required(),
  metadata: Joi.object({
    tokens: Joi.object({
      prompt: Joi.number().integer().min(0),
      completion: Joi.number().integer().min(0),
      total: Joi.number().integer().min(0),
    }),
    cost: Joi.object({
      prompt: Joi.number().min(0),
      completion: Joi.number().min(0),
      total: Joi.number().min(0),
    }),
    latency: Joi.number().min(0), // milliseconds
    provider: Joi.string().required(),
    modelVersion: Joi.string(),
    temperature: Joi.number().min(0).max(2),
    maxTokens: Joi.number().integer().min(1),
  }),
});

// Conversation schema - full conversation with state
const conversationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().required(),
  title: Joi.string().allow(""),
  messages: Joi.array().items(messageSchema),
  activeModel: Joi.string(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
  metadata: Joi.object({
    totalTokens: Joi.number().integer().min(0),
    totalCost: Joi.number().min(0),
    messageCount: Joi.number().integer().min(0),
    tags: Joi.array().items(Joi.string()),
    isComparison: Joi.boolean(),
    comparisonModels: Joi.array().items(Joi.string()),
  }),
  state: Joi.string().valid("active", "archived", "deleted").default("active"),
});

// API request schemas
const chatRequestSchema = Joi.object({
  conversationId: Joi.string().uuid(),
  message: Joi.string().required().min(1).max(100000),
  model: Joi.string().required(),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().integer().min(1).max(200000).default(4096),
  systemPrompt: Joi.string().max(10000),
  apiKeys: Joi.object({
    anthropic: Joi.string().pattern(/^sk-ant-/),
    openai: Joi.string().pattern(/^sk-/),
    google: Joi.string().pattern(/^AIza/),
    together: Joi.string().min(8),
    mistral: Joi.string().min(8),
    cohere: Joi.string().min(8),
    perplexity: Joi.string().pattern(/^pplx-/),
  }).min(1),
});

const compareRequestSchema = Joi.object({
  message: Joi.string().required().min(1).max(100000),
  models: Joi.array().items(Joi.string()).min(2).max(10).required(),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().integer().min(1).max(200000).default(4096),
  systemPrompt: Joi.string().max(10000),
  apiKeys: Joi.object().required(),
});

module.exports = {
  messageSchema,
  conversationSchema,
  chatRequestSchema,
  compareRequestSchema,
};
