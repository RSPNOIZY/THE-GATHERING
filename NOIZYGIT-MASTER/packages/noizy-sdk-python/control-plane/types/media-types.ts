/**
 * @file media-types.ts
 * @description Type definitions for the MC96 Audio & Video Control Plane.
 * Invariants: Rule Zero, The Plowman Standard (75/25), Law 25 Biometrics, C2PA v2.2.
 */

export interface AudioStemMetadata {
  stemId: string;
  filename: string;
  sampleRate: number; // e.g. 48000, 96000
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2 | 6 | 8; // Mono, Stereo, 5.1, 7.1.4
  durationSeconds: number;
  lufsIntegrated: number; // e.g. -14.0 LUFS
  peakDb: number;
  bpm: number; // e.g. 96.0
  musicalKey?: string; // e.g. 'A Minor'
  tuningFrequencyHz: number; // e.g. 396.0 or 440.0
  sha256: string;
}

export interface Law25VoiceProfile {
  speakerId: string;
  alias: string;
  voiceHash150d: string; // 150-dimensional non-reversible hash
  caiFilingRef: string; // Commission d'accès à l'information filing ref
  consentExpiresAt: string;
  isRevoked: boolean;
  clearanceTier: 'T0_PUBLIC' | 'T1_SANDBOX' | 'T2_COLLAB' | 'T3_FAMILY' | 'T4_SOVEREIGN';
}

export interface VideoAssetMetadata {
  videoId: string;
  filename: string;
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'hevc' | 'prores' | 'av1' | 'vp9';
  durationSeconds: number;
  bitrateKbps: number;
  colorSpace: 'bt709' | 'bt2020' | 'dci_p3';
  sha256: string;
}

export interface BeatMarker {
  beatIndex: number;
  timestampSeconds: number;
  isDownbeat: boolean;
  intensity: number; // 0.0 to 1.0
}

export interface C2paMediaManifest {
  manifestId: string;
  assetHash: string;
  jumbfDataUri: string;
  merkleRoot: string;
  signerPublicKey: string;
  signatureEd25519: string;
  covenantSplit: '75/25';
  signedAt: string;
  parentAssetIds?: string[];
  assertions: {
    title: string;
    artist: string;
    law25ConsentVerified: boolean;
    ruleZeroReceiptId: string;
  };
}

export interface MediaProcessResult {
  success: boolean;
  receiptId: string;
  idempotencyKey: string;
  assetType: 'audio_stem' | 'audio_master' | 'video_cut' | 'multimodal_bundle';
  audioMetadata?: AudioStemMetadata;
  videoMetadata?: VideoAssetMetadata;
  voiceProfile?: Law25VoiceProfile;
  c2paManifest?: C2paMediaManifest;
  errors?: string[];
}
