#!/bin/bash
# NOIZYLAB M2 Ultra — Fix Shell PATH for All Tools
# Run once: source scripts/fix-shell-path.sh

ZSHRC="$HOME/.zshrc"

# Backup
cp "$ZSHRC" "$ZSHRC.backup.$(date +%Y%m%d)" 2>/dev/null

cat >> "$ZSHRC" << 'EOF'

# ─── NOIZYLAB M2 Ultra PATH Fixes ────────────────────────────
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
export PATH="$HOME/.docker/bin:$PATH"
export DOCKER_HOST="unix:///private/tmp/com.docker.docker.sock"

# NVM / Node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ollama
export OLLAMA_HOST="http://localhost:11434"

# Heaven Project
export HEAVEN_ROOT="/tmp/Heaven"
alias heaven-up='cd $HEAVEN_ROOT/Docker && docker compose up -d'
alias heaven-down='cd $HEAVEN_ROOT/Docker && docker compose down'
alias heaven-logs='cd $HEAVEN_ROOT/Docker && docker compose logs -f'
alias heaven-status='curl -s http://localhost:17017/health | python3 -m json.tool && curl -s http://localhost:7777/health | python3 -m json.tool'
# ─────────────────────────────────────────────────────────────
EOF

echo "✅ ~/.zshrc updated with NOIZYLAB PATH fixes"
echo "   Run: source ~/.zshrc"
