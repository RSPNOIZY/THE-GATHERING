#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# NOIZYNET — SSH & VPN Internal Data Transfer Setup
# RSP_001 Arsenal — GOD (M2 Ultra Mac Studio)
# Sets up secure internal network for NOIZY EMPIRE file transfer
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${DIM}→${NC} $1"; }

header() {
    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}"
}

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    NOIZYNET — SSH & VPN SETUP                        ║${NC}"
echo -e "${BOLD}║    Internal Data Transfer Infrastructure              ║${NC}"
echo -e "${BOLD}║    RSP_001 ARSENAL                                    ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"

# ═══════════════════════════════════════════════════════════════════
# SECTION 1: SSH KEY GENERATION & CONFIGURATION
# ═══════════════════════════════════════════════════════════════════
header "SSH KEY SETUP"

SSH_DIR="$HOME/.ssh"
NOIZYNET_KEY="$SSH_DIR/noizynet_ed25519"

# Create .ssh directory if needed
if [ ! -d "$SSH_DIR" ]; then
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    ok "Created $SSH_DIR"
else
    ok "SSH directory exists"
fi

# Generate NOIZYNET-specific key
if [ ! -f "$NOIZYNET_KEY" ]; then
    ssh-keygen -t ed25519 -C "RSP_001@noizynet.local" -f "$NOIZYNET_KEY" -N ""
    ok "Generated NOIZYNET SSH key: $NOIZYNET_KEY"
else
    ok "NOIZYNET SSH key already exists"
fi

# SSH Config for NOIZYNET hosts
SSH_CONFIG="$SSH_DIR/config"
if ! grep -q "# === NOIZYNET ===" "$SSH_CONFIG" 2>/dev/null; then
    cat >> "$SSH_CONFIG" << 'SSHEOF'

# === NOIZYNET — RSP_001 INTERNAL NETWORK ===

# GOD (M2 Ultra Mac Studio) — self-reference for scripts
Host god god.noizynet.local
    HostName 10.90.90.20
    User m2ultra
    IdentityFile ~/.ssh/noizynet_ed25519
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Micky-P (Recording Machine — Apollo UAD)
Host micky-p micky-p.noizynet.local
    HostName 10.90.90.10
    User rsp001
    IdentityFile ~/.ssh/noizynet_ed25519
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    # Audio session port forwards
    LocalForward 52800 127.0.0.1:52800
    LocalForward 52801 127.0.0.1:52801

# GABRIEL (same as GOD, different persona)
Host gabriel gabriel.noizynet.local
    HostName 10.90.90.20
    User m2ultra
    IdentityFile ~/.ssh/noizynet_ed25519
    Port 22

# Lucy iPad (via SSH over USB or local WiFi)
Host lucy lucy.noizynet.local
    HostName 10.90.90.30
    User mobile
    IdentityFile ~/.ssh/noizynet_ed25519
    Port 22

# NOIZYNET Wildcard — any .noizynet.local host
Host *.noizynet.local
    IdentityFile ~/.ssh/noizynet_ed25519
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new
    AddKeysToAgent yes
    UseKeychain yes

# === END NOIZYNET ===
SSHEOF
    chmod 600 "$SSH_CONFIG"
    ok "Added NOIZYNET hosts to SSH config"
else
    ok "NOIZYNET SSH config already present"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 2: ENABLE SSH SERVER ON GOD
# ═══════════════════════════════════════════════════════════════════
header "SSH SERVER (Remote Login)"

# Check if Remote Login is enabled
if systemsetup -getremotelogin 2>/dev/null | grep -q "On"; then
    ok "Remote Login (SSH server) is ON"
else
    warn "Remote Login is OFF"
    info "To enable: System Settings → General → Sharing → Remote Login"
    info "Or run: sudo systemsetup -setremotelogin on"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 3: NOIZYNET FILE TRANSFER SCRIPTS
# ═══════════════════════════════════════════════════════════════════
header "FILE TRANSFER UTILITIES"

