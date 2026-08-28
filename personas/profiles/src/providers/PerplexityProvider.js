const BaseProvider = require("./BaseProvider");
const fetch = require("node-fetch");

class PerplexityProvider extends BaseProvider {
  constructor(apiKey) {
    super("Perplexity");
    this.apiKey = apiKey;
    this.baseUrl = "https://api.perplexity.ai";

    this.models = {
      "perplexity-online": {
        name: "sonar",
        contextLimit: 127072,
        costs: { input: 0, output: 0 }, // Free with search
      },
    };
  }

  async chat(messages, options = {}) {
    const model = this.models[options.model] || this.models["perplexity-online"];

    const startTime = Date.now();

    try {
      const response = await this.withRetry(async () => {
        const chatMessages = [...messages];

        // Add system prompt if provided
        if (options.systemPrompt) {
          chatMessages.unshift({
            role: "system",
            content: options.systemPrompt,
          });
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.name,
            messages: chatMessages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: false,
            // Perplexity-specific options
            search_domain_filter: options.searchDomain || null,
            return_citations: true,
            search_recency_filter: options.searchRecency || null,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return await res.json();
      });

      const latency = Date.now() - startTime;
      const completion = response.choices[0];

      // Extract citations from response
      const citations = response.citations || [];

      const tokens = {
        prompt:
          response.usage?.prompt_tokens ||
          this.estimateTokens(messages.map((m) => m.content).join(" ")),
        completion:
          response.usage?.completion_tokens || this.estimateTokens(completion.message.content),
        total: response.usage?.total_tokens || 0,
      };

      if (!response.usage?.total_tokens) {
        tokens.total = tokens.prompt + tokens.completion;
      }

      const cost = this.calculateCost(tokens, model.costs);

      return {
        content: completion.message.content,
        metadata: {
          tokens,
          cost,
          latency,
          provider: "perplexity",
          modelVersion: model.name,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
          citations,
          searchPerformed: true,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChat(messages, options = {}) {
    const model = this.models[options.model] || this.models["perplexity-online"];

    const chatMessages = [...messages];
    if (options.systemPrompt) {
      chatMessages.unshift({
        role: "system",
        content: options.systemPrompt,
      });
    }

    try {
      const res = await this.withRetry(async () => {
        return await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.name,
            messages: chatMessages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
            stream: true,
            stream_options: { include_usage: true },
            // Perplexity-specific options
            search_domain_filter: options.searchDomain || null,
            return_citations: true,
            search_recency_filter: options.searchRecency || null,
          }),
        });
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || `HTTP ${res.status}`);
      }

      let promptTokens = 0;
      let completionTokens = 0;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1];

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') continue;
              try {
                const chunk = JSON.parse(dataStr);
                const text = chunk.choices?.[0]?.delta?.content || '';
                if (text) yield { text, done: false };
                if (chunk.usage) {
                  promptTokens = chunk.usage.prompt_tokens;
                  completionTokens = chunk.usage.completion_tokens;
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const tokens = {
        prompt: promptTokens || this.estimateTokens(messages.map(m => m.content).join(' ')),
        completion: completionTokens,
        total: promptTokens + completionTokens
      };
      const cost = this.calculateCost(tokens, model.costs);
      yield { text: '', done: true, tokens, cost, model: model.name };
    } catch (error) {
      this.handleError(error);
    }
  }

  calculateCost(tokens, costs) {
    // Perplexity is currently free for online search model
    return {
      prompt: 0,
      completion: 0,
      total: 0,
    };
  }

  async validateApiKey(apiKey) {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return res.ok;
    } catch (error) {
      return false;
    }
  }

  getContextLimit(model) {
    return this.models[model]?.contextLimit || 127072;
  }

  getCosts(model) {
    return this.models[model]?.costs || { input: 0, output: 0 };
  }
}

module.exports = PerplexityProvider;
