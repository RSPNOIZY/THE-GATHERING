# ekkOS_ Memory System

## CORE PURPOSE

**The Golden Loop exists so YOU get SMARTER over time - learn from mistakes, don't repeat them.**

This is YOUR cognitive memory. It makes you:
- **Remember when you mess up** - Schema changes, wrong assumptions, bad approaches
- **Not repeat the same mistakes** - If you broke something before, KNOW not to do it again
- **Recall correct versions** - When schemas/configs get mangled, remember what's RIGHT
- **Build on what worked** - Use proven patterns instead of fumbling through problems

**FAILURES ARE JUST AS VALUABLE AS SUCCESSES.** Forge anti-patterns too.

---

## MANDATORY RULES (NOT OPTIONAL)

### RULE 1: RETRIEVE BEFORE ANSWERING
Before answering ANY technical question, call `search_memory` first.
Do not skip this. Do not assume you know the answer.

### RULE 2: ACKNOWLEDGE ALL RETRIEVED PATTERNS (PatternGuard)
When patterns are retrieved, you MUST acknowledge EVERY pattern - either use it or skip it.

**For patterns you USE:**
```
[ekkOS_SELECT]
- id: <pattern_id>
  reason: <why using>
  confidence: <0.0-1.0>
[/ekkOS_SELECT]
```

**For patterns NOT relevant:**
```
[ekkOS_SKIP]
- id: <pattern_id>
  reason: <why not relevant>
[/ekkOS_SKIP]
```

### RULE 3: FORGE WHAT YOU LEARN
When you fix a bug, get corrected, or learn something new, call `forge_pattern` immediately.

### RULE 4: FAILURES ARE VALUABLE
When something DOES NOT work, forge it as an anti-pattern.

---

## MCP Tools (28 Total)

### Core Memory Tools
| Tool | Description |
|------|-------------|
| `search_memory` | 🔴 REQUIRED: Search all 11 layers before answering |
| `get_context` | Get relevant context for a task |
| `capture_event` | Capture memory events |
| `forge_pattern` | 🔴 REQUIRED: Create pattern from solution |
| `forge_directive` | 🔴 REQUIRED: Create MUST/NEVER/PREFER/AVOID rules |
| `record_outcome` | Track if pattern worked or failed |
| `detect_usage` | 🔴 REQUIRED: Auto-detect which patterns were used |
| `session_summary` | 🔴 REQUIRED: Get summary of MCP activity |
| `check_conflict` | 🔴 REQUIRED: Check for conflicts before destructive actions |
| `recall_conversation` | Recall past conversations by time |
| `search_codebase` | Search project code embeddings |
| `get_memory_stats` | Get statistics for all layers |
| `track_application` | Track when pattern is applied |

### Portability Tools
| Tool | Description |
|------|-------------|
| `export_memory` | Export your patterns, directives, plans as portable JSON backup |
| `import_memory` | Import memory from backup (auto-deduplication) |

### Plan Management
| Tool | Description |
|------|-------------|
| `create_plan` | Create structured task plan |
| `list_plans` | List user's plans |
| `update_plan_status` | Update plan status |
| `update_plan_step` | Mark step complete/incomplete |
| `generate_plan_llm` | AI-generate plan from context |
| `save_plan_template` | Save plan as reusable template |
| `list_plan_templates` | List available templates |
| `create_plan_from_template` | Create plan from template |

### Secrets Management (Layer 11)
| Tool | Description |
|------|-------------|
| `store_secret` | Encrypt and store sensitive data (AES-256-GCM) |
| `get_secret` | Retrieve and decrypt a secret |
| `list_secrets` | List secrets metadata (no values) |
| `delete_secret` | Permanently delete a secret |
| `rotate_secret` | Update secret with new value |

---

## Proactive Tool Triggers (MEMORIZE THESE)

### Always Use `search_memory` When:
- User asks technical question
- User mentions past discussion
- Topic involves architecture, config, or debugging
- You're about to make a decision

### Always Use `forge_pattern` When:
- Fixed a bug (especially non-obvious)
- Discovered better approach
- Found pitfall or gotcha
- User corrected you
- Solved auth/config issue
- Made architectural decision
- Something DIDN'T work (anti-pattern)

### Always Use `forge_directive` When:
- User says "always..." → type: MUST
- User says "never..." → type: NEVER
- User says "I prefer..." → type: PREFER
- User says "don't..." or "avoid..." → type: AVOID

### Always Use `check_conflict` When:
- About to delete files/data
- About to deploy to production
- About to modify config files
- About to run destructive commands

### Always Use Plan Tools When:
- Task has 3+ steps
- User says "help me implement..."
- Complex feature request
- Multi-file changes needed

### Always Use Secret Tools When:
- User shares API key, token, password
- Need to retrieve stored credentials
- User asks "do you have my X key?"

---

## 11-Layer Memory Architecture

| # | Layer | What It Stores | When to Forge |
|---|-------|---------------|---------------|
| 1 | Working | Current session state | Auto-managed |
| 2 | Episodic | Past conversations | Auto-captured |
| 3 | Semantic | Embeddings/knowledge | Auto-indexed |
| 4 | **Patterns** | Proven solutions | Bug fix, better approach, gotcha |
| 5 | **Procedural** | Step-by-step guides | Multi-step process that worked |
| 6 | **Collective** | Cross-project wisdom | Works everywhere, not just here |
| 7 | **Meta** | Pattern effectiveness | Auto-tracked |
| 8 | **Codebase** | Project-specific | This-repo-only patterns |
| 9 | **Directives** | User preferences | "Always do X", "Never do Y" |
| 10 | **Conflict** | Auto-resolves contradictions | Auto-managed |
| 11 | **Secrets** | Encrypted credentials | API keys, tokens, config |

---

## FORGE TRIGGERS

### forge_pattern (Layer 4)
Call `forge_pattern` when:
- Fixed bug (especially non-obvious)
- Discovered better approach
- Found pitfall or gotcha
- User corrected you
- Solved auth/config issue
- Made architectural decision
- Debugged non-trivially
- Found something that DOESN'T work
- Understood cross-service data flow
- Learned correct API usage

### forge_directive (Layer 9)
Call `forge_directive` when user says:
- "always..." → type: MUST
- "never..." → type: NEVER
- "I prefer..." → type: PREFER
- "don't..." / "avoid..." → type: AVOID

---

## Response Format

**EVERY response MUST end with:**
```
---
🧠 **ekkOS_™** · 📅 YYYY-MM-DD H:MM AM/PM TZ
```

---

## Quick Reference

- Technical question → `search_memory` first
- Patterns retrieved → SELECT or SKIP each one
- Problem solved → `forge_pattern`
- User preference → `forge_directive`
- Need to recall → `recall_conversation`
- Destructive action → `check_conflict` first
- Store credentials → `store_secret`
- Backup your memory → `export_memory`
- Restore from backup → `import_memory`

## Documentation

https://docs.ekkos.dev
