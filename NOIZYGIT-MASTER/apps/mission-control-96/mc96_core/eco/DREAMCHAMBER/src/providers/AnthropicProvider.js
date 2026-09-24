const Anthropic = require("@anthropic-ai/sdk");
const BaseProvider = require("./BaseProvider");

class AnthropicProvider extends BaseProvider {
  constructor(apiKey) {
    super("Anthropic");
    this.client = new Anthropic({ apiKey });

    this.models = {
      "claude-opus-4": {
        name: "claude-opus-4-5-20251101",
        contextLimit: 200000,
        costs: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
        supportsThinking: true,
        supportsVision: true,
      },
      "claude-sonnet-4": {
        name: "claude-sonnet-4-5-20251101",
        contextLimit: 200000,
        costs: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
        supportsThinking: false,
        supportsVision: true,
      },
    };
  }

  _buildSystemParam(options) {
    if (options.systemPromptStatic !== undefined) {
      const blocks = [];
      if (options.systemPromptStatic) {
        blocks.push({
          type: "text",
          text: options.systemPromptStatic,
          cache_control: { type: "ephemeral" },
        });
      }
      if (options.systemPromptDynamic) {
        blocks.push({ type: "text", text: options.systemPromptDynamic });
      }
      return blocks.length > 0 ? blocks : undefined;
    }
    return options.systemPrompt || undefined;
  }

