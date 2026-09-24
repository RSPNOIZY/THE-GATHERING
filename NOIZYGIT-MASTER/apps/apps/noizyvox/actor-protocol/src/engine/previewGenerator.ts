/**
 * RSP001 ACTOR PROTOCOL — Preview Generator
 * 
 * The actor repeats direction in plain language.
 * Generates one revised take.
 * Waits for approval.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import type { DirectionEvent } from '../schemas/directionEvent';
import type { CharacterProfile } from '../schemas/characterProfile';
import type { Take } from '../schemas/take';
import type { PerformanceStateMachine } from './stateMachine';

// ─── PREVIEW REQUEST ─────────────────────────────────────

export interface PreviewRequest {
  direction: DirectionEvent;
  character: CharacterProfile;
  original_line?: string;
  actor_notes?: string;
}

// ─── PREVIEW RESPONSE ────────────────────────────────────

export interface PreviewResponse {
  acknowledgment: string;       // Actor repeats direction in plain language
  interpretation: string;       // What the actor understood
  proposed_adjustment: string;  // How the actor will change the performance
  preview_take: Take;           // The revised take
  ready_for_approval: boolean;
}

// ─── PREVIEW GENERATOR ──────────────────────────────────

export class PreviewGenerator {
  private machine: PerformanceStateMachine;

  constructor(machine: PerformanceStateMachine) {
    this.machine = machine;
  }

  /**
   * Generate a preview based on direction.
   * 
   * Flow:
   * 1. Actor acknowledges direction in plain language
   * 2. Actor proposes how they'll adjust
   * 3. Actor generates one revised take
   * 4. System waits for approval
   */
  generate(request: PreviewRequest): PreviewResponse {
    const { direction, character } = request;

    // Step 1: Build acknowledgment
    const acknowledgment = this.buildAcknowledgment(direction);

    // Step 2: Interpret direction against character profile
    const interpretation = this.interpretDirection(direction, character);

    // Step 3: Propose adjustment
    const adjustment = this.proposeAdjustment(direction, character);

    // Step 4: Generate preview take via state machine
    const previewText = this.generatePreviewText(
      request.original_line || direction.raw_direction,
      direction,
      character,
    );

    const previewTake = this.machine.renderPreview(previewText);

    return {
      acknowledgment,
      interpretation,
      proposed_adjustment: adjustment,
      preview_take: previewTake,
      ready_for_approval: true,
    };
  }

  /**
   * Approve a preview — blesses the take.
   */
  approve(takeId: string, approvedBy: string = 'client'): Take {
    return this.machine.approveTake(takeId, approvedBy);
  }

  /**
   * Reject a preview — returns to direction intake.
   */
  reject(takeId: string, reason?: string): Take {
    return this.machine.rejectTake(takeId, reason);
  }

  // ─── INTERNALS ───────────────────────────────────────

  private buildAcknowledgment(direction: DirectionEvent): string {
    // Actor repeats direction in their own words
    const categoryMap: Record<string, string> = {
      tone: 'Adjusting the tone',
      pacing: 'Changing the pacing',
      intensity: 'Shifting the intensity',
      emotion: 'Finding a different emotional register',
      accent: 'Adjusting the accent',
      character: 'Rethinking how the character would say this',
      technical: 'Hitting the technical mark',
      general: 'Got it',
    };

    const prefix = categoryMap[direction.category] || 'Got it';
    return `${prefix}. ${direction.interpreted_direction}`;
  }

  private interpretDirection(
    direction: DirectionEvent,
    character: CharacterProfile,
  ): string {
    // Check if direction conflicts with hard constraints
    for (const constraint of character.hard_constraints) {
      // Simple keyword matching for constraint detection
      const dirLower = direction.raw_direction.toLowerCase();
      const constraintLower = constraint.description.toLowerCase();
      
      if (dirLower.includes(constraintLower)) {
        return `Direction noted, but it conflicts with a hard constraint: "${constraint.description}" (${constraint.reason}). Adjusting within allowed bounds.`;
      }
    }

    // Check if direction targets an allowed transformation
    const targetProperty = direction.category;
    const allowedTransform = character.allowed_transformations.find(
      t => t.property === targetProperty
    );

    if (allowedTransform) {
      return `Direction applies to "${targetProperty}" — allowed range [${allowedTransform.range.min}, ${allowedTransform.range.max}]. Adjusting within bounds.`;
    }

    return `Direction received: "${direction.interpreted_direction}". Applying to current character profile.`;
  }

  private proposeAdjustment(
    direction: DirectionEvent,
    character: CharacterProfile,
  ): string {
    // Build a plain-language proposal
    switch (direction.category) {
      case 'tone':
        return `Shifting ${character.name}'s tone. Keeping the ${character.emotional_baseline.primary} baseline but adjusting the surface.`;
      case 'intensity':
        return `Moving intensity from ${character.intensity.toFixed(2)}. Let me find the right level.`;
      case 'pacing':
        return `Current cadence is ${character.cadence.tempo}. Adjusting to match direction.`;
      case 'emotion':
        return `Finding the emotional layer underneath. Current baseline: ${character.emotional_baseline.primary}.`;
      case 'accent':
        return `Accent is at ${character.accent_strength.toFixed(2)} strength. Adjusting.`;
      default:
        return `Let me try this with the adjusted direction applied.`;
    }
  }

  private generatePreviewText(
    originalLine: string,
    direction: DirectionEvent,
    character: CharacterProfile,
  ): string {
    // In a full implementation, this would call the NOIZYVOX voice synthesis engine
    // or one of the Creative Builder models (noizy-vox-architect).
    // For now, we return the original line with a direction marker.
    // The actual text transformation happens in the voice layer.
    return originalLine;
  }
}
