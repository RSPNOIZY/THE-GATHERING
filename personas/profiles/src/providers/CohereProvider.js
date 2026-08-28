const { CohereClient } = require("cohere-ai");
const BaseProvider = require("./BaseProvider");

class CohereProvider extends BaseProvider {
  constructor(apiKey) {
    super("Cohere");
    this.client = new CohereClient({ token: apiKey });

    this.models = {
      "command-r-plus": {
        name: "command-r-plus",
        contextLimit: 128000,
        costs: { input: 3.0, output: 15.0 },
      },
    };
  }

  async chat(messages, options = {}) {
    const model = this.models[options.model] || this.models["command-r-plus"];

    const startTime = Date.now();

    try {
      // Convert messages to Cohere format
      const chatHistory = this.formatMessagesForCohere(messages);
      const lastMessage = messages[messages.length - 1].content;

      const response = await this.withRetry(async () => {
        return await this.client.chat({
          model: model.name,
          message: lastMessage,
          chatHistory,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
          preamble: options.systemPrompt,
        });
      });

      const latency = Date.now() - startTime;

      // Cohere provides token usage in meta
      const tokens = {
        prompt:
          response.meta?.billed_units?.input_tokens ||
          this.estimateTokens(messages.map((m) => m.content).join(" ")),
        completion:
          response.meta?.billed_units?.output_tokens ||
          this.estimateTokens(response.text),
        total: 0,
      };
      tokens.total = tokens.prompt + tokens.completion;

      const cost = this.calculateCost(tokens, model.costs);

      return {
        content: response.text,
        metadata: {
          tokens,
          cost,
          latency,
          provider: "cohere",
          modelVersion: model.name,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
          citations: response.citations || [],
          searchQueries: response.searchQueries || [],
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChat(messages, options = {}) {
    const model = this.models[options.model] || this.models["command-r-plus"];

    try {
      // Convert messages to Cohere format
      const chatHistory = this.formatMessagesForCohere(messages);
      const lastMessage = messages[messages.length - 1].content;

      const stream = await this.withRetry(async () => {
        return await this.client.chatStream({
          model: model.name,
          message: lastMessage,
          chatHistory,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
          preamble: options.systemPrompt,
        });
      });

      let promptTokens = 0;
      let completionTokens = 0;

      for await (const event of stream) {
        if (event.type === "text-generation") {
          yield { text: event.text, done: false };
        } else if (event.type === "stream-end") {
          if (event.response?.meta?.billed_units) {
            promptTokens = event.response.meta.billed_units.input_tokens || promptTokens;
            completionTokens = event.response.meta.billed_units.output_tokens || completionTokens;
          }
        }
      }

      const tokens = {
        prompt: promptTokens || this.estimateTokens(messages.map((m) => m.content).join(" ")),
        completion: completionTokens,
        total: 0,
      };
      tokens.total = tokens.prompt + tokens.completion;

      const cost = this.calculateCost(tokens, model.costs);
      yield { text: "", done: true, tokens, cost, model: model.name };
    } catch (error) {
      this.handleError(error);
    }
  }

  formatMessagesForCohere(messages) {
    // Cohere expects chatHistory as array of {role, message} objects
    const history = [];

    messages.slice(0, -1).forEach((msg) => {
      if (msg.role === "user") {
        history.push({
          role: "USER",
          message: msg.content,
        });
      } else if (msg.role === "assistant") {
        history.push({
          role: "CHATBOT",
          message: msg.content,
        });
      }
      // Skip system messages as they're handled via preamble
    });

    return history;
  }

  calculateCost(tokens, costs) {
    return {
      prompt: (tokens.prompt / 1000000) * costs.input,
      completion: (tokens.completion / 1000000) * costs.output,
      total:
        (tokens.prompt / 1000000) * costs.input +
        (tokens.completion / 1000000) * costs.output,
    };
  }

  async validateApiKey(apiKey) {
    try {
      const testClient = new CohereClient({ token: apiKey });
      await testClient.chat({
        model: "command-r-plus",
        message: "test",
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getContextLimit(model) {
    return this.models[model]?.contextLimit || 128000;
  }

  getCosts(model) {
    return this.models[model]?.costs || { input: 3.0, output: 15.0 };
  }
}

module.exports = CohereProvider;
