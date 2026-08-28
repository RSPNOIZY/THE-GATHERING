const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");
const NodeCache = require("node-cache");

class StateManager extends EventEmitter {
  constructor() {
    super();

    // In-memory stores
    this.conversations = new Map();
    this.activeConnections = new Map();
    this.modelStats = new Map();

    // Cache for temporary data (TTL: 1 hour)
    this.cache = new NodeCache({ stdTTL: 3600 });

    // Initialize model stats
    this.initializeModelStats();

    // Schedule periodic cleanup every 30 minutes
    this._cleanupInterval = setInterval(
      () => this.cleanupInactive(),
      30 * 60 * 1000,
    );
  }

  initializeModelStats() {
    const models = [
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
    ];

    models.forEach((model) => {
      this.modelStats.set(model, {
        requestCount: 0,
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        errors: 0,
        lastUsed: null,
      });
    });
  }

  // Conversation Management
  createConversation(userId) {
    const conversation = {
      id: uuidv4(),
      userId,
      title: "",
      messages: [],
      activeModel: "claude-sonnet-4",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        tags: [],
        isComparison: false,
        comparisonModels: [],
      },
      state: "active",
    };

    this.conversations.set(conversation.id, conversation);
    this.emit("conversation:created", conversation);

    return conversation;
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  updateConversation(conversationId, updates) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updated = {
      ...conversation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(conversationId, updated);
    this.emit("conversation:updated", updated);

    return updated;
  }

  addMessage(conversationId, message) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messageWithId = {
      id: uuidv4(),
      conversationId,
      timestamp: new Date().toISOString(),
      ...message,
    };

    conversation.messages.push(messageWithId);
    conversation.metadata.messageCount++;

    // Update metadata if available
    if (message.metadata) {
      if (message.metadata.tokens?.total) {
        conversation.metadata.totalTokens += message.metadata.tokens.total;
      }
      if (message.metadata.cost?.total) {
        conversation.metadata.totalCost += message.metadata.cost.total;
      }
    }

    conversation.updatedAt = new Date().toISOString();

    this.conversations.set(conversationId, conversation);
    this.emit("message:added", { conversationId, message: messageWithId });

    // Update model stats
    this.updateModelStats(message.model, message.metadata);

    return messageWithId;
  }

  // Connection Management
  addConnection(clientId, connectionInfo) {
    this.activeConnections.set(clientId, {
      ...connectionInfo,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    });

    this.emit("connection:added", clientId);
  }

  removeConnection(clientId) {
    this.activeConnections.delete(clientId);
    this.emit("connection:removed", clientId);
  }

  updateConnectionActivity(clientId) {
    const connection = this.activeConnections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date().toISOString();
      this.activeConnections.set(clientId, connection);
    }
  }

  // Model Statistics
  updateModelStats(model, metadata) {
    const stats = this.modelStats.get(model);
    if (!stats) return;

    stats.requestCount++;
    stats.lastUsed = new Date().toISOString();

    if (metadata) {
      if (metadata.tokens?.total) {
        stats.totalTokens += metadata.tokens.total;
      }
      if (metadata.cost?.total) {
        stats.totalCost += metadata.cost.total;
      }
      if (metadata.latency) {
        // Calculate running average
        const prevTotal = stats.averageLatency * (stats.requestCount - 1);
        stats.averageLatency =
          (prevTotal + metadata.latency) / stats.requestCount;
      }
    }

    this.modelStats.set(model, stats);
    this.emit("stats:updated", { model, stats });
  }

  incrementModelError(model) {
    const stats = this.modelStats.get(model);
    if (stats) {
      stats.errors++;
      this.modelStats.set(model, stats);
    }
  }

  // Getters
  getAllConversations(userId) {
    const conversations = [];
    for (const [id, conversation] of this.conversations) {
      if (conversation.userId === userId && conversation.state === "active") {
        conversations.push(conversation);
      }
    }
    return conversations.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  }

  getStats() {
    const stats = {
      conversations: {
        total: this.conversations.size,
        active: Array.from(this.conversations.values()).filter(
          (c) => c.state === "active",
        ).length,
      },
      connections: {
        active: this.activeConnections.size,
      },
      models: {},
    };

    for (const [model, modelStats] of this.modelStats) {
      stats.models[model] = { ...modelStats };
    }

    return stats;
  }

  // Cache operations
  setCached(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  getCached(key) {
    return this.cache.get(key);
  }

  deleteCached(key) {
    return this.cache.del(key);
  }

  // Cleanup
  cleanupInactive() {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old conversations
    for (const [id, conversation] of this.conversations) {
      const lastUpdate = new Date(conversation.updatedAt).getTime();
      if (now - lastUpdate > INACTIVE_THRESHOLD) {
        conversation.state = "archived";
        this.conversations.set(id, conversation);
      }
    }

    // Clean up inactive connections
    for (const [clientId, connection] of this.activeConnections) {
      const lastActivity = new Date(connection.lastActivity).getTime();
      if (now - lastActivity > 30 * 60 * 1000) {
        // 30 minutes
        this.removeConnection(clientId);
      }
    }
  }
}

module.exports = StateManager;
