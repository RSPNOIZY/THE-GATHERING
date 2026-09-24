#!/usr/bin/env bash
set -euo pipefail

echo "📋 NOIZY Postmortem Capture"
echo "==========================="

# Create postmortems directory
POSTMORTEM_DIR="postmortems"
mkdir -p "$POSTMORTEM_DIR"

TIMESTAMP=$(date -u +%Y-%m-%dT%H%M%SZ)
FILENAME="${POSTMORTEM_DIR}/${TIMESTAMP}.json"

echo "Capturing postmortem: ${FILENAME}"
echo ""

# Gather deployment info
echo "Gathering deployment metadata..."
DEPLOYMENT_INFO=$(npx wrangler deployments list --json 2>/dev/null | head -1 || echo '{"error": "unable to fetch"}')

# Gather experiment state
echo "Gathering experiment state..."
EXPERIMENT_STATE="[]"
if [[ -n "${FEATURE_FLAGS_ID:-}" ]]; then
  EXPERIMENT_STATE=$(npx wrangler kv key list --namespace-id="$FEATURE_FLAGS_ID" 2>/dev/null || echo '[]')
fi

# Gather error budget state
echo "Gathering error budget state..."
BUDGET_STATE=$(node -e "
const { calculateBudget } = require('./src/error-budget.js');
// Mock data - in production, fetch from CF Analytics
const budget = calculateBudget(100000, 150, 0.999);
console.log(JSON.stringify(budget));
" 2>/dev/null || echo '{"error": "unable to compute"}')

# Gather git state
echo "Gathering git state..."
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
GIT_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# Determine trigger reason
TRIGGER="${TRIGGER:-manual}"
ACTION="${ACTION:-investigation}"

# Build postmortem document
cat > "$FILENAME" <<EOF
{
  "version": "1.0",
  "captured_at": "${TIMESTAMP}",
  "trigger": "${TRIGGER}",
  "action": "${ACTION}",

  "deployment": {
    "recent_deployments": ${DEPLOYMENT_INFO}
  },

  "experiments": {
    "active_flags": ${EXPERIMENT_STATE}
  },

  "error_budget": ${BUDGET_STATE},

  "git": {
    "sha": "${GIT_SHA}",
    "branch": "${GIT_BRANCH}",
    "uncommitted_changes": ${GIT_DIRTY}
  },

  "environment": {
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "wrangler_version": "$(npx wrangler --version 2>/dev/null | head -1 || echo 'unknown')",
    "hostname": "$(hostname)",
    "user": "${USER:-unknown}"
  },

  "context": {
    "notes": "Auto-captured postmortem artifact",
    "requires_followup": true,
    "severity": "to_be_determined"
  }
}
EOF

echo ""
echo "════════════════════════════════════════"
echo "  Postmortem captured"
echo "════════════════════════════════════════"
echo "  File: ${FILENAME}"
echo "  Trigger: ${TRIGGER}"
echo "  Action: ${ACTION}"
echo ""
echo "  Contents:"
jq . "$FILENAME"
echo ""
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Review captured data"
echo "  2. Add timeline and findings"
echo "  3. Document action items"
echo "  4. Share with stakeholders"
echo ""

# Create summary for quick review
SUMMARY_FILE="${POSTMORTEM_DIR}/${TIMESTAMP}-summary.md"
cat > "$SUMMARY_FILE" <<EOF
# Postmortem: ${TIMESTAMP}

## Trigger
${TRIGGER}

## Action Taken
${ACTION}

## Quick Facts
- Git SHA: ${GIT_SHA}
- Branch: ${GIT_BRANCH}
- Uncommitted changes: ${GIT_DIRTY}

## Error Budget Status
$(echo "$BUDGET_STATE" | jq -r '"- Consumed: \(.consumedPercent)\n- Remaining: \(.remaining)\n- Can Deploy: \(.canDeploy)"' 2>/dev/null || echo "Unable to parse")

## Timeline
| Time | Event |
|------|-------|
| ${TIMESTAMP} | Postmortem initiated |

## Findings
_(To be filled in during review)_

## Action Items
- [ ] Review deployment logs
- [ ] Check error rates
- [ ] Validate rollback if needed
- [ ] Update documentation

## Lessons Learned
_(To be filled in during review)_

---
*Generated automatically by NOIZY Edge Core*
EOF

echo "Summary created: ${SUMMARY_FILE}"