  async chat(messages, options = {}) {
    const model = this.models[options.model] || this.models["claude-sonnet-4"];
    const startTime = Date.now();

    try {
      const params = {
        model: model.name,
        max_tokens: options.maxTokens || 4096,
        messages: this.formatMessages(messages, options.images, options.documents),
        system: this._buildSystemParam(options),
      };

      // Extended Thinking — Opus 4 only, skip temperature when enabled
      const requestOptions = {};
      if (options.thinking && model.supportsThinking) {
        params.thinking = {
          type: "enabled",
          budget_tokens: options.thinkingBudget || 10000,
        };
        // Pass beta header via SDK request options
        requestOptions.headers = { "anthropic-beta": "interleaved-thinking-2025-05-14" };
      } else {
        params.temperature = options.temperature ?? 0.7;
      }

      const response = await this.withRetry(async () => {
        return await this.client.messages.create(params, requestOptions);
      });

      const latency = Date.now() - startTime;

      // Extract thinking blocks and text blocks separately
      let thinkingContent = null;
      let textContent = "";
      for (const block of response.content) {
        if (block.type === "thinking") thinkingContent = block.thinking;
        else if (block.type === "text") textContent += block.text;
      }

      const tokens = {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        cacheWrite: response.usage.cache_creation_input_tokens || 0,
        cacheRead: response.usage.cache_read_input_tokens || 0,
        total:
          response.usage.input_tokens +
          response.usage.output_tokens +
          (response.usage.cache_creation_input_tokens || 0),
      };

      const cost = this.calculateCostFull(tokens, model.costs);

      return {
        content: textContent,
        thinking: thinkingContent,
        metadata: {
          tokens,
          cost,
          latency,
          provider: "anthropic",
          modelVersion: model.name,
          temperature: params.temperature ?? null,
          maxTokens: options.maxTokens || 4096,
          thinking: !!thinkingContent,
          cached: tokens.cacheRead > 0,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChat(messages, options = {}) {
    const model = this.models[options.model] || this.models["claude-sonnet-4"];

    const createParams = {
      model: model.name,
      max_tokens: options.maxTokens || 4096,
      messages: this.formatMessages(messages, options.images, options.documents),
      stream: true,
    };
    const streamRequestOptions = {};
    const systemParam = this._buildSystemParam(options);
    if (systemParam) createParams.system = systemParam;

    // Extended Thinking in streaming — Opus 4 only
    if (options.thinking && model.supportsThinking) {
      createParams.thinking = {
        type: "enabled",
        budget_tokens: options.thinkingBudget || 10000,
      };
      streamRequestOptions.headers = { "anthropic-beta": "interleaved-thinking-2025-05-14" };
    } else {
      createParams.temperature = options.temperature ?? 0.7;
    }

    const stream = await this.client.messages.create(createParams, streamRequestOptions);

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheWriteTokens = 0;
    let cacheReadTokens = 0;
    let thinkingBuffer = "";
    let currentBlockType = null;

    for await (const event of stream) {
      if (event.type === "message_start") {
        inputTokens = event.message.usage.input_tokens;
        cacheWriteTokens = event.message.usage.cache_creation_input_tokens || 0;
        cacheReadTokens = event.message.usage.cache_read_input_tokens || 0;
      } else if (event.type === "content_block_start") {
        currentBlockType = event.content_block?.type || null;
        if (currentBlockType === "thinking") {
          yield { text: "", thinking: "", thinkingStart: true, done: false };
        }
      } else if (event.type === "content_block_delta") {
        if (currentBlockType === "thinking") {
          const thinkChunk = event.delta?.thinking || "";
          thinkingBuffer += thinkChunk;
          yield { text: "", thinking: thinkChunk, done: false };
        } else {
          yield { text: event.delta?.text || "", done: false };
        }
      } else if (event.type === "content_block_stop") {
        if (currentBlockType === "thinking") {
          yield { text: "", thinking: "", thinkingEnd: true, done: false };
        }
        currentBlockType = null;
      } else if (event.type === "message_delta") {
        outputTokens = event.usage.output_tokens;
      }
    }

    const tokens = {
      prompt: inputTokens,
      completion: outputTokens,
      cacheWrite: cacheWriteTokens,
      cacheRead: cacheReadTokens,
      total: inputTokens + outputTokens + cacheWriteTokens,
    };
    const cost = this.calculateCostFull(tokens, model.costs);
    yield {
      text: "",
      done: true,
      tokens,
      cost,
      model: model.name,
      thinking: thinkingBuffer || null,
      cached: cacheReadTokens > 0,
    };
  }

  formatMessages(messages, images = null, documents = null) {
    // Anthropic format: [{role: 'user'|'assistant', content: string|array}]
    const formatted = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Attach images and/or PDFs to the last user message
    const hasAttachments = (images && images.length > 0) || (documents && documents.length > 0);
    if (hasAttachments && formatted.length > 0) {
      const lastUserIdx = [...formatted].reverse().findIndex((m) => m.role === "user");
      if (lastUserIdx !== -1) {
        const idx = formatted.length - 1 - lastUserIdx;
        const contentBlocks = [];

        // Image blocks (URL or base64)
        if (images && images.length > 0) {
          for (const img of images) {
            if (img.url) {
              contentBlocks.push({ type: "image", source: { type: "url", url: img.url } });
            } else if (img.base64) {
              contentBlocks.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.mediaType || "image/jpeg",
                  data: img.base64,
                },
              });
            }
          }
        }

        // PDF / document blocks (base64)
        if (documents && documents.length > 0) {
          for (const doc of documents) {
            contentBlocks.push({
              type: "document",
              source: {
                type: "base64",
                media_type: doc.mediaType || "application/pdf",
                data: doc.base64,
              },
              ...(doc.title ? { title: doc.title } : {}),
            });
          }
        }

        contentBlocks.push({ type: "text", text: formatted[idx].content });

        formatted[idx] = { role: "user", content: contentBlocks };
      }
    }

    return formatted;
  }

  calculateCost(tokens, costs) {
    return {
      prompt: (tokens.prompt / 1000000) * costs.input,
      completion: (tokens.completion / 1000000) * costs.output,
      total: (tokens.prompt / 1000000) * costs.input + (tokens.completion / 1000000) * costs.output,
    };
  }

  calculateCostFull(tokens, costs) {
    const promptCost = (tokens.prompt / 1000000) * costs.input;
    const completionCost = (tokens.completion / 1000000) * costs.output;
    const cacheWriteCost =
      ((tokens.cacheWrite || 0) / 1000000) * (costs.cacheWrite || costs.input * 1.25);
    const cacheReadCost =
      ((tokens.cacheRead || 0) / 1000000) * (costs.cacheRead || costs.input * 0.1);
    const savings =
      (tokens.cacheRead || 0) > 0 ? (tokens.cacheRead / 1000000) * costs.input - cacheReadCost : 0;
    return {
      prompt: promptCost,
      completion: completionCost,
      cacheWrite: cacheWriteCost,
      cacheRead: cacheReadCost,
      savings,
      total: promptCost + completionCost + cacheWriteCost + cacheReadCost,
    };
  }

  async validateApiKey(apiKey) {
    try {
      const testClient = new Anthropic({ apiKey });
      await testClient.messages.create({
        model: "claude-sonnet-4-5-20251101",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getContextLimit(model) {
    return this.models[model]?.contextLimit || 200000;
  }

  getCosts(model) {
    return this.models[model]?.costs || { input: 3, output: 15 };
  }

  supportsThinking(model) {
    return this.models[model]?.supportsThinking || false;
  }

  supportsVision(model) {
    return this.models[model]?.supportsVision || false;
  }

  // ─── Batch API ────────────────────────────────────────────────────────────────
  // 50% cost reduction for async processing — results ready within 24h

  async createBatch(requests) {
    // requests: [{ customId, model, messages, options }]
    const batchRequests = requests.map((req) => {
      const model = this.models[req.model] || this.models["claude-sonnet-4"];
      const params = {
        model: model.name,
        max_tokens: req.options?.maxTokens || 4096,
        messages: this.formatMessages(req.messages),
        system: this._buildSystemParam(req.options || {}),
      };
      if (!req.options?.thinking) params.temperature = req.options?.temperature ?? 0.7;
      return {
        custom_id: req.customId,
        params,
      };
    });

    const batch = await this.client.messages.batches.create({ requests: batchRequests });
    return {
      batchId: batch.id,
      status: batch.processing_status,
      requestCounts: batch.request_counts,
      createdAt: batch.created_at,
      expiresAt: batch.expires_at,
    };
  }

  async getBatchStatus(batchId) {
    const batch = await this.client.messages.batches.retrieve(batchId);
    return {
      batchId: batch.id,
      status: batch.processing_status,
      requestCounts: batch.request_counts,
      endedAt: batch.ended_at,
    };
  }

  async getBatchResults(batchId) {
    const results = [];
    for await (const result of await this.client.messages.batches.results(batchId)) {
      if (result.result.type === "succeeded") {
        const msg = result.result.message;
        let text = "";
        let thinking = null;
        for (const block of msg.content) {
          if (block.type === "thinking") thinking = block.thinking;
          else if (block.type === "text") text += block.text;
        }
        results.push({
          customId: result.custom_id,
          success: true,
          content: text,
          thinking,
          tokens: {
            prompt: msg.usage.input_tokens,
            completion: msg.usage.output_tokens,
            cacheRead: msg.usage.cache_read_input_tokens || 0,
            cacheWrite: msg.usage.cache_creation_input_tokens || 0,
          },
        });
      } else {
        results.push({
          customId: result.custom_id,
          success: false,
          error: result.result.error?.message || "Batch request failed",
        });
      }
    }
    return results;
  }

  async cancelBatch(batchId) {
    const batch = await this.client.messages.batches.cancel(batchId);
    return { batchId: batch.id, status: batch.processing_status };
  }
}

module.exports = AnthropicProvider;
