/**
 * @file index.ts
 * @description Master Audio & Video Control Plane Entrypoint for MC96 / NOIZYWORLD.
 * Unifies AudioControlPlane, VideoControlPlane, C2paEngine, and Biometric Consent.
 */

export * from './types/media-types.ts';
export * from './provenance/c2pa-engine.ts';
export * from './audio/audio-control-plane.ts';
export * from './video/video-control-plane.ts';

import { AudioControlPlane } from './audio/audio-control-plane.ts';
import { VideoControlPlane } from './video/video-control-plane.ts';
import { C2paEngine } from './provenance/c2pa-engine.ts';
import type { MediaProcessResult } from './types/media-types.ts';

export class MediaControlPlane {
  public readonly audio: AudioControlPlane;
  public readonly video: VideoControlPlane;
  public readonly c2pa: C2paEngine;

  constructor() {
    this.c2pa = new C2paEngine();
    this.audio = new AudioControlPlane(this.c2pa);
    this.video = new VideoControlPlane(this.c2pa);
  }

  /**
   * Bundles an audio master and a video loop into a verified, chained multimodal release.
   */
  public async createMultimodalRelease(params: {
    title: string;
    audioFilename: string;
    audioBuffer: Buffer;
    videoFilename: string;
    videoBuffer: Buffer;
    speakerId?: string;
    bpm?: number;
  }): Promise<MediaProcessResult & { chainedManifests: string[] }> {
    // 1. Process Audio
    const audioResult = await this.audio.ingestAudioStem({
      filename: params.audioFilename,
      buffer: params.audioBuffer,
      speakerId: params.speakerId,
      bpm: params.bpm || 96.0,
    });

    if (!audioResult.success || !audioResult.c2paManifest) {
      throw new Error(`Failed to ingest audio master: ${audioResult.errors?.join(', ')}`);
    }

    // 2. Process Video chained to Audio Manifest
    const videoResult = await this.video.ingestVideoAsset({
      filename: params.videoFilename,
      buffer: params.videoBuffer,
      audioManifestId: audioResult.c2paManifest.manifestId,
      targetBpm: params.bpm || 96.0,
      artist: audioResult.c2paManifest.assertions.artist,
    });

    return {
      success: true,
      receiptId: `REC_BUNDLE_${Date.now()}`,
      idempotencyKey: `BUNDLE_${Date.now()}`,
      assetType: 'multimodal_bundle',
      audioMetadata: audioResult.audioMetadata,
      videoMetadata: videoResult.videoMetadata,
      voiceProfile: audioResult.voiceProfile,
      c2paManifest: videoResult.c2paManifest,
      chainedManifests: [audioResult.c2paManifest.manifestId, videoResult.c2paManifest!.manifestId],
    };
  }
}
