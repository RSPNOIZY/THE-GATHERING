import { ConsentRecord, VoiceIdentity } from "../types";

export class ConsentEnforcementEngine {
  constructor(private db: D1Database) {}

  /**
   * Check if a voice clone operation is authorized
   */
  async checkVoiceCloneConsent(params: {
    creatorId: string;
    requesterId: string;
    voiceIdentityId: string;
  }): Promise<{
    authorized: boolean;
    consentRecordId?: string;
    reason?: string;
  }> {
    // First verify the voice identity belongs to the creator
    const voiceIdentity = await this.db
      .prepare("SELECT * FROM voice_identities WHERE id = ? AND creator_id = ?")
      .bind(params.voiceIdentityId, params.creatorId)
      .first<VoiceIdentity>();

    if (!voiceIdentity) {
      return {
        authorized: false,
        reason: "Voice identity not found or does not belong to creator",
      };
    }

    // Check for valid consent record
    const consent = await this.db
      .prepare(
        `
        SELECT * FROM consent_records 
        WHERE creator_id = ? 
        AND consented_entity_id = ? 
        AND consent_type = 'voice_clone'
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `,
      )
      .bind(params.creatorId, params.requesterId)
      .first<ConsentRecord>();

    if (!consent) {
      return {
        authorized: false,
        reason: "No valid consent record found",
      };
    }

    return {
      authorized: true,
      consentRecordId: consent.id,
    };
  }

  /**
   * Grant consent for voice usage
   */
  async grantConsent(params: {
    creatorId: string;
    consentedEntityId: string;
    consentType: "voice_clone" | "sample_use" | "derivative_work";
    expiresAt?: string;
    termsVersion: string;
  }): Promise<ConsentRecord> {
    const id = crypto.randomUUID();
    const consentHash = await this.generateConsentHash(params);

    const consent: ConsentRecord = {
      id,
      creator_id: params.creatorId,
      consented_entity_id: params.consentedEntityId,
      consent_type: params.consentType,
      granted_at: new Date().toISOString(),
      expires_at: params.expiresAt,
      consent_hash: consentHash,
      terms_version: params.termsVersion,
    };

    await this.db
      .prepare(
        `
        INSERT INTO consent_records 
        (id, creator_id, consented_entity_id, consent_type, granted_at, expires_at, consent_hash, terms_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(
        consent.id,
        consent.creator_id,
        consent.consented_entity_id,
        consent.consent_type,
        consent.granted_at,
        consent.expires_at || null,
        consent.consent_hash,
        consent.terms_version,
      )
      .run();

    // Log to audit
    await this.logConsentEvent("consent_granted", params.creatorId, consent.id);

    return consent;
  }

  /**
   * Revoke previously granted consent
   */
  async revokeConsent(params: {
    consentRecordId: string;
    creatorId: string;
  }): Promise<boolean> {
    // Verify ownership
    const consent = await this.db
      .prepare("SELECT * FROM consent_records WHERE id = ? AND creator_id = ?")
      .bind(params.consentRecordId, params.creatorId)
      .first<ConsentRecord>();

    if (!consent || consent.revoked_at) {
      return false;
    }

    await this.db
      .prepare(
        'UPDATE consent_records SET revoked_at = datetime("now") WHERE id = ?',
      )
      .bind(params.consentRecordId)
      .run();

    // Log to audit
    await this.logConsentEvent(
      "consent_revoked",
      params.creatorId,
      params.consentRecordId,
    );

    return true;
  }

  /**
   * Register a voice identity for consent management
   */
  async registerVoiceIdentity(params: {
    creatorId: string;
    voiceFingerprint: string;
    verificationMethod: "biometric" | "manual" | "ai_verified";
    metadata?: any;
  }): Promise<VoiceIdentity> {
    const id = crypto.randomUUID();

    const voiceIdentity: VoiceIdentity = {
      id,
      creator_id: params.creatorId,
      voice_fingerprint: params.voiceFingerprint,
      verification_method: params.verificationMethod,
      verified_at: new Date().toISOString(),
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    };

    await this.db
      .prepare(
        `
        INSERT INTO voice_identities 
        (id, creator_id, voice_fingerprint, verification_method, verified_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(
        voiceIdentity.id,
        voiceIdentity.creator_id,
        voiceIdentity.voice_fingerprint,
        voiceIdentity.verification_method,
        voiceIdentity.verified_at,
        voiceIdentity.metadata || null,
      )
      .run();

    return voiceIdentity;
  }

  /**
   * Check consent for sample usage
   */
  async checkSampleUseConsent(params: {
    audioFingerprintId: string;
    requesterId: string;
  }): Promise<{
    authorized: boolean;
    consentRecordId?: string;
    reason?: string;
  }> {
    // Get the creator from the audio fingerprint's provenance
    const fingerprint = await this.db
      .prepare(
        `
        SELECT af.*, vi.creator_id 
        FROM audio_fingerprints af
        LEFT JOIN voice_identities vi ON af.id = vi.id
        WHERE af.id = ?
      `,
      )
      .bind(params.audioFingerprintId)
      .first<any>();

    if (!fingerprint || !fingerprint.creator_id) {
      return {
        authorized: false,
        reason: "Audio fingerprint not found or creator unknown",
      };
    }

    // Check consent
    const consent = await this.db
      .prepare(
        `
        SELECT * FROM consent_records 
        WHERE creator_id = ? 
        AND consented_entity_id = ? 
        AND consent_type IN ('sample_use', 'derivative_work')
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      `,
      )
      .bind(fingerprint.creator_id, params.requesterId)
      .first<ConsentRecord>();

    if (!consent) {
      return {
        authorized: false,
        reason: "No valid consent for sample usage",
      };
    }

    return {
      authorized: true,
      consentRecordId: consent.id,
    };
  }

  /**
   * Get all active consents for a creator
   */
  async getActiveConsents(creatorId: string): Promise<ConsentRecord[]> {
    const consents = await this.db
      .prepare(
        `
        SELECT * FROM consent_records 
        WHERE creator_id = ? 
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY granted_at DESC
      `,
      )
      .bind(creatorId)
      .all<ConsentRecord>();

    return consents.results;
  }

  private async generateConsentHash(params: any): Promise<string> {
    const data = JSON.stringify({
      ...params,
      timestamp: new Date().toISOString(),
    });
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private async logConsentEvent(
    eventType: string,
    actorId: string,
    consentRecordId: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT INTO audit_log 
        (id, event_type, actor_id, resource_type, resource_id, action, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      )
      .bind(
        crypto.randomUUID(),
        eventType,
        actorId,
        "consent_record",
        consentRecordId,
        eventType,
      )
      .run();
  }
}
