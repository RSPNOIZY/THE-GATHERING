#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — noizymobile Secure Hash-Verified Batch Sync Pipeline
# Transmits queued local rideshare journal records to M2 Ultra God Rig,
# verifies integrity using SHA-256 manifests, and cleans local queue after verification.
# ==============================================================================
set -euo pipefail

CENTRAL_RIG_IP="100.118.84.40"
CENTRAL_USER="m2ultra"
FREDO_IP="100.100.100.100" # Placeholder IP - update after registration
LOCAL_DB="$HOME/noizymobile_journal.db"
LOCAL_MANIFEST="/tmp/noizymobile_manifest.txt"
REMOTE_TEMP_DIR="/tmp/noizymobile_sync_temp"
CENTRAL_DB="/Users/m2ultra/noizymobile_central.db"
LOCAL_RECEIPT="/tmp/noizymobile_sync_receipt.txt"

echo "═══════════════════════════════════════════════════════════════"
echo "  🔄 NOIZYMOBILE SECURE BATCH SYNC PIPELINE"
echo "  Target Rig: M2 Ultra ($CENTRAL_RIG_IP) · Network: Tailscale"
echo "═══════════════════════════════════════════════════════════════"

# Check local DB
if [ ! -f "$LOCAL_DB" ]; then
  echo "❌ Local journal database not found at $LOCAL_DB. Nothing to sync."
  exit 0
fi

# Count unsynced records
UNSYNCED_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM noizymobile_journal WHERE synced = 0;")
if [ "$UNSYNCED_COUNT" -eq 0 ]; then
  echo "✅ All records already synchronized. Local journal is clean."
  exit 0
fi

echo "📦 Found $UNSYNCED_COUNT unsynced records."

# Check connectivity to God Rig
echo "🔍 Probing central rig connectivity..."
if ! ping -c 1 -t 3 "$CENTRAL_RIG_IP" >/dev/null 2>&1; then
  echo "⚠️ God Rig ($CENTRAL_RIG_IP) is unreachable. Sync deferred until next connection."
  exit 0
fi
echo "  🟢 Central rig is online."

# ─── 1. CLOSE DATABASE AND COMPUTE HASH ─────────────────────────
echo "🔒 Locking local database and generating manifest..."
# Run a quick checkpoint/vacuum to flush to disk
sqlite3 "$LOCAL_DB" "PRAGMA wal_checkpoint(FULL);"

# Calculate SHA-256 hash of the local database
DB_HASH=$(shasum -a 256 "$LOCAL_DB" | awk '{print $1}')
echo "  • Local DB Hash: $DB_HASH"

# Generate manifest file
cat <<EOF > "$LOCAL_MANIFEST"
FILE:noizymobile_journal.db
HASH:$DB_HASH
RECORDS:$UNSYNCED_COUNT
EOF

# ─── 2. TRANSMIT FILES TO CENTRAL RIG ───────────────────────────
echo "🚀 Transmitting database and manifest to Central Rig..."
ssh "$CENTRAL_USER@$CENTRAL_RIG_IP" "mkdir -p $REMOTE_TEMP_DIR"
scp "$LOCAL_DB" "$CENTRAL_USER@$CENTRAL_RIG_IP:$REMOTE_TEMP_DIR/noizymobile_journal.db"
scp "$LOCAL_MANIFEST" "$CENTRAL_USER@$CENTRAL_RIG_IP:$REMOTE_TEMP_DIR/manifest.txt"

# ─── 3. GOD RIG VERIFICATION AND MERGE ──────────────────────────
echo "💾 Verifying hashes and merging records on God Rig..."
# We run SSH and feed it commands to verify the manifest, merge, backup to Fredo, and write receipt
ssh "$CENTRAL_USER@$CENTRAL_RIG_IP" <<EOF
set -e
# Re-calculate hash on God Rig
REMOTE_HASH=\$(shasum -a 256 "$REMOTE_TEMP_DIR/noizymobile_journal.db" | awk '{print \$1}')
MANIFEST_HASH=\$(grep "HASH:" "$REMOTE_TEMP_DIR/manifest.txt" | cut -d':' -f2)

if [ "\$REMOTE_HASH" != "\$MANIFEST_HASH" ]; then
  echo "❌ Hash mismatch detected on Central Rig! Aborting merge."
  exit 1
fi
echo "  ✅ Hashes match. Proceeding with merge."

# Merge into Central DB
sqlite3 "$CENTRAL_DB" <<SQL
CREATE TABLE IF NOT EXISTS rideshare_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  rule_zero_receipt TEXT,
  inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
ATTACH DATABASE '$REMOTE_TEMP_DIR/noizymobile_journal.db' AS incoming;
INSERT INTO rideshare_logs (timestamp, event_type, payload, rule_zero_receipt)
SELECT timestamp, event_type, payload, rule_zero_receipt FROM incoming.noizymobile_journal WHERE synced = 0;
DETACH DATABASE incoming;
SQL

# Replicate to Fredo (if reachable)
echo "💾 Checking backup path to Fredo ($FREDO_IP)..."
if ping -c 1 -t 2 "$FREDO_IP" >/dev/null 2>&1; then
  echo "  📦 Copying sync backup to Fredo..."
  scp "$REMOTE_TEMP_DIR/noizymobile_journal.db" "m2ultra@$FREDO_IP:/tmp/noizymobile_backup_\$(date +%Y%m%d).db" || true
else
  echo "  ⚠️ Fredo is offline. Backup deferred."
fi

# Write receipt file
echo "STATUS=SUCCESS" > "$REMOTE_TEMP_DIR/receipt.txt"
echo "VERIFIED_HASH=\$REMOTE_HASH" >> "$REMOTE_TEMP_DIR/receipt.txt"
echo "TIMESTAMP=\$(date +%Y-%m-%dT%H:%M:%S)" >> "$REMOTE_TEMP_DIR/receipt.txt"
EOF

# ─── 4. PULL RECEIPT AND VERIFY ─────────────────────────────────
echo "📥 Retrieving sync receipt from God Rig..."
scp "$CENTRAL_USER@$CENTRAL_RIG_IP:$REMOTE_TEMP_DIR/receipt.txt" "$LOCAL_RECEIPT"

# Clean up remote temp directory
ssh "$CENTRAL_USER@$CENTRAL_RIG_IP" "rm -rf $REMOTE_TEMP_DIR"

# Verify receipt locally
RECEIPT_HASH=$(grep "VERIFIED_HASH=" "$LOCAL_RECEIPT" | cut -d'=' -f2)
if [ "$RECEIPT_HASH" != "$DB_HASH" ]; then
  echo "❌ Receipt validation failed! Local hash ($DB_HASH) does not match receipt hash ($RECEIPT_HASH)."
  exit 1
fi

echo "  ✅ Receipt verified successfully."

# ─── 5. PURGE SYNCED RECORDS LOCALLY ─────────────────────────────
echo "🧹 Cleaning local journal..."
sqlite3 "$LOCAL_DB" "UPDATE noizymobile_journal SET synced = 1 WHERE synced = 0;"
sqlite3 "$LOCAL_DB" "DELETE FROM noizymobile_journal WHERE synced = 1;"

# Clean up local temp files
rm -f "$LOCAL_MANIFEST" "$LOCAL_RECEIPT"

echo "🎉 Synchronization complete! Local queue purged safely."
