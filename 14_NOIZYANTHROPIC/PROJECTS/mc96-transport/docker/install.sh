#!/usr/bin/env bash
# ============================================================
#  MC96 UNIVERSE — ONE-COMMAND INSTALL SCRIPT
#  Usage: bash install.sh [controller|worker|worker-micky-p|worker-michael]
#
#  Handles:
#   • Docker Desktop installation detection & version check
#   • Docker Desktop download link (Catalina compatible)
#   • Image build or pull
#   • Service startup
#   • Health verification
# ============================================================
set -euo pipefail

# ── Terminal colors ───────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
MAGENTA='\033[0;35m'

BANNER="
${BOLD}${MAGENTA}
 ████████████████████████████████████████████████████████████
 █                                                          █
 █    🎯  MC96 UNIVERSE — MASTER HIVE INSTALLER  v1.0      █
 █        Transport · Rescue · Sync · Control              █
 █                                                          █
 ████████████████████████████████████████████████████████████
${RESET}"

echo -e "$BANNER"

# ── Detect OS & chip ─────────────────────────────────────────
OS=$(uname -s)
ARCH=$(uname -m)
MACOS_VER=""
if [ "$OS" = "Darwin" ]; then
    MACOS_VER=$(sw_vers -productVersion)
    MACOS_MAJOR=$(echo "$MACOS_VER" | cut -d. -f1)
    echo -e "${CYAN}[INFO]${RESET} macOS ${MACOS_VER} detected (${ARCH})"
else
    echo -e "${CYAN}[INFO]${RESET} Linux ${ARCH} detected"
fi

# ── Role detection ────────────────────────────────────────────
ROLE="${1:-controller}"
echo -e "${CYAN}[INFO]${RESET} Installing as role: ${BOLD}${ROLE}${RESET}"

# ── Docker check ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}[1/5] Checking Docker...${RESET}"

DOCKER_CMD=""
if command -v docker &>/dev/null; then
    DOCKER_CMD="docker"
    DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
    echo -e "  ${GREEN}✅ Docker found: ${DOCKER_VER}${RESET}"
else
    echo -e "  ${RED}❌ Docker not found!${RESET}"
    echo ""
    echo -e "  ${BOLD}Please install Docker Desktop first:${RESET}"
    echo ""
    if [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            echo -e "  ${CYAN}Apple Silicon (M1/M2/M3):${RESET}"
            echo -e "  https://desktop.docker.com/mac/main/arm64/Docker.dmg"
        else
            echo -e "  ${CYAN}Intel Mac:${RESET}"
            # Catalina-safe version
            if [ ! -z "$MACOS_MAJOR" ] && [ "$MACOS_MAJOR" -le 10 ]; then
                echo -e "  ${YELLOW}⚠️  macOS Catalina detected — use Docker Desktop 4.15.0 (last Catalina version):${RESET}"
                echo -e "  ${BOLD}https://desktop.docker.com/mac/main/amd64/93002/Docker.dmg${RESET}"
            else
                echo -e "  https://desktop.docker.com/mac/main/amd64/Docker.dmg"
            fi
        fi
    else
        echo -e "  ${CYAN}Linux install:${RESET}"
        echo -e "  curl -fsSL https://get.docker.com | bash"
    fi
    echo ""
    echo -e "  After installing Docker Desktop, re-run this script."
    exit 1
fi

# ── Docker Compose check ──────────────────────────────────────
if ! docker compose version &>/dev/null 2>&1; then
    echo -e "  ${RED}❌ Docker Compose plugin not found!${RESET}"
    echo -e "  Ensure you have Docker Desktop 4.x+ installed."
    exit 1
fi
echo -e "  ${GREEN}✅ Docker Compose: $(docker compose version --short)${RESET}"

# ── Directory setup ───────────────────────────────────────────
echo ""
echo -e "${BOLD}[2/5] Setting up directories...${RESET}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$HOME/.mc96"
mkdir -p "$DATA_DIR/logs" "$DATA_DIR/registry" "$DATA_DIR/ssh"
echo -e "  ${GREEN}✅ Data directory: ${DATA_DIR}${RESET}"

# ── SSH key generation ────────────────────────────────────────
echo ""
echo -e "${BOLD}[3/5] Configuring SSH keys...${RESET}"
SSH_KEY="$DATA_DIR/ssh/mc96_ed25519"
if [ ! -f "$SSH_KEY" ]; then
    ssh-keygen -t ed25519 -C "mc96-universe-$(hostname)" -f "$SSH_KEY" -N "" -q
    echo -e "  ${GREEN}✅ Generated Ed25519 keypair: ${SSH_KEY}${RESET}"
else
    echo -e "  ${CYAN}ℹ️  SSH key already exists: ${SSH_KEY}${RESET}"
fi
# Copy public key to authorized_keys for peer containers
cat "${SSH_KEY}.pub" >> "$DATA_DIR/ssh/authorized_keys" 2>/dev/null || true
sort -u "$DATA_DIR/ssh/authorized_keys" -o "$DATA_DIR/ssh/authorized_keys" 2>/dev/null || true

# ── Build Docker image ────────────────────────────────────────
echo ""
echo -e "${BOLD}[4/5] Building MC96 Universe Docker image...${RESET}"
cd "$SCRIPT_DIR"

# Copy Python requirements to docker dir if not already there
if [ ! -f "$SCRIPT_DIR/docker/requirements.txt" ]; then
    echo -e "  ${RED}❌ Missing docker/requirements.txt — are you in the mc96-transport directory?${RESET}"
    exit 1
fi

docker build \
    --platform "${MC96_PLATFORM:-linux/$([ "$ARCH" = "arm64" ] && echo arm64 || echo amd64)}" \
    -t mc96-universe:latest \
    -f "$SCRIPT_DIR/docker/Dockerfile" \
    "$SCRIPT_DIR/docker/"

echo -e "  ${GREEN}✅ Image built: mc96-universe:latest${RESET}"

# ── Launch services ───────────────────────────────────────────
echo ""
echo -e "${BOLD}[5/5] Starting MC96 services...${RESET}"

COMPOSE_FILE="$SCRIPT_DIR/docker/docker-compose.yml"

case "$ROLE" in
  controller)
    echo -e "  Starting CONTROLLER (M2 Ultra command plane)..."
    MC96_DATA_DIR="$DATA_DIR" docker compose \
        -f "$COMPOSE_FILE" \
        up -d mc96-controller mc96-rsync mc96-dashboard
    ;;
  worker-micky-p)
    echo -e "  Starting MICKY-P worker node..."
    MC96_DATA_DIR="$DATA_DIR" docker compose \
        -f "$COMPOSE_FILE" \
        --profile micky-p \
        up -d mc96-micky-p mc96-rsync
    ;;
  worker-michael)
    echo -e "  Starting MICHAEL worker node..."
    MC96_DATA_DIR="$DATA_DIR" docker compose \
        -f "$COMPOSE_FILE" \
        --profile michael \
        up -d mc96-michael mc96-rsync
    ;;
  all)
    echo -e "  Starting FULL HIVE stack..."
    MC96_DATA_DIR="$DATA_DIR" docker compose \
        -f "$COMPOSE_FILE" \
        --profile micky-p --profile michael \
        up -d
    ;;
  *)
    echo -e "  ${RED}❌ Unknown role: $ROLE${RESET}"
    echo -e "  Valid roles: controller | worker-micky-p | worker-michael | all"
    exit 1
    ;;
