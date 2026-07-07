# ═══════════════════════════════════════════════════════════════════════════
# NOIZY EMPIRE — Makefile
# ═══════════════════════════════════════════════════════════════════════════

.PHONY: help doctor deploy deploy-canary smoke status rollback audit tail dev

# Default target
help:
	@echo "NOIZY Empire Commands"
	@echo "═════════════════════"
	@echo ""
	@echo "  make doctor       - Check environment & auth"
	@echo "  make deploy       - Deploy Heaven (with smoke test)"
	@echo "  make deploy-canary - Deploy with canary verification"
	@echo "  make smoke        - Run smoke tests"
	@echo "  make status       - Full system status"
	@echo "  make rollback     - Emergency rollback"
	@echo "  make audit        - Export deployment audit log"
	@echo "  make tail         - Stream live logs"
	@echo "  make dev          - Start local dev server"
	@echo ""

# Preflight check
doctor:
	@./scripts/wrangler-doctor.sh

# Standard deploy
deploy:
	@./scripts/deploy-heaven.sh

# Canary deploy
deploy-canary:
	@./scripts/canary-deploy.sh

# Smoke tests
smoke:
	@./scripts/smoke-test.sh

# Full status
status:
	@./scripts/full-status.sh

# Emergency rollback
rollback:
	@./scripts/rollback.sh

# Export audit log
audit:
	@./scripts/export-audit-log.sh

# Live logs
tail:
	@npx wrangler tail heaven

# Local development
dev:
	@npx wrangler dev
