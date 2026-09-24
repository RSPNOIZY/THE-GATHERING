const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists (dreamchamber/logs/)
const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
fs.mkdirSync(LOGS_DIR, { recursive: true });

class BaseProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.label({ label: `Provider:${name}` }),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(LOGS_DIR, `providers-${name}.log`),
        }),
      ],
    });
  }

  // Abstract methods to be implemented by providers
  async chat(messages, options = {}) {
    throw new Error(`${this.name} provider must implement chat method`);
  }

  async validateApiKey(apiKey) {
    throw new Error(
      `${this.name} provider must implement validateApiKey method`,
    );
  }

  // Common methods
  formatMessages(messages) {
    // Convert to provider-specific format
    return messages;
  }

  calculateCost(tokens) {
    const costs = this.getCosts();
    return {
      prompt: (tokens.prompt / 1000000) * costs.input,
      completion: (tokens.completion / 1000000) * costs.output,
      total:
        (tokens.prompt / 1000000) * costs.input +
        (tokens.completion / 1000000) * costs.output,
    };
  }

  getCosts() {
    // Override in subclasses with actual costs
    return {
      input: 0,
      output: 0,
    };
  }

  getContextLimit() {
    // Override in subclasses
    return 128000;
  }

  handleError(error) {
    this.logger.error("Provider error", {
      provider: this.name,
      error: error.message,
      stack: error.stack,
    });

    // Standardize error response
    if (error.response?.status === 401) {
      throw new Error("Invalid API key");
    } else if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded");
    } else if (error.response?.status === 400) {
      throw new Error(
        "Bad request: " + (error.response?.data?.error || error.message),
      );
    } else {
      throw new Error(`${this.name} error: ${error.message}`);
    }
  }

  // Retry logic for transient failures
  async withRetry(fn, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on auth errors
        if (error.message.includes("Invalid API key")) {
          throw error;
        }

        // Exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          this.logger.warn(`Retrying after ${delay}ms`, {
            provider: this.name,
            attempt: i + 1,
            error: error.message,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Token counting (approximate if provider doesn't give exact counts)
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

module.exports = BaseProvider;
