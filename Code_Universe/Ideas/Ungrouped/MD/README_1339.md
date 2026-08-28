# NOIZYWORLD Discord Bot

Local-first bot that scaffolds the NOIZYWORLD Discord server — categories,
channels, roles, and permissions — from one editable blueprint. Zero cost,
no cloud dependency, safe to re-run.

```
noizyworld-bot/
├── noizyworld_bot.py   # the bot: /setup, /blueprint, /ping + one-shot --build
├── blueprint.py        # EDIT THIS — roles, categories, channels, permissions
├── requirements.txt    # discord.py, python-dotenv
├── .env.example        # copy to .env, add your token + server id
├── SETUP.md            # full step-by-step deployment guide
└── README.md           # this file
```

## Quickstart

1. Read **SETUP.md** (5 steps, ~10 minutes).
2. `cp .env.example .env` and fill in `DISCORD_TOKEN` + `GUILD_ID`.
3. `python -m pip install -r requirements.txt`
4. `python noizyworld_bot.py --build`

Built and verified against discord.py 2.7.1 (Python 3.10+).
