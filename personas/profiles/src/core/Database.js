const { Pool } = require("pg");
const winston = require("winston");
const path = require("path");
const fs = require("fs");

const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
fs.mkdirSync(LOGS_DIR, { recursive: true });

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://dreamchamber:dreamchamber123@localhost:5432/dreamchamber",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.label({ label: "Database" }),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(LOGS_DIR, "database.log"),
        }),
      ],
    });

    // Test connection on startup
    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query("SELECT NOW()");
      this.logger.info("Database connected", { timestamp: result.rows[0].now });
      client.release();
    } catch (error) {
      this.logger.error("Database connection failed", { error: error.message });
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug("Query executed", {
        text: text.substring(0, 100),
        duration,
        rows: result.rowCount,
      });
      return result;
    } catch (error) {
      this.logger.error("Query error", {
        text: text.substring(0, 100),
        error: error.message,
      });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Conversation methods
  async createConversation(userId, title = "") {
    const result = await this.query(
      `INSERT INTO conversations (user_id, title, active_model)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title, "claude-sonnet-4"], // Anthropic-first
    );
    return result.rows[0];
  }

  async getConversation(conversationId, userId) {
    const result = await this.query(
      `SELECT c.*, 
              COUNT(m.id) as message_count,
              MAX(m.created_at) as last_message_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.id = $1 AND c.user_id = $2 AND c.state = 'active'
       GROUP BY c.id`,
      [conversationId, userId],
    );
    return result.rows[0];
  }

  async getUserConversations(userId, limit = 50, offset = 0) {
    const result = await this.query(
      `SELECT c.*, 
              COUNT(m.id) as message_count,
              MAX(m.created_at) as last_message_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = $1 AND c.state = 'active'
       GROUP BY c.id
       ORDER BY c.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async addMessage(conversationId, message) {
    const result = await this.query(
      `INSERT INTO messages (
        conversation_id, role, content, model,
        prompt_tokens, completion_tokens, total_tokens,
        prompt_cost, completion_cost, total_cost,
        latency_ms, provider, model_version, temperature, max_tokens,
        citations, search_queries
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        conversationId,
        message.role,
        message.content,
        message.model,
        message.metadata?.tokens?.prompt || null,
        message.metadata?.tokens?.completion || null,
        message.metadata?.tokens?.total || null,
        message.metadata?.cost?.prompt || null,
        message.metadata?.cost?.completion || null,
        message.metadata?.cost?.total || null,
        message.metadata?.latency || null,
        message.metadata?.provider || null,
        message.metadata?.modelVersion || null,
        message.metadata?.temperature || null,
        message.metadata?.maxTokens || null,
        message.metadata?.citations
          ? JSON.stringify(message.metadata.citations)
          : null,
        message.metadata?.searchQueries
          ? JSON.stringify(message.metadata.searchQueries)
          : null,
      ],
    );

    // Update conversation stats
    if (message.metadata?.cost?.total || message.metadata?.tokens?.total) {
      await this.query(
        `UPDATE conversations 
         SET total_tokens = total_tokens + COALESCE($2, 0),
             total_cost = total_cost + COALESCE($3, 0),
             message_count = message_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          conversationId,
          message.metadata?.tokens?.total || 0,
          message.metadata?.cost?.total || 0,
        ],
      );
    }

    return result.rows[0];
  }

  async getMessages(conversationId, limit = 100) {
    const result = await this.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, limit],
    );
    return result.rows;
  }

  // Model stats
  async updateModelStats(userId, model, stats) {
    await this.query(
      `INSERT INTO model_stats (user_id, model, date, request_count, total_tokens, total_cost, average_latency_ms, error_count)
       VALUES ($1, $2, CURRENT_DATE, 1, $3, $4, $5, $6)
       ON CONFLICT (user_id, model, date) 
       DO UPDATE SET 
         request_count = model_stats.request_count + 1,
         total_tokens = model_stats.total_tokens + COALESCE($3, 0),
         total_cost = model_stats.total_cost + COALESCE($4, 0),
         average_latency_ms = ((model_stats.average_latency_ms * model_stats.request_count) + COALESCE($5, 0)) / (model_stats.request_count + 1),
         error_count = model_stats.error_count + COALESCE($6, 0)`,
      [
        userId,
        model,
        stats.tokens || 0,
        stats.cost || 0,
        stats.latency || 0,
        stats.error ? 1 : 0,
      ],
    );
  }

  async getUserStats(userId, days = 30) {
    const result = await this.query(
      `SELECT model, 
              SUM(request_count) as total_requests,
              SUM(total_tokens) as total_tokens,
              SUM(total_cost) as total_cost,
              AVG(average_latency_ms) as avg_latency
       FROM model_stats
       WHERE user_id = $1 
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY model
       ORDER BY total_requests DESC`,
      [userId],
    );
    return result.rows;
  }

  // Cleanup
  async cleanup() {
    await this.pool.end();
    this.logger.info("Database pool closed");
  }
}

// Singleton instance
let instance;

function getDatabase() {
  if (!instance) {
    instance = new Database();
  }
  return instance;
}

module.exports = { Database, getDatabase };
