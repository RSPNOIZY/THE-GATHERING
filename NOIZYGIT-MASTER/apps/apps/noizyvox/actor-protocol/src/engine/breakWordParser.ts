/**
 * RSP001 ACTOR PROTOCOL — Break-Word Parser
 * 
 * Low-latency detection of the break-word.
 * When the actor says it, character drops instantly.
 * No delay. No confirmation. Immediate sovereignty.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// ─── PARSER CONFIG ───────────────────────────────────────

export interface BreakWordConfig {
  /** The exact break phrase (default: "break character") */
  phrase: string;
  /** Case sensitive matching (default: false) */
  case_sensitive: boolean;
  /** Allow the break-word to appear within a longer sentence (default: true) */
  allow_embedded: boolean;
  /** Fuzzy matching threshold — Levenshtein distance tolerance (default: 0 = exact) */
  fuzzy_tolerance: number;
  /** Alternative break phrases (e.g., "drop character", "out of character") */
  alternatives: string[];
}

const DEFAULT_CONFIG: BreakWordConfig = {
  phrase: 'break character',
  case_sensitive: false,
  allow_embedded: true,
  fuzzy_tolerance: 0,
  alternatives: ['drop character', 'out of character', 'step out'],
};

// ─── PARSE RESULT ────────────────────────────────────────

export interface BreakWordResult {
  detected: boolean;
  matched_phrase: string | null;
  match_type: 'exact' | 'alternative' | 'fuzzy' | 'none';
  position: number;  // character index where the match starts (-1 if none)
  latency_ms: number;
  remaining_text: string | null;  // text after the break-word, if any
}

// ─── LEVENSHTEIN DISTANCE ────────────────────────────────
// For fuzzy matching when tolerance > 0

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  
  return dp[m][n];
}

// ─── PARSER ──────────────────────────────────────────────

export class BreakWordParser {
  private config: BreakWordConfig;
  private allPhrases: string[];

  constructor(config?: Partial<BreakWordConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.allPhrases = [this.config.phrase, ...this.config.alternatives];
  }

  /**
   * Parse input text for the break-word.
   * Designed for low latency — checks exact match first, then alternatives, then fuzzy.
   */
  parse(input: string): BreakWordResult {
    const start = performance.now();
    const normalized = this.config.case_sensitive ? input : input.toLowerCase();

    // ── Pass 1: Exact primary phrase match ──
    const primaryPhrase = this.config.case_sensitive
      ? this.config.phrase
      : this.config.phrase.toLowerCase();

    const exactPos = this.findPhrase(normalized, primaryPhrase);
    if (exactPos !== -1) {
      return this.buildResult(true, this.config.phrase, 'exact', exactPos, start, input);
    }

    // ── Pass 2: Alternative phrase matches ──
    for (const alt of this.config.alternatives) {
      const altNorm = this.config.case_sensitive ? alt : alt.toLowerCase();
      const altPos = this.findPhrase(normalized, altNorm);
      if (altPos !== -1) {
        return this.buildResult(true, alt, 'alternative', altPos, start, input);
      }
    }

    // ── Pass 3: Fuzzy matching (if enabled) ──
    if (this.config.fuzzy_tolerance > 0) {
      const words = normalized.split(/\s+/);
      for (const phrase of this.allPhrases) {
        const phraseNorm = this.config.case_sensitive ? phrase : phrase.toLowerCase();
        const phraseWords = phraseNorm.split(/\s+/);
        
        // Sliding window over input words
        for (let i = 0; i <= words.length - phraseWords.length; i++) {
          const window = words.slice(i, i + phraseWords.length).join(' ');
          const dist = levenshtein(window, phraseNorm);
          if (dist <= this.config.fuzzy_tolerance) {
            const pos = normalized.indexOf(window);
            return this.buildResult(true, phrase, 'fuzzy', pos, start, input);
          }
        }
      }
    }

    // ── No match ──
    return this.buildResult(false, null, 'none', -1, start, input);
  }

  /**
   * Quick boolean check — for use in hot paths where you just need yes/no.
   */
  detect(input: string): boolean {
    const normalized = this.config.case_sensitive ? input : input.toLowerCase();
    
    for (const phrase of this.allPhrases) {
      const phraseNorm = this.config.case_sensitive ? phrase : phrase.toLowerCase();
      if (this.findPhrase(normalized, phraseNorm) !== -1) {
        return true;
      }
    }
    
    return false;
  }

  // ─── INTERNALS ───────────────────────────────────────

  private findPhrase(haystack: string, needle: string): number {
    if (this.config.allow_embedded) {
      return haystack.indexOf(needle);
    }
    // Strict mode: the entire input must be the break-word (trimmed)
    return haystack.trim() === needle ? 0 : -1;
  }

  private buildResult(
    detected: boolean,
    matched_phrase: string | null,
    match_type: 'exact' | 'alternative' | 'fuzzy' | 'none',
    position: number,
    startTime: number,
    originalInput: string,
  ): BreakWordResult {
    let remaining: string | null = null;
    if (detected && matched_phrase && position !== -1) {
      const afterBreak = originalInput.slice(position + matched_phrase.length).trim();
      remaining = afterBreak.length > 0 ? afterBreak : null;
    }

    return {
      detected,
      matched_phrase,
      match_type,
      position,
      latency_ms: performance.now() - startTime,
      remaining_text: remaining,
    };
  }
}
