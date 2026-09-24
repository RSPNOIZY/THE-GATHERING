class CostCalculator {
  // Model pricing per 1M tokens (input/output)
  static PRICING = {
    'claude-opus-4': { input: 15.00, output: 75.00 },
    'claude-sonnet-4': { input: 3.00, output: 15.00 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gemini-2.0-flash': { input: 0.075, output: 0.30 },
    'gemini-pro': { input: 0.125, output: 0.375 },
    'llama-3.3-70b': { input: 0.88, output: 0.88 },
    'mistral-large': { input: 2.00, output: 6.00 },
    'command-r-plus': { input: 3.00, output: 15.00 },
    'perplexity-online': { input: 0.00, output: 0.00 } // Free
  };

  static calculateCost(model, tokens) {
    const pricing = this.PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown model for pricing: ${model}`);
    }

    const inputCost = (tokens.prompt / 1000000) * pricing.input;
    const outputCost = (tokens.completion / 1000000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      input: Number(inputCost.toFixed(6)),
      output: Number(outputCost.toFixed(6)),
      total: Number(totalCost.toFixed(6))
    };
  }

  static estimateCost(model, estimatedTokens) {
    return this.calculateCost(model, {
      prompt: estimatedTokens.prompt || 0,
      completion: estimatedTokens.completion || 0
    });
  }

  static compareModelCosts(message, models, avgResponseTokens = 1000) {
    // Estimate input tokens based on message length
    const estimatedInputTokens = Math.ceil(message.length / 4);
    
    const comparisons = models.map(model => {
      const cost = this.calculateCost(model, {
        prompt: estimatedInputTokens,
        completion: avgResponseTokens
      });
      
      return {
        model,
        estimatedCost: cost.total,
        breakdown: cost
      };
    });
    
    // Sort by cost
    comparisons.sort((a, b) => a.estimatedCost - b.estimatedCost);
    
    return comparisons;
  }

  static getModelPricing(model) {
    return this.PRICING[model] || null;
  }

  static getCheapestModel() {
    let cheapest = null;
    let lowestCost = Infinity;
    
    for (const [model, pricing] of Object.entries(this.PRICING)) {
      const avgCost = (pricing.input + pricing.output) / 2;
      if (avgCost < lowestCost && avgCost > 0) { // Exclude free models
        lowestCost = avgCost;
        cheapest = model;
      }
    }
    
    return cheapest;
  }

  static getMostExpensiveModel() {
    let expensive = null;
    let highestCost = 0;
    
    for (const [model, pricing] of Object.entries(this.PRICING)) {
      const avgCost = (pricing.input + pricing.output) / 2;
      if (avgCost > highestCost) {
        highestCost = avgCost;
        expensive = model;
      }
    }
    
    return expensive;
  }

  static formatCost(cost) {
    if (cost < 0.01) {
      return `$${(cost * 100).toFixed(3)}¢`;
    } else if (cost < 1) {
      return `$${cost.toFixed(3)}`;
    } else {
      return `$${cost.toFixed(2)}`;
    }
  }

  static getSessionCost(messages) {
    let totalCost = 0;
    
    messages.forEach(message => {
      if (message.metadata?.cost?.total) {
        totalCost += message.metadata.cost.total;
      }
    });
    
    return totalCost;
  }
}

module.exports = CostCalculator;
