# NOIZY Empire — DNS & Email Migration (redirect)

> **SUPERSEDED 2026-04-18.** The canonical source is [`ops/DNS_CORRECTNESS_PLAN.md`](../../ops/DNS_CORRECTNESS_PLAN.md).
>
> This file previously described a migration whose routing destination was **Outlook M365**. That assumption is no longer valid:
>
> - The **destination inbox** is `rsplowman@icloud.com`, reached via Cloudflare Email Routing on each brand zone (not via M365).
> - The **public-face address** is `rsp@noizy.ai`, which forwards to the iCloud inbox like every other alias.
> - **Outlook/M365 is being exited** — see [`TASKS.md`](../../TASKS.md) and [`repos/the-gathering/apple-identity-master-plan.md`](../../repos/the-gathering/apple-identity-master-plan.md).
> - The prior doc also referenced `noizy.com`, `noizybox.com`, and `noizyfish.ca` — **none of those are registered**. The 5 canonical domains are `noizy.ai`, `noizyfish.com`, `fishmusicinc.com`, `noizykidz.com`, `noizyvox.com`.
>
> For the active migration procedure (phased bleed-fix → registrar transfer → account consolidation → GoDaddy close), read [`ops/DNS_CORRECTNESS_PLAN.md`](../../ops/DNS_CORRECTNESS_PLAN.md).
>
> For zone-level DNS-as-code, read [`infra/dns/README.md`](../../infra/dns/README.md) and [`infra/dns/zones/*.zone`](../../infra/dns/zones/).

_This stub intentionally replaces the prior content. Git history preserves the superseded version._
