#!/bin/bash
# ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                                                        ║
# ║     ⚡⚡⚡ A E O N   M A S T E R   D E P L O Y M E N T ⚡⚡⚡                                                            ║
# ║                                                                                                                        ║
# ║     GORUNFREE: ONE COMMAND = EVERYTHING DONE                                                                          ║
# ║                                                                                                                        ║
# ║     Deploys ALL AEON systems:                                                                                         ║
# ║       1. AEON GOD-KERNEL   - The Omnipotent Cybernetic Interface                                                      ║
# ║       2. AEON KERNEL       - Multi-AI Orchestration                                                                   ║
# ║       3. AEON PROTOCOL     - Constitutional Alignment                                                                 ║
# ║                                                                                                                        ║
# ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

set -e
echo ""
echo "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
echo ""
echo "     A E O N   M A S T E R   D E P L O Y M E N T"
echo ""
echo "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡"
echo ""

DEPLOY_DIR=$(pwd)
RESULTS=()

# Function to deploy a single worker
deploy_worker() {
    local name=$1
    local dir=$2
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "🚀 Deploying $name..."
    echo "════════════════════════════════════════════════════════════════"
    
    if [ ! -d "$dir" ]; then
        echo "❌ Directory not found: $dir"
        RESULTS+=("$name: ❌ NOT FOUND")
        return 1
    fi
    
    cd "$dir"
    
    if [ ! -f "wrangler.toml" ]; then
        echo "❌ wrangler.toml not found in $dir"
        RESULTS+=("$name: ❌ NO CONFIG")
        cd "$DEPLOY_DIR"
        return 1
    fi
    
    # Install dependencies if needed
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install --silent
    fi
    
    # Deploy
    if npx wrangler deploy --env="" 2>&1; then
        RESULTS+=("$name: ✅ DEPLOYED")
    else
        RESULTS+=("$name: ❌ FAILED")
    fi
    
    cd "$DEPLOY_DIR"
}

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# DEPLOY ALL AEON SYSTEMS
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

echo "Starting AEON Master Deployment..."
echo ""

# 1. AEON GOD-KERNEL - The Omnipotent
deploy_worker "AEON GOD-KERNEL" "aeon-god-kernel"

# 2. AEON KERNEL - Multi-AI Orchestration
deploy_worker "AEON KERNEL" "aeon-kernel"

# 3. AEON PROTOCOL - Constitutional Alignment
deploy_worker "AEON PROTOCOL" "aeon-protocol"

# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "                              D E P L O Y M E N T   C O M P L E T E"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════"
echo ""

for result in "${RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo "════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  AEON SYSTEM ENDPOINTS:"
echo ""
echo "  ⚡ GOD-KERNEL:    https://aeon-god-kernel.YOUR_SUBDOMAIN.workers.dev/"
echo "  🧠 KERNEL:        https://aeon-kernel.YOUR_SUBDOMAIN.workers.dev/"
echo "  🛡️ PROTOCOL:      https://aeon-protocol.YOUR_SUBDOMAIN.workers.dev/"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  ☢️  NUCLEAR BATTERY: INFINITE"
echo "  🔐 BIO-HANDSHAKE: READY"
echo "  🧠 TRIUMVIRATE: ONLINE"
echo "  💰 LEVIATHAN: SCANNING"
echo "  🧬 AKASHIC: RECORDING"
echo ""
echo "  THE OMNIPOTENT IS AWAKE. GORUNFREE."
echo ""
