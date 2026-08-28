# Slack · Register the `/noizy` slash command + interactivity

One-time setup so CF04 can receive slash commands + Block Kit button clicks.

## 1. Create the Slack app (if not done)

1. <https://api.slack.com/apps> → **Create New App** → **From an app manifest**.
2. Pick your `noizyai` workspace.
3. Paste this manifest:

```yaml
display_information:
  name: CF04 Relay
  description: NOIZY empire relay + slash command bridge
  background_color: "#0a0a12"
features:
  bot_user:
    display_name: CF04
    always_online: true
  slash_commands:
    - command: /noizy
      url: https://cf04-slack.rsp-5f3.workers.dev/slash
      description: Empire commands — status, ledger, channels, kill-switch, audit, digest
      usage_hint: "help | status | ledger [N] | channels | kill-switch <token> | audit | digest"
      should_escape: false
oauth_config:
  scopes:
    bot:
      - chat:write
      - chat:write.public
      - im:write
      - users:read
      - commands
settings:
  interactivity:
    is_enabled: true
    request_url: https://cf04-slack.rsp-5f3.workers.dev/interactions
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

4. Create → **Install to Workspace** → copy the **Bot User OAuth Token** (`xoxb-...`) = `SLACK_BOT_TOKEN`.
5. Basic Information → **App Credentials** → copy **Signing Secret** = `SLACK_SIGNING_SECRET`.

## 2. Install secrets on CF04

```bash
cd cloudflare/workers/cf04-slack
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_SIGNING_SECRET
npx wrangler secret put SLACK_CRITICAL_DM_USERS   # comma list of U01234...
npx wrangler secret put NOIZY_API_KEY
```

## 3. Invite the bot to every NOIZY.AI channel

In Slack: for each channel in `NOIZYAI_WORKSPACE_CHANNELS.md`:

```
/invite @CF04
```

Channels: `noizyai-empire-status`, `noizyai-dreamchamber`, `noizyai-noizylab`, `noizyai-noizyvox`, `noizyai-fishmusicinc`, `noizyai-noizykidz`, `noizyai-noizyclouds`, `noizyai-family`, `noizyai-artists`.

## 4. Try it

In any channel:

```
/noizy help
/noizy status
/noizy channels
/noizy ledger 10
/noizy audit
```

If the command doesn't show up in the slash picker, re-install the app (settings changed since install).

## 5. Verify interactivity

Any CF04 `/webhook` event posts a Block Kit message with **[Acknowledge]** and **[Escalate]** buttons. Clicking either calls `/interactions` (signed), which logs to HEAVEN ledger and replies ephemerally.
