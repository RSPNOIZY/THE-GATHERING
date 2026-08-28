const AnthropicProvider = require("./AnthropicProvider");
const OpenAIProvider = require("./OpenAIProvider");
const GoogleProvider = require("./GoogleProvider");
const TogetherProvider = require("./TogetherProvider");
const MistralProvider = require("./MistralProvider");
const CohereProvider = require("./CohereProvider");
const PerplexityProvider = require("./PerplexityProvider");

class ProviderFactory {
  static providers = new Map();

  static getProvider(providerName, apiKey) {
    if (!apiKey)
      throw new Error(`API key missing for provider: ${providerName}`);
    // Check cache first
    const cacheKey = `${providerName}:${apiKey.substring(0, 8)}`;
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    // Create new provider instance
    let provider;
    switch (providerName) {
      case "anthropic":
        provider = new AnthropicProvider(apiKey);
        break;
      case "openai":
        provider = new OpenAIProvider(apiKey);
        break;
      case "google":
        provider = new GoogleProvider(apiKey);
        break;
      case "together":
        provider = new TogetherProvider(apiKey);
        break;
      case "mistral":
        provider = new MistralProvider(apiKey);
        break;
      case "cohere":
        provider = new CohereProvider(apiKey);
        break;
      case "perplexity":
        provider = new PerplexityProvider(apiKey);
        break;
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    // Cache the provider
    this.providers.set(cacheKey, provider);
    return provider;
  }

  static getProviderForModel(model, apiKeys) {
    const modelProviderMap = {
      "claude-opus-4": { provider: "anthropic", key: apiKeys.anthropic },
      "claude-sonnet-4": { provider: "anthropic", key: apiKeys.anthropic },
      "gpt-4o": { provider: "openai", key: apiKeys.openai },
      "gpt-4-turbo": { provider: "openai", key: apiKeys.openai },
      "gemini-2.0-flash": { provider: "google", key: apiKeys.google },
      "gemini-pro": { provider: "google", key: apiKeys.google },
      "gemma-3-27b": { provider: "google", key: apiKeys.google },
      "llama-3.3-70b": { provider: "together", key: apiKeys.together },
      "mistral-large": { provider: "mistral", key: apiKeys.mistral },
      "command-r-plus": { provider: "cohere", key: apiKeys.cohere },
      "perplexity-online": { provider: "perplexity", key: apiKeys.perplexity },
    };

    const mapping = modelProviderMap[model];
    if (!mapping) {
      throw new Error(`Unknown model: ${model}`);
    }

    if (!mapping.key) {
      throw new Error(`API key not provided for ${mapping.provider}`);
    }

    return this.getProvider(mapping.provider, mapping.key);
  }

  static clearCache() {
    this.providers.clear();
  }
}

module.exports = ProviderFactory;