esac

# ── Health check ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}Waiting for services to become healthy...${RESET}"
sleep 5

if [ "$ROLE" = "controller" ] || [ "$ROLE" = "all" ]; then
    for i in {1..10}; do
        if curl -sf http://localhost:8096/health &>/dev/null; then
            echo -e "  ${GREEN}✅ Controller API is UP${RESET}"
            break
        fi
        echo -e "  Waiting... (${i}/10)"
        sleep 3
    done
fi

# ── Final summary ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  ✅ MC96 UNIVERSE IS LIVE!${RESET}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════${RESET}"
echo ""

if [ "$ROLE" = "controller" ] || [ "$ROLE" = "all" ]; then
    echo -e "  🌐 ${BOLD}Web Dashboard:${RESET}   http://localhost:8080"
    echo -e "  🔌 ${BOLD}Controller API:${RESET}  http://localhost:8096"
    echo -e "  📡 ${BOLD}WebSocket Logs:${RESET}  ws://localhost:8097"
    echo -e "  🔑 ${BOLD}SSH Relay:${RESET}       localhost:2222"
    echo -e "  📁 ${BOLD}rsync Daemon:${RESET}    rsync://localhost:873"
    echo ""
    echo -e "  ${CYAN}Open your browser:${RESET} http://localhost:8080"
fi

echo ""
echo -e "  ${BOLD}Useful commands:${RESET}"
echo -e "  docker compose -f ${COMPOSE_FILE} ps              # show all containers"
echo -e "  docker compose -f ${COMPOSE_FILE} logs -f         # stream all logs"
echo -e "  docker exec -it mc96-controller /bin/bash         # shell into controller"
echo -e "  docker compose -f ${COMPOSE_FILE} down            # stop all services"
echo ""
echo -e "  ${YELLOW}To register MICKY-P:  scp install.sh micky-p:/tmp/ && ssh micky-p 'bash /tmp/install.sh worker-micky-p'${RESET}"
echo -e "  ${YELLOW}To register MICHAEL:  scp install.sh michael:/tmp/ && ssh michael 'bash /tmp/install.sh worker-michael'${RESET}"
echo ""
