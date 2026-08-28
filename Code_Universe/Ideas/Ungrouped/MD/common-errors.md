# MC96ECO Common Errors and Fixes

> GABRIEL Self-Healing Loop Knowledge Base
> Last updated: 2026-04-03

---

## 1. Port Conflict (EADDRINUSE)

**Error:**
```
Error: listen EADDRINUSE: address already in use :::7777
```

**Cause:** An orphan process is still holding the port. This happens after a crash where pm2 didn't clean up, or when both pm2 and launchd try to start the same service.

**Fix:**

```bash
# Find what's holding the port
lsof -i :<port>

# Kill the orphan process
kill -9 <PID>

# Restart via pm2
pm2 restart <service-name>
```

**Port reference:**

| Port | Service |
|------|---------|
| 3001 | AirPlay |
| 4040 | NOIZYSTREAM |
| 5500 | THE CODEX |
| 5678 | n8n |
| 7777 | GABRIEL |
| 8080 | Voice Bridge |
| 8421 | NOIZYVOX |
| 8888 | Command Center |
| 9090 | Health Monitor |
| 11434 | Ollama |

**Prevention:** If both pm2 and launchd manage the same service, disable one. Check with:
```bash
pm2 status
launchctl print gui/$(id -u)/com.noizy.gabriel
```

---

## 2. D1 Binding Error

**Error:**
```
Error: D1_ERROR: no such binding 'DB_MEMORY'
```
or
```
Error: D1 database not found for binding DB_MEMORY
```

**Cause:** The Worker is deployed to the wrong Cloudflare account, or wrangler.toml has incorrect database IDs.

**Fix:**

1. Check which account you're on:
```bash
npx wrangler whoami
```

2. Verify database IDs in wrangler.toml match the account:

| Binding | Database | ID (HEAVEN account) |
|---------|----------|---------------------|
| DB_MEMORY | agent-memory | `7b813205-fd12-4a23-84a6-ce83bc49ec70` |
| DB_REPAIRS | noizylab-repairs | `2bd4aa06-f9b2-4761-b235-e92e8a21fe45` |
| DB_AQUARIUM | aquarium-archive | `e6f98279-656b-4f7a-979d-9197821193f5` |

3. If on the wrong account, switch:
```bash
npx wrangler login
```

4. Re-deploy:
```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven && npx wrangler deploy
```

**Critical:** Never reference `gabriel_db` / `f75939d5`. That database is dead.

---

## 3. KV Namespace Not Found

**Error:**
```
Error: KV namespace not found for binding KV_SIGNUPS
```

**Cause:** KV namespace IDs are account-specific. If you deploy to the wrong account, the KV IDs won't resolve.

**Fix:**

1. Verify account: `npx wrangler whoami`
2. Verify KV IDs in wrangler.toml match the HEAVEN account:

| Binding | Namespace ID |
|---------|-------------|
| KV_SIGNUPS | `392c1bf429114148999824a9f9e15169` |
| KV_ROYALTIES | `4cf36e4bd1fd44fe802096925413f694` |
| KV_GUILD | `8a15ed31fea8462da7c92a8237d6f854` |
| KV_SESSIONS | `c90299891f684de7bcc7c53967133748` |
| KV_SUBMISSIONS | `6e888a017ebe4ba78ed7497c4929439b` |
| KV_MEMCELL | `9aa2511652ce4a2faeb106858f76df67` |

3. If IDs are wrong, update wrangler.toml and re-deploy.

---

## 4. Wrangler Auth Expired

**Error:**
```
Error: You must be logged in to use this command.
```
or
```
Error: Authentication token has expired
```

**Cause:** Wrangler OAuth token has expired. Tokens expire after a period of inactivity.

**Fix:**

```bash
npx wrangler login
```

This opens a browser window. Log in with the correct Cloudflare account credentials. After successful login, retry your command.

**Note:** If the browser doesn't open (headless/SSH session), use:
```bash
npx wrangler login --browser=false
```
This gives you a URL to paste into a browser manually.

---

## 5. Pack Exceeds 2GB

**Error:**
```
Error: The Worker bundle size exceeds the maximum allowed size of 2 GB
```

**Cause:** The Worker bundle includes large files that shouldn't be deployed. Common culprits:
- ARCHIVE/ directory (historical data, old builds)
- node_modules with heavy dependencies
- Binary files (audio samples, model weights)
- .git directory

**Fix:**

Option A — Use .wranglerignore:
```bash
# Create or edit ~/NOIZYANTHROPIC/repos/noizy-heaven/.wranglerignore
echo "ARCHIVE/" >> ~/NOIZYANTHROPIC/repos/noizy-heaven/.wranglerignore
echo "*.wav" >> ~/NOIZYANTHROPIC/repos/noizy-heaven/.wranglerignore
echo "*.mp3" >> ~/NOIZYANTHROPIC/repos/noizy-heaven/.wranglerignore
echo ".git/" >> ~/NOIZYANTHROPIC/repos/noizy-heaven/.wranglerignore
```