TOOLS_DIR="$HOME/swift-library/bin"
mkdir -p "$TOOLS_DIR"

# noizynet-push: send files to any NOIZYNET host
cat > "$TOOLS_DIR/noizynet-push" << 'PUSHEOF'
#!/bin/bash
# noizynet-push — Send files/dirs to a NOIZYNET host
# Usage: noizynet-push <host> <source> [dest]
# Example: noizynet-push micky-p ~/sessions/latest.wav /recordings/

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: noizynet-push <host> <source> [dest_dir]"
    echo ""
    echo "Hosts: god, micky-p, gabriel, lucy"
    echo "Example: noizynet-push micky-p ~/session.wav /recordings/"
    exit 1
fi

HOST="$1"
SOURCE="$2"
DEST="${3:-~/incoming/}"

echo "⇧ Pushing to $HOST:$DEST"
rsync -avz --progress \
    -e "ssh -i ~/.ssh/noizynet_ed25519" \
    "$SOURCE" \
    "$HOST:$DEST"
echo "✓ Transfer complete"
PUSHEOF
chmod +x "$TOOLS_DIR/noizynet-push"
ok "Created noizynet-push"

# noizynet-pull: pull files from any NOIZYNET host
cat > "$TOOLS_DIR/noizynet-pull" << 'PULLEOF'
#!/bin/bash
# noizynet-pull — Pull files/dirs from a NOIZYNET host
# Usage: noizynet-pull <host> <source> [local_dest]
# Example: noizynet-pull micky-p /recordings/session1.wav ~/sessions/

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: noizynet-pull <host> <source> [local_dest]"
    echo ""
    echo "Hosts: god, micky-p, gabriel, lucy"
    echo "Example: noizynet-pull micky-p /recordings/*.wav ~/sessions/"
    exit 1
fi

HOST="$1"
SOURCE="$2"
DEST="${3:-.}"

echo "⇩ Pulling from $HOST:$SOURCE"
rsync -avz --progress \
    -e "ssh -i ~/.ssh/noizynet_ed25519" \
    "$HOST:$SOURCE" \
    "$DEST"
echo "✓ Transfer complete"
PULLEOF
chmod +x "$TOOLS_DIR/noizynet-pull"
ok "Created noizynet-pull"

# noizynet-sync: bidirectional sync between NOIZYNET hosts
cat > "$TOOLS_DIR/noizynet-sync" << 'SYNCEOF'
#!/bin/bash
# noizynet-sync — Bidirectional sync a directory with a NOIZYNET host
# Usage: noizynet-sync <host> <local_dir> <remote_dir>
# Example: noizynet-sync micky-p ~/sessions/ /shared/sessions/

set -euo pipefail

