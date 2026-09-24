# AI GENIUS - COMPLETE GUIDE
## All AI Models | Editable List | Full Automation

**ONE SYSTEM = ALL AI | GORUNFREE X1000**

---

## 🎯 WHAT IS AI GENIUS?

**Unified system to access ALL major AI models:**
- **16+ AI models** in one interface
- **10+ COMPLETELY FREE** models included
- **Editable configuration** - add/remove models easily
- **Right-click integration** - Select text, ask any AI
- **Keyboard shortcuts** - Fast access to any model
- **Smart routing** - Auto-picks best AI for task
- **Web dashboard** - Beautiful management interface
- **Full automation** - GORUNFREE X1000 compliant

---

## ⚡ ONE-COMMAND SETUP

```bash
cd /mnt/user-data/outputs/noizylab-perfect
chmod +x setup-ai-genius.sh
./setup-ai-genius.sh
```

**Creates:**
- Editable configuration file
- Right-click menu services (7 AIs)
- Web dashboard (port 8888)
- Automator Quick Actions
- API integrations

**Time:** 2 minutes

---

## 🆓 10+ FREE AI MODELS INCLUDED

### TOP 10 FREE AI TOOLS:

1. **💎 Gemini 2.0 Flash** ⭐ BEST FREE
   - Completely FREE (no credit card)
   - Fastest responses
   - 1M token context
   - Excellent quality
   - Get key: https://aistudio.google.com/app/apikey

2. **💻 Cursor AI** ⭐ CODING
   - FREE AI code editor
   - GPT-4 integration
   - Real-time suggestions
   - Download: https://cursor.sh

3. **🦙 Llama 3.3 70B**
   - FREE open source
   - Run locally (Ollama)
   - Or use Together AI (free tier)
   - Privacy-focused

4. **🔍 Perplexity AI** ⭐ RESEARCH
   - FREE search-augmented AI
   - Always up-to-date
   - Cites sources
   - Web: https://www.perplexity.ai

5. **🔮 ChatGPT Free**
   - FREE GPT-4o mini access
   - Via web interface
   - No API key needed
   - Web: https://chat.openai.com

6. **🔬 Phind** ⭐ DEVELOPERS
   - FREE AI for developers
   - Code search
   - Documentation help
   - Web: https://www.phind.com

7. **🤗 HuggingFace Chat**
   - FREE multiple models
   - Mistral, Llama, Falcon
   - Experimentation
   - Web: https://huggingface.co/chat

8. **🏠 Ollama (Local)** ⭐ PRIVACY
   - 100% FREE
   - Run AI on your Mac
   - Completely offline
   - Install: brew install ollama

9. **🚀 Codeium** ⭐ CODING
   - Forever FREE
   - AI code completion
   - Works in all IDEs
   - Web: https://codeium.com

10. **🎬 LM Studio** ⭐ LOCAL
    - FREE local AI GUI
    - Easy to use
    - No coding needed
    - Download: https://lmstudio.ai

### BONUS FREE MODELS:

11. **🎭 Poe AI** - Access to Claude, GPT-4 (limited free)
12. **🌐 You.com** - AI search engine
13. **⬛ Blackbox AI** - Code search
14. **📝 Tabnine** - Code completion (free tier)

---

## 💰 PREMIUM MODELS (OPTIONAL):

15. **⚡ Claude Sonnet 4** - $3/M tokens (your key works!)
16. **🤖 GitHub Copilot++** - $10/month (coding)

---

## 📝 EDITING YOUR AI LIST

### Method 1: Edit JSON File

**Open:**
```bash
nano ai-models-list.json
```

**Or:**
```bash
open -a TextEdit ai-models-list.json
```

**Format:**
```json
{
  "your-model-id": {
    "name": "Model Name",
    "icon": "🤖",
    "description": "What this model does",
    "free": true,
    "category": "general",
    "priority": 10,
    "url": "https://...",
    "enabled": true,
    "notes": "Best for: X, Y, Z"
  }
}
```

**Examples:**

**To disable a model:**
```json
"chatgpt-free": {
  "enabled": false  // Change to false
}
```

**To add a new model:**
```json
"new-ai-model": {
  "name": "New AI Model",
  "icon": "🌟",
  "description": "Amazing new AI",
  "free": true,
  "category": "general",
  "priority": 8,
  "url": "https://newai.com",
  "enabled": true,
  "notes": "Best for: special tasks"
}
```

**Save and reload:**
```bash
# Restart AI GENIUS or refresh web dashboard
```

### Method 2: Web Dashboard

1. Open: http://localhost:8888
2. Click "Configuration" tab
3. Edit JSON directly
4. Click "Save"
5. Done!

