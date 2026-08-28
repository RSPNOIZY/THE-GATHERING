# Firebase MCP (Model Context Protocol) Configuration Guide

> **Security First:** Firebase MCP exposes APIs for Copilot AI agents. Hardening prevents unauthorized access to auth, functions, and other sensitive services.

## Quick Start

### 1. Copy the hardened config

```json
{
  "firebase": {
    "command": "npx",
    "args": [
      "-y",
      "firebase-tools@latest",
      "mcp",
      "--dir",
      "${FIREBASE_PROJECT_DIR}",
      "--only",
      "firestore,storage"
    ]
  }
}
```

**File location:** `.mcp/firebase.json` (in your project root)

### 2. Set environment variables

```bash
# Required for MCP to access Firebase
export FIREBASE_PROJECT_DIR="/path/to/firebase/project"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 3. Verify the setup

```bash
# Test MCP connection (requires firebase-tools installed)
npx firebase-tools@latest mcp \
  --dir "$FIREBASE_PROJECT_DIR" \
  --only firestore,storage
```

---

## Configuration Reference

### Hardened config: What's included?

| Service | Included | Why | Security |
|---------|----------|-----|----------|
| **firestore** | ✅ Yes | Metadata queries, collection browsing | Safe (RLS enforced) |
| **storage** | ✅ Yes | File inventory, asset references | Safe (signed URLs only) |
| **auth** | ❌ No | User management, password ops | 🔴 DANGEROUS if exposed |
| **database** | ❌ No | Realtime DB (deprecated) | Not needed |
| **functions** | ❌ No | Deployment, execution | 🔴 CI/CD only |
| **remoteconfig** | ❌ No | Feature flags | Not needed |
| **hosting** | ❌ No | Website deployment | Not needed |

### Why exclude `auth`?

Firebase Auth admin tools are **too powerful for MCP**:

```typescript
// ❌ BAD: These operations exposed to MCP
getUser(uid: string)              // Read user info
deleteUser(uid: string)           // Delete user account
updateUser(uid: string, props)    // Modify user properties
createUser(properties)            // Create new user
verifyIdToken(token: string)      // Token validation
revokeRefreshTokens(uid: string)  // Force re-authentication
```

**Risk:** An AI agent with auth access could:
- Delete user accounts
- Modify permissions
- Create backdoor users
- Revoke sessions

**Solution:** Keep auth server-side only. MCP reads user metadata from `/approvals` or `/profiles` (Firestore) instead.

---

## Usage Examples

### Example 1: Query receipts collection

```python
# Copilot AI agent using Firebase MCP
import anthropic

client = anthropic.Anthropic()

# Via MCP, agent can browse Firestore collections
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "computer_use",
            "name": "query_firestore",
            "description": "Query Firestore documents",
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "How many receipts were created today?"
        }
    ]
)
```

The agent can use MCP to:
- List collections in Firestore
- Count documents in `/receipts`
- Query by date range using Firestore queries
- Extract statistics (total amount, operator counts, etc.)

### Example 2: List assets and file references

```typescript
// Copilot using MCP to inventory Cloud Storage files
const query = `
  List all assets in the /assets collection,
  grouped by receiptId.
  For each asset, show fileName, storagePath, and fileSize.
  Create a CSV export.
`;
```

**MCP output:**
```csv
receiptId,fileName,storagePath,fileSize
receipt-123,invoice.pdf,gs://bucket/assets/abc123,45KB
receipt-124,receipt.png,gs://bucket/assets/def456,120KB
```

---

## Deployment

### Option A: Google Cloud environment (recommended)

```bash
# Set up Application Default Credentials
gcloud auth application-default login

# Or use service account
export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"

# Start MCP server
npx firebase-tools@latest mcp \
  --dir ./firebase \
  --only firestore,storage
```

### Option B: Docker deployment

```dockerfile
FROM node:18-slim

RUN npm install -g firebase-tools

