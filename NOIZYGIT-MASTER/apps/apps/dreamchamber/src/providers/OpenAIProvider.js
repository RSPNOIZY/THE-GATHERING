const OpenAI = require("openai");
const BaseProvider = require("./BaseProvider");

class OpenAIProvider extends BaseProvider {
  constructor(apiKey) {
    super("OpenAI");
    this.client = new OpenAI({ apiKey });

    this.models = {
      "gpt-4o": {
        name: "gpt-4o",
        contextLimit: 128000,
        costs: { input: 2.5, output: 10 },
        supportsVision: true,
      },
      "gpt-4-turbo": {
        name: "gpt-4-turbo",
        contextLimit: 128000,
        costs: { input: 10, output: 30 },
        supportsVision: true,
      },
    };
  }

  _formatMessagesWithVision(messages, images = null) {
    const formatted = messages.map((m) => ({ ...m }));
    if (images && images.length > 0 && formatted.length > 0) {
      const lastUserEntry = [...formatted]
        .map((m, i) => ({ m, i }))
        .reverse()
        .find(({ m }) => m.role === "user");
      if (lastUserEntry) {
        const imageContent = images
          .map((img) => {
            if (img.url) {
              return { type: "image_url", image_url: { url: img.url } };
            } else if (img.base64) {
              const mime = img.mediaType || "image/jpeg";
              return { type: "image_url", image_url: { url: `data:${mime};base64,${img.base64}` } };
            }
            return null;
          })
          .filter(Boolean);
        formatted[lastUserEntry.i] = {
          role: "user",
          content: [...imageContent, { type: "text", text: formatted[lastUserEntry.i].content }],
        };
      }
    }
    return formatted;
  }

  async chat(messages, options = {}) {
    const model = this.models[options.model] || this.models["gpt-4o"];

    const startTime = Date.now();

    try {
      const response = await this.withRetry(async () => {
        let chatMessages = this._formatMessagesWithVision(messages, options.images);

        // Add system prompt if provided
        if (options.systemPrompt) {
          chatMessages.unshift({
            role: "system",
            content: options.systemPrompt,
          });
        }

        return await this.client.chat.completions.create({
          model: model.name,
          messages: chatMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
          stream: false,
        });
      });

      const latency = Date.now() - startTime;
      const completion = response.choices[0];

      const tokens = {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      };

      const cost = this.calculateCost(tokens, model.costs);

      return {
        content: completion.message.content,
        metadata: {
          tokens,
          cost,
          latency,
          provider: "openai",
          modelVersion: model.name,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
          finishReason: completion.finish_reason,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChat(messages, options = {}) {
    const model = this.models[options.model] || this.models["gpt-4o"];
    let chatMessages = this._formatMessagesWithVision(messages, options.images);
    if (options.systemPrompt) {
      chatMessages.unshift({ role: "system", content: options.systemPrompt });
    }

    const stream = await this.client.chat.completions.create({
      model: model.name,
      messages: chatMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      stream: true,
      stream_options: { include_usage: true },
    });

    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) yield { text, done: false };
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }

    const tokens = {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    };
    const cost = this.calculateCost(tokens, model.costs);
    yield { text: "", done: true, tokens, cost, model: model.name };
  }

  calculateCost(tokens, costs) {
    return {
      prompt: (tokens.prompt / 1000000) * costs.input,
      completion: (tokens.completion / 1000000) * costs.output,
      total: (tokens.prompt / 1000000) * costs.input + (tokens.completion / 1000000) * costs.output,
    };
  }

  async validateApiKey(apiKey) {
    try {
      const testClient = new OpenAI({ apiKey });
      await testClient.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  getContextLimit(model) {
    return this.models[model]?.contextLimit || 128000;
  }

  getCosts(model) {
    return this.models[model]?.costs || { input: 2.5, output: 10 };
  }
}

module.exports = OpenAIProvider;
