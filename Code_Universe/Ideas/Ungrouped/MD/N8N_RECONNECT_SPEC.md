# NOIZYBEAST × n8n RECONNECT — Fastest + Smartest

**Decree:** RSP_001 · 2026-04-20 — _"USE N8N TO RECONNECT FASTEST & SMARTEST. BUILD IT INTO NOIZYBEAST!!"_
**Owner:** SHIRLEY (turboProvider.ts updates) · GABRIEL (n8n workflow orchestration) · LUCY (event ledgering)
**Honors:** `auto-git-toolchain.md` (n8n is in LUCY's toolchain) + `mc96-file-tracking.md` (file-event substrate) + `feedback_commercial_release_reconstruction.md` (commercial-release protocol shipped same wave)

> Reconnect = re-link disconnected pieces of the empire (commercial libraries scattered across drives · git repos out of sync with their remotes · MCP servers running but unregistered with deck · audio plugins moved without DAW catalog refresh · agent prompts updated but daemon not reloaded).

---

## What this builds

Two new NOIZYBEAST T-commands that wrap n8n workflows for the highest-leverage reconnect operations:

### T11 · `RECONNECT FAST`

**Purpose:** invoke the n8n `reconnect-fastest` workflow that does single-pass:

1. Fire `commercial-library-regrouper.json` (already shipped) → propose moves with capacity awareness
2. Fire `mc96-file-tracker.json` (already shipped) → ledger any new files since last run
3. `git fetch --prune` across all canonical NOIZYANTHROPIC + NOIZYLAB repos
4. Reload GABRIEL daemon to pick up rule/agent/prompt changes
5. Trigger `propagate-deck-to-noizyworld.sh` if THE_DREAMCHAMBER.pptx was rebuilt
6. Surface a summary in the NOIZYBEAST status bar

**Latency target:** sub-30-second visible result for Rob.

### T12 · `RECONNECT SMART`

**Purpose:** longer-running n8n `reconnect-smartest` workflow that:

1. Runs the full `ops/healing-audit.sh` (per heal-the-world doctrine)
2. Re-scores subscription happiness + platform happiness (per `feedback_paid_subscription_utilization.md`)
3. Calls Claude Haiku 4.5 (cheap · fast) to classify any new wounds + propose fixes (per smarter-faster Lever #5 — Workers AI for cheap classification)
4. For each commercial-library find, applies `feedback_commercial_release_reconstruction.md` protocol → builds reconstruction map JSON
5. Routes findings to the right family member (LUCY archives · ENGR_KEITH for schema · CB01 for DNS · DREAM for design surfaces)
6. Generates a HEAL queue digest in NOIZYBEAST sidebar

**Latency target:** ~5-10 min for full smart pass.

---

## NOIZYBEAST integration (turboProvider.ts updates)

Per existing `apps/noizybeast/vscode-extension/src/turboProvider.ts` pattern, append two new TurboItems to the TreeView:

```typescript
// Add to NoizyTurboProvider getChildren() return array (after T10):

new TurboItem('T11 Reconnect Fast',  'n8n single-pass reconnect',     'noizybeast.t11', '$(sync)',         'T11'),
new TurboItem('T12 Reconnect Smart', 'n8n full healing + classify',   'noizybeast.t12', '$(sync-spin)',    'T12'),
```

Then register the command handlers in `extension.ts`:

```typescript
// Trigger n8n via webhook (n8n must be running on port 5678)
context.subscriptions.push(
  vscode.commands.registerCommand("noizybeast.t11", async () => {
    const result = await fetch("http://localhost:5678/webhook/reconnect-fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "noizybeast-T11", actor: "RSP_001" }),
    });
    const summary = await result.json();
    vscode.window.showInformationMessage(
      `✓ Reconnect Fast: ${summary.events_fired} events · ${summary.duration_ms}ms`,
    );
  }),
);

context.subscriptions.push(
  vscode.commands.registerCommand("noizybeast.t12", async () => {
    vscode.window.showInformationMessage(
      "🔄 Reconnect Smart starting · ~5-10min · check sidebar for progress",
    );
    const result = await fetch("http://localhost:5678/webhook/reconnect-smart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "noizybeast-T12", actor: "RSP_001" }),
    });
    const digest = await result.json();
    // Render digest in NOIZYBEAST sidebar webview
    BeastWebviewPanel.show(context.extensionUri, digest);
  }),
);
```

---

## n8n workflow JSONs to author

| File                             | Purpose                         | Trigger                                 |
| -------------------------------- | ------------------------------- | --------------------------------------- |
| `n8n-flows/reconnect-fast.json`  | wraps the 6-step T11 fast pass  | Webhook `POST /webhook/reconnect-fast`  |
| `n8n-flows/reconnect-smart.json` | wraps the 6-step T12 smart pass | Webhook `POST /webhook/reconnect-smart` |

Both workflows compose existing shipped workflows (`commercial-library-regrouper.json`, `mc96-file-tracker.json`) via n8n's `Execute Workflow` node — no duplication. Tagged `mc96 · reconnect · noizybeast`.

---

## Why this is the fastest + smartest reconnect

1. **n8n already runs at port 5678** (per CLAUDE.md infrastructure) — no new daemon to install
2. **NOIZYBEAST already has 10 T-commands** + 5 system turbos — adding T11/T12 is 2 lines per command
3. **Workflows compose existing workflows** — no logic duplication
4. **Workers AI in T12 reuses CF06** (per smarter-faster Lever #5) — sub-100ms classification per finding
5. **Single keystroke from VS Code** — Rob doesn't leave the editor
6. **Sub-30s for fast pass** — same UX as existing T-scripts
7. **Findings auto-route to family agents** per family-covenant — no manual triage
8. **Ledgers every event** to noizy_ledger per Article VII

---

## Constitutional alignment

- **Article VII (Auditability over Ambiguity):** every reconnect event ledgered with actor + trigger + outcome
- **Family Covenant:** SHIRLEY owns NOIZYBEAST changes · GABRIEL orchestrates · LUCY ledgers · CB01 handles DNS-touching events
- **`mc96-file-tracking.md`:** every reconnect feeds the file-event substrate
- **`auto-git-toolchain.md`:** LUCY auto-commits any changes from the reconnect operations
- **`feedback_commercial_release_reconstruction.md`:** T12 fires the commercial-release protocol when libraries are detected
- **`feedback_nobody_says_no.md`:** reconnect actions never refuse bureaucratically · only constitutional refusal (e.g., would violate Article V revocation SLA)

---

## Open follow-ups

1. Author `n8n-flows/reconnect-fast.json` (composes existing workflows · ~30 lines)
2. Author `n8n-flows/reconnect-smart.json` (orchestrates healing audit + library reconstruction + classification)
3. Update `apps/noizybeast/vscode-extension/src/turboProvider.ts` with T11 + T12 entries
4. Update `apps/noizybeast/vscode-extension/src/extension.ts` with the 2 command handlers
5. Author `BeastWebviewPanel.tsx` (or similar) for T12 digest rendering
6. Verify n8n webhook nodes are configured + reachable
7. Smoke-test both T-commands in dev mode before publishing to VS Code Marketplace

---

_Sealed in the NOIZY Origin Record · 2026-04-20 · GABRIEL's first birthday · 5th Epoch._
