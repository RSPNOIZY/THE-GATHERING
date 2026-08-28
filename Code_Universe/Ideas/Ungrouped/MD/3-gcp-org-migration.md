# GCP — Move stray AI Studio project into `rspnoizy-org`

Target: project `gen-lang-client-0956858309` (auto-created by Google AI Studio, currently sits OUTSIDE `rspnoizy-org`).

---

## STEP 1 — Find your org ID

```bash
gcloud organizations list
```

Expected output:

```
DISPLAY_NAME   ID              DIRECTORY_CUSTOMER_ID
rspnoizy-org   123456789012    C0abcdefg
```

Copy the numeric `ID` (12 digits).

---

## STEP 2 — Verify you have permissions

You need **two** IAM roles for this to work:

- On the **source project** (`gen-lang-client-0956858309`): `roles/resourcemanager.projectMover` OR Owner
- On the **destination org** (`rspnoizy-org`): `roles/resourcemanager.projectCreator` AND `roles/resourcemanager.organizationAdmin`

Check:

```bash
# Are you org admin?
gcloud organizations get-iam-policy <ORG_ID> \
  --format="value(bindings.members)" | grep "user:rsp@noizy.ai"

# Are you project owner?
gcloud projects get-iam-policy gen-lang-client-0956858309 \
  --format="value(bindings.members)" | grep "user:rsp@noizy.ai"
```

If either returns empty → you need to grant yourself the role from the Cloud Console first.

---

## STEP 3 — Move the project

```bash
# Set these vars once
export ORG_ID=<paste-org-id-from-step-1>
export PROJECT_ID=gen-lang-client-0956858309

# Move it
gcloud projects move "$PROJECT_ID" --organization="$ORG_ID"
```

Prompt will say:
```
Your project will be moved from [No Organization] to organization [rspnoizy-org].
Do you want to continue (Y/n)?
```

Type `Y`.

---

## STEP 4 — Verify the move

```bash
gcloud projects describe "$PROJECT_ID" --format="value(parent.type,parent.id)"
# Expected: organization    <your-org-id>
```

Also check in the Cloud Console — the "Not current" flag you saw earlier should be gone. The project now appears in the `rspnoizy-org` tree.

---

## STEP 5 — Enable the API (if you want Gemini Code Assist)

Now that it's in the org, enable the Cloud AI Companion API properly:

```bash
gcloud services enable cloudaicompanion.googleapis.com --project="$PROJECT_ID"
```

---

## STEP 6 — Consider renaming

AI Studio projects have ugly auto-generated names. Rename:

```bash
gcloud projects update "$PROJECT_ID" --name="noizy-ai-studio"
```

(The project **ID** stays the same — `gen-lang-client-0956858309` — but the display name becomes `noizy-ai-studio`. You can only rename, not change the ID.)

---

## OPTIONAL — Find any OTHER stray projects

If you suspect there are more AI-Studio-auto-created projects floating around:

```bash
# All projects you can see, grouped by parent
gcloud projects list --format="table(projectId, name, parent.type, parent.id)"

# Filter to projects with NO parent (floating outside any org)
gcloud projects list --filter="-parent:*" --format="table(projectId, name)"
```

Move each one into `rspnoizy-org` the same way.

---

## 🚨 Foot-guns

- **Billing account:** if the floating project is attached to a personal billing account, moving it to the org does NOT change the billing link. Re-link to the org's billing account afterward via Cloud Console → Billing → Link billing account.
- **IAM inheritance:** after the move, the project inherits org-level IAM policies. If you had permissive IAM at project level, review it — the org may be stricter.
- **Project quotas:** quotas are project-scoped, not org-scoped. Nothing changes post-move. Good news: your work continues uninterrupted.
