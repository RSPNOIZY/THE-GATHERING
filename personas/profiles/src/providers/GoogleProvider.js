const { GoogleGenerativeAI } = require("@google/generative-ai");
const BaseProvider = require("./BaseProvider");

class GoogleProvider extends BaseProvider {
  constructor(apiKey) {
    super("Google");
    this.genAI = new GoogleGenerativeAI(apiKey);

    this.models = {
      "gemini-2.0-flash": {
        name: "gemini-2.0-flash-latest",
        contextLimit: 1000000,
        costs: { input: 0.075, output: 0.3 },
      },
      "gemini-pro": {
        name: "gemini-1.5-pro-latest",
        contextLimit: 2000000,
        costs: { input: 1.25, output: 5.0 },
      },
      "gemma-3-27b": {
        name: "gemma-3-27b-it",
        contextLimit: 128000,
        costs: { input: 0.1, output: 0.2 },
        persona: "Shirley",
        role: "Code & File Manager — helps manage the NOIZY Empire codebase, files, and organization",
      },
    };
  }

  async chat(messages, options = {}) {
    const modelConfig = this.models[options.model] || this.models["gemini-pro"];
    const model = this.genAI.getGenerativeModel({ model: modelConfig.name });

    const startTime = Date.now();

    try {
      // Convert messages to Gemini format
      const history = this.formatMessagesForGemini(messages);

      // Create chat with system instruction
      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 4096,
        },
        systemInstruction: options.systemPrompt,
      });

      // Get the last user message
      const lastMessage = messages[messages.length - 1].content;

      const result = await this.withRetry(async () => {
        return await chat.sendMessage(lastMessage);
      });

      const response = await result.response;
      let text;
      try {
        text = response.text();
      } catch (e) {
        throw new Error(`Gemini response blocked or empty: ${e.message}`);
      }
      const latency = Date.now() - startTime;

      const tokens = {
        prompt:
          response.usageMetadata?.promptTokenCount ||
          this.estimateTokens(messages.map((m) => m.content).join(" ")),
        completion: response.usageMetadata?.candidatesTokenCount || this.estimateTokens(text),
        total: 0,
      };
      tokens.total = tokens.prompt + tokens.completion;

      const cost = this.calculateCost(tokens, modelConfig.costs);

      return {
        content: text,
        metadata: {
          tokens,
          cost,
          latency,
          provider: "google",
          modelVersion: modelConfig.name,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4096,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamChat(messages, options = {}) {
    const modelConfig = this.models[options.model] || this.models["gemini-pro"];
    const model = this.genAI.getGenerativeModel({ model: modelConfig.name });

    // Convert messages to Gemini format
    const history = this.formatMessagesForGemini(messages);

    // Create chat with system instruction
    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4096,
      },
      systemInstruction: options.systemPrompt,
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1].content;

    try {
      const stream = await this.withRetry(async () => {
        return await chat.sendMessageStream(lastMessage);
      });

      let promptTokenCount = 0;
      let candidatesTokenCount = 0;

      for await (const event of stream.stream) {
        const text = event.text() || "";
        if (text) {
          yield { text, done: false };
        }
        if (event.usageMetadata) {
          promptTokenCount = event.usageMetadata.promptTokenCount || promptTokenCount;
          candidatesTokenCount = event.usageMetadata.candidatesTokenCount || candidatesTokenCount;
        }
      }

      const tokens = {
        prompt: promptTokenCount || this.estimateTokens(messages.map((m) => m.content).join(" ")),
        completion: candidatesTokenCount,
        total: 0,
      };
      tokens.total = tokens.prompt + tokens.completion;

      const cost = this.calculateCost(tokens, modelConfig.costs);
      yield { text: "", done: true, tokens, cost, model: modelConfig.name };
    } catch (error) {
      this.handleError(error);
    }
  }

  formatMessagesForGemini(messages) {
    // Gemini expects alternating user/model messages
    const history = [];

    messages.forEach((msg) => {
      if (msg.role === "user") {
        history.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "assistant") {
        history.push({
          role: "model",
          parts: [{ text: msg.content }],
        });
      }
      // Skip system messages as they're handled via systemInstruction
    });

    // Remove last message as it will be sent separately
    if (history.length > 0 && history[history.length - 1].role === "user") {
      history.pop();
    }

    return history;
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
      const testAI = new GoogleGenerativeAI(apiKey);
      const model = testAI.getGenerativeModel({ model: "gemini-2.0-flash-latest" });
      await model.generateContent("test");
      return true;
    } catch (error) {
      return false;
    }
  }

  getContextLimit(model) {
    return this.models[model]?.contextLimit || 1000000;
  }

  getCosts(model) {
    return this.models[model]?.costs || { input: 0.125, output: 0.375 };
  }

}

module.exports = GoogleProvider;