---

## 🚀 USING AI GENIUS

### Method 1: Right-Click Menu

1. **Select text anywhere** (any app)
2. **Right-click**
3. **Services → Ask [Model]**
4. **Get response** (notification + clipboard + TextEdit)

**Available services:**
- Ask Cursor AI
- Ask Claude Sonnet
- Ask Gemini Flash
- Ask ChatGPT
- Ask Llama 3.3
- Ask Perplexity
- Ask Ollama Local

### Method 2: Keyboard Shortcuts

**Assign hotkeys:**
1. System Settings → Keyboard → Shortcuts → Services
2. Find "Ask [Model]" services
3. Assign your hotkeys

**Recommended shortcuts:**
- ⌘⌥C → Ask Claude Sonnet
- ⌘⌥G → Ask Gemini Flash (FREE)
- ⌘⌥P → Ask Perplexity (FREE research)
- ⌘⌥K → Ask Cursor (coding)
- ⌘⌥L → Ask Ollama (local/offline)

**Usage:**
1. Select text
2. Press hotkey
3. Done!

### Method 3: Web Dashboard

1. **Open:** http://localhost:8888
2. **Select model** from sidebar
3. **Type question**
4. **Send**
5. **Get response**

**Features:**
- Chat interface
- Model comparison
- Smart routing
- Cost tracking
- Configuration editor

### Method 4: API Calls

```bash
curl -X POST http://localhost:8888/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gemini-flash",
    "message": "Explain quantum computing",
    "api_keys": {}
  }'
```

---

## 🧠 SMART ROUTING

**Let AI GENIUS pick the best model automatically:**

```bash
# For code review
curl -X POST http://localhost:8888/api/route \
  -d '{"task_type": "code_review", "message": "..."}'

# Returns: cursor, claude-sonnet, github-copilot
```

**Task types:**
- `code_review` → Cursor, Claude, Copilot
- `code_generation` → Cursor, Copilot, Phind
- `debugging` → Cursor, Phind, Claude
- `research` → Perplexity, You.com, Gemini
- `writing` → Claude, ChatGPT, Gemini
- `analysis` → Claude, Gemini, Llama
- `quick_question` → Gemini Flash (fastest)
- `long_document` → Gemini (1M context)
- `offline_needed` → Ollama, LM Studio
- `free_only` → Gemini, Perplexity, Ollama, etc.

---

## 🔑 API KEYS SETUP

**Only needed for API-based models. Web-based are FREE with no keys!**

### Free API Keys:

**Google (Gemini) - FREE:**
```
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy key (starts with "AIza...")
4. Store: security add-generic-password -a $USER -s 'google_api_key' -w "YOUR-KEY"
```

**HuggingFace - FREE:**
```
1. Go to: https://huggingface.co/settings/tokens
2. Create token
3. Copy token
4. Store in keychain
```

**Together AI (Llama) - FREE $25 credit:**
```
1. Go to: https://api.together.xyz
2. Sign up
3. Get API key
4. Store in keychain
```

### Paid API Keys (Optional):

**Anthropic (Claude) - Already have:**
```
Your key: sk-ant-api03-jdXjxMTODL...
Already configured in system
```

**OpenAI (GPT) - Optional:**
```
https://platform.openai.com/api-keys
```

---

## 💻 SPECIAL: CURSOR AI INTEGRATION

**Cursor is a FREE AI-powered code editor:**

### Install:
```bash
# Download from https://cursor.sh
# Or:
brew install --cask cursor
```

### Features:
- GPT-4 integration
- Real-time code suggestions
- Chat with your codebase
- Edit multiple files at once
- Debug with AI
- Generate tests

### Usage:
1. Open Cursor
2. Press ⌘K → Chat with AI
3. Or select code → ⌘L → Edit with AI
4. Or just type and get suggestions

### Integration with AI GENIUS:
- Right-click service: "Ask Cursor AI"
- Opens Cursor with your selected code
- Or use Cursor's built-in AI directly

---

## 🏠 SPECIAL: LOCAL AI (OLLAMA)

**Run AI completely offline on your Mac:**

### Install:
```bash
brew install ollama
```

### Download models:
```bash
ollama pull llama3.3      # Best overall
ollama pull codellama     # For coding
ollama pull mistral       # Fast & efficient
ollama pull deepseek-coder # Coding specialist
```

### Use:
```bash
# Command line
ollama run llama3.3 "Explain quantum physics"

# Via AI GENIUS
# Right-click → Ask Ollama Local

# Or API:
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.3",
  "prompt": "Why is the sky blue?"
}'
```

