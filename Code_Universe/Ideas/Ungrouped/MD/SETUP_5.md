# NOIZYWORLD Bot — Setup

A Discord bot that builds the NOIZYWORLD server (categories, channels, roles,
permissions) from a single editable blueprint. Runs locally. No cloud, no cost.

It does two things:

- **One-shot build** — `python noizyworld_bot.py --build` logs in, builds the
  server, prints a receipt, and exits.
- **Live bot** — `python noizyworld_bot.py` stays online with slash commands
  (`/setup`, `/blueprint`, `/ping`).

Re-running is safe. Anything that already exists is detected and skipped.

---

## 1. Create the bot application

1. Go to <https://discord.com/developers/applications> and click **New
   Application**. Name it `NOIZYWORLD`.
2. Open the **Bot** tab. The bot user already exists; click **Reset Token**,
   then **Copy**. This token is a password — keep it private.
3. (Optional, only if you want auto-welcome later) under **Privileged Gateway
   Intents**, turn on **Server Members Intent**. Leave it off for now if you
   just want the build.

## 2. Fill in your secrets

```bash
cp .env.example .env
```

Open `.env` and set:

- `DISCORD_TOKEN` — the token you copied above.
- `GUILD_ID` — in Discord, enable **Settings → Advanced → Developer Mode**,
  then right-click your server icon → **Copy Server ID**.

## 3. Invite the bot to your server

Open the **OAuth2 → URL Generator** in the Developer Portal and tick:

- Scopes: **`bot`** and **`applications.commands`**
- Bot Permissions: **Manage Roles, Manage Channels, View Channels, Send
  Messages, Read Message History, Add Reactions, Embed Links, Manage Messages**

Copy the generated URL, open it, and add the bot to your server.

Or paste this link, replacing `APPLICATION_ID` with the ID from your app's
**General Information** tab (this is the same least-privilege permission set,
integer `268528720`):

```
https://discord.com/api/oauth2/authorize?client_id=APPLICATION_ID&permissions=268528720&scope=bot%20applications.commands
```

**Then do one thing that matters:** in **Server Settings → Roles**, drag the
bot's role (it will be named `NOIZYWORLD`) **up near the top**, above any roles
it will create. A bot cannot create or order roles that sit above its own.

> Prefer least privilege over Administrator. The scoped set above is enough to
> build everything. If you would rather not think about it for the first run,
> you can grant Administrator instead and remove it afterward — but the scoped
> path is the recommended default.

## 4. Install dependencies

```bash
python -m pip install -r requirements.txt
```

(Python 3.10+ required.)

## 5. Build the server

```bash
python noizyworld_bot.py --build
```

You'll see a printed receipt of everything created. Done.

Prefer to drive it from inside Discord instead? Run `python noizyworld_bot.py`
(no flag) to keep the bot online, then in your server type `/setup`. Use
`/blueprint` first if you want to preview without changing anything.

---

## Customising the server

Everything you'd want to change lives in **`blueprint.py`** — roles, colours,
categories, channels, which channels are read-only, which are private. Edit it,
then run `python noizyworld_bot.py --build` again. New items get added; existing
ones are left untouched.

## Optional: auto-welcome

1. Enable **Server Members Intent** (step 1, item 3).
2. In `noizyworld_bot.py`, set `MEMBERS_INTENT = True`.
3. Adjust the message in `blueprint.py` (`WELCOME_MESSAGE`).

New members then get a welcome in `#welcome`.

---

## Notes and gotchas

- **Roles are identity-only by default.** They carry colour and hoist, not
  global power. `Crew` gets light moderation (`manage_messages`). This is
  deliberate — power through channel overwrites, not blanket permissions —
  and it lets the bot run without Administrator.
- **If you add a stronger permission to a role** in `blueprint.py` (e.g.
  `kick_members`, `moderate_members`), you must also grant that permission to
  the bot in the invite. A bot cannot create a role with a permission it
  doesn't itself hold — the create call will fail with `Forbidden`.
- **`Architect` is not given Administrator.** As server owner you already have
  full control. If you want a non-owner to hold admin, edit that role directly
  in Discord — safer than minting an admin role programmatically.
- **Discord lowercases and hyphenates** text channel names (`get-your-roles`).
  Voice channel names keep their case (`Studio Floor`).
- **Verified against discord.py 2.7.1.** `requirements.txt` pins `>=2.4,<3`.