if [ $# -lt 3 ]; then
    echo "Usage: noizynet-sync <host> <local_dir> <remote_dir>"
    echo ""
    echo "Syncs local_dir with remote_dir (bidirectional via rsync)"
    exit 1
fi

HOST="$1"
LOCAL="$2"
REMOTE="$3"

echo "⇅ Syncing $LOCAL ↔ $HOST:$REMOTE"

# Pull remote changes first
echo "  ⇩ Pulling remote..."
rsync -avz --update --progress \
    -e "ssh -i ~/.ssh/noizynet_ed25519" \
    "$HOST:$REMOTE/" \
    "$LOCAL/"

# Push local changes
echo "  ⇧ Pushing local..."
rsync -avz --update --progress \
    -e "ssh -i ~/.ssh/noizynet_ed25519" \
    "$LOCAL/" \
    "$HOST:$REMOTE/"

echo "✓ Sync complete"
SYNCEOF
chmod +x "$TOOLS_DIR/noizynet-sync"
ok "Created noizynet-sync"

# noizynet-tunnel: create SSH tunnel for audio/API services
cat > "$TOOLS_DIR/noizynet-tunnel" << 'TUNNELEOF'
#!/bin/bash
# noizynet-tunnel — Create SSH tunnels to NOIZYNET services
# Usage: noizynet-tunnel <profile>
# Profiles: audio, api, full

set -euo pipefail

PROFILE="${1:-full}"

case "$PROFILE" in
    audio)
        echo "🎧 Opening audio tunnel to Micky-P..."
        ssh -N -L 52800:127.0.0.1:52800 \
               -L 52801:127.0.0.1:52801 \
               micky-p &
        echo "✓ AU Net Send ports forwarded (52800, 52801)"
        echo "  PID: $!"
        ;;
    api)
        echo "🔌 Opening API tunnels..."
        ssh -N -L 9099:127.0.0.1:9099 \
               -L 5678:127.0.0.1:5678 \
               god &
        echo "✓ GABRIEL API (9099) and n8n (5678) forwarded"
        echo "  PID: $!"
        ;;
    full)
        echo "🌐 Opening full NOIZYNET tunnel..."
        ssh -N -L 52800:127.0.0.1:52800 \
               -L 52801:127.0.0.1:52801 \
               micky-p &
        AUDIO_PID=$!
        echo "✓ Audio tunnels: PID $AUDIO_PID"

        echo ""
        echo "Active tunnels:"
        echo "  52800 → Micky-P AU Net Send (default)"
        echo "  52801 → Micky-P AU Net Send (alt)"
        echo ""
        echo "Kill all: kill $AUDIO_PID"
        ;;
    *)
        echo "Usage: noizynet-tunnel <audio|api|full>"
        exit 1
        ;;
esac
TUNNELEOF
chmod +x "$TOOLS_DIR/noizynet-tunnel"
ok "Created noizynet-tunnel"

# ═══════════════════════════════════════════════════════════════════
# SECTION 4: WIREGUARD VPN (NOIZYNET OVERLAY)
# ═══════════════════════════════════════════════════════════════════
header "WIREGUARD VPN — NOIZYNET OVERLAY"

# Check if WireGuard is installed
if command -v wg &> /dev/null; then
    ok "WireGuard installed"
else
    info "WireGuard not installed"
    info "Install: brew install wireguard-tools"
    info "Or: App Store → WireGuard"
fi

# Create WireGuard config directory
WG_DIR="$HOME/.config/wireguard"
mkdir -p "$WG_DIR"

# Generate WireGuard keys if not present
WG_KEY="$WG_DIR/noizynet_private.key"
WG_PUB="$WG_DIR/noizynet_public.key"

if command -v wg &> /dev/null; then
    if [ ! -f "$WG_KEY" ]; then
        wg genkey > "$WG_KEY"
        chmod 600 "$WG_KEY"
        cat "$WG_KEY" | wg pubkey > "$WG_PUB"
        ok "Generated WireGuard keypair"
    else
        ok "WireGuard keys exist"
    fi

    GOD_PUBKEY=$(cat "$WG_PUB")
    info "GOD Public Key: $GOD_PUBKEY"

    # Create WireGuard config for NOIZYNET
    cat > "$WG_DIR/noizynet.conf" << WGEOF
# NOIZYNET WireGuard VPN — GOD (M2 Ultra)
# This creates a secure overlay network for all NOIZY machines
# Subnet: 10.96.0.0/24 (MC96 reference)

[Interface]
# GOD is the VPN hub
Address = 10.96.0.1/24
ListenPort = 51820
PrivateKey = $(cat "$WG_KEY")
DNS = 1.1.1.1

# Post-up: enable IP forwarding for routing
PostUp = sysctl -w net.inet.ip.forwarding=1
PostDown = sysctl -w net.inet.ip.forwarding=0

# Micky-P (recording machine)
[Peer]
# Replace with Micky-P's actual public key after setup
PublicKey = REPLACE_WITH_MICKY_P_PUBLIC_KEY
AllowedIPs = 10.96.0.10/32
# If on local network:
Endpoint = 10.90.90.10:51820
PersistentKeepalive = 25

# Lucy iPad (dashboard)
[Peer]
# Replace with Lucy's actual public key
PublicKey = REPLACE_WITH_LUCY_PUBLIC_KEY
AllowedIPs = 10.96.0.30/32
PersistentKeepalive = 25

