# Azure App Registration — 5-minute walkthrough

One-time setup to get a **client ID** for `rspnoizy@outlook.com`. Free, no subscription required.

## 1. Sign in to Azure Portal

Go to <https://portal.azure.com> and sign in with **rspnoizy@outlook.com**.

First-time sign-in for a personal MS account will prompt you to accept Azure terms (free tier is fine — we won't create any paid resources).

## 2. Open "App registrations"

In the top search bar, type `App registrations` and open it. Click **+ New registration**.

## 3. Fill the registration form

| Field | Value |
|-------|-------|
| **Name** | `noizy-ms` |
| **Supported account types** | **Personal Microsoft accounts only** |
| **Redirect URI** | Leave **blank** (device-code flow doesn't need one) |

Click **Register**.

## 4. Copy the Application (client) ID

On the Overview page, copy the **Application (client) ID** — it looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

This is your `MS_CLIENT_ID`.

## 5. Enable public-client flows

In the left sidebar: **Authentication** → scroll to **Advanced settings** → **Allow public client flows** → toggle to **Yes** → **Save**.

(Device code flow is a public-client flow. Without this toggle, login fails.)

## 6. Add API permissions

Left sidebar: **API permissions** → **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**.

Check these (search each):

- `User.Read`
- `Mail.Read`
- `Mail.Send`
- `Calendars.ReadWrite`
- `Files.ReadWrite`
- `Contacts.Read`
- `Tasks.ReadWrite`
- `offline_access`

Click **Add permissions**. No admin consent needed — they're all user-scoped.

## 7. Run the first login

From the monorepo root:

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-ms
npm install
MS_CLIENT_ID=<paste-client-id> npm run auth
```

You'll see something like:

```
To sign in, use a web browser to open https://microsoft.com/devicelogin
and enter the code ABCD1234 to authenticate.
```

Open the URL in a browser signed in as **rspnoizy@outlook.com**, paste the code, approve the scopes. CLI shows ✓ on success and caches the refresh token to `~/Library/Application Support/noizy-ms/token-cache.json`.

## 8. (Optional) Export refresh token for the Worker

Only needed if deploying `apps/mcp-worker`:

```bash
# Extract current refresh token
node -e "import('./packages/graph-client/src/auth.mjs').then(m => m.extractRefreshToken()).then(console.log)"

# Upload to Worker
cd apps/mcp-worker
wrangler secret put MS_CLIENT_ID            # paste the client id
wrangler secret put MS_REFRESH_TOKEN        # paste the refresh token
wrangler secret put MCP_AUTH_TOKEN          # paste a random bearer token you generate
wrangler kv namespace create ms_token_cache # copy the id into wrangler.jsonc
wrangler deploy
```

## Notes

- **Adding scopes later**: append to `DEFAULT_SCOPES` in `packages/graph-client/src/auth.mjs`, then re-run `npm run auth` (forces re-consent).
- **Rotating credentials**: if the refresh token is compromised, go to <https://account.live.com/consent/Manage> and revoke access for "noizy-ms". Then re-register + re-consent.
- **Kill switch**: the same revocation URL is your emergency kill switch. No code deployment needed to revoke.
