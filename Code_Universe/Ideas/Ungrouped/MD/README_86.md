# April 17, 2026 — Deployment Ops Pack

Binding deployment of the NOIZY Empire consent kernel.
All operational artifacts for the launch window live here.

## Read order on launch day

1. [`00_APRIL17_CHECKLIST.md`](./00_APRIL17_CHECKLIST.md) — master checklist, open this first
2. [`01_waf_config.md`](./01_waf_config.md) — Cloudflare WAF + rate limiting rules
3. [`02_pretooluse_security_hook.sh`](./02_pretooluse_security_hook.sh) — Claude Code PreToolUse guard
4. [`03_c2pa_founding.js`](./03_c2pa_founding.js) — Signed C2PA manifest generator for the founding artifact
5. [`04_deploy_dryrun.sh`](./04_deploy_dryrun.sh) — Preflight without deploying
6. [`05_loadtest.js`](./05_loadtest.js) — k6 load test to 1000 req/min
7. [`06_rollback.sh`](./06_rollback.sh) — Restore to last-known-good in <5min
8. [`07_slack_webhook.js`](./07_slack_webhook.js) — Alert helper, import into canonical worker
9. [`08_dmca_template.md`](./08_dmca_template.md) — Enforcement templates (legal review required)
10. [`09_consent_policy.md`](./09_consent_policy.md) — Public policy for `noizy.ai/consent`

## Two unresolved gates before launch

1. **Worker reconciliation** — `heaven` worker marks `gabriel_db` DEAD; `noizy-app` binds it and declares `HEAVEN_VERSION=19.0.0`. Which is the canonical consent kernel? See checklist "BLOCKING PRE-LAUNCH RECONCILIATION".

2. **Fork exhaustion on GOD.local** — `ulimit -u` and `ps aux | wc -l`; kill runaway processes so `brew` and shell init stop erroring.

## Files with TODOs that need your judgment

- [`06_rollback.sh`](./06_rollback.sh) — abort thresholds (NC violations, 5xx count, p95 latency, ledger failures). Placeholders set; edit to your risk tolerance.
- [`07_slack_webhook.js`](./07_slack_webhook.js) — alert message format (blocks vs plain vs threaded). Current choice is blocks layout; change `buildBlocks` if you prefer another.

## After launch

Update this README with a "LAUNCHED" banner and link to the NOIZY Ledger tx hash of the founding event.
