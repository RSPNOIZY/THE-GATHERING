#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Connect to Michael (MacBook Pro 2012) via ARD / Screen Sharing
# ==============================================================================
MICHAEL_IP="100.88.102.10"

echo "Connecting to Michael ($MICHAEL_IP) via Apple Remote Desktop / VNC..."
open "vnc://$MICHAEL_IP"
