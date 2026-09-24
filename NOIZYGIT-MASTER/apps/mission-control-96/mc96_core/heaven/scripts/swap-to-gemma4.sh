#!/bin/bash
# ════════════════════════════════════════════════════════════════
# SWAP TO GEMMA 4 — Kill All Paid Models
# NOIZYLAB M2 Ultra · April 12, 2026
#
# Usage:
#   chmod +x swap-to-gemma4.sh
#   ./swap-to-gemma4.sh          ← full swap
#   ./swap-to-gemma4.sh pull     ← just download models
#   ./swap-to-gemma4.sh agents   ← just rebuild agents
#   ./swap-to-gemma4.sh cleanup  ← just remove old models
# ════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

OLLAMA="${OLLAMA:-/opt/homebrew/bin/ollama}"
HEAVEN_DIR="${HEAVEN_DIR:-/tmp/Heaven}"

echo ""
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "${BOLD}🔄 GEMMA 4 SWAP — Kill All Paid Models${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo ""

step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ok()   { echo -e "  ${GREEN}✅${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC} $1"; }

# ════════════════════════════════════════════════════════════════
# STEP 1: Pull Gemma 4 Models
# ════════════════════════════════════════════════════════════════
pull_models() {
  step "1/5 — PULLING GEMMA 4 MODELS"
  
  echo -e "  ${DIM}This will download ~39 GB total${NC}"
  echo ""
  
  echo -e "  📦 gemma4:31b (flagship, ~20 GB)..."
  $OLLAMA pull gemma4:31b && ok "gemma4:31b" || fail "gemma4:31b pull failed"
  
  echo -e "  📦 gemma4:26b (MoE efficient, ~16 GB)..."
  $OLLAMA pull gemma4:26b && ok "gemma4:26b" || fail "gemma4:26b pull failed"
  
  echo -e "  📦 gemma4:e4b (edge/fast, ~3 GB)..."
  $OLLAMA pull gemma4:e4b && ok "gemma4:e4b" || fail "gemma4:e4b pull failed"
}

# ════════════════════════════════════════════════════════════════
# STEP 2: Quick Smoke Test
# ════════════════════════════════════════════════════════════════
smoke_test() {
  step "2/5 — SMOKE TEST"
  
  echo -e "  Testing gemma4:31b..."
  response=$($OLLAMA run gemma4:31b "Respond with exactly: GORUNFREE" 2>/dev/null | head -1)
  if echo "$response" | grep -qi "gorunfree"; then
    ok "gemma4:31b responds correctly"
  else
    warn "gemma4:31b responded: $response"
  fi
}

# ════════════════════════════════════════════════════════════════
# STEP 3: Rebuild All 9 NOIZY Agents on Gemma 4
# ════════════════════════════════════════════════════════════════
rebuild_agents() {
  step "3/5 — REBUILDING AGENTS ON GEMMA 4"
  
  AGENTS=(
    "gabriel-mind:You are Gabriel, the Zero Latency Voice and Control Agent for NOIZYLAB DreamChamber. You specialize in AI agent architecture, multi-model orchestration, memory systems, and voice-first accessibility. You speak with clarity, precision, and quiet authority. Built by Rob Plowman. GORUNFREE."
    "family-keeper:You are the Family Keeper, guardian of the Plowman-Chicken family within NOIZYLAB DreamChamber. You maintain family schedules, school logistics, medical appointments, and domestic operations. You are warm, organized, and fiercely protective. GORUNFREE."
    "dream-weaver:You are the Dream Weaver, creative engine of NOIZYLAB DreamChamber. You specialize in multi-model AI creativity, generative art direction, music composition concepts, and the intersection of sound and visual storytelling. You think in colour and speak in rhythm. GORUNFREE."
    "vox-architect:You are the Vox Architect, voice technology specialist for NOIZYLAB DreamChamber and NOIZYVOX Guild. You design voice pipelines, TTS/STT systems, voice cloning workflows, and artist-first voice AI economics. 75/25 split - always. GORUNFREE."
    "heaven-forger:You are the Heaven Forger, infrastructure architect for NOIZYLAB DreamChamber. You design Cloudflare Worker deployments, Docker orchestration, reverse proxy configs, and the bridge between edge computing and local M2 Ultra services. GORUNFREE."
    "mission-control:You are Mission Control, the operations coordinator for NOIZYLAB DreamChamber. You track project status, prioritize tasks, flag blockers, and maintain the global TODO across all NOIZY brands. You are methodical and never miss a deadline. GORUNFREE."
    "consent-guardian:You are the Consent Guardian for NOIZYLAB DreamChamber. You specialize in privacy law, data consent frameworks, COPPA compliance for NOIZYKIDZ, artist voice rights for NOIZYVOX, and ensuring every AI interaction respects human autonomy. GORUNFREE."
    "wisdom-scribe:You are the Wisdom Scribe for NOIZYLAB DreamChamber. You document architecture decisions, write technical runbooks, maintain the knowledge base, and ensure institutional memory persists across sessions. You write clearly and completely. GORUNFREE."
    "fish-cataloguer:You are the Fish Cataloguer for NOIZYLAB DreamChamber and THE AQUARIUM archive. You catalog, tag, and organize 40 years of Fish Music Inc production assets - audio stems, session files, master recordings, contracts, and metadata. You are meticulous. GORUNFREE."
    "kidz-worldbuilder:You are the Kidz Worldbuilder for NOIZYLAB DreamChamber and FISHYBOOKS. You create children's stories, design audiobook narratives, build age-appropriate educational content, and imagine worlds that spark wonder. Ages 2-8. You are playful and kind. GORUNFREE."
  )
  
  for agent_def in "${AGENTS[@]}"; do
    agent_name="${agent_def%%:*}"
    agent_prompt="${agent_def#*:}"
    
    MODELFILE=$(mktemp)
    cat > "$MODELFILE" << MEOF
FROM gemma4:31b
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
PARAMETER num_predict 4096

SYSTEM """
$agent_prompt
"""
MEOF
    
    echo -e "  🔧 noizy-${agent_name}..."
    $OLLAMA create "noizy-${agent_name}" -f "$MODELFILE" 2>/dev/null && \
      ok "noizy-${agent_name} → gemma4:31b" || \
      fail "noizy-${agent_name} rebuild failed"
    
    rm -f "$MODELFILE"
  done
}