# Remote access (Rob's iPhone when outside studio)
[Peer]
# Replace with iPhone WireGuard public key
PublicKey = REPLACE_WITH_IPHONE_PUBLIC_KEY
AllowedIPs = 10.96.0.50/32
PersistentKeepalive = 25
WGEOF
    chmod 600 "$WG_DIR/noizynet.conf"
    ok "Created WireGuard config: $WG_DIR/noizynet.conf"
    info "NOIZYNET VPN subnet: 10.96.0.0/24 (MC96 reference)"
    info "GOD: 10.96.0.1 | Micky-P: 10.96.0.10 | Lucy: 10.96.0.30 | iPhone: 10.96.0.50"
else
    warn "Skipping WireGuard config (not installed)"
    info "Install first: brew install wireguard-tools"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 5: CLOUDFLARE TUNNEL (REMOTE ACCESS)
# ═══════════════════════════════════════════════════════════════════
header "CLOUDFLARE TUNNEL — REMOTE NOIZYNET ACCESS"

if command -v cloudflared &> /dev/null; then
    ok "cloudflared installed"
    info "Version: $(cloudflared --version 2>&1 | head -1)"

    # Create tunnel config for NOIZYNET
    CF_DIR="$HOME/.cloudflared"
    mkdir -p "$CF_DIR"

    if [ ! -f "$CF_DIR/noizynet-tunnel.yml" ]; then
        cat > "$CF_DIR/noizynet-tunnel.yml" << 'CFEOF'
# NOIZYNET Cloudflare Tunnel Configuration
# Routes external requests to GOD services securely
# No open ports required — outbound-only connection

tunnel: noizynet
credentials-file: /Users/m2ultra/.cloudflared/noizynet-tunnel.json

ingress:
  # GABRIEL API
  - hostname: gabriel.noizy.ai
    service: http://localhost:9099
  # n8n Orchestration
  - hostname: n8n.noizy.ai
    service: http://localhost:5678
  # HEAVEN Worker bridge
  - hostname: heaven.noizy.ai
    service: http://localhost:8787
  # SSH access (via cloudflared access)
  - hostname: ssh.noizy.ai
    service: ssh://localhost:22
  # Catch-all
  - service: http_status:404
CFEOF
        ok "Created Cloudflare tunnel config: $CF_DIR/noizynet-tunnel.yml"
    else
        ok "Cloudflare tunnel config exists"
    fi
    info "To create tunnel: cloudflared tunnel create noizynet"
    info "To run: cloudflared tunnel --config ~/.cloudflared/noizynet-tunnel.yml run"
else
    warn "cloudflared not installed"
    info "Install: brew install cloudflared"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 6: NOIZYNET STATUS CHECKER
# ═══════════════════════════════════════════════════════════════════
header "NOIZYNET STATUS TOOL"

cat > "$TOOLS_DIR/noizynet-status" << 'STATUSEOF'
#!/bin/bash
# noizynet-status — Check all NOIZYNET connections and services
# Usage: noizynet-status

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           NOIZYNET STATUS — $(date '+%Y-%m-%d %H:%M')            ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BOLD}${CYAN}  HOSTS${NC}"

for host_info in "god:10.90.90.20:GOD (M2 Ultra)" "micky-p:10.90.90.10:Micky-P (Recording)" "gateway:10.90.90.1:Gateway/Router"; do
    IFS=':' read -r host ip label <<< "$host_info"
    if ping -c1 -t2 "$ip" &>/dev/null; then
        ms=$(ping -c1 -t2 "$ip" 2>/dev/null | grep "time=" | sed 's/.*time=\([0-9.]*\).*/\1/')
        echo -e "  ${GREEN}●${NC} ${BOLD}$label${NC} ($ip) — ${GREEN}${ms}ms${NC}"
    else
        echo -e "  ${RED}●${NC} ${BOLD}$label${NC} ($ip) — ${RED}OFFLINE${NC}"
    fi
done

