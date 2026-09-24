/**
 * VoiceProcessor — NOIZY Voice DNA Utility
 * Ingests iPhone recordings (.m4a/.caf/.wav) via ffmpeg + sox.
 * Extracts fingerprint hash, metadata, and waveform stats.
 * Outputs standardized 16kHz mono WAV for Voice DNA registration.
 */

const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VOICE_DIR = path.join(__dirname, "..", "..", "test-voices");
const FFMPEG = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";
const SOX = process.env.SOX_PATH || "/opt/homebrew/bin/sox";

// Target format for Voice DNA: 16kHz mono WAV (standard for voice biometrics)
const TARGET_SAMPLE_RATE = 16000;
const TARGET_CHANNELS = 1;

class VoiceProcessor {
  // ─── Ingest ──────────────────────────────────────────────────────────────────

  /**
   * Ingest a raw audio file (m4a, caf, wav, mp3, opus) → normalized WAV.
   * Returns metadata + fingerprint.
   */
  static ingest(inputPath, outputName = null) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const ext = path.extname(inputPath).toLowerCase();
    const baseName = outputName || path.basename(inputPath, ext);
    const outputPath = path.join(VOICE_DIR, `${baseName}_dna.wav`);

    // Convert to 16kHz mono WAV using ffmpeg
    execFileSync(FFMPEG, [
      "-i", inputPath,
      "-ar", String(TARGET_SAMPLE_RATE),
      "-ac", String(TARGET_CHANNELS),
      "-c:a", "pcm_s16le",
      "-y",
      outputPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    const stats = this.analyzeWav(outputPath);
    const fingerprint = this.fingerprint(outputPath);
    const inputStats = this.getInputMetadata(inputPath);

    return {
      inputPath,
      outputPath,
      baseName,
      fingerprint,
      inputFormat: {
        ext: ext.replace(".", ""),
        ...inputStats,
      },
      outputFormat: {
        sampleRate: TARGET_SAMPLE_RATE,
        channels: TARGET_CHANNELS,
        encoding: "pcm_s16le",
        ext: "wav",
      },
      analysis: stats,
      processedAt: new Date().toISOString(),
    };
  }

  // ─── Fingerprint ─────────────────────────────────────────────────────────────

  /**
   * Generate a deterministic Voice DNA fingerprint from the WAV content.
   * SHA-256 of raw PCM bytes = content-addressable voice identity.
   */
  static fingerprint(wavPath) {
    const buf = fs.readFileSync(wavPath);
    // Skip WAV header (44 bytes) to hash only audio data
    const pcmData = buf.slice(44);
    const hash = crypto.createHash("sha256").update(pcmData).digest("hex");
    return {
      algorithm: "sha256-pcm",
      hash,
      shortHash: hash.substring(0, 16),
      voiceDnaId: `VD-${hash.substring(0, 8).toUpperCase()}`,
    };
  }

  // ─── Analysis ────────────────────────────────────────────────────────────────

  /**
   * Extract audio statistics using sox stat.
   * Returns duration, RMS, peak level, silence ratio.
   */
  static analyzeWav(wavPath) {
    try {
      const output = execFileSync(SOX, [
        wavPath,
        "-n",
        "stat",
      ], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

      // sox stat writes to stderr
      return this._parseSoxStat(output || "");
    } catch (err) {
      // sox writes stat to stderr, catch it there
      const stderr = err.stderr?.toString() || "";
      if (stderr) return this._parseSoxStat(stderr);
      return { error: err.message };
    }
  }

  static _parseSoxStat(output) {
    const stats = {};
    const lines = output.split("\n");
    for (const line of lines) {
      const match = line.match(/^(.+?):\s+([\d.e+\-]+)/);
      if (match) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, "");
        stats[key] = parseFloat(match[2]);
      }
    }
    return {
      duration: stats["length_seconds"] || stats["samples_read"] / TARGET_SAMPLE_RATE || null,
      rmsLevel: stats["rms_amplitude"] || null,
      peakLevel: stats["maximum_amplitude"] || null,
      dcOffset: stats["mean_norm_amplitude"] || null,
      hasAudio: (stats["rms_amplitude"] || 0) > 0.001,
    };
  }

  /**
   * Get input file metadata using ffprobe (bundled with ffmpeg).
   */
  static getInputMetadata(inputPath) {
    try {
      const output = execFileSync("ffprobe", [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        inputPath,
      ], { encoding: "utf-8" });
      const data = JSON.parse(output);
      const audioStream = data.streams?.find((s) => s.codec_type === "audio");
      return {
        duration: parseFloat(data.format?.duration || 0),
        size: parseInt(data.format?.size || 0),
        bitrate: parseInt(data.format?.bit_rate || 0),
        codec: audioStream?.codec_name || "unknown",
        sampleRate: parseInt(audioStream?.sample_rate || 0),
        channels: audioStream?.channels || 0,
      };
    } catch {
      return {};
    }
  }

  // ─── List test voices ─────────────────────────────────────────────────────────

  static listTestVoices() {
    if (!fs.existsSync(VOICE_DIR)) return [];
    return fs
      .readdirSync(VOICE_DIR)
      .filter((f) => /\.(m4a|wav|mp3|caf|aac|opus|flac)$/i.test(f) && !f.startsWith("."))
      .map((f) => ({
        filename: f,
        path: path.join(VOICE_DIR, f),
        size: fs.statSync(path.join(VOICE_DIR, f)).size,
        isProcessed: f.endsWith("_dna.wav"),
      }));
  }

  // ─── Batch process all voices in test-voices/ ─────────────────────────────────

  static async processAll() {
    const files = this.listTestVoices().filter((f) => !f.isProcessed);
    const results = [];
    for (const f of files) {
      try {
        const result = this.ingest(f.path);
        results.push({ success: true, filename: f.filename, ...result });
      } catch (err) {
        results.push({ success: false, filename: f.filename, error: err.message });
      }
    }
    return results;
  }

  // ─── Similarity (basic RMS delta — placeholder for real biometric engine) ────

  static compareFingerprints(fpA, fpB) {
    return {
      identical: fpA.hash === fpB.hash,
      hashMatch: fpA.hash === fpB.hash,
      note: "SHA-256 PCM hash — identical = same recording. Full biometric similarity requires voice embedding model.",
    };
  }
}

module.exports = VoiceProcessor;
