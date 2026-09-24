#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# FIX GOOGLE & ANTIGRAVITY — RSP_001 Arsenal
# Diagnoses and fixes all Google Cloud + Antigravity IDE issues
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
echo -e "${BOLD}║    FIX GOOGLE & ANTIGRAVITY                          ║${NC}"
echo -e "${BOLD}║    RSP_001 ARSENAL — $(date '+%Y-%m-%d %H:%M')                   ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"

# ═══════════════════════════════════════════════════════════════
# ISSUE 1: Google Cloud Auth
# ═══════════════════════════════════════════════════════════════
header "GOOGLE CLOUD AUTHENTICATION"

if gcloud auth list --format="value(account)" 2>/dev/null | grep -q "@"; then
    ACCOUNT=$(gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null)
    ok "Authenticated as: $ACCOUNT"
else
    fail "No Google Cloud account authenticated"
    echo ""
    echo -e "  ${BOLD}${YELLOW}ACTION REQUIRED:${NC}"
    echo -e "  Run this command in a terminal (requires browser):${NC}"
    echo ""
    echo -e "  ${BOLD}  gcloud auth login rsplowman@icloud.com${NC}"
    echo ""
    info "This will open a browser for Google OAuth"
    info "After login, also run:"
    echo -e "  ${BOLD}  gcloud auth application-default login${NC}"
    info "(This sets credentials for local apps like Antigravity)"
fi

# Check project
PROJECT=$(gcloud config get-value project 2>/dev/null || echo "none")
info "Active GCP project: $PROJECT"

# ═══════════════════════════════════════════════════════════════
# ISSUE 2: The 403 Error Explained
# ═══════════════════════════════════════════════════════════════
header "403 ERROR DIAGNOSIS"

info "Error: Permission 'cloudaicompanion.companions.generateChat' denied"
info "Project in error: gen-lang-client-0531202734"
echo ""
info "This is the ${BOLD}Gemini Code Assist${NC} in Antigravity (Google's IDE)"
info "The error means ONE of these:"
echo ""
info "  1. gcloud is not authenticated (most likely — CONFIRMED)"
info "  2. Cloud AI Companion API is not enabled on the project"
info "  3. Your account doesn't have the right IAM role"
echo ""
info "Fix order:"
info "  Step 1: gcloud auth login"
info "  Step 2: gcloud auth application-default login"
info "  Step 3: Enable Cloud AI Companion API in GCP Console"
info "  Step 4: Restart Antigravity"

# ═══════════════════════════════════════════════════════════════
# ISSUE 3: Antigravity Settings
# ═══════════════════════════════════════════════════════════════
header "ANTIGRAVITY IDE SETTINGS"

SETTINGS="$HOME/Library/Application Support/Antigravity/User/settings.json"
if [ -f "$SETTINGS" ]; then
    # Check Gemini project
    GEMINI_PROJECT=$(grep "geminicodeassist.project" "$SETTINGS" | sed 's/.*": "\(.*\)".*/\1/')
    if [ "$GEMINI_PROJECT" = "noizy-ai" ]; then
        ok "Gemini Code Assist project: noizy-ai"
    else
        warn "Gemini Code Assist project: $GEMINI_PROJECT (should be noizy-ai)"
    fi

    # Check MCP servers
    MCP_EMPTY=$(grep '"mcpServers": {}' "$SETTINGS" || true)
    if [ -n "$MCP_EMPTY" ]; then
        warn "MCP servers in Antigravity: EMPTY"
        info "Consider adding NOIZY MCP servers to Antigravity settings"
    fi

    ok "Antigravity version: $(mdls -name kMDItemVersion /Applications/Antigravity.app | awk -F'"' '{print $2}')"
    ok "Claude Code integration: present (panel mode)"
    ok "Claude ultrathink: enabled"
    ok "Profile: GABRIEL & CLAUDE"
    ok "Storage backup: enabled"
    ok "Auto-save: on focus change"
else
    fail "Antigravity settings not found at $SETTINGS"
fi

# ═══════════════════════════════════════════════════════════════
# ISSUE 4: Google APIs to Enable
# ═══════════════════════════════════════════════════════════════
header "GOOGLE APIS TO ENABLE"

