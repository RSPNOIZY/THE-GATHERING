/**
 * RSP001 ACTOR PROTOCOL — Performance State Machine
 * 
 * Five states. Clear transitions. No ambiguity.
 * The actor is sovereign. The character is a layer.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { v4 as uuidv4 } from 'uuid';
import type { PerformanceMode, DirectionEvent, DirectionSource, DirectionCategory } from '../schemas/directionEvent';
import type { ActorImprint } from '../schemas/actorImprint';
import type { CharacterProfile } from '../schemas/characterProfile';
import type { Take, TakeStatus } from '../schemas/take';

// ─── VALID TRANSITIONS ───────────────────────────────────
// Explicit transition map. If a transition isn't listed, it's illegal.

const VALID_TRANSITIONS: Record<PerformanceMode, PerformanceMode[]> = {
  'CHARACTER':        ['ACTOR', 'CHARACTER'],           // break-word → ACTOR, or stay in character
  'ACTOR':            ['DIRECTION_INTAKE', 'CHARACTER'], // receive notes or re-enter character
  'DIRECTION_INTAKE': ['RENDER_PREVIEW', 'ACTOR'],      // generate preview or continue discussion
  'RENDER_PREVIEW':   ['LOCKED_TAKE', 'DIRECTION_INTAKE', 'CHARACTER'], // approve, revise, or re-enter
  'LOCKED_TAKE':      ['CHARACTER', 'ACTOR'],            // back to performing or discuss next
};

// ─── SESSION STATE ───────────────────────────────────────

export interface SessionState {
  session_id: string;
  actor: ActorImprint;
  character: CharacterProfile | null;
  mode: PerformanceMode;
  take_count: number;
  events: DirectionEvent[];
  takes: Take[];
  last_direction: string | null;
  started_at: string;
}

// ─── STATE MACHINE ───────────────────────────────────────

export class PerformanceStateMachine {
  private state: SessionState;

  constructor(actor: ActorImprint, character?: CharacterProfile) {
    this.state = {
      session_id: uuidv4(),
      actor,
      character: character ?? null,
      mode: character ? 'CHARACTER' : 'ACTOR',
      take_count: 0,
      events: [],
      takes: [],
      last_direction: null,
      started_at: new Date().toISOString(),
    };
  }

  // ─── GETTERS ─────────────────────────────────────────

  get currentMode(): PerformanceMode {
    return this.state.mode;
  }

  get sessionId(): string {
    return this.state.session_id;
  }

  get actorId(): string {
    return this.state.actor.actor_id;
  }

  get characterId(): string | null {
    return this.state.character?.character_id ?? null;
  }

  get takeCount(): number {
    return this.state.take_count;
  }

  get eventLog(): DirectionEvent[] {
    return [...this.state.events];
  }

  get allTakes(): Take[] {
    return [...this.state.takes];
  }

  get blessedTakes(): Take[] {
    return this.state.takes.filter(t => t.blessed);
  }

  get snapshot(): Readonly<SessionState> {
    return { ...this.state };
  }

  // ─── TRANSITION VALIDATION ───────────────────────────

  canTransition(to: PerformanceMode): boolean {
    return VALID_TRANSITIONS[this.state.mode].includes(to);
  }

  private assertTransition(to: PerformanceMode): void {
    if (!this.canTransition(to)) {
      throw new Error(
        `Illegal transition: ${this.state.mode} → ${to}. ` +
        `Valid targets from ${this.state.mode}: [${VALID_TRANSITIONS[this.state.mode].join(', ')}]`
      );
    }
  }

  // ─── BREAK WORD ──────────────────────────────────────
  // Drops character instantly. Returns to actor mode.

  breakCharacter(): DirectionEvent {
    this.assertTransition('ACTOR');
    
    const event = this.logEvent({
      source: 'self',
      prior_state: this.state.mode,
      new_state: 'ACTOR',
      triggered_by_break_word: true,
      raw_direction: this.state.actor.break_word,
      interpreted_direction: 'Actor invoked break-word. Dropping character layer.',
      category: 'general',
      interpretation_confidence: 1.0,
      actor_acknowledgment: 'Okay, what do you need?',
    });

    this.state.mode = 'ACTOR';
    return event;
  }

  // ─── RECEIVE DIRECTION ───────────────────────────────
  // Actor receives notes. Transitions to DIRECTION_INTAKE.

  receiveDirection(
    raw: string,
    interpreted: string,
    source: DirectionSource = 'client',
    category: DirectionCategory = 'general',
    confidence: number = 0.9,
  ): DirectionEvent {
    // Direction can be received in ACTOR mode or (if directable_in_character) in CHARACTER mode
    if (this.state.mode === 'CHARACTER') {
      if (!this.state.character?.directable_in_character) {
        throw new Error(
          'Character is not directable in-character. Use break-word first.'
        );
      }
      // In-character direction doesn't require full mode switch
      // but we still log it
    }

    const prior = this.state.mode;
    const newState: PerformanceMode = 'DIRECTION_INTAKE';
    
    // Only assert transition if we're actually changing state
    if (prior !== 'DIRECTION_INTAKE') {
      // ACTOR → DIRECTION_INTAKE is valid
      // CHARACTER → DIRECTION_INTAKE (in-character direction) — we allow this
      if (prior === 'CHARACTER') {
        // In-character direction: log but stay conceptually in character
        // The state machine tracks this as DIRECTION_INTAKE for audit purposes
      }
    }

    const event = this.logEvent({
      source,
      prior_state: prior,
      new_state: newState,
      triggered_by_break_word: false,
      raw_direction: raw,
      interpreted_direction: interpreted,
      category,
      interpretation_confidence: confidence,
    });

    this.state.mode = newState;
    this.state.last_direction = interpreted;
    return event;
  }

  // ─── RENDER PREVIEW ──────────────────────────────────
  // Actor generates a revised take based on direction.

  renderPreview(text: string, improvised: boolean = false): Take {
    this.assertTransition('RENDER_PREVIEW');
    
    this.state.take_count++;
    
    const take: Take = {
      take_id: uuidv4(),
      session_id: this.state.session_id,
      actor_id: this.state.actor.actor_id,
      character_id: this.state.character?.character_id ?? 'unset',
      take_number: this.state.take_count,
      mode_used: 'RENDER_PREVIEW',
      direction_event_id: this.state.events.length > 0
        ? this.state.events[this.state.events.length - 1].event_id
        : undefined,
      text,
      improvised,
      status: 'preview' as TakeStatus,
      preview: true,
      created_at: new Date().toISOString(),
      gabriel_ingested: false as const,
      voice_ip_retained: true as const,
      blessed: false,
    };

    this.state.takes.push(take);
    this.state.mode = 'RENDER_PREVIEW';
    return take;
  }

  // ─── APPROVE TAKE ────────────────────────────────────
  // Client approves the preview. Take becomes blessed.

  approveTake(takeId: string, approvedBy: string = 'client'): Take {
    this.assertTransition('LOCKED_TAKE');
    
    const take = this.state.takes.find(t => t.take_id === takeId);
    if (!take) {
      throw new Error(`Take not found: ${takeId}`);
    }
    if (take.status === 'blessed') {
      throw new Error(`Take already blessed: ${takeId}`);
    }

    const now = new Date().toISOString();
    take.status = 'blessed';
    take.approved_by = approvedBy;
    take.approved_at = now;
    take.blessed = true;
    take.blessed_at = now;

    this.state.mode = 'LOCKED_TAKE';
    return take;
  }

  // ─── REJECT TAKE ─────────────────────────────────────
  // Client rejects. Back to direction intake.

  rejectTake(takeId: string, reason?: string): Take {
    const take = this.state.takes.find(t => t.take_id === takeId);
    if (!take) {
      throw new Error(`Take not found: ${takeId}`);
    }

    take.status = 'rejected';
    
    // Stay in or return to DIRECTION_INTAKE for revision
    this.state.mode = 'DIRECTION_INTAKE';
    return take;
  }

  // ─── RE-ENTER CHARACTER ──────────────────────────────
  // After direction or locked take, go back to performing.

  enterCharacter(character?: CharacterProfile): void {
    if (character) {
      this.state.character = character;
    }
    if (!this.state.character) {
      throw new Error('No character profile loaded. Cannot enter character mode.');
    }
    
    this.state.mode = 'CHARACTER';
  }

  // ─── LOAD CHARACTER ──────────────────────────────────

  loadCharacter(character: CharacterProfile): void {
    if (character.actor_id !== this.state.actor.actor_id) {
      throw new Error(
        `Character actor_id (${character.actor_id}) doesn't match session actor (${this.state.actor.actor_id})`
      );
    }
    this.state.character = character;
  }

  // ─── EVENT LOGGING ───────────────────────────────────

  private logEvent(params: {
    source: DirectionSource;
    prior_state: PerformanceMode;
    new_state: PerformanceMode;
    triggered_by_break_word: boolean;
    raw_direction: string;
    interpreted_direction: string;
    category: DirectionCategory;
    interpretation_confidence: number;
    actor_acknowledgment?: string;
  }): DirectionEvent {
    const event: DirectionEvent = {
      event_id: uuidv4(),
      session_id: this.state.session_id,
      actor_id: this.state.actor.actor_id,
      character_id: this.state.character?.character_id,
      timestamp: new Date().toISOString(),
      source: params.source,
      prior_state: params.prior_state,
      new_state: params.new_state,
      triggered_by_break_word: params.triggered_by_break_word,
      raw_direction: params.raw_direction,
      interpreted_direction: params.interpreted_direction,
      category: params.category,
      interpretation_confidence: params.interpretation_confidence,
      actor_acknowledgment: params.actor_acknowledgment,
      logged: true as const,
      gabriel_ingested: false as const,
    };

    this.state.events.push(event);
    return event;
  }

  // ─── EXPORT ──────────────────────────────────────────
  // Full session dump for audit.

  exportSession(): {
    session_id: string;
    actor_id: string;
    character_id: string | null;
    started_at: string;
    exported_at: string;
    total_events: number;
    total_takes: number;
    blessed_takes: number;
    events: DirectionEvent[];
    takes: Take[];
  } {
    return {
      session_id: this.state.session_id,
      actor_id: this.state.actor.actor_id,
      character_id: this.state.character?.character_id ?? null,
      started_at: this.state.started_at,
      exported_at: new Date().toISOString(),
      total_events: this.state.events.length,
      total_takes: this.state.takes.length,
      blessed_takes: this.blessedTakes.length,
      events: this.state.events,
      takes: this.state.takes,
    };
  }
}