Option B — Use orphan branch:
```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven
git checkout --orphan deploy-clean
git add -A
git commit -m "Clean deploy branch"
npx wrangler deploy
git checkout main
```

Option C — Identify the bloat:
```bash
du -sh ~/NOIZYANTHROPIC/repos/noizy-heaven/* | sort -rh | head -20
```

Remove or ignore the largest directories.

---

## 6. Ollama Model Not Found

**Error:**
```
Error: model 'llama3.1:70b' not found
```

**Cause:** The model hasn't been pulled yet, or Ollama lost its model cache.

**Fix:**

```bash
# Pull the model
ollama pull llama3.1:70b

# Verify
ollama list
```

**All 7 required models:**
```bash
ollama pull llama3.1:70b
ollama pull qwen2.5-coder
ollama pull gemma3
ollama pull mistral
ollama pull llava:34b
ollama pull llama3.2
ollama pull deepseek-coder
```

---

## 7. GABRIEL Health Check Failing

**Error:** Health Monitor shows GABRIEL as RED/CRITICAL.

**Diagnosis steps:**

```bash
# 1. Is GABRIEL running?
pm2 status gabriel

# 2. Can you reach it?
curl http://localhost:7777/health

# 3. Check logs
pm2 logs gabriel --lines 50

# 4. Check for port conflict
lsof -i :7777

# 5. Check memory (M2 Ultra has 192GB, but check anyway)
top -l 1 | head -5
```

**Common causes:**
- Ollama is down (GABRIEL depends on it for inference)
- D1 connection timeout (Cloudflare API issue)
- Memory leak in long-running session (restart clears it)
- Uncaught exception in Tower handler (check logs)

**Fix:** Usually `pm2 restart gabriel` resolves it. If not, check Ollama first.

---

## 8. Voice Bridge Webhook 401

**Error:**
```
HTTP 401 Unauthorized on POST /webhook/voice
```

**Cause:** Missing or invalid Bearer token in the request.

**Fix:**

1. Verify the token is set in the environment:
```bash
pm2 env voice-bridge | grep VOICE_BRIDGE_TOKEN
```

2. Ensure the iPhone Shortcut or Power Automate flow includes the correct Authorization header:
```
Authorization: Bearer <VOICE_BRIDGE_TOKEN value>
```

3. If the token needs to be rotated, update both the server env and the client (iPhone/Power Automate).

---

## 9. NOIZYVOX uvicorn Crash

**Error:**
```
[ERROR] uvicorn.error: Application startup failed
```
or
```
ModuleNotFoundError: No module named 'xtts'
```

**Cause:** Python virtual environment is deactivated or dependencies are missing.

**Fix:**

```bash
# Activate venv
cd ~/NOIZYLAB/noizyvox
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Restart via pm2
pm2 restart noizyvox
```

**Note:** pm2 should be configured to activate the venv in the ecosystem config. If it's not, update `~/NOIZYLAB/ecosystem.config.cjs` to include the interpreter path:
```javascript
{
  name: 'noizyvox',
  script: 'venv/bin/uvicorn',
  args: 'main:app --host 0.0.0.0 --port 8421',
  cwd: '~/NOIZYLAB/noizyvox'
}
```

---

## 10. n8n Workflow Execution Failed

**Error:** Workflow shows red "Error" status in n8n dashboard.

**Diagnosis:**

1. Open `http://localhost:5678` in browser
2. Navigate to the failed workflow execution
3. Click the failed node to see the error detail

**Common causes:**
- Webhook URL changed (GABRIEL restarted with different config)
- External API timeout (Cloudflare, Anthropic)
- Credential expired (re-authenticate in n8n credentials)
- Memory limit (n8n processing large payloads)

**Fix:** Address the specific node error. If n8n itself is unresponsive:
```bash
pm2 restart n8n
```

---

## 11. Git Push Rejected (Pack Too Large)

**Error:**
```
remote: error: pack exceeds maximum allowed size (2.00 GiB)
```

**Cause:** The repository contains large binary files (audio, models, archives).

**Fix:**

Do NOT force push. Instead:

1. Identify large files:
```bash
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n -r | head -20
```

2. Add to .gitignore:
```
ARCHIVE/
*.wav
*.mp3
*.onnx
*.bin
```

3. Use orphan branch for clean history:
```bash
git checkout --orphan clean-main
git add -A
git commit -m "Clean history without binaries"
git push origin clean-main
```

---

## Error Escalation Path

If GABRIEL Tower 9 (HEAL) cannot auto-resolve an error:

1. Tower 9 logs the error to D1 `noizylab-repairs.repairs`
2. Tower 9 sends webhook to Voice Bridge `/webhook/emergency`
3. Voice Bridge notifies Rob via iPhone push notification
4. Error appears on Health Monitor dashboard (:9090) in red
5. n8n Error Escalator workflow creates a ticket

**Human intervention required for:**
- Cloudflare account authentication issues
- DNS configuration changes
- Secret rotation
- Hardware failures
- Network topology changes
