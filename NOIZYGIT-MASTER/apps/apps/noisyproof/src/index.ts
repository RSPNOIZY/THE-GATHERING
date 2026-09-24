import { Hono, Context } from "hono";
import { C2PAExtension } from "./c2pa";
import { ConsentEnforcementEngine } from "./consent";
import { WatermarkInjector } from "./watermark";
import { ImmutableAuditLedger } from "./audit";
import { AudioFingerprint, ConsentRecord } from "./types";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

const app = new Hono();

/**
 * Main Noisy Proof Engine
 */
export class NoisyProofEngine {
  private c2pa: C2PAExtension;
  private consent: ConsentEnforcementEngine;
  private watermark: WatermarkInjector;
  private audit: ImmutableAuditLedger;

  constructor(env: Env) {
    this.c2pa = new C2PAExtension();
    this.consent = new ConsentEnforcementEngine(env.DB);
    this.watermark = new WatermarkInjector(env.DB);
    this.audit = new ImmutableAuditLedger(env.DB);
  }

  async initialize() {
    await this.audit.initialize();
  }

  /**
   * Register audio with full provenance
   */
  async registerAudio(params: {
    fileHash: string;
    fingerprint: string;
    creatorId: string;
    title: string;
    metadata?: {
      duration_ms?: number;
      sample_rate?: number;
      bit_depth?: number;
      channels?: number;
    };
  }): Promise<{
    fingerprintId: string;
    watermarkId: string;
    manifestId: string;
    consentId?: string;
  }> {
    // 1. Create audio fingerprint
    const fingerprintId = crypto.randomUUID();
    const fingerprint: AudioFingerprint = {
      id: fingerprintId,
      fingerprint: params.fingerprint,
      algorithm: "chromaprint",
      created_at: new Date().toISOString(),
      file_hash: params.fileHash,
      ...params.metadata,
    };

    // 2. Inject watermark
    const watermarkData = this.watermark.generateWatermarkData({
      creatorId: params.creatorId,
      timestamp: fingerprint.created_at,
      noisyOrigin: true,
    });

    const watermark = await this.watermark.injectWatermark({
      audioFingerprintId: fingerprintId,
      payload: watermarkData,
    });

    // 3. Create C2PA manifest
    const c2paClaim = this.c2pa.createClaim({
      title: params.title,
      creator: params.creatorId,
      audioFingerprint: params.fingerprint,
      assertions: this.c2pa.createAudioAssertions({
        watermarkId: watermark.id,
      }),
    });

    const manifest = await this.c2pa.generateManifest(c2paClaim);

    // 4. Log to audit
    await this.audit.logProvenanceEvent({
      action: "fingerprint_created",
      actorId: params.creatorId,
      audioFingerprintId: fingerprintId,
      metadata: {
        watermark_id: watermark.id,
        manifest_signature: manifest.signature,
      },
    });

    return {
      fingerprintId,
      watermarkId: watermark.id,
      manifestId: crypto.randomUUID(), // Would be stored in DB
    };
  }

  /**
   * Authorize voice clone with consent
   */
  async authorizeVoiceClone(params: {
    creatorId: string;
    requesterId: string;
    voiceIdentityId: string;
  }): Promise<{
    authorized: boolean;
    consentRecordId?: string;
    reason?: string;
  }> {
    const result = await this.consent.checkVoiceCloneConsent(params);

    if (result.authorized) {
      await this.audit.logProvenanceEvent({
        action: "consent_granted",
        actorId: params.creatorId,
        audioFingerprintId: params.voiceIdentityId,
        metadata: {
          requester_id: params.requesterId,
          consent_record_id: result.consentRecordId,
        },
      });
    }

    return result;
  }

  /**
   * Verify audio provenance chain
   */
  async verifyProvenance(audioFingerprintId: string): Promise<{
    valid: boolean;
    origin: "noisy" | "external" | "unknown";
    consent?: ConsentRecord;
    watermark?: any;
    c2pa?: any;
  }> {
    // Check watermark
    const hasNoisyWatermark =
      await this.watermark.hasNoisyOrigin(audioFingerprintId);

    // Get watermark data
    const watermark = await this.watermark.extractWatermark(audioFingerprintId);
    let watermarkData = null;
    if (watermark) {
      const verification = await this.watermark.verifyWatermark(watermark.id);
      watermarkData = verification.data;
    }

    // TODO: Get C2PA manifest from DB
    // TODO: Get consent records

    return {
      valid: hasNoisyWatermark,
      origin: hasNoisyWatermark ? "noisy" : "unknown",
      watermark: watermarkData,
    };
  }
}

// API Routes
app.post("/audio/register", async (c: any) => {
  const engine = new NoisyProofEngine(c.env);
  await engine.initialize();

  const body = await c.req.json();
  const result = await engine.registerAudio(body);

  return c.json(result);
});

app.post("/consent/grant", async (c: any) => {
  const consent = new ConsentEnforcementEngine(c.env.DB);
  const body = await c.req.json();

  const result = await consent.grantConsent(body);
  return c.json(result);
});

app.post("/consent/check", async (c: any) => {
  const engine = new NoisyProofEngine(c.env);
  const body = await c.req.json();

  const result = await engine.authorizeVoiceClone(body);
  return c.json(result);
});

app.get("/provenance/:fingerprintId", async (c: any) => {
  const engine = new NoisyProofEngine(c.env);
  const fingerprintId = c.req.param("fingerprintId");

  const result = await engine.verifyProvenance(fingerprintId);
  return c.json(result);
});

app.get("/audit/verify", async (c: any) => {
  const audit = new ImmutableAuditLedger(c.env.DB);
  await audit.initialize();

  const result = await audit.verifyChainIntegrity();
  return c.json(result);
});

app.get("/audit/stats", async (c: any) => {
  const audit = new ImmutableAuditLedger(c.env.DB);

  const stats = await audit.getStatistics();
  return c.json(stats);
});

export default app;
