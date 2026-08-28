# NOIZY EMPIRE — Email Matrix (redirect)

> **SUPERSEDED 2026-04-18.** The canonical source is [`ops/DNS_CORRECTNESS_PLAN.md`](../../ops/DNS_CORRECTNESS_PLAN.md).
>
> This file previously described a **Microsoft 365 / Outlook** primary-inbox architecture for the 6-brand email matrix, including a `noizyfish.ca` brand slot. Both are wrong under the ratified 2026-04-18 doctrine:
>
> - **Outlook M365 is being exited.** `rsplowman@outlook.com` is inactive/bouncing (see [`TASKS.md`](../../TASKS.md)) and slated for deletion under [`repos/the-gathering/apple-identity-master-plan.md`](../../repos/the-gathering/apple-identity-master-plan.md).
> - **The primary inbox is `rsplowman@icloud.com`** via Cloudflare Email Routing on each brand zone.
> - **The public-face address is `rsp@noizy.ai`** (universal NOIZY contact) — which, like every other alias, forwards through CF Email Routing → iCloud.
> - **`noizyfish.ca` is NOT registered and is not being registered.** The 5 canonical domains are `noizy.ai`, `noizyfish.com`, `fishmusicinc.com`, `noizykidz.com`, `noizyvox.com`.
>
> For the current email architecture, routing rules, DMARC baseline, and send-as options, read [`ops/DNS_CORRECTNESS_PLAN.md`](../../ops/DNS_CORRECTNESS_PLAN.md) and the per-zone files under [`infra/dns/zones/`](../../infra/dns/zones/).

_This stub intentionally replaces the prior content. Git history preserves the superseded version._
