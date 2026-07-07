#!/usr/bin/env zsh
# turbo_mount_omen.sh
# Connects the M2Ultra to the HP-OMEN (Gabriel's Body) via SMB.

MOUNT_POINT="/Volumes/HP-OMEN"
# DEFAULT SETTINGS - CHANGE THESE IF NEEDED OR PASS AS ARGS
OMEN_USER="gabriel"
OMEN_IP="192.168.1.100" # REPLACE WITH REAL IP
SHARE_NAME="GABRIEL"

echo "🔗 INITIATING NEURAL LINK TO HP-OMEN..."

# 1. Check if already mounted
if [ -d "$MOUNT_POINT" ]; then
    echo "✅ HP-OMEN is ALREADY CONNECTED."
    exit 0
fi

# 2. Create Mount Point
if [ ! -d "$MOUNT_POINT" ]; then
    echo "🔧 Creating mount point: $MOUNT_POINT"
    sudo mkdir -p "$MOUNT_POINT"
    sudo chown $USER "$MOUNT_POINT"
fi

# 3. Mount Logic
echo "⚡ Connecting to smb://$OMEN_USER@$OMEN_IP/$SHARE_NAME..."
mount_smb "//${OMEN_USER}@${OMEN_IP}/${SHARE_NAME}" "$MOUNT_POINT"

# 4. Verify
if [ -d "$MOUNT_POINT/NOIZYLAB" ]; then
    echo "✅ CONNECTION SUCCESSFUL. GABRIEL IS LINKED."
else
    echo "⚠️  Mount attempted, but verify connection manually."
fi