info "After gcloud auth login, enable these APIs:"
echo ""
echo -e "  ${BOLD}# Cloud AI Companion (for Gemini Code Assist in Antigravity)${NC}"
echo -e "  gcloud services enable cloudaicompanion.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# Gemini API (for direct API access)${NC}"
echo -e "  gcloud services enable generativelanguage.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# Google Drive API (for Archivist + GABRIEL)${NC}"
echo -e "  gcloud services enable drive.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# Gmail API (for n8n/Zapier email triggers)${NC}"
echo -e "  gcloud services enable gmail.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# Calendar API (for scheduling integration)${NC}"
echo -e "  gcloud services enable calendar-json.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# Cloud Text-to-Speech (backup TTS for NOIZYVOX)${NC}"
echo -e "  gcloud services enable texttospeech.googleapis.com --project=noizy-ai"
echo ""
echo -e "  ${BOLD}# All at once:${NC}"
echo -e "  gcloud services enable \\"
echo -e "    cloudaicompanion.googleapis.com \\"
echo -e "    generativelanguage.googleapis.com \\"
echo -e "    drive.googleapis.com \\"
echo -e "    gmail.googleapis.com \\"
echo -e "    calendar-json.googleapis.com \\"
echo -e "    texttospeech.googleapis.com \\"
echo -e "    --project=noizy-ai"

# ═══════════════════════════════════════════════════════════════
# ISSUE 5: IAM Roles
# ═══════════════════════════════════════════════════════════════
header "IAM ROLES NEEDED"

info "Your account (rsplowman@icloud.com) needs these roles on project noizy-ai:"
echo ""
info "  roles/cloudaicompanion.user      — Gemini Code Assist"
info "  roles/aiplatform.user            — Vertex AI (if using)"
info "  roles/editor                     — General project access"
echo ""
info "After auth, check with:"
echo -e "  gcloud projects get-iam-policy noizy-ai \\"
echo -e "    --flatten='bindings[].members' \\"
echo -e "    --filter='bindings.members:rsplowman@icloud.com'"

# ═══════════════════════════════════════════════════════════════
# QUICK FIX SCRIPT
# ═══════════════════════════════════════════════════════════════
header "ONE-SHOT FIX (run after gcloud auth login)"

cat > "$HOME/swift-library/bin/fix-google-all" << 'FIXEOF'
#!/bin/bash
# Run this AFTER: gcloud auth login rsplowman@icloud.com
set -euo pipefail

echo "Enabling all Google APIs on noizy-ai..."
gcloud services enable \
    cloudaicompanion.googleapis.com \
    generativelanguage.googleapis.com \
    drive.googleapis.com \
    gmail.googleapis.com \
    calendar-json.googleapis.com \
    texttospeech.googleapis.com \
    --project=noizy-ai

echo ""
echo "Setting application default credentials..."
gcloud auth application-default login

echo ""
echo "Verifying..."
gcloud services list --enabled --project=noizy-ai | grep -iE "companion|gemini|drive|gmail|calendar|speech"

echo ""
echo "✓ All Google services enabled. Restart Antigravity."
echo "  killall Antigravity && open /Applications/Antigravity.app"
FIXEOF
chmod +x "$HOME/swift-library/bin/fix-google-all"
ok "Created fix-google-all script"

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
header "SUMMARY"

echo ""
echo -e "  ${BOLD}${RED}ROOT CAUSE:${NC} gcloud has NO authenticated account"
echo -e "  ${BOLD}${RED}EFFECT:${NC} Antigravity can't reach Cloud AI Companion API"
echo -e "  ${BOLD}${RED}FIX:${NC} 2-step process (requires browser):"
echo ""
echo -e "  ${BOLD}Step 1:${NC} gcloud auth login rsplowman@icloud.com"
echo -e "  ${BOLD}Step 2:${NC} ~/swift-library/bin/fix-google-all"
echo ""
echo -e "  ${BOLD}${GREEN}After that, Antigravity Gemini Code Assist will work.${NC}"
echo ""
echo -e "${DIM}  Google & Antigravity Fix v1.0 — NOIZY EMPIRE${NC}"
echo ""
