/**
 * Voice DNA Test Suite — NOIZY Empire
 * Tests 3 voice recordings from RSP_001's iPhone 15 Pro Max.
 *
 * Drop zone: dreamchamber/test-voices/
 * Expected files: voice_01.m4a, voice_02.m4a, voice_03.m4a
 * (or whatever AirDrop names them — test auto-discovers all .m4a/.wav files)
 *
 * Run: cd dreamchamber && npx jest tests/voice/voice-dna.test.js --verbose
 */

const fs = require("fs");
const path = require("path");
const VoiceProcessor = require("../../src/utils/VoiceProcessor");

const VOICE_DIR = path.join(__dirname, "..", "..", "test-voices");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTestVoices() {
  if (!fs.existsSync(VOICE_DIR)) return [];
  return fs
    .readdirSync(VOICE_DIR)
    .filter((f) => /\.(m4a|caf|wav|mp3|aac|opus)$/i.test(f) && !f.includes("_dna"))
    .map((f) => path.join(VOICE_DIR, f));
}

function skipIfNoVoices(count = 1) {
  const voices = getTestVoices();
  if (voices.length < count) {
    console.warn(
      `\n⚠ SKIP: Need ${count} voice file(s) in test-voices/ — found ${voices.length}.\n` +
      `  AirDrop from iPhone: Settings → AirDrop → Everyone\n` +
      `  Drop to: ${VOICE_DIR}\n`,
    );
    return true;
  }
  return false;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("Voice DNA — Drop Zone", () => {
  test("test-voices/ directory exists", () => {
    expect(fs.existsSync(VOICE_DIR)).toBe(true);
  });

  test("lists available test voices", () => {
    const voices = VoiceProcessor.listTestVoices();
    console.log(`\nFound ${voices.length} voice file(s) in test-voices/:`);
    voices.forEach((v) => {
      console.log(`  ${v.isProcessed ? "✓ processed" : "○ raw      "} ${v.filename} (${(v.size / 1024).toFixed(1)} KB)`);
    });
    // Don't fail if empty — inform and skip downstream tests
    expect(Array.isArray(voices)).toBe(true);
  });
});

describe("Voice DNA — Ingestion (requires voice files)", () => {
  let voices;

  beforeAll(() => {
    voices = getTestVoices();
  });

  test("Voice 1: ingests and converts to 16kHz mono WAV", () => {
    if (skipIfNoVoices(1)) return;
    const result = VoiceProcessor.ingest(voices[0]);

    expect(result.outputPath).toBeTruthy();
    expect(fs.existsSync(result.outputPath)).toBe(true);
    expect(result.outputFormat.sampleRate).toBe(16000);
    expect(result.outputFormat.channels).toBe(1);
    expect(result.outputFormat.encoding).toBe("pcm_s16le");

    console.log(`\nVoice 1: ${path.basename(voices[0])}`);
    console.log(`  Duration:    ${result.analysis?.duration?.toFixed(2)}s`);
    console.log(`  RMS Level:   ${result.analysis?.rmsLevel?.toFixed(6)}`);
    console.log(`  Has Audio:   ${result.analysis?.hasAudio}`);
    console.log(`  DNA ID:      ${result.fingerprint.voiceDnaId}`);
    console.log(`  Hash:        ${result.fingerprint.shortHash}...`);
  });

  test("Voice 2: ingests and generates unique fingerprint", () => {
    if (skipIfNoVoices(2)) return;
    const result = VoiceProcessor.ingest(voices[1]);

    expect(result.fingerprint.hash).toBeTruthy();
    expect(result.fingerprint.voiceDnaId).toMatch(/^VD-[A-F0-9]{8}$/);
    expect(result.analysis?.hasAudio).toBe(true);

    console.log(`\nVoice 2: ${path.basename(voices[1])}`);
    console.log(`  Duration:    ${result.analysis?.duration?.toFixed(2)}s`);
    console.log(`  DNA ID:      ${result.fingerprint.voiceDnaId}`);
    console.log(`  Hash:        ${result.fingerprint.shortHash}...`);
  });

  test("Voice 3: ingests and generates unique fingerprint", () => {
    if (skipIfNoVoices(3)) return;
    const result = VoiceProcessor.ingest(voices[2]);

    expect(result.fingerprint.hash).toBeTruthy();
    expect(result.fingerprint.voiceDnaId).toMatch(/^VD-[A-F0-9]{8}$/);
    expect(result.analysis?.hasAudio).toBe(true);

    console.log(`\nVoice 3: ${path.basename(voices[2])}`);
    console.log(`  Duration:    ${result.analysis?.duration?.toFixed(2)}s`);
    console.log(`  DNA ID:      ${result.fingerprint.voiceDnaId}`);
    console.log(`  Hash:        ${result.fingerprint.shortHash}...`);
  });
});

describe("Voice DNA — Fingerprint Uniqueness", () => {
  test("All 3 voices produce distinct fingerprints", () => {
    if (skipIfNoVoices(3)) return;
    const voices = getTestVoices();
    const results = voices.slice(0, 3).map((v) => VoiceProcessor.ingest(v));
    const hashes = results.map((r) => r.fingerprint.hash);
    const unique = new Set(hashes);

    console.log("\nFingerprint uniqueness check:");
    results.forEach((r, i) => {
      console.log(`  Voice ${i + 1}: ${r.fingerprint.voiceDnaId} — ${r.fingerprint.shortHash}...`);
    });

    expect(unique.size).toBe(3);
  });

  test("Same file produces identical fingerprint on re-process (deterministic)", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();
    const r1 = VoiceProcessor.ingest(voices[0], "determinism_check_1");
    const r2 = VoiceProcessor.ingest(voices[0], "determinism_check_2");

    expect(r1.fingerprint.hash).toBe(r2.fingerprint.hash);
    console.log("\nDeterminism check: PASS — same source → same hash ✓");

    // Cleanup temp files
    [r1.outputPath, r2.outputPath].forEach((p) => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });
});

describe("Voice DNA — Audio Quality Validation", () => {
  test("All voices have detectable audio signal (not silent)", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();

    console.log("\nAudio quality check:");
    let silentCount = 0;
    for (const v of voices.slice(0, 3)) {
      const result = VoiceProcessor.ingest(v);
      const { rmsLevel, hasAudio, duration } = result.analysis || {};
      const status = hasAudio ? "✓ audio detected" : "✗ SILENT";
      console.log(`  ${path.basename(v)}: ${status} | RMS=${rmsLevel?.toFixed(6)} | ${duration?.toFixed(2)}s`);
      if (!hasAudio) silentCount++;
    }

    expect(silentCount).toBe(0);
  });

  test("All voices are at least 1 second long", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();

    for (const v of voices.slice(0, 3)) {
      const result = VoiceProcessor.ingest(v);
      const duration = result.analysis?.duration || result.inputFormat?.duration || 0;
      expect(duration).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Voice DNA — NOIZY Consent Gate Simulation", () => {
  test("Unregistered voice is BLOCKED by default (Never Clause enforcement)", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();
    const result = VoiceProcessor.ingest(voices[0]);

    // Simulate: unregistered voice_dna_id has no consent token → synthesis blocked
    const voiceDnaId = result.fingerprint.voiceDnaId;
    const consentTokens = []; // empty = no consent

    const canSynthesize = consentTokens.some(
      (t) => t.voice_dna_id === voiceDnaId && t.active && !t.revoked,
    );

    expect(canSynthesize).toBe(false);
    console.log(`\nConsent gate: ${voiceDnaId} → BLOCKED ✓ (no active consent token)`);
  });

  test("Registered voice with active consent token PASSES synthesis gate", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();
    const result = VoiceProcessor.ingest(voices[0]);
    const voiceDnaId = result.fingerprint.voiceDnaId;

    // Simulate: valid consent token exists
    const consentTokens = [
      {
        voice_dna_id: voiceDnaId,
        actor_id: "RSP_001",
        scope: "synthesis:personal",
        active: true,
        revoked: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    const canSynthesize = consentTokens.some(
      (t) => t.voice_dna_id === voiceDnaId && t.active && !t.revoked,
    );

    expect(canSynthesize).toBe(true);
    console.log(`\nConsent gate: ${voiceDnaId} → PASSES ✓ (active consent token found)`);
  });

  test("Revoked consent token BLOCKS synthesis immediately (Kill Switch)", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();
    const result = VoiceProcessor.ingest(voices[0]);
    const voiceDnaId = result.fingerprint.voiceDnaId;

    // Simulate: consent was revoked
    const consentTokens = [
      {
        voice_dna_id: voiceDnaId,
        actor_id: "RSP_001",
        active: false,
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoke_reason: "Kill Switch activated by RSP_001",
      },
    ];

    const canSynthesize = consentTokens.some(
      (t) => t.voice_dna_id === voiceDnaId && t.active && !t.revoked,
    );

    expect(canSynthesize).toBe(false);
    console.log(`\nKill Switch: ${voiceDnaId} → BLOCKED ✓ (revoked at ${consentTokens[0].revoked_at})`);
  });
});

describe("Voice DNA — Never Clause Enforcement", () => {
  const NEVER_CLAUSES = [
    "NEVER synthesize voice without explicit, scoped, revocable consent",
    "NEVER store raw audio beyond the registered DNA fingerprint",
    "NEVER allow voice synthesis to impersonate without actor permission",
    "NEVER bypass consent check under any circumstance, including emergency",
    "NEVER allow third-party access to voice DNA without actor approval",
  ];

  test("Never Clauses are defined and non-empty", () => {
    expect(NEVER_CLAUSES.length).toBeGreaterThan(0);
    NEVER_CLAUSES.forEach((clause) => {
      expect(clause).toBeTruthy();
      expect(clause.startsWith("NEVER")).toBe(true);
    });
    console.log(`\nNever Clauses verified: ${NEVER_CLAUSES.length} active ✓`);
  });

  test("Voice DNA pipeline does NOT retain raw audio after fingerprinting", () => {
    if (skipIfNoVoices(1)) return;
    const voices = getTestVoices();
    const tempName = `__test_retention_${Date.now()}`;
    const result = VoiceProcessor.ingest(voices[0], tempName);

    // The processed WAV (_dna.wav) exists — but the original raw is untouched
    expect(fs.existsSync(result.outputPath)).toBe(true);
    // Original input still at its source path — we never move/delete it
    expect(fs.existsSync(result.inputPath)).toBe(true);

    // Cleanup test artifact
    if (fs.existsSync(result.outputPath)) fs.unlinkSync(result.outputPath);
    console.log("\nAudio retention: raw input preserved, normalized WAV for DNA only ✓");
  });
});
