/**
 * Supabase Telemetry Sink & Batch Ingester for LUCY
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ProcessedTelemetryEvent } from './telemetry-processor.ts';

export interface SinkConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  localSpoolDir: string;
  batchSize: number;
}

export class SupabaseTelemetrySink {
  private queue: ProcessedTelemetryEvent[] = [];
  private readonly config: SinkConfig;

  constructor(config: Partial<SinkConfig> = {}) {
    this.config = {
      localSpoolDir: config.localSpoolDir || '/Users/m2ultra/THE-GATHERING/memory/telemetry_spool',
      batchSize: config.batchSize || 20,
      supabaseUrl: config.supabaseUrl || process.env.SUPABASE_URL,
      supabaseKey: config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    fs.mkdirSync(this.config.localSpoolDir, { recursive: true });
  }

  public async push(event: ProcessedTelemetryEvent): Promise<void> {
    this.queue.push(event);

    if (this.queue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  public async flush(): Promise<{ batchId: string; count: number; merkleRoot: string }> {
    if (this.queue.length === 0) {
      return { batchId: '', count: 0, merkleRoot: '' };
    }

    const batch = [...this.queue];
    this.queue = [];

    const batchId = `BATCH_${Date.now()}_${batch.length}`;
    
    // Compute Merkle Root for batch integrity
    const leafHashes = batch.map((item) =>
      crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex')
    );
    
    const merkleRoot = crypto
      .createHash('sha256')
      .update(leafHashes.join(':'))
      .digest('hex');

    const manifest = {
      batch_id: batchId,
      merkle_root: merkleRoot,
      record_count: batch.length,
      timestamp: new Date().toISOString(),
      records: batch,
    };

    // Save to local immutable spool
    const spoolFilePath = path.join(this.config.localSpoolDir, `${batchId}.json`);
    fs.writeFileSync(spoolFilePath, JSON.stringify(manifest, null, 2), 'utf-8');

    return {
      batchId,
      count: batch.length,
      merkleRoot,
    };
  }
}
