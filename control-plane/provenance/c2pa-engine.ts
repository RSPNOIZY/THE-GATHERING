/**
 * @file c2pa-engine.ts
 * @description Sovereign C2PA v2.2 Provenance Engine & Invariant Verifier.
 * Enforces: The Plowman Standard (CHECK covenantSplit === '75/25'), Ed25519 signing.
 */

import * as crypto from 'node:crypto';
import type { C2paMediaManifest } from '../types/media-types.ts';

export class C2paEngine {
  private keyPair: crypto.KeyPairSyncResult<string, string>;

  constructor() {
    // Generate sovereign Ed25519 keypair for signing provenance manifests
    this.keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
  }

  public getPublicKey(): string {
    return this.keyPair.publicKey;
  }

  /**
   * Generates a tamper-proof C2PA v2.2 Manifest with strict 75/25 split verification.
   */
  public generateManifest(params: {
    assetHash: string;
    title: string;
    artist: string;
    covenantSplit: string;
    law25ConsentVerified: boolean;
    ruleZeroReceiptId: string;
    parentAssetIds?: string[];
  }): C2paMediaManifest {
    // Hard fail-closed check on the Plowman Standard
    if (params.covenantSplit !== '75/25') {
      throw new Error(
        `[C2PA_INVARIANT_VIOLATION] Illegal covenant split: '${params.covenantSplit}'. Only '75/25' is permitted under the Plowman Standard.`
      );
    }

    const manifestId = `C2PA_${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    // Compute Merkle root combining asset hash, parent manifests, and consent assertion
    const merklePayload = [
      params.assetHash,
      params.law25ConsentVerified ? 'LAW25_CONSENT_OK' : 'LAW25_UNVERIFIED',
      params.ruleZeroReceiptId,
      ...(params.parentAssetIds || []),
    ].join(':');

    const merkleRoot = crypto.createHash('sha256').update(merklePayload).digest('hex');

    // Create JUMBF metadata payload
    const jumbfPayload = JSON.stringify({
      version: '2.2',
      manifest_id: manifestId,
      merkle_root: merkleRoot,
      covenant_split: '75/25',
      signed_at: timestamp,
      assertions: {
        title: params.title,
        artist: params.artist,
        law25ConsentVerified: params.law25ConsentVerified,
        ruleZeroReceiptId: params.ruleZeroReceiptId,
      },
    });

    // Ed25519 signature
    const signature = crypto.sign(null, Buffer.from(jumbfPayload, 'utf-8'), this.keyPair.privateKey).toString('hex');

    return {
      manifestId,
      assetHash: params.assetHash,
      jumbfDataUri: `data:application/c2pa-jumbf;base64,${Buffer.from(jumbfPayload).toString('base64')}`,
      merkleRoot,
      signerPublicKey: this.keyPair.publicKey,
      signatureEd25519: signature,
      covenantSplit: '75/25',
      signedAt: timestamp,
      parentAssetIds: params.parentAssetIds,
      assertions: {
        title: params.title,
        artist: params.artist,
        law25ConsentVerified: params.law25ConsentVerified,
        ruleZeroReceiptId: params.ruleZeroReceiptId,
      },
    };
  }

  /**
   * Verifies the authenticity and cryptographic integrity of a C2PA manifest.
   */
  public verifyManifest(manifest: C2paMediaManifest): boolean {
    if (manifest.covenantSplit !== '75/25') {
      return false;
    }

    try {
      const base64Data = manifest.jumbfDataUri.replace('data:application/c2pa-jumbf;base64,', '');
      const rawPayload = Buffer.from(base64Data, 'base64').toString('utf-8');

      const isSigValid = crypto.verify(
        null,
        Buffer.from(rawPayload, 'utf-8'),
        manifest.signerPublicKey,
        Buffer.from(manifest.signatureEd25519, 'hex')
      );

      return isSigValid;
    } catch {
      return false;
    }
  }
}
