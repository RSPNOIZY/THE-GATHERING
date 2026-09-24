# GABRIEL API KEYS SETUP — DreamChamber

## Required for GABRIEL to Function

GABRIEL needs at least ONE AI provider API key to work. Recommended: **Anthropic** (Claude).

---

## Get Your API Keys

### 1. Anthropic (Claude) — RECOMMENDED
- Go to: https://console.anthropic.com/settings/keys
- Create a new API key
- Copy the key (starts with `sk-ant-`)
- Add to `dreamchamber/.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### 2. OpenAI (GPT-4)
- Go to: https://platform.openai.com/api-keys
- Create a new secret key
- Copy the key (starts with `sk-`)
- Add to `dreamchamber/.env`: `OPENAI_API_KEY=sk-...`

### 3. Google (Gemini)
- Go to: https://aistudio.google.com/app/apikey
- Create API key
- Copy the key
- Add to `dreamchamber/.env`: `GOOGLE_API_KEY=...`

### 4. Together AI (Llama, Mixtral)
- Go to: https://api.together.xyz/settings/api-keys
- Create new API key
- Add to `dreamchamber/.env`: `TOGETHER_API_KEY=...`

### 5. Mistral AI
- Go to: https://console.mistral.ai/api-keys/
- Create new API key
- Add to `dreamchamber/.env`: `MISTRAL_API_KEY=...`

### 6. Cohere
- Go to: https://dashboard.cohere.com/api-keys
- Create new API key
- Add to `dreamchamber/.env`: `COHERE_API_KEY=...`

### 7. Perplexity
- Go to: https://www.perplexity.ai/settings/api
- Generate API key
- Add to `dreamchamber/.env`: `PERPLEXITY_API_KEY=...`

---

## Quick Start (Minimum)

**For GABRIEL to work RIGHT NOW**, you need just ONE:

```bash
# Edit dreamchamber/.env and add:
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

Then restart DreamChamber:
```bash
npm run dc:dev
```

---

## Full Multi-Provider Setup

For maximum flexibility, add ALL providers to `dreamchamber/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
TOGETHER_API_KEY=...
MISTRAL_API_KEY=...
COHERE_API_KEY=...
PERPLEXITY_API_KEY=...
```

---

## Security Notes

- ✅ `.env` files are in `.gitignore` — safe from commits
- ✅ Never share API keys publicly
- ✅ Rotate keys if exposed
- ✅ Set spending limits in provider dashboards

---

**Next Step**: Add at least `ANTHROPIC_API_KEY` to `dreamchamber/.env` and GABRIEL will come alive! 🚀