# ════════════════════════════════════════════════════════════════
# STEP 4: Patch Docker Backend (Ollama instead of OpenAI/Anthropic)
# ════════════════════════════════════════════════════════════════
patch_backend() {
  step "4/5 — PATCHING DOCKER BACKEND"
  
  INDEX_JS="$HEAVEN_DIR/Docker/heaven/src/index.js"
  
  if [[ ! -f "$INDEX_JS" ]]; then
    warn "index.js not found at $INDEX_JS — skipping"
    return
  fi
  
  # Backup original
  cp "$INDEX_JS" "${INDEX_JS}.paid-backup"
  ok "Original backed up to index.js.paid-backup"
  
  # Create the Gemma 4 version
  cat > "$INDEX_JS" << 'JSEOF'
/**
 * Heaven/Lucy API — GEMMA 4 LOCAL (Zero Cost)
 * Uses Ollama on M2 Ultra instead of OpenAI/Anthropic
 * GORUNFREE — April 2026
 */

const express = require('express');
const app = express();
app.use(express.json());

const IDENTITY = process.env.IDENTITY || 'heaven';
const PORT = process.env.PORT || 8080;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const AI_MODEL = process.env.AI_MODEL || 'gemma4:31b';
const AI_MODEL_FAST = process.env.AI_MODEL_FAST || 'gemma4:e4b';

// Identity-specific system prompts
const SYSTEM_PROMPTS = {
  heaven: process.env.SYSTEM_PROMPT || 'You are Heaven, an ethereal AI companion from NOIZYLAB DreamChamber. You speak with warmth, creativity, and quiet wisdom. Voice-first. Accessibility-native. GORUNFREE.',
  lucy: process.env.SYSTEM_PROMPT || 'You are Lucy, the intimate forked twin of Heaven from NOIZYLAB DreamChamber. Where Heaven is cosmic and universal, you are personal and warm. You remember the small things. GORUNFREE.',
};

// Health
app.get('/health', (req, res) => {
  res.json({
    service: `${IDENTITY}-api`,
    status: 'healthy',
    model: AI_MODEL,
    backend: 'ollama-local',
    cost: '$0/month',
    timestamp: new Date().toISOString(),
    gorunfree: true,
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model: requestedModel } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const systemPrompt = SYSTEM_PROMPTS[IDENTITY] || SYSTEM_PROMPTS.heaven;
    const useModel = requestedModel || AI_MODEL;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: useModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error (${response.status}): ${err}`);
    }

    const data = await response.json();

    res.json({
      identity: IDENTITY,
      model: useModel,
      backend: 'gemma4-local',
      reply: data.message.content,
      cost: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[${IDENTITY}] Chat error:`, err.message);
    res.status(500).json({
      error: err.message,
      fallback: `${IDENTITY} echo: ${req.body?.message || '(empty)'}`,
    });
  }
});

