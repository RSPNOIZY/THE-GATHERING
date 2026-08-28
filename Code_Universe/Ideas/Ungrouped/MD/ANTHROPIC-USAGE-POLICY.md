# NOIZY.AI — Anthropic / Claude Usage Policy

**Author:** Robert Stephen Plowman
**Date:** 2026-04-13
**Applies to:** All NOIZY.AI systems, agents, and automation workflows

---

## 1. SUBSCRIPTION vs. API — The Hard Line

Anthropic enforces a clear boundary between subscription and programmatic access:

**Claude Max (subscription at claude.ai / Cowork):**
- For human-in-the-loop use only
- Cannot be accessed through third-party agent frameworks
- Cannot be used for automated pipelines
- Used for: interactive development, Cowork sessions, manual research, architecture

**Anthropic API (pay-per-token):**
- For programmatic access, automation, and agent systems
- Requires API keys from console.anthropic.com
- Used for: n8n workflows, custom NOIZY agents, automated consent reasoning, batch processing

**This is not optional.** Using Claude Max subscription tokens in automated systems violates Anthropic's Terms of Service.

## 2. Where Each Mode Is Used in NOIZY.AI

### Claude Max / Cowork (Human Interactive)
- HEAVEN development and deployment
- Architecture planning and code review
- Compliance audits and document generation
- Postman collection design
- Infrastructure debugging
- Artist communications drafting (with human review)

### Anthropic API (Automated / Agent)
- gabriel-mcp agent orchestration
- n8n workflow AI nodes (consent reasoning)
- Automated consent clause analysis
- Batch voice print analysis
- Scheduled compliance monitoring
- CI/CD code review via GitHub Actions

## 3. API Key Management

- API keys stored in Cloudflare Worker secrets (never in source code)
- n8n credential store (encrypted at rest on GOD.local)
- GitHub Actions secrets for CI workflows
- Never in KV, D1, or any queryable store
- Rotated quarterly at minimum

## 4. Model Selection for NOIZY Agents

| Task | Model | Reasoning |
|------|-------|-----------|
| Consent clause analysis | Claude Opus | Requires nuanced legal reasoning |
| Agent orchestration | Claude Sonnet | Good balance of speed and capability |
| Simple routing/triage | Claude Haiku | Fast, cost-effective for routing decisions |
| Code generation in CI | Claude Sonnet | Best code quality per token cost |
| Batch text processing | Claude Haiku | Volume processing at lowest cost |

## 5. Cost Controls

- Set monthly API budget alerts at $50, $100, $250
- Use prompt caching for repeated consent templates
- Use Batch API for non-urgent processing (50% cost reduction)
- Monitor token usage via Anthropic dashboard weekly
- Prefer local Ollama models (gemma3, deepseek-r1) for tasks that don't require Claude-level reasoning

## 6. Data Handling with Anthropic API

- Never send raw PII (email addresses, names) to the API
- Pseudonymize or hash personal data before sending
- Use Anthropic's zero-data-retention option for sensitive workloads
- Consent token IDs are safe to send (they're random UUIDs, not PII)
- Voice prints are NEVER sent to cloud AI — they stay on GOD.local with Ollama

## 7. Anthropic Projects (claude.ai)

Claude Projects provide persistent context for different work streams:

| Project | Purpose |
|---------|---------|
| NOIZY.AI Core | HEAVEN development, architecture, consent engine |
| NOIZY Legal | Compliance, contracts, privacy law |
| NOIZY Creative | DreamChamber, voice demos, content production |
| NOIZY Business | Strategy, investor materials, market analysis |

Projects support enhanced knowledge (RAG beyond context limits on Max plan) and custom instructions that persist across conversations.

---

*This policy reflects Anthropic's Terms of Service as of April 2026.*
*Reviewed and authored by Robert Stephen Plowman.*
