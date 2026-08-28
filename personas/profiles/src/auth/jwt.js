const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// JWT configuration
if (!process.env.JWT_SECRET) {
  console.warn(
    "[AUTH] WARNING: JWT_SECRET env var not set. Using ephemeral random secret — all sessions will be invalidated on restart. Set JWT_SECRET in .env for persistence.",
  );
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");
const JWT_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

// Separate encryption key for API key storage — must NOT change after keys are stored.
// Falls back to JWT_SECRET if not set, but ENCRYPTION_KEY is strongly preferred.
if (!process.env.ENCRYPTION_KEY && process.env.JWT_SECRET) {
  console.warn(
    "[AUTH] WARNING: ENCRYPTION_KEY not set — API key encryption is tied to JWT_SECRET. Set ENCRYPTION_KEY in .env to decouple key rotation from API key access.",
  );
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || JWT_SECRET;

class AuthService {
  constructor(db) {
    this.db = db;
  }

  // Generate JWT tokens
  generateTokens(userId) {
    const accessToken = jwt.sign(
      {
        userId,
        type: "access",
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
      {
        userId,
        type: "refresh",
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
    );

    return { accessToken, refreshToken };
  }

  // Verify token
  verifyToken(token, type = "access") {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== type) {
        throw new Error("Invalid token type");
      }
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Register new user
  async register(email, username, password, fullName) {
    // Check if user exists
    const existingUser = await this.db.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user with Anthropic as default
    const result = await this.db.query(
      `INSERT INTO users (email, username, password_hash, full_name, preferred_model, preferred_search_model)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, full_name, preferred_model`,
      [email, username, passwordHash, fullName, "claude-sonnet-4", "command-r-plus"],
    );

    const user = result.rows[0];
    const tokens = this.generateTokens(user.id);

    return { user, ...tokens };
  }

  // Login
  async login(emailOrUsername, password) {
    // Find user
    const result = await this.db.query(
      `SELECT id, email, username, password_hash, full_name, preferred_model
       FROM users
       WHERE (email = $1 OR username = $1) AND is_active = true`,
      [emailOrUsername],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await this.db.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [
      user.id,
    ]);

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    delete user.password_hash;
    return { user, ...tokens };
  }

  // Create session
  async createSession(userId, token, ipAddress = null, userAgent = null) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.query(
      `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, ipAddress, userAgent, expiresAt],
    );
  }

  // Validate session
  async validateSession(token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await this.db.query(
      `SELECT s.*, u.email, u.username, u.preferred_model, u.preferred_search_model
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1
       AND s.expires_at > CURRENT_TIMESTAMP
       AND u.is_active = true`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Update last activity
    await this.db.query("UPDATE sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1", [
      result.rows[0].id,
    ]);

    return result.rows[0];
  }

  // Logout
  async logout(token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await this.db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
  }

  // Encrypt API key for storage
  encryptApiKey(apiKey) {
    const algorithm = "aes-256-gcm";
    const salt = crypto.randomBytes(16); // unique per-key salt
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(apiKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
      authTag: cipher.getAuthTag().toString("hex"),
    };
  }

  // Decrypt API key
  decryptApiKey(encryptedData) {
    const algorithm = "aes-256-gcm";
    // Support legacy records (no salt field) for backwards compatibility
    const salt = encryptedData.salt ? Buffer.from(encryptedData.salt, "hex") : Buffer.from("salt");
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const iv = Buffer.from(encryptedData.iv, "hex");
    const authTag = Buffer.from(encryptedData.authTag, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  // Store user's API keys (encrypted)
  async storeApiKeys(userId, apiKeys) {
    const updates = [];
    const values = [userId];
    let paramCount = 1;

    for (const [provider, key] of Object.entries(apiKeys)) {
      if (key && key.trim()) {
        const encrypted = this.encryptApiKey(key);
        const encryptedJson = JSON.stringify(encrypted);
        updates.push(`${provider}_key_encrypted = $${++paramCount}`);
        values.push(encryptedJson);
      }
    }

    if (updates.length > 0) {
      await this.db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $1`, values);
    }
  }

  // Get user's decrypted API keys
  async getApiKeys(userId) {
    const result = await this.db.query(
      `SELECT anthropic_key_encrypted, openai_key_encrypted, google_key_encrypted,
              cohere_key_encrypted, together_key_encrypted, mistral_key_encrypted,
              perplexity_key_encrypted
       FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return {};
    }

    const encryptedKeys = result.rows[0];
    const decryptedKeys = {};

    for (const [field, encrypted] of Object.entries(encryptedKeys)) {
      if (encrypted) {
        const provider = field.replace("_key_encrypted", "");
        try {
          const encryptedData = JSON.parse(encrypted);
          decryptedKeys[provider] = this.decryptApiKey(encryptedData);
        } catch (error) {
          console.error(`Failed to decrypt ${provider} key:`, error);
        }
      }
    }

    return decryptedKeys;
  }
}

// Middleware for Express
function authMiddleware(authService) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      // Verify JWT
      const decoded = authService.verifyToken(token);

      // Validate session
      const session = await authService.validateSession(token);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: session.email,
        username: session.username,
        preferredModel: session.preferred_model,
        preferredSearchModel: session.preferred_search_model,
      };

      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

module.exports = { AuthService, authMiddleware, JWT_SECRET };
