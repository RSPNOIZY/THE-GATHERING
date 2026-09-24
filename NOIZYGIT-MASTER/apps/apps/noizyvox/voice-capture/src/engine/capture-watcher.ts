/**
 * NOIZYVOX — Capture Watcher
 * 
 * Watches an external target directory for new WAV files.
 * When a new WAV appears, it:
 *   1. Validates the file (WAV header, sample rate, bit depth)
 *   2. Registers it against the active capture session
 *   3. Queues it for the analysis pipeline (Whisper → Librosa → XTTS → Gemma 4)
 * 
 * Design principles:
 *   - Raw WAVs live on external storage, NOT on the system drive
 *   - VS Code Insiders handles orchestration + metadata display
 *   - Heavy media processing stays in the external pipeline
 *   - The watcher bridges the gap between recording and analysis
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { watch, existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// ─── CONFIG ──────────────────────────────────────────────

export interface WatcherConfig {
  /** Directory to watch for new WAV files */
  watch_dir: string;
  /** Minimum file size in bytes to consider valid (avoid partial writes) */
  min_file_size: number;
  /** Debounce time in ms to wait for file writes to complete */
  debounce_ms: number;
  /** File extensions to watch */
  extensions: string[];
  /** Maximum concurrent files in processing queue */
  max_queue_size: number;
  /** Active session ID to register takes against */
  active_session_id?: string;
}

export const DEFAULT_WATCHER_CONFIG: WatcherConfig = {
  watch_dir: '/Volumes/NOIZYLAB-EXT/voice-captures',
  min_file_size: 44100, // At least ~0.5s of 44.1kHz mono WAV
  debounce_ms: 2000,    // Wait 2s after last write event
  extensions: ['.wav', '.flac'],
  max_queue_size: 50,
};

// ─── WAV VALIDATION ──────────────────────────────────────

export interface WavInfo {
  valid: boolean;
  sample_rate?: number;
  bit_depth?: number;
  channels?: number;
  duration_s?: number;
  file_size: number;
  content_hash?: string;
  error?: string;
}

/**
 * Validate a WAV file by reading its header.
 * Returns basic audio metadata without loading the full file.
 */
export function validateWavFile(filepath: string): WavInfo {
  if (!existsSync(filepath)) {
    return { valid: false, file_size: 0, error: 'File not found' };
  }

  const stat = statSync(filepath);
  if (stat.size < 44) {
    return { valid: false, file_size: stat.size, error: 'File too small for WAV header' };
  }

  const buffer = Buffer.alloc(44);
  const fd = require('fs').openSync(filepath, 'r');
  require('fs').readSync(fd, buffer, 0, 44, 0);
  require('fs').closeSync(fd);

  // Check RIFF header
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);

  if (riff !== 'RIFF' || wave !== 'WAVE') {
    return { valid: false, file_size: stat.size, error: 'Not a valid WAV file (bad RIFF/WAVE header)' };
  }

  // Parse fmt chunk
  const audioFormat = buffer.readUInt16LE(20);
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitDepth = buffer.readUInt16LE(34);
  const dataSize = buffer.readUInt32LE(40);

  if (audioFormat !== 1 && audioFormat !== 3) {
    // 1 = PCM, 3 = IEEE float — both acceptable
    return { valid: false, file_size: stat.size, error: `Unsupported audio format: ${audioFormat}` };
  }

  const bytesPerSample = bitDepth / 8;
  const bytesPerSecond = sampleRate * channels * bytesPerSample;
  const duration_s = bytesPerSecond > 0 ? dataSize / bytesPerSecond : 0;

  // Compute SHA-256 of entire file
  const fullContent = readFileSync(filepath);
  const content_hash = createHash('sha256').update(fullContent).digest('hex');

  return {
    valid: true,
    sample_rate: sampleRate,
    bit_depth: bitDepth,
    channels,
    duration_s,
    file_size: stat.size,
    content_hash,
  };
}

// ─── PROCESSING QUEUE ────────────────────────────────────

export interface QueuedFile {
  filepath: string;
  filename: string;
  discovered_at: string;
  wav_info: WavInfo;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  session_id?: string;
  take_id?: string;
  error?: string;
}

// ─── WATCHER ─────────────────────────────────────────────

export type WatcherEvent =
  | { type: 'file_discovered'; file: QueuedFile }
  | { type: 'file_invalid'; filepath: string; error: string }
  | { type: 'queue_full'; filepath: string }
  | { type: 'watcher_started'; watch_dir: string }
  | { type: 'watcher_stopped' }
  | { type: 'error'; error: string };

/**
 * CaptureWatcher — watches for new WAV files and queues them for processing.
 * 
 * Usage:
 *   const watcher = new CaptureWatcher(config);
 *   watcher.on('file_discovered', (event) => { ... });
 *   watcher.start();
 *   // later:
 *   watcher.stop();
 */