### Benefits:
- ✅ 100% FREE
- ✅ Unlimited usage
- ✅ Complete privacy
- ✅ Works offline
- ✅ No API keys needed
- ✅ Fast on M2 Ultra (GOD)

---

## 🔀 MODEL COMPARISON

**Test multiple AIs at once:**

### Via Dashboard:
1. Open http://localhost:8888
2. Click "Compare" tab
3. Select models (check boxes)
4. Enter question
5. Click "Compare"
6. See all responses side-by-side

### Via API:
```bash
curl -X POST http://localhost:8888/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "model_ids": ["gemini-flash", "claude-sonnet", "llama-3.3"],
    "message": "Write a haiku about AI"
  }'
```

---

## ⚙️ CONFIGURATION

### Files:
- **ai-models-list.json** - Simple editable list
- **ai-genius-config.json** - Full configuration
- **ai-genius.js** - Server code
- **ai-genius-config.js** - Config manager

### Edit configuration:
```bash
# Simple list (recommended)
nano ai-models-list.json

# Full config (advanced)
nano ai-genius-config.json

# Or use web dashboard
open http://localhost:8888
# Click "Configuration" tab
```

### Hot-reload:
Save file → Refresh browser → Changes applied

---

## 🎯 WHICH MODEL FOR WHAT?

| Task | Best Model | Why | Cost |
|------|------------|-----|------|
| Quick question | Gemini Flash | Fastest | FREE |
| Code review | Cursor / Claude | Best understanding | FREE / $3/M |
| Research | Perplexity | Search-augmented | FREE |
| Long document | Gemini Flash | 1M context | FREE |
| Offline work | Ollama | Local processing | FREE |
| Complex reasoning | Claude Sonnet | Most intelligent | $3/M |
| Code generation | Cursor / Phind | Specialized | FREE |
| General chat | ChatGPT Free | Good quality | FREE |
| Privacy-critical | Ollama / LM Studio | 100% local | FREE |
| Experimentation | HuggingFace | Multiple models | FREE |

---

## 🚨 TROUBLESHOOTING

### "AI GENIUS not starting"
```bash
# Check if port 8888 is in use
lsof -i :8888

# Kill if needed
kill -9 <PID>

# Restart
./start-ai-genius.sh
```

### "Right-click menu not showing"
```bash
# Refresh Services
/System/Library/CoreServices/pbs -flush
killall Finder

# Check if workflows exist
ls ~/Library/Services/Ask*.workflow
```

### "Model not responding"
```bash
# Check if local AI is running (for Ollama/LM Studio)
curl http://localhost:11434/api/version  # Ollama
curl http://localhost:1234/v1/models     # LM Studio

# Check API keys
security find-generic-password -a $USER -s 'google_api_key' -w
```

### "API key error"
```bash
# Re-add key to Keychain
security add-generic-password -a $USER -s 'google_api_key' -w "YOUR-KEY" -U
```

---

## 📊 STATISTICS & MONITORING

### Via Dashboard:
- Total models: 16+
- Free models: 10+
- Messages today: 0
- Enabled: All

### Via API:
```bash
# Get config
curl http://localhost:8888/api/config

# Get enabled models
curl http://localhost:8888/api/models

# Get free models only
curl http://localhost:8888/api/models/free
```

---

## 🎓 ADVANCED USAGE

### Chain Multiple AIs:
```bash
# Ask Claude first
CLAUDE_RESPONSE=$(curl ... /api/ask -d '{"model_id":"claude-sonnet", ...}')

# Then ask Gemini to review Claude's response
curl /api/ask -d "{\"model_id\":\"gemini-flash\", \"message\":\"Review: $CLAUDE_RESPONSE\"}"
```

### Batch Processing:
```bash
# Process multiple questions
for question in "${QUESTIONS[@]}"; do
  curl /api/ask -d "{\"model_id\":\"gemini-flash\", \"message\":\"$question\"}"
done
```

### Custom Routing:
Edit `ai-models-list.json`:
```json
"routing_rules": {
  "my_custom_task": ["gemini-flash", "perplexity", "claude-sonnet"]
}
```

---

## 💡 PRO TIPS

1. **Start with free models** - Gemini Flash is excellent and FREE
2. **Use Perplexity for research** - It searches the web automatically
3. **Ollama for privacy** - Run everything locally
4. **Cursor for coding** - Best AI code editor, FREE
5. **Compare when unsure** - See multiple perspectives
6. **Edit the list** - Add/remove models as you discover new ones
7. **Keyboard shortcuts** - Set up hotkeys for your most-used models
8. **Local first** - Use Ollama when possible (free, private, fast)

---

## 📱 iOS/IPAD INTEGRATION