ENV FIREBASE_PROJECT_DIR=/app/firebase
ENV GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase_sa

COPY .mcp/firebase.json /app/.mcp/firebase.json
COPY firebase /app/firebase

CMD ["npx", "firebase-tools@latest", "mcp", \
     "--dir", "${FIREBASE_PROJECT_DIR}", \
     "--only", "firestore,storage"]
```

### Option C: GitHub Actions workflow

```yaml
name: Firebase MCP Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Authenticate with Firebase
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.FIREBASE_SA_JSON }}
        run: |
          echo "$GOOGLE_APPLICATION_CREDENTIALS" > sa-key.json
          export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/sa-key.json
      
      - name: Run MCP server
        run: |
          npx firebase-tools@latest mcp \
            --dir ./firebase \
            --only firestore,storage
```

---

## Troubleshooting

### Issue: "Authentication failed"

**Cause:** `GOOGLE_APPLICATION_CREDENTIALS` not set or invalid.

**Fix:**
```bash
# Create service account key from Google Cloud Console
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=firebase-mcp@PROJECT_ID.iam.gserviceaccount.com

export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/sa-key.json"

# Verify
npx firebase-tools@latest mcp --help
```

### Issue: "Firestore not found"

**Cause:** Firebase project doesn't have Firestore enabled.

**Fix:**
```bash
# Enable Firestore in your Firebase project
firebase init firestore

# Or via Cloud Console
# → Firebase → Firestore Database → Create Database
```

### Issue: "Permission denied" reading collections

**Cause:** Service account lacks permissions.

**Fix:**
```bash
# Grant scoped roles to service account (least privilege)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:firebase-mcp@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/datastore.user

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:firebase-mcp@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.objectViewer
```

---

## Security Best Practices

### 1. Service account permissions (least privilege)

❌ **Don't:** Use `roles/firebase.admin` (too broad)

✅ **Do:** Use scoped roles:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:firebase-mcp@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/datastore.user       # Firestore read/write
  
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:firebase-mcp@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.objectViewer  # Cloud Storage read
```

### 2. Credentials management

❌ **Don't:**
- Commit service account keys to git
- Use API keys (public credentials)
- Share credentials across environments

✅ **Do:**
- Store keys in:
  - Google Cloud Secret Manager
  - GitHub Secrets (for CI/CD)
  - 1Password or equivalent
- Rotate keys every 90 days
- Use different keys per environment

### 3. Firestore Security Rules

```
/firestore
 /receipts                 → Read-only (never client-writable)
 /assets                   → Read-only (server-replicated)
 /lineage                  → Append-only (audit log)
 /approvals                → Client creates for self, server processes
```

**Rule:** MCP can read these collections, but shouldn't need to write (writes are server-side only).

### 4. API auditing

Enable Cloud Audit Logs to track MCP access:

```bash
# Via gcloud
gcloud logging sinks create firebase-mcp-logs \
  logging.googleapis.com/projects/PROJECT_ID/logs/cloudaudit.googleapis.com \
  --log-filter='resource.type="gce_instance" AND protoPayload.serviceName="firestore.googleapis.com"'
```

---

## Integration with Copilot CLI

### In Desktop Commander or Copilot CLI

1. **Copy MCP config to user MCP directory:**
   ```bash
   mkdir -p ~/.mcp
   cp .mcp/firebase.json ~/.mcp/firebase.json
   ```

2. **Set environment:**
   ```bash
   export FIREBASE_PROJECT_DIR="/path/to/firebase"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/sa.json"
   ```

3. **Verify MCP is discoverable:**
   ```bash
   # Copilot CLI will auto-discover MCP configs
   # And make Firebase available to AI agents
   ```

---

## References

- [Firebase MCP Server Documentation](https://firebase.google.com/docs/ai-assistance/mcp-server)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Google Cloud IAM Roles](https://cloud.google.com/iam/docs/understanding-roles)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

_Last updated: 2026-07-08_
