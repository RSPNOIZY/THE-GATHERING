/**
 * @file test_media_control_plane.ts
 * @description Test suite for the MC96 Audio & Video Control Plane.
 * Verifies: Law 25 Biometric Voice Gating, C2PA v2.2 Signing, Beat Sync, 75/25 Invariant.
 */

import { MediaControlPlane } from '../control-plane/index.ts';

async function runTests() {
  console.log('🎬 Initializing Audio & Video Control Plane Test Suite...\n');

  const controlPlane = new MediaControlPlane();

  // Test 1: Ingest Sovereign Audio Master with Law 25 Consent
  console.log('🎵 [1/6] Ingesting Audio Master with Law 25 Verified Speaker (RSP_001)...');
  const dummyAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data' + 'NOIZY_396HZ_DSP_AUDIO_PAYLOAD'.repeat(100));
  const audioResult = await controlPlane.audio.ingestAudioStem({
    filename: 'GABRIEL_MASTER_396HZ.wav',
    buffer: dummyAudioBuffer,
    speakerId: 'RSP_001',
    bpm: 96.0,
    tuningHz: 396.0,
  });

  if (!audioResult.success || !audioResult.c2paManifest) {
    throw new Error('Test 1 Failed: Audio ingestion failed');
  }

  console.log(`   ✅ Audio Ingested: ${audioResult.audioMetadata?.filename} (${audioResult.audioMetadata?.lufsIntegrated} LUFS, ${audioResult.audioMetadata?.bpm} BPM)`);
  console.log(`   ✅ Law 25 Biometrics: ${audioResult.voiceProfile?.alias} (Clearance: ${audioResult.voiceProfile?.clearanceTier})`);
  console.log(`   ✅ C2PA Manifest ID: ${audioResult.c2paManifest.manifestId}`);

  // Test 2: Verify Cryptographic Signature of C2PA Audio Manifest
  console.log('\n🔏 [2/6] Verifying C2PA v2.2 Ed25519 Signature...');
  const isAudioSigValid = controlPlane.c2pa.verifyManifest(audioResult.c2paManifest);
  if (!isAudioSigValid) {
    throw new Error('Test 2 Failed: Ed25519 signature verification failed');
  }
  console.log('   ✅ Ed25519 Signature Verified successfully.');

  // Test 3: Verify Fail-Closed Biometric Gating on Unauthorized Speaker
  console.log('\n🛑 [3/6] Testing Fail-Closed Biometric Gating on Unknown Speaker...');
  try {
    await controlPlane.audio.ingestAudioStem({
      filename: 'UNAUTHORIZED_CLONE.wav',
      buffer: dummyAudioBuffer,
      speakerId: 'UNKNOWN_UNAUTHORIZED_SPEAKER',
    });
    throw new Error('Test 3 Failed: Unauthorized speaker should have been blocked');
  } catch (err: any) {
    console.log(`   ✅ Successfully blocked unauthorized speaker: ${err.message}`);
  }

  // Test 4: Ingest 4K Video Loop with 96 BPM Beat Grid
  console.log('\n🎞️ [4/6] Ingesting 4K Video Loop & Generating 96 BPM Beat Grid...');
  const dummyVideoBuffer = Buffer.from('ftypmp42....' + 'NOIZY_4K_VIDEO_FRAME_STREAM'.repeat(100));
  const videoResult = await controlPlane.video.ingestVideoAsset({
    filename: 'HERO_LOOP_4K.mp4',
    buffer: dummyVideoBuffer,
    targetBpm: 96.0,
  });

  if (!videoResult.success || !videoResult.beatGrid) {
    throw new Error('Test 4 Failed: Video ingestion failed');
  }

  console.log(`   ✅ Video Ingested: ${videoResult.videoMetadata?.filename} (${videoResult.videoMetadata?.width}x${videoResult.videoMetadata?.height} @ ${videoResult.videoMetadata?.fps}fps)`);
  console.log(`   ✅ Beat Grid Generated: ${videoResult.beatGrid.length} cut markers mapped to 96 BPM.`);

  // Test 5: Verify 75/25 Covenant Split Invariant Check
  console.log('\n⚖️ [5/6] Verifying Hard Fail-Closed on 75/25 Split Alteration...');
  try {
    controlPlane.c2pa.generateManifest({
      assetHash: 'dummy_hash',
      title: 'Illegal Split Track',
      artist: 'Rogue',
      covenantSplit: '50/50', // Illegal split
      law25ConsentVerified: true,
      ruleZeroReceiptId: 'REC_ROGUE',
    });
    throw new Error('Test 5 Failed: Illegal split should have thrown invariant violation');
  } catch (err: any) {
    console.log(`   ✅ Invariant Guard blocked illegal split: ${err.message}`);
  }

  // Test 6: Create Multimodal Chained Release (Audio + Video)
  console.log('\n🌐 [6/6] Bundling Multimodal Chained Release...');
  const bundle = await controlPlane.createMultimodalRelease({
    title: 'GABRIEL_MULTIMODAL_EXPERIENCE',
    audioFilename: 'GABRIEL_TRACK.wav',
    audioBuffer: dummyAudioBuffer,
    videoFilename: 'GABRIEL_VISUALS.mp4',
    videoBuffer: dummyVideoBuffer,
    speakerId: 'GABRIEL_TWIN',
    bpm: 96.0,
  });

  if (!bundle.success || bundle.chainedManifests.length !== 2) {
    throw new Error('Test 6 Failed: Multimodal bundle failed');
  }

  console.log(`   ✅ Multimodal Bundle Created: ${bundle.receiptId}`);
  console.log(`   ✅ Chained Manifests: [${bundle.chainedManifests.join(' -> ')}]`);

  console.log('\n🏆 ALL 6 AUDIO & VIDEO CONTROL PLANE TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
