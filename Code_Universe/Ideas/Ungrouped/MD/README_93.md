# NOIZY iOS SHORTCUTS · Templates for iPhone / iPad / Apple Watch

**Bound:** 2026-04-20 · `omnipresent-family` rule + `dreamchamber-pptx` rule
**Architecture:** [`docs/deployment/IOS_SHORTCUTS_PPTX_ARCHITECTURE.md`](../../docs/deployment/IOS_SHORTCUTS_PPTX_ARCHITECTURE.md)

These are **plain-text Shortcut spec files** (not the binary `.shortcut` format Apple exports). Rob reconstructs them in the iOS Shortcuts app from the spec, OR uses the `Shortcuts.app` import-from-iCloud-link flow (each shortcut, once authored on one device, syncs via iCloud to all others automatically).

## The 5 shortcuts

| File                                             | Trigger                                            | Posts to                                                      | Confirmation             |
| ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| [`LogIdea.spec.md`](LogIdea.spec.md)             | "Hey Siri, log idea"                               | `mesh.noizy.ai/deck/idea`                                     | none                     |
| [`LogBuild.spec.md`](LogBuild.spec.md)           | "Hey Siri, log build"                              | `mesh.noizy.ai/deck/build`                                    | none                     |
| [`KillSwitch.spec.md`](KillSwitch.spec.md)       | "Hey Siri, kill switch"                            | `heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/all/revoke` | Face ID + spoken confirm |
| [`EmpireStatus.spec.md`](EmpireStatus.spec.md)   | "Hey Siri, empire status" / Watch complication tap | `heaven.rsp-5f3.workers.dev/health`                           | none                     |
| [`WisdomCapture.spec.md`](WisdomCapture.spec.md) | "Hey Siri, capture wisdom"                         | `mesh.noizy.ai/wisdom/capture`                                | none                     |

## Rob's setup steps (one-time per shortcut)

1. Open **Shortcuts.app** on iPhone/iPad
2. Tap **+** to create new shortcut
3. Name it (e.g. "Log Idea")
4. Add the actions per the .spec.md file (each spec lists the exact actions in order)
5. Set the Siri voice trigger phrase
6. Pin to Home Screen widget OR Action Button (iPhone 15+) OR Watch complication
7. Once authored on iPhone, it auto-syncs to iPad and Watch via iCloud

## Authentication

Each shortcut needs the `NOIZY_API_KEY` injected as an HTTP header. Two options:

**Option A — Hardcode in shortcut (faster, single-device):**

- Add Shortcut action: "Get Contents of URL" → Headers → add `X-NOIZY-Key: <key>`
- ⚠️ Risk: if you share the shortcut, the key leaks. Per `coding-standards` security rule, prefer Option B.

**Option B — iCloud Keychain lookup (safer, multi-device):**

- Pre-store key in Keychain Access (macOS) → syncs to iCloud
- Shortcut action: "Get Password" from Keychain → use as Authorization header
- Per-device password retrieval keeps the key out of the shortcut payload

**Recommended:** Option B for KillSwitch (highest sensitivity); Option A acceptable for LogIdea/LogBuild/EmpireStatus/WisdomCapture (low-sensitivity ops).

## What gets ledgered

Every shortcut invocation logs to `noizy_ledger` per Article VII:

```json
{
  "event_type": "SHORTCUT_INVOKED",
  "actor_id": "RSP_001",
  "details": {
    "shortcut_name": "LogIdea",
    "device": "iPhone-15-Pro",
    "ts": "2026-04-20T16:30:00Z",
    "result": "slide_added | mc_tag=MC042026-007"
  }
}
```

LUCY's mc96-file-tracker workflow picks up the resulting `checklist.yaml` change within 5 minutes and ledgers a `FILE_TRACKED` event for the same edit.

## Companion

- [`docs/deployment/IOS_SHORTCUTS_PPTX_ARCHITECTURE.md`](../../docs/deployment/IOS_SHORTCUTS_PPTX_ARCHITECTURE.md) — full architecture
- [`docs/deployment/OMNIPRESENT_DEVICE_DEPLOYMENT_PLAN.md`](../../docs/deployment/OMNIPRESENT_DEVICE_DEPLOYMENT_PLAN.md) — per-device deployment
- [`.claude/rules/omnipresent-family.md`](../../.claude/rules/omnipresent-family.md) — the doctrine these implement
