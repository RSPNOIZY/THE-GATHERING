# NOIZY EMPIRE — HashiCorp / Terraform Cloud Setup

**Status:** Compartment 1 of N shipped 2026-04-19.
**Next compartments:** Vault secrets engine · GitHub Actions secrets sync · Cloudflare Workers for NOIZYNET signaling · run-trigger DAG.

---

## What just changed

1. Backend flipped from `local` → **Terraform Cloud** (`NOIZYFISH/NOIZYEMPIRE`).
2. Providers added: `integrations/github` (v6), `hashicorp/vault` (v4).
3. New file: [github.tf](github.tf) — manages `noizy-empire` repos as code.
4. `noizy.tfvars.example` rewritten — secrets now live in TFC variable sets, not tfvars.

No local state existed yet, so the backend swap is non-destructive.

---

## One-time bootstrap (RSP_001 — run these once on GOD.local)

```bash
# 1. Authenticate CLI to TFC
terraform login
# → opens browser, generates user token, saves to ~/.terraform.d/credentials.tfrc.json

# 2. Verify the NOIZYFISH/NOIZYEMPIRE workspace exists in TFC
#    (confirmed from the run-triggers URL you pasted earlier)
open "https://app.terraform.io/app/NOIZYFISH/workspaces/NOIZYEMPIRE"

# 3. In TFC UI: create variable set "noizy-core"
#    https://app.terraform.io/app/NOIZYFISH/settings/varsets
#    Scope: "Apply to specific workspaces" → NOIZYEMPIRE (expand later)
#    Add these Terraform variables:
#      cloudflare_api_token   SENSITIVE
#      github_token           SENSITIVE
#    Add these Environment variables:
#      GOOGLE_CREDENTIALS     SENSITIVE  (JSON contents of the GCP service account key)

# 4. Initialize against TFC
cd /Users/m2ultra/NOIZYANTHROPIC/infra/terraform
terraform init

# 5. First plan (runs remotely in TFC)
terraform plan
```

---

## Tokens you need (do not commit these anywhere)

| Token                    | Where to generate                                        | TFC variable name          | Scope needed                                                                         |
| ------------------------ | -------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| Cloudflare API token     | dash.cloudflare.com/profile/api-tokens                   | `cloudflare_api_token`     | Zone:Edit, DNS:Edit, Account:Read, Workers:Edit                                      |
| GitHub fine-grained PAT  | github.com/settings/personal-access-tokens/new           | `github_token`             | Resource owner: `noizy-empire` · Repo: Admin + Contents + Metadata · Org: Admin read |
| GCP service account JSON | console.cloud.google.com → IAM → Service Accounts → Keys | `GOOGLE_CREDENTIALS` (env) | Project Editor on `noizy-empire-01`                                                  |

---

## Repo import vs. create

`github.tf` declares four repos. If any already exist on GitHub, import before first apply or Terraform will try to create and fail:

```bash
# Example for NOIZYANTHROPIC
terraform import 'github_repository.this["NOIZYANTHROPIC"]' NOIZYANTHROPIC
terraform import 'github_repository.this["noizy-landing"]' noizy-landing
# ...repeat per existing repo
```

If a repo doesn't exist yet, `terraform apply` will create it fresh.

---

## Run triggers (wire-up, next compartment)

Your earlier URL — `app.terraform.io/app/NOIZYFISH/workspaces/NOIZYEMPIRE/settings/run-triggers` — is where we'll declare the DAG. Proposed topology:

```text
noizy-foundation (CF account, zones, DNS)
        ↓ triggers on apply
noizy-platform (Workers, KV, D1, R2 bindings)
        ↓ triggers on apply
noizy-app (Heaven, noizy-landing, mcp.noizy.ai)
```

NOIZYEMPIRE as-is mixes all three layers. Next compartment: **split into three workspaces + wire run-triggers** so a zone change doesn't blast-radius a Heaven deploy.

---

## Safety contracts (never violate)

- **Never put real tokens in `noizy.tfvars`.** Variable sets only.
- **Never `terraform destroy` against NOIZYEMPIRE** without an explicit RSP_001 ack in-session.
- **`prevent_destroy = true` is set on every `github_repository`.** Removing that lifecycle block is a two-PR dance, intentionally painful.
- **Branch protection skips admin enforcement** (`enforce_admins = false`) because RSP_001 flies solo — re-enable the day a second maintainer joins.