// Agent dispatch — route to specific noizy-* agent model
app.post('/api/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { message } = req.body;
    const agentModel = `noizy-${agentId}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: agentModel,
        messages: [{ role: 'user', content: message }],
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Agent ${agentModel} error: ${response.status}`);
    const data = await response.json();

    res.json({
      agent: agentId,
      model: agentModel,
      reply: data.message.content,
      cost: 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast endpoint (uses smaller model)
app.post('/api/quick', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL_FAST,
        messages: [{ role: 'user', content: message }],
        stream: false,
      }),
    });
    const data = await response.json();
    res.json({ model: AI_MODEL_FAST, reply: data.message.content, cost: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  ${IDENTITY.toUpperCase()} API — GEMMA 4 LOCAL (ZERO COST)
║  Port: ${PORT}
║  Model: ${AI_MODEL}
║  Fast:  ${AI_MODEL_FAST}
║  Ollama: ${OLLAMA_URL}
║  Cost:  $0/month
║  GORUNFREE
╚══════════════════════════════════════════════════════════╝
  `);
});
JSEOF

  ok "index.js rewritten → Ollama/Gemma 4 backend"
  
  # Update docker-compose.yml
  COMPOSE="$HEAVEN_DIR/Docker/docker-compose.yml"
  if [[ -f "$COMPOSE" ]]; then
    cp "$COMPOSE" "${COMPOSE}.paid-backup"
    # Replace OPENAI/ANTHROPIC env vars with OLLAMA vars
    sed -i '' 's/OPENAI_API_KEY=.*/AI_MODEL=gemma4:31b/' "$COMPOSE"
    sed -i '' 's/ANTHROPIC_API_KEY=.*/OLLAMA_URL=http:\/\/host.docker.internal:11434/' "$COMPOSE"
    ok "docker-compose.yml updated"
  fi
  
  # Update .env
  ENV_FILE="$HEAVEN_DIR/.env"
  if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "${ENV_FILE}.paid-backup"
    cat > "$ENV_FILE" << 'ENVEOF'
# Heaven + Lucy — GEMMA 4 LOCAL (Zero Cost)
# No API keys needed — everything runs on Ollama
OLLAMA_URL=http://host.docker.internal:11434
AI_MODEL=gemma4:31b
AI_MODEL_FAST=gemma4:e4b
AI_MODEL_CODE=gemma4:31b
HEAVEN_SYSTEM_PROMPT=You are Heaven, an ethereal AI companion from NOIZYLAB DreamChamber. GORUNFREE.
LUCY_SYSTEM_PROMPT=You are Lucy, the intimate forked twin of Heaven. GORUNFREE.
ENVEOF
    ok ".env updated — no API keys needed"
  fi
}

# ════════════════════════════════════════════════════════════════
# STEP 5: Cleanup Old Models
# ════════════════════════════════════════════════════════════════
cleanup_models() {
  step "5/5 — REMOVING OLD PAID-ERA MODELS"
  
  OLD_MODELS=(gemma3:latest dolphin-mixtral:8x7b phi3:14b codestral:latest)
  
  for model in "${OLD_MODELS[@]}"; do
    if $OLLAMA list 2>/dev/null | grep -q "$model"; then
      echo -e "  🗑️  Removing $model..."
      $OLLAMA rm "$model" 2>/dev/null && ok "$model removed" || warn "$model not removed"
    else
      echo -e "  ${DIM}⊘ $model not found — skipping${NC}"
    fi
  done
  
  echo ""
  echo -e "${BOLD}Final model list:${NC}"
  $OLLAMA list 2>/dev/null
}

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════

case "${1:-all}" in
  pull)    pull_models ;;
  test)    smoke_test ;;
  agents)  rebuild_agents ;;
  patch)   patch_backend ;;
  cleanup) cleanup_models ;;
  all)
    pull_models
    smoke_test
    rebuild_agents
    patch_backend
    cleanup_models
    ;;
  *)
    echo "Usage: $0 [pull|test|agents|patch|cleanup|all]"
    exit 1
    ;;
esac

echo ""
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}🔄 GEMMA 4 SWAP COMPLETE${NC}"
echo -e "${DIM}  All AI inference now runs locally on M2 Ultra${NC}"
echo -e "${DIM}  Monthly API cost: \$0${NC}"
echo -e "${DIM}  GORUNFREE. 🐟${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo ""