### Create iOS Shortcut:
1. Open Shortcuts app
2. New Shortcut
3. Add actions:
   - Get Clipboard
   - URL: http://GOD.local:8888/api/ask
   - Method: POST
   - Body: {"model_id":"gemini-flash", "message":"[clipboard]"}
4. Add to Siri: "Ask AI"

### Usage:
- Copy text
- Say "Hey Siri, ask AI"
- Get response

---

## 🌟 ADDING NEW AI MODELS

### Step 1: Find a new AI model
Example: "SuperAI" just launched

### Step 2: Add to ai-models-list.json
```json
"super-ai": {
  "name": "SuperAI",
  "icon": "🌟",
  "description": "New amazing AI model",
  "free": true,
  "category": "general",
  "priority": 8,
  "url": "https://superai.com",
  "api": "https://api.superai.com/v1/chat",
  "api_key": "SUPERAI_API_KEY",
  "enabled": true,
  "notes": "Best for: X, Y, Z"
}
```

### Step 3: Add to routing rules (optional)
```json
"routing_rules": {
  "special_task": ["super-ai", "gemini-flash"]
}
```

### Step 4: Create Quick Action (optional)
```bash
# Run setup again to add to right-click menu
./setup-ai-genius.sh
```

### Step 5: Reload
- Restart AI GENIUS
- Or refresh web dashboard
- Done!

---

## ✅ COMPLETE FEATURES LIST

### ✅ 16+ AI Models:
- Cursor AI (coding)
- GitHub Copilot++ (coding)
- Claude Sonnet (general)
- Gemini Flash (FREE, fast)
- ChatGPT Free (FREE)
- Llama 3.3 (FREE, open)
- Perplexity (FREE, research)
- HuggingFace (FREE, multiple)
- Poe AI (FREE, multi-bot)
- Phind (FREE, developers)
- Ollama (FREE, local)
- Codeium (FREE, coding)
- You.com (FREE, search)
- LM Studio (FREE, local)
- Blackbox AI (FREE, code)
- Tabnine (FREE, coding)

### ✅ 10+ Completely FREE Models

### ✅ Editable Configuration:
- JSON file
- Web dashboard
- Hot-reload

### ✅ Multiple Access Methods:
- Right-click menu
- Keyboard shortcuts
- Web dashboard
- API calls
- Voice (Siri Shortcuts)

### ✅ Smart Features:
- Auto-routing by task
- Model comparison
- Cost tracking
- Response time monitoring

### ✅ Full Automation:
- One-command setup
- Auto-creates Quick Actions
- Auto-configures services
- GORUNFREE X1000 compliant

---

## 🎯 RECOMMENDED DAILY WORKFLOW

### Morning:
```bash
# Start AI GENIUS once
cd /mnt/user-data/outputs/noizylab-perfect
./start-ai-genius.sh &

# Bookmark: http://localhost:8888
```

### During work:
1. **Quick questions** → Press ⌘⌥G (Gemini Flash - FREE & fast)
2. **Code review** → Select code, ⌘⌥K (Cursor)
3. **Research** → Select topic, ⌘⌥P (Perplexity - FREE search)
4. **Complex tasks** → ⌘⌥C (Claude Sonnet - best quality)
5. **Offline/privacy** → ⌘⌥L (Ollama local)

### Evening:
- AI GENIUS keeps running
- All models always available
- Zero friction access

---

## 📚 SUMMARY

**AI GENIUS gives you:**
- ✅ 16+ AI models
- ✅ 10+ completely FREE
- ✅ Unified interface
- ✅ Editable list
- ✅ Right-click access
- ✅ Keyboard shortcuts
- ✅ Web dashboard
- ✅ Smart routing
- ✅ Local AI support
- ✅ Full automation
- ✅ GORUNFREE X1000

**Setup time:** 2 minutes  
**Cost:** FREE (10+ models) + optional paid  
**Accessibility:** Voice, keyboard, touch, right-click  
**Integration:** Works everywhere on Mac  

**ONE SYSTEM = ALL AI**

**GORUNFREE X1000 ✨**

---

## 📁 FILES REFERENCE

- **ai-models-list.json** - Editable list (use this)
- **ai-genius.js** - Main server
- **ai-genius-config.js** - Config manager
- **setup-ai-genius.sh** - One-command installer
- **start-ai-genius.sh** - Server launcher
- **~/Library/Services/Ask*.workflow** - Quick Actions

---

**Start using AI GENIUS now:**
```bash
./setup-ai-genius.sh
./start-ai-genius.sh
open http://localhost:8888
```

**Select text. Ask AI. Get answer. DONE.**
