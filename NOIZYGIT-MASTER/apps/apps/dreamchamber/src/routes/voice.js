/**
 * Voice DNA Routes — NOIZY Empire
 * Upload, process, fingerprint, and register voice samples from iPhone recordings.
 * All 3 voices from RSP_001's iPhone test sessions flow through here.
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const VoiceProcessor = require("../utils/VoiceProcessor");

const VOICE_DIR = path.join(__dirname, "..", "..", "test-voices");
fs.mkdirSync(VOICE_DIR, { recursive: true });

// Multer: store raw uploads in test-voices/ with original extension preserved
const storage = multer.diskStorage({
  destination: VOICE_DIR,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(m4a|caf|wav|mp3|aac|opus|flac)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error(`Unsupported format: ${file.originalname}. Allowed: m4a, caf, wav, mp3, aac, opus, flac`));
    }
    cb(null, true);
  },
});

// ─── GET /api/voice — list all voice files in test-voices/ ────────────────────

router.get("/", (req, res) => {
  try {
    const voices = VoiceProcessor.listTestVoices();
    res.json({
      voiceDir: VOICE_DIR,
      count: voices.length,
      voices,
      hint: voices.length === 0
        ? "No voice files found. AirDrop .m4a files from iPhone to test-voices/ or POST /api/voice/upload"
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/upload — upload one or more voice files ──────────────────

router.post("/upload", upload.array("voices", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded. Field name: voices" });
    }

    const results = [];
    for (const file of req.files) {
      try {
        const processed = VoiceProcessor.ingest(file.path);
        results.push({
          success: true,
          originalName: file.originalname,
          savedAs: file.filename,
          ...processed,
        });
      } catch (err) {
        results.push({
          success: false,
          originalName: file.originalname,
          error: err.message,
        });
      }
    }

    res.json({
      uploaded: req.files.length,
      processed: results.filter((r) => r.success).length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/process — process all raw files in test-voices/ ──────────

router.post("/process", async (req, res) => {
  try {
    const results = await VoiceProcessor.processAll();
    res.json({
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/voice/:filename/analyze — analyze a specific voice file ─────────

router.get("/:filename/analyze", (req, res) => {
  try {
    const filePath = path.join(VOICE_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${req.params.filename}` });
    }
    const result = VoiceProcessor.ingest(filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/voice/:filename/fingerprint — fingerprint only ──────────────────

router.get("/:filename/fingerprint", (req, res) => {
  try {
    const filePath = path.join(VOICE_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${req.params.filename}` });
    }

    // Require pre-processed _dna.wav for fingerprinting
    const dnaPath = filePath.replace(/\.[^.]+$/, "_dna.wav");
    const targetPath = fs.existsSync(dnaPath) ? dnaPath : filePath;
    const fingerprint = VoiceProcessor.fingerprint(targetPath);

    res.json({ filename: req.params.filename, ...fingerprint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/register — register voice DNA to Heaven ─────────────────
// Body: { actorId, filename, displayName? }

router.post("/register", async (req, res) => {
  try {
    const { actorId, filename, displayName } = req.body;
    if (!actorId || !filename) {
      return res.status(400).json({ error: "actorId and filename are required" });
    }

    const filePath = path.join(VOICE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${filename}` });
    }

    // Process voice
    const processed = VoiceProcessor.ingest(filePath);
    const { fingerprint } = processed;

    // Register to Heaven GABRIEL_VOICE KV via HeavenClient
    const heaven = req.heaven;
    let heavenResult = null;

    if (heaven?.enabled) {
      try {
        heavenResult = await heaven.request("/api/v1/voice/register", {
          method: "POST",
          body: JSON.stringify({
            actor_id: actorId,
            voice_dna_id: fingerprint.voiceDnaId,
            fingerprint_hash: fingerprint.hash,
            fingerprint_algorithm: fingerprint.algorithm,
            source_file: filename,
            duration: processed.analysis?.duration,
            registered_at: processed.processedAt,
            display_name: displayName || actorId,
          }),
        });
      } catch (err) {
        heavenResult = { error: err.message, note: "Local fingerprint still valid" };
      }
    }

    res.json({
      registered: true,
      actorId,
      voiceDnaId: fingerprint.voiceDnaId,
      fingerprint,
      analysis: processed.analysis,
      heaven: heavenResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/compare — compare two voice fingerprints ─────────────────
// Body: { fileA, fileB }

router.post("/compare", (req, res) => {
  try {
    const { fileA, fileB } = req.body;
    if (!fileA || !fileB) {
      return res.status(400).json({ error: "fileA and fileB are required" });
    }

    const pathA = path.join(VOICE_DIR, fileA);
    const pathB = path.join(VOICE_DIR, fileB);

    if (!fs.existsSync(pathA)) return res.status(404).json({ error: `Not found: ${fileA}` });
    if (!fs.existsSync(pathB)) return res.status(404).json({ error: `Not found: ${fileB}` });

    const fpA = VoiceProcessor.fingerprint(pathA);
    const fpB = VoiceProcessor.fingerprint(pathB);
    const comparison = VoiceProcessor.compareFingerprints(fpA, fpB);

    res.json({ fileA, fileB, fingerprintA: fpA, fingerprintB: fpB, comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/voice/:filename — remove a voice file ────────────────────────

router.delete("/:filename", (req, res) => {
  try {
    const filePath = path.join(VOICE_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${req.params.filename}` });
    }
    fs.unlinkSync(filePath);
    res.json({ deleted: true, filename: req.params.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
