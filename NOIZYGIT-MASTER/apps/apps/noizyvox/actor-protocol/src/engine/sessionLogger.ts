/**
 * RSP001 ACTOR PROTOCOL — Session Logger
 * 
 * Every transition becomes audit data.
 * Every approved take becomes a blessed candidate.
 * Nothing goes to Gabriel by default.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { DirectionEvent } from '../schemas/directionEvent';
import type { Take } from '../schemas/take';

// ─── LOG FORMAT ──────────────────────────────────────────

export interface SessionLog {
  session_id: string;
  actor_id: string;
  character_id: string | null;
  started_at: string;
  events: DirectionEvent[];
  takes: Take[];
  blessed_takes: Take[];
  summary: SessionSummary;
}

export interface SessionSummary {
  total_events: number;
  total_takes: number;
  blessed_count: number;
  rejected_count: number;
  break_word_count: number;
  direction_sources: Record<string, number>;
  direction_categories: Record<string, number>;
  average_interpretation_confidence: number;
  session_duration_ms: number;
}

// ─── LOGGER ──────────────────────────────────────────────

export class SessionLogger {
  private basePath: string;
  private sessionId: string;
  private events: DirectionEvent[] = [];
  private takes: Take[] = [];
  private startTime: number;

  constructor(
    sessionId: string,
    basePath: string = '/Users/m2ultra/NOIZYLAB/noizyvox/actor-protocol/sessions',
  ) {
    this.sessionId = sessionId;
    this.basePath = basePath;
    this.startTime = Date.now();

    // Ensure session directory exists
    const sessionDir = join(this.basePath, this.sessionId);
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true });
    }
  }

  // ─── LOG EVENT ───────────────────────────────────────

  logEvent(event: DirectionEvent): void {
    this.events.push(event);
    this.appendToFile('events.jsonl', event);
  }

  // ─── LOG TAKE ────────────────────────────────────────

  logTake(take: Take): void {
    this.takes.push(take);
    this.appendToFile('takes.jsonl', take);
    
    if (take.blessed) {
      this.appendToFile('blessed.jsonl', take);
    }
  }

  // ─── GENERATE SUMMARY ───────────────────────────────

  generateSummary(actorId: string, characterId: string | null): SessionLog {
    const blessed = this.takes.filter(t => t.blessed);
    const rejected = this.takes.filter(t => t.status === 'rejected');
    const breakWords = this.events.filter(e => e.triggered_by_break_word);
    
    // Count direction sources
    const sources: Record<string, number> = {};
    const categories: Record<string, number> = {};
    let totalConfidence = 0;

    for (const event of this.events) {
      sources[event.source] = (sources[event.source] || 0) + 1;
      categories[event.category] = (categories[event.category] || 0) + 1;
      totalConfidence += event.interpretation_confidence;
    }

    const summary: SessionSummary = {
      total_events: this.events.length,
      total_takes: this.takes.length,
      blessed_count: blessed.length,
      rejected_count: rejected.length,
      break_word_count: breakWords.length,
      direction_sources: sources,
      direction_categories: categories,
      average_interpretation_confidence: this.events.length > 0
        ? totalConfidence / this.events.length
        : 0,
      session_duration_ms: Date.now() - this.startTime,
    };

    const log: SessionLog = {
      session_id: this.sessionId,
      actor_id: actorId,
      character_id: characterId,
      started_at: new Date(this.startTime).toISOString(),
      events: this.events,
      takes: this.takes,
      blessed_takes: blessed,
      summary,
    };

    // Write full session log
    const sessionDir = join(this.basePath, this.sessionId);
    writeFileSync(
      join(sessionDir, 'session.json'),
      JSON.stringify(log, null, 2),
    );

    return log;
  }

  // ─── INTERNALS ───────────────────────────────────────

  private appendToFile(filename: string, data: unknown): void {
    const sessionDir = join(this.basePath, this.sessionId);
    const filepath = join(sessionDir, filename);
    
    try {
      const line = JSON.stringify(data) + '\n';
      // Append mode
      const { appendFileSync } = require('fs');
      appendFileSync(filepath, line);
    } catch {
      // If append fails, write fresh
      writeFileSync(
        join(sessionDir, filename),
        JSON.stringify(data) + '\n',
      );
    }
  }
}
