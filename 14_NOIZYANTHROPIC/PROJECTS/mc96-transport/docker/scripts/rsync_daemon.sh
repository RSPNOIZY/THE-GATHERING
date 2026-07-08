#!/usr/bin/env bash
# ============================================================
#  MC96 UNIVERSE — rsync Daemon Service
#  Provides high-speed module-based file transfers
# ============================================================
set -euo pipefail

RSYNCD_CONF="/etc/rsyncd.conf"
VOLUMES_ROOT="${MC96_VOLUMES_ROOT:-/volumes}"
LOG_DIR="${MC96_LOG_DIR:-/data/logs}"

mkdir -p "$LOG_DIR"

echo "[RSYNC] Writing rsyncd.conf..."
cat > "$RSYNCD_CONF" <<EOF
uid = root
gid = root
use chroot = no
max connections = 8
timeout = 300
log file = ${LOG_DIR}/rsyncd.log
transfer logging = yes
lock file = /var/run/rsync.lock

EOF

# ── Dynamically add a module for each mounted volume ─────────
for vol_path in "$VOLUMES_ROOT"/*/; do
    vol_name=$(basename "$vol_path")
    cat >> "$RSYNCD_CONF" <<EOF
[${vol_name}]
    path = ${vol_path}
    comment = MC96 Hive Volume: ${vol_name}
    read only = no
    list = yes
    auth users = mc96
    secrets file = /etc/rsyncd.secrets
    hosts allow = 172.96.0.0/24 100.0.0.0/8 10.0.0.0/8 192.168.0.0/16

EOF
    echo "[RSYNC] Registered module: [${vol_name}] → ${vol_path}"
done

# ── Write secrets file ───────────────────────────────────────
MC96_RSYNC_PASS="${MC96_RSYNC_PASS:-mc96universe}"
echo "mc96:${MC96_RSYNC_PASS}" > /etc/rsyncd.secrets
chmod 600 /etc/rsyncd.secrets

echo "[RSYNC] Starting rsync daemon (port 873)..."
exec rsync --daemon --no-detach --config="$RSYNCD_CONF"