export class CaptureWatcher extends EventEmitter {
  private config: WatcherConfig;
  private queue: QueuedFile[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private fsWatcher: ReturnType<typeof watch> | null = null;
  private running = false;

  constructor(config: Partial<WatcherConfig> = {}) {
    super();
    this.config = { ...DEFAULT_WATCHER_CONFIG, ...config };
  }

  /**
   * Start watching the target directory.
   */
  start(): void {
    if (this.running) return;

    const { watch_dir } = this.config;

    if (!existsSync(watch_dir)) {
      mkdirSync(watch_dir, { recursive: true });
    }

    // Scan for existing files first
    this.scanExisting();

    // Start watching for new files
    this.fsWatcher = watch(watch_dir, { persistent: true }, (eventType, filename) => {
      if (!filename) return;
      const ext = extname(filename).toLowerCase();
      if (!this.config.extensions.includes(ext)) return;

      const filepath = join(watch_dir, filename);
      this.handleFileEvent(filepath);
    });

    this.running = true;
    this.emit('event', { type: 'watcher_started', watch_dir } as WatcherEvent);
  }

  /**
   * Stop watching.
   */
  stop(): void {
    if (!this.running) return;

    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    this.running = false;
    this.emit('event', { type: 'watcher_stopped' } as WatcherEvent);
  }

  /**
   * Get current queue state.
   */
  getQueue(): QueuedFile[] {
    return [...this.queue];
  }

  /**
   * Mark a queued file as processing.
   */
  markProcessing(filepath: string): void {
    const item = this.queue.find(f => f.filepath === filepath);
    if (item) item.status = 'processing';
  }

  /**
   * Mark a queued file as completed.
   */
  markCompleted(filepath: string, takeId?: string): void {
    const item = this.queue.find(f => f.filepath === filepath);
    if (item) {
      item.status = 'completed';
      if (takeId) item.take_id = takeId;
    }
  }

  /**
   * Mark a queued file as failed.
   */
  markFailed(filepath: string, error: string): void {
    const item = this.queue.find(f => f.filepath === filepath);
    if (item) {
      item.status = 'failed';
      item.error = error;
    }
  }

  /**
   * Write queue state to a JSON file for VS Code display.
   */
  writeQueueState(outputPath?: string): void {
    const path = outputPath ?? join(this.config.watch_dir, '.watcher-queue.json');
    const state = {
      watch_dir: this.config.watch_dir,
      running: this.running,
      active_session_id: this.config.active_session_id,
      queue_size: this.queue.length,
      queued: this.queue.filter(f => f.status === 'queued').length,
      processing: this.queue.filter(f => f.status === 'processing').length,
      completed: this.queue.filter(f => f.status === 'completed').length,
      failed: this.queue.filter(f => f.status === 'failed').length,
      files: this.queue,
      updated_at: new Date().toISOString(),
    };
    writeFileSync(path, JSON.stringify(state, null, 2));
  }

  // ─── PRIVATE ─────────────────────────────────────────

  private scanExisting(): void {
    const { watch_dir, extensions } = this.config;
    try {
      const files = readdirSync(watch_dir)
        .filter(f => extensions.includes(extname(f).toLowerCase()))
        .map(f => join(watch_dir, f));

      for (const filepath of files) {
        this.processFile(filepath);
      }
    } catch {
      // Directory might not exist yet — that's fine
    }
  }

  private handleFileEvent(filepath: string): void {
    // Debounce: wait for file write to complete
    const existing = this.debounceTimers.get(filepath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filepath);
      this.processFile(filepath);
    }, this.config.debounce_ms);

    this.debounceTimers.set(filepath, timer);
  }

  private processFile(filepath: string): void {
    // Skip if already in queue
    if (this.queue.some(f => f.filepath === filepath)) return;

    // Check queue size
    if (this.queue.length >= this.config.max_queue_size) {
      this.emit('event', { type: 'queue_full', filepath } as WatcherEvent);
      return;
    }

    // Check file exists and meets minimum size
    if (!existsSync(filepath)) return;
    const stat = statSync(filepath);
    if (stat.size < this.config.min_file_size) return;

    // Validate WAV
    const wavInfo = validateWavFile(filepath);
    if (!wavInfo.valid) {
      this.emit('event', {
        type: 'file_invalid',
        filepath,
        error: wavInfo.error ?? 'Unknown validation error',
      } as WatcherEvent);
      return;
    }

    const queued: QueuedFile = {
      filepath,
      filename: basename(filepath),
      discovered_at: new Date().toISOString(),
      wav_info: wavInfo,
      status: 'queued',
      session_id: this.config.active_session_id,
    };

    this.queue.push(queued);
    this.emit('event', { type: 'file_discovered', file: queued } as WatcherEvent);
  }
}
