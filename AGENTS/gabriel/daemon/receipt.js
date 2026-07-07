// NOIZY Empire — Universal Receipt Contract
// PLOWMAN STANDARD: every command path emits one NOIZYReceipt.
// Every failure is also a receipt. No silent execution.
// Five-verb grammar: GOVERN | CAPTURE | RECALL | ORBIT | FORGE
import { randomUUID } from "node:crypto";
// ── Five-Verb Classifier ───────────────────────────────────────────────────
// Rule: boss identity takes precedence. Verb suffix is fallback.
// If neither matches, defaults to FORGE (execution is always Forge if unclear).
const BOSS_VERB_MAP = {
    // GOVERN — authority, consent, permissions, kill switch, Never Clauses
    consent_auditor: "GOVERN",
    maintenance: "GOVERN",
    // CAPTURE — ingest, store, archive, record
    lucy: "CAPTURE",
    // RECALL — retrieve, query, status, list
    gabriel: "RECALL",
    engr_keith: "RECALL",
    ollama: "RECALL",
    rag: "RECALL",
    sql: "RECALL",
    context: "RECALL",
    // ORBIT — broadcast, publish, distribute, notify
    publisher: "ORBIT",
    noizyarmy: "ORBIT",
    nodered: "ORBIT",
    // FORGE — synthesize, generate, build, transform, execute
    dream: "FORGE",
    voice_specialist: "FORGE",
    ai_gateway: "FORGE",
    cohere: "FORGE",
    openclaw: "FORGE",
    cb01: "FORGE",
    // FORGE — these agents act
    pops: "ORBIT", // family communications
    shirl: "GOVERN", // file management authority
    shirley: "GOVERN",
    test_runner: "RECALL",
    stubs: "RECALL",
};
// Verb-suffix fallback rules (applied when boss not in map above)
const VERB_SUFFIX_MAP = [
    ["govern", "GOVERN"],
    ["grant", "GOVERN"],
    ["revoke", "GOVERN"],
    ["audit", "GOVERN"],
    ["consent", "GOVERN"],
    ["ingest", "CAPTURE"],
    ["record", "CAPTURE"],
    ["store", "CAPTURE"],
    ["archive", "CAPTURE"],
    ["capture", "CAPTURE"],
    ["get", "RECALL"],
    ["list", "RECALL"],
    ["status", "RECALL"],
    ["search", "RECALL"],
    ["recall", "RECALL"],
    ["query", "RECALL"],
    ["fetch", "RECALL"],
    ["broadcast", "ORBIT"],
    ["publish", "ORBIT"],
    ["notify", "ORBIT"],
    ["orbit", "ORBIT"],
    ["announce", "ORBIT"],
    ["send", "ORBIT"],
    ["synthesize", "FORGE"],
    ["generate", "FORGE"],
    ["build", "FORGE"],
    ["forge", "FORGE"],
    ["transform", "FORGE"],
    ["run", "FORGE"],
    ["execute", "FORGE"],
];
export function classifyVerb(boss, bossVerb) {
    if (BOSS_VERB_MAP[boss])
        return BOSS_VERB_MAP[boss];
    const lower = bossVerb.toLowerCase();
    for (const [suffix, verb] of VERB_SUFFIX_MAP) {
        if (lower.includes(suffix))
            return verb;
    }
    return "FORGE"; // default: execution
}
// Bosses whose intents touch consent state and require a consent_required flag
const CONSENT_BOSSES = new Set(["consent_auditor", "voice_specialist", "dream"]);
const CONSENT_VERBS = ["synthesize", "generate", "voice", "consent", "grant", "revoke"];
function needsConsent(boss, bossVerb) {
    if (CONSENT_BOSSES.has(boss))
        return true;
    const lower = bossVerb.toLowerCase();
    return CONSENT_VERBS.some((v) => lower.includes(v));
}
export function makeReceipt(input) {
    const { boss, bossVerb, actor, surface, correlation_id, duration_ms, result } = input;
    const { ok, ack_message, error, ...payload } = result;
    return {
        receipt_id: randomUUID(),
        ts: new Date().toISOString(),
        verb: classifyVerb(boss, bossVerb),
        boss,
        boss_verb: bossVerb,
        actor,
        surface,
        status: ok ? "OK" : "FAIL",
        duration_ms,
        consent_required: needsConsent(boss, bossVerb),
        correlation_id,
        ...(ok ? { payload, ack_message } : { error: error ?? "unknown error" }),
    };
}
// ── Receipt serializer (for logs, ledger, DAZEFLOW) ───────────────────────
export function receiptToLog(r) {
    return `[${r.ts}] ${r.verb} ${r.boss}.${r.boss_verb} → ${r.status} (${r.duration_ms}ms) [${r.receipt_id}]`;
}
//# sourceMappingURL=receipt.js.map