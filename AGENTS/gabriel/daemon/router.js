/**
 * Model routing — picks the right Claude model for each task shape.
 *
 * Defaults (overridable via env):
 *   FAST  → claude-haiku-4-5-20251001     status, lookups, voice (<3s)
 *   NORM  → claude-sonnet-4-6             normal dev work (default)
 *   HEAVY → claude-opus-4-7               deep reasoning, architecture
 */
/**
 * Memcell doctrine (updated 2026-05-18 by RSP_001):
 *   "MAKE GABRIEL AS POWERFUL & INTELLIGENT & ASSISTIVE AS YOU ARE" → max-out tier.
 *   Supersedes the 2026-04-18 pin that held Sonnet-4 / Opus-4 (May 2025 models).
 *
 * Current approved tier (RSP-ratified 2026-05-18):
 *   FAST  → claude-haiku-4-5-20251001     status, lookups, voice (<3s)
 *   NORM  → claude-sonnet-4-6             normal dev work (default)
 *   HEAVY → claude-opus-4-7               deep reasoning, architecture (1M context available)
 *
 * Override via env only if RSP_001 explicitly approves. When in doubt, leave defaults
 * (which now equal what Rob runs in Claude Code · "as powerful as you").
 */
export const MODELS = {
    FAST: process.env.GABRIEL_FAST_MODEL || "claude-haiku-4-5-20251001",
    NORM: process.env.GABRIEL_DEFAULT_MODEL || "claude-sonnet-4-6",
    HEAVY: process.env.GABRIEL_HEAVY_MODEL || "claude-opus-4-7",
};
const FAST_SIGNALS = [
    /^\/?status\b/i,
    /^\/?health\b/i,
    /^\/?time\b/i,
    /^\/?date\b/i,
    /^\/?days\b/i,
    /how many days/i,
    /^what time/i,
    /\bquick\b/i,
    /\bfast\b/i,
];
const HEAVY_SIGNALS = [
    /architect|architecture|design the|refactor the whole/i,
    /strateg(y|ize|ic)/i,
    /10[- ]?year|long[- ]?arc/i,
    /\bdeep(?:ly)? (?:think|reason|analy[sz]e)\b/i,
    /\breason (?:carefully|deeply|hard)\b/i,
    /think step by step/i,
];
/**
 * Route a turn to the right model. Explicit `hint` wins over inference.
 * Voice inputs always go FAST (sub-3s TTS target).
 */
export function route(input, hint, isVoice = false) {
    if (hint)
        return MODELS[hint];
    if (isVoice)
        return MODELS.FAST;
    if (FAST_SIGNALS.some((re) => re.test(input)))
        return MODELS.FAST;
    if (HEAVY_SIGNALS.some((re) => re.test(input)))
        return MODELS.HEAVY;
    return MODELS.NORM;
}
export function tierOf(model) {
    if (model === MODELS.FAST)
        return "FAST";
    if (model === MODELS.HEAVY)
        return "HEAVY";
    return "NORM";
}
//# sourceMappingURL=router.js.map