echo ""
echo -e "${BOLD}${CYAN}  SERVICES${NC}"

for svc_info in "GABRIEL API:127.0.0.1:9099" "n8n:127.0.0.1:5678" "SSH (GOD):127.0.0.1:22"; do
    IFS=':' read -r name host port <<< "$svc_info"
    if nc -z -w2 "$host" "$port" 2>/dev/null; then
        echo -e "  ${GREEN}●${NC} $name ($host:$port) — ${GREEN}UP${NC}"
    else
        echo -e "  ${RED}●${NC} $name ($host:$port) — ${RED}DOWN${NC}"
    fi
done

# WireGuard
if command -v wg &>/dev/null && sudo wg show noizynet &>/dev/null 2>&1; then
    echo ""
    echo -e "${BOLD}${CYAN}  WIREGUARD VPN${NC}"
    echo -e "  ${GREEN}●${NC} NOIZYNET VPN — ${GREEN}ACTIVE${NC}"
    sudo wg show noizynet 2>/dev/null | grep -E "peer|endpoint|latest" | while read line; do
        echo -e "  ${DIM}  $line${NC}"
    done
else
    echo ""
    echo -e "${BOLD}${CYAN}  WIREGUARD VPN${NC}"
    echo -e "  ${YELLOW}●${NC} NOIZYNET VPN — ${YELLOW}INACTIVE${NC}"
fi

# Cloudflare Tunnel
if pgrep -f "cloudflared tunnel" &>/dev/null; then
    echo ""
    echo -e "${BOLD}${CYAN}  CLOUDFLARE TUNNEL${NC}"
    echo -e "  ${GREEN}●${NC} NOIZYNET Tunnel — ${GREEN}RUNNING${NC}"
else
    echo ""
    echo -e "${BOLD}${CYAN}  CLOUDFLARE TUNNEL${NC}"
    echo -e "  ${YELLOW}●${NC} NOIZYNET Tunnel — ${YELLOW}NOT RUNNING${NC}"
fi

echo ""
STATUSEOF
chmod +x "$TOOLS_DIR/noizynet-status"
ok "Created noizynet-status"

# ═══════════════════════════════════════════════════════════════════
# SECTION 7: PATH SETUP
# ═══════════════════════════════════════════════════════════════════
header "PATH INTEGRATION"

SHELL_RC="$HOME/.zshrc"
if ! grep -q "swift-library/bin" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# NOIZYNET + RSP_001 Arsenal tools" >> "$SHELL_RC"
    echo 'export PATH="$HOME/swift-library/bin:$PATH"' >> "$SHELL_RC"
    ok "Added ~/swift-library/bin to PATH in .zshrc"
else
    ok "PATH already includes swift-library/bin"
fi

# ═══════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════
header "NOIZYNET SETUP COMPLETE"

ok "SSH key: $NOIZYNET_KEY"
ok "SSH config: $SSH_CONFIG (god, micky-p, gabriel, lucy)"
ok "Transfer tools: noizynet-push, noizynet-pull, noizynet-sync"
ok "Tunnel tool: noizynet-tunnel (audio, api, full)"
ok "Status tool: noizynet-status"

echo ""
info "Commands available:"
info "  noizynet-push micky-p ~/session.wav /recordings/"
info "  noizynet-pull micky-p /recordings/*.wav ~/sessions/"
info "  noizynet-sync micky-p ~/shared/ /shared/"
info "  noizynet-tunnel audio"
info "  noizynet-status"

echo ""
info "Next steps:"
info "  1. Copy public key to Micky-P: ssh-copy-id -i $NOIZYNET_KEY.pub micky-p"
info "  2. Install WireGuard: brew install wireguard-tools"
info "  3. Install cloudflared: brew install cloudflared"
info "  4. Create CF tunnel: cloudflared tunnel create noizynet"
info "  5. Run: source ~/.zshrc"

echo ""
echo -e "${DIM}  NOIZYNET v1.0 — Secure Internal Transfer — NOIZY EMPIRE — 5th Epoch${NC}"
echo ""
