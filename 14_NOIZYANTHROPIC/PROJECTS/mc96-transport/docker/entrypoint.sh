#!/usr/bin/env bash
# ============================================================
#  MC96 UNIVERSE — Container Entrypoint
#  Routes execution based on MC96_ROLE environment variable
# ============================================================
set -euo pipefail

LOG_DIR="${MC96_LOG_DIR:-/data/logs}"
mkdir -p "$LOG_DIR"

echo ""
echo "════════════════════════════════════════════════════════"
echo "   🎯 MC96 UNIVERSE NODE STARTING"
echo "   Node: ${MC96_NODE_NAME:-UNNAMED}"
echo "   Role: ${MC96_ROLE:-worker}"
echo "   Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "════════════════════════════════════════════════════════"
echo ""

# ── SSH host keys (generate if not present) ──────────────────
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    echo "[SSH] Generating host keys..."
    ssh-keygen -A
fi

# ── Start SSH daemon ─────────────────────────────────────────
echo "[SSH] Starting daemon on port ${MC96_SSH_PORT:-2222}..."
sed -i "s/#Port 22/Port ${MC96_SSH_PORT:-2222}/" /etc/ssh/sshd_config
/usr/sbin/sshd

# ── Authorized keys from volume ──────────────────────────────
if [ -f /root/.ssh/authorized_keys ]; then
    chmod 600 /root/.ssh/authorized_keys
    echo "[SSH] Loaded authorized_keys"
fi

# ── Role routing ─────────────────────────────────────────────
case "${MC96_ROLE}" in

  controller)
    echo "[CONTROLLER] Starting MC96 Controller API..."
    exec python3 /opt/mc96/scripts/controller_api.py
    ;;

  worker)
    echo "[WORKER] Registering with controller at ${MC96_HIVE_HOST}:${MC96_HIVE_PORT}..."
    exec python3 /opt/mc96/scripts/worker_agent.py
    ;;

  rsync)
    echo "[RSYNC] Starting rsync daemon..."
    exec /opt/mc96/scripts/rsync_daemon.sh
    ;;

  dashboard)
    echo "[DASHBOARD] Starting web dashboard..."
    exec python3 /opt/mc96/scripts/dashboard_api.py
    ;;

  shell)
    echo "[SHELL] Dropping into interactive shell..."
    exec /bin/bash
    ;;

  *)
    echo "[ERROR] Unknown role: ${MC96_ROLE}. Defaulting to shell."
    exec /bin/bash
    ;;
esac
