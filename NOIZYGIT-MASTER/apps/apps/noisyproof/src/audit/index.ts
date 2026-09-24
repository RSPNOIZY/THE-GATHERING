import { AuditLogEntry } from "../types";

export class ImmutableAuditLedger {
  private lastBlockHash: string | null = null;
  private writeQueue: Promise<any> = Promise.resolve();

  constructor(private db: D1Database) {}

  /**
   * Initialize the audit ledger
   */
  async initialize(): Promise<void> {
    // Get the last block hash
    const lastEntry = await this.db
      .prepare(
        "SELECT block_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1",
      )
      .first<{ block_hash: string }>();

    this.lastBlockHash = lastEntry?.block_hash || null;
  }

  /**
   * Log an event to the immutable ledger
   */
  async logEvent(params: {
    eventType: string;
    actorId: string;
    resourceType: string;
    resourceId: string;
    action: string;
    metadata?: any;
  }): Promise<AuditLogEntry> {
    // Serialize writes to protect the hash chain from concurrent corruption
    const result = new Promise<AuditLogEntry>((resolve, reject) => {
      this.writeQueue = this.writeQueue.then(async () => {
        try {
          const id = crypto.randomUUID();
          const timestamp = new Date().toISOString();
          const metadataStr = params.metadata
            ? JSON.stringify(params.metadata)
            : null;

          // Build block data with snake_case keys matching DB columns
          // so that logEvent and verifyChainIntegrity hash identically
          const blockData = {
            id,
            event_type: params.eventType,
            actor_id: params.actorId,
            resource_type: params.resourceType,
            resource_id: params.resourceId,
            action: params.action,
            metadata: metadataStr,
            timestamp,
            previous_hash: this.lastBlockHash,
          };

          const blockHash = await this.generateBlockHash(blockData);

          const entry: AuditLogEntry = {
            id,
            event_type: params.eventType,
            actor_id: params.actorId,
            resource_type: params.resourceType,
            resource_id: params.resourceId,
            action: params.action,
            metadata: metadataStr || undefined,
            timestamp,
            block_hash: blockHash,
            previous_hash: this.lastBlockHash || undefined,
          };

          await this.db
            .prepare(
              `
              INSERT INTO audit_log 
              (id, event_type, actor_id, resource_type, resource_id, action, metadata, timestamp, block_hash, previous_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            )
            .bind(
              entry.id,
              entry.event_type,
              entry.actor_id,
              entry.resource_type,
              entry.resource_id,
              entry.action,
              entry.metadata || null,
              entry.timestamp,
              entry.block_hash,
              entry.previous_hash || null,
            )
            .run();

          // Update last block hash only after successful write
          this.lastBlockHash = blockHash;

          resolve(entry);
        } catch (err) {
          reject(err);
        }
      });
    });

    return result;
  }

  /**
   * Verify the integrity of the audit chain
   */
  async verifyChainIntegrity(
    startTime?: string,
    endTime?: string,
  ): Promise<{
    valid: boolean;
    brokenLinks: number[];
    totalEntries: number;
  }> {
    let query = "SELECT * FROM audit_log";
    const params: any[] = [];

    if (startTime && endTime) {
      query += " WHERE timestamp >= ? AND timestamp <= ?";
      params.push(startTime, endTime);
    } else if (startTime) {
      query += " WHERE timestamp >= ?";
      params.push(startTime);
    } else if (endTime) {
      query += " WHERE timestamp <= ?";
      params.push(endTime);
    }

    query += " ORDER BY timestamp ASC";

    const entries = await this.db
      .prepare(query)
      .bind(...params)
      .all<AuditLogEntry>();

    const brokenLinks: number[] = [];
    let previousHash: string | null = null;

    for (let i = 0; i < entries.results.length; i++) {
      const entry = entries.results[i];

      // Verify previous hash matches (normalize null/undefined)
      const entryPrev = entry.previous_hash || null;
      if (entryPrev !== previousHash) {
        brokenLinks.push(i);
      }

      // Verify block hash — must use identical structure as logEvent
      const expectedHash = await this.generateBlockHash({
        id: entry.id,
        event_type: entry.event_type,
        actor_id: entry.actor_id,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        action: entry.action,
        metadata: entry.metadata || null,
        timestamp: entry.timestamp,
        previous_hash: entry.previous_hash || null,
      });

      if (entry.block_hash !== expectedHash) {
        brokenLinks.push(i);
      }

      previousHash = entry.block_hash || null;
    }

    return {
      valid: brokenLinks.length === 0,
      brokenLinks: [...new Set(brokenLinks)], // Remove duplicates
      totalEntries: entries.results.length,
    };
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: {
    eventType?: string;
    actorId?: string;
    resourceType?: string;
    resourceId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let query = "SELECT * FROM audit_log WHERE 1=1";
    const params: any[] = [];

    if (filters.eventType) {
      query += " AND event_type = ?";
      params.push(filters.eventType);
    }

    if (filters.actorId) {
      query += " AND actor_id = ?";
      params.push(filters.actorId);
    }

    if (filters.resourceType) {
      query += " AND resource_type = ?";
      params.push(filters.resourceType);
    }

    if (filters.resourceId) {
      query += " AND resource_id = ?";
      params.push(filters.resourceId);
    }

    if (filters.startTime) {
      query += " AND timestamp >= ?";
      params.push(filters.startTime);
    }

    if (filters.endTime) {
      query += " AND timestamp <= ?";
      params.push(filters.endTime);
    }

    query += " ORDER BY timestamp DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    const results = await this.db
      .prepare(query)
      .bind(...params)
      .all<AuditLogEntry>();

    return results.results;
  }

  /**
   * Export audit logs for blockchain submission
   */
  async exportForBlockchain(
    startTime: string,
    endTime: string,
  ): Promise<{
    merkleRoot: string;
    entries: AuditLogEntry[];
    metadata: {
      startTime: string;
      endTime: string;
      count: number;
      chainValid: boolean;
    };
  }> {
    const entries = await this.queryLogs({ startTime, endTime });
    const verification = await this.verifyChainIntegrity(startTime, endTime);

    // Generate Merkle tree root
    const merkleRoot = await this.generateMerkleRoot(entries);

    return {
      merkleRoot,
      entries,
      metadata: {
        startTime,
        endTime,
        count: entries.length,
        chainValid: verification.valid,
      },
    };
  }

  /**
   * Log specific audio provenance events
   */
  async logProvenanceEvent(params: {
    action:
      | "fingerprint_created"
      | "consent_granted"
      | "watermark_embedded"
      | "c2pa_manifest_created";
    actorId: string;
    audioFingerprintId: string;
    metadata?: any;
  }): Promise<void> {
    await this.logEvent({
      eventType: "audio_provenance",
      actorId: params.actorId,
      resourceType: "audio_fingerprint",
      resourceId: params.audioFingerprintId,
      action: params.action,
      metadata: {
        ...params.metadata,
        provenance_action: params.action,
      },
    });
  }

  private async generateBlockHash(data: any): Promise<string> {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return await this.sha256(serialized);
  }

  private async generateMerkleRoot(entries: AuditLogEntry[]): Promise<string> {
    if (entries.length === 0) return "";

    // Create leaf nodes
    let hashes = await Promise.all(
      entries.map((entry) => this.sha256(JSON.stringify(entry))),
    );

    // Build tree
    while (hashes.length > 1) {
      const newLevel: string[] = [];

      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Duplicate last if odd number

        const combined = await this.sha256(left + right);

        newLevel.push(combined);
      }

      hashes = newLevel;
    }

    return hashes[0];
  }

  private async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Get audit statistics
   */
  async getStatistics(period?: { start: string; end: string }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    topActors: Array<{ actorId: string; count: number }>;
    chainIntegrity: boolean;
  }> {
    let whereClause = "";
    const params: any[] = [];

    if (period) {
      whereClause = "WHERE timestamp >= ? AND timestamp <= ?";
      params.push(period.start, period.end);
    }

    // Total events
    const totalResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM audit_log ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Events by type
    const typeResults = await this.db
      .prepare(
        `
        SELECT event_type, COUNT(*) as count 
        FROM audit_log ${whereClause}
        GROUP BY event_type
      `,
      )
      .bind(...params)
      .all<{ event_type: string; count: number }>();

    const eventsByType: Record<string, number> = {};
    for (const row of typeResults.results) {
      eventsByType[row.event_type] = row.count;
    }

    // Top actors
    const actorResults = await this.db
      .prepare(
        `
        SELECT actor_id, COUNT(*) as count 
        FROM audit_log ${whereClause}
        GROUP BY actor_id 
        ORDER BY count DESC 
        LIMIT 10
      `,
      )
      .bind(...params)
      .all<{ actor_id: string; count: number }>();

    // Chain integrity
    const integrity = await this.verifyChainIntegrity(
      period?.start,
      period?.end,
    );

    return {
      totalEvents: totalResult?.count || 0,
      eventsByType,
      topActors: actorResults.results.map((r) => ({
        actorId: r.actor_id,
        count: r.count,
      })),
      chainIntegrity: integrity.valid,
    };
  }
}
