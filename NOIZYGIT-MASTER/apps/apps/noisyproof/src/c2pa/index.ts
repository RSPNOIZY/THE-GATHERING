import { C2PAManifest, C2PAClaim, C2PAAssertion } from '../types';

export class C2PAExtension {
  private readonly version = '1.0.0';
  private readonly generator = '@noisy/proof';

  /**
   * Create a C2PA claim for an audio asset
   */
  createClaim(params: {
    title: string;
    creator: string;
    audioFingerprint: string;
    assertions: C2PAAssertion[];
  }): C2PAClaim {
    return {
      dc_title: params.title,
      dc_creator: params.creator,
      claim_generator: this.generator,
      claim_generator_info: {
        name: 'Noisy Proof Engine',
        version: this.version
      },
      assertions: [
        ...params.assertions,
        // Add audio-specific assertions
        {
          label: 'audio.fingerprint',
          data: {
            algorithm: 'chromaprint',
            value: params.audioFingerprint
          }
        },
        {
          label: 'stds.schema-org.CreativeWork',
          data: {
            '@context': 'https://schema.org/',
            '@type': 'AudioObject',
            'author': params.creator,
            'dateCreated': new Date().toISOString()
          }
        }
      ],
      signature_info: {
        alg: 'ES256',
        issuer: 'noisy.proof',
        time: new Date().toISOString()
      }
    };
  }

  /**
   * Add audio-specific assertions for voice/music provenance
   */
  createAudioAssertions(params: {
    voiceIdentityId?: string;
    consentRecordId?: string;
    watermarkId?: string;
    parentFingerprints?: string[];
  }): C2PAAssertion[] {
    const assertions: C2PAAssertion[] = [];

    if (params.voiceIdentityId) {
      assertions.push({
        label: 'noisy.voice.identity',
        data: {
          voice_identity_id: params.voiceIdentityId,
          verified: true
        }
      });
    }

    if (params.consentRecordId) {
      assertions.push({
        label: 'noisy.consent.record',
        data: {
          consent_record_id: params.consentRecordId,
          type: 'voice_clone',
          valid: true
        }
      });
    }

    if (params.watermarkId) {
      assertions.push({
        label: 'noisy.watermark.embedded',
        data: {
          watermark_id: params.watermarkId,
          type: 'psychoacoustic',
          removable: false
        }
      });
    }

    if (params.parentFingerprints && params.parentFingerprints.length > 0) {
      assertions.push({
        label: 'noisy.provenance.chain',
        data: {
          parent_fingerprints: params.parentFingerprints,
          relationship: 'derived'
        }
      });
    }

    return assertions;
  }

  /**
   * Generate a manifest for storage
   */
  async generateManifest(claim: C2PAClaim): Promise<{
    manifest_data: string;
    signature: string;
  }> {
    const manifestJson = JSON.stringify(claim, null, 2);
    
    // In production, this would use proper PKI signing
    // For now, we'll use a placeholder signature
    const signature = await this.signData(manifestJson);

    return {
      manifest_data: manifestJson,
      signature
    };
  }

  /**
   * Verify a C2PA manifest
   */
  async verifyManifest(manifest: C2PAManifest): Promise<{
    valid: boolean;
    claim?: C2PAClaim;
    errors?: string[];
  }> {
    try {
      const claim = JSON.parse(manifest.manifest_data) as C2PAClaim;
      
      // Verify signature
      const signatureValid = await this.verifySignature(
        manifest.manifest_data,
        manifest.signature
      );

      if (!signatureValid) {
        return {
          valid: false,
          errors: ['Invalid signature']
        };
      }

      // Validate claim structure
      const validationErrors = this.validateClaim(claim);
      if (validationErrors.length > 0) {
        return {
          valid: false,
          errors: validationErrors
        };
      }

      return {
        valid: true,
        claim
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Manifest parsing error: ${error}`]
      };
    }
  }

  /**
   * Extract audio provenance data from a C2PA claim
   */
  extractAudioProvenance(claim: C2PAClaim): {
    fingerprint?: string;
    voiceIdentity?: string;
    consentRecord?: string;
    watermark?: string;
    parents?: string[];
  } {
    const result: any = {};

    for (const assertion of claim.assertions) {
      switch (assertion.label) {
        case 'audio.fingerprint':
          result.fingerprint = assertion.data.value;
          break;
        case 'noisy.voice.identity':
          result.voiceIdentity = assertion.data.voice_identity_id;
          break;
        case 'noisy.consent.record':
          result.consentRecord = assertion.data.consent_record_id;
          break;
        case 'noisy.watermark.embedded':
          result.watermark = assertion.data.watermark_id;
          break;
        case 'noisy.provenance.chain':
          result.parents = assertion.data.parent_fingerprints;
          break;
      }
    }

    return result;
  }

  private validateClaim(claim: C2PAClaim): string[] {
    const errors: string[] = [];

    if (!claim.claim_generator) {
      errors.push('Missing claim_generator');
    }

    if (!claim.assertions || !Array.isArray(claim.assertions)) {
      errors.push('Invalid or missing assertions');
    }

    // Check for required audio fingerprint assertion
    const hasFingerprint = claim.assertions?.some(
      a => a.label === 'audio.fingerprint'
    );
    if (!hasFingerprint) {
      errors.push('Missing required audio.fingerprint assertion');
    }

    return errors;
  }

  private async signData(data: string): Promise<string> {
    // Placeholder for actual signing implementation
    // In production, use proper cryptographic signing
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  private async verifySignature(data: string, signature: string): Promise<boolean> {
    // Placeholder for actual verification
    // In production, use proper cryptographic verification
    const expectedSignature = await this.signData(data);
    return signature === expectedSignature;
  }
}
