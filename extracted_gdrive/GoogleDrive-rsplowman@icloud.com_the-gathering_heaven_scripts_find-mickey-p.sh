#!/usr/bin/env bash
# ============================================================
# FIND MICKEY-P — Network Discovery
# Run this ON GOD to find Mickey-P's actual IP
# ============================================================

echo "🔍 SEARCHING FOR MICKEY-P..."
echo ""

echo "GOD's network:"
ifconfig en0 2>/dev/null | grep "inet " | awk '{print "  GOD IP: " $2}'
echo ""

echo "All devices on network (ARP):"
arp -a 2>/dev/null | while read -r line; do
  ip=$(echo "$line" | grep -oE '10\.[0-9]+\.[0-9]+\.[0-9]+')
  mac=$(echo "$line" | grep -oE '([0-9a-f]{1,2}:){5}[0-9a-f]{1,2}')
  [[ -z "$ip" ]] && continue
  
  # Try to identify via hostname
  name=$(dns-sd -Q "$ip" 2>/dev/null | head -1 || echo "")
  
  echo "  $ip  ($mac)"
done

echo ""
echo "Testing SSH on each IP..."
arp -a 2>/dev/null | grep -oE '10\.[0-9]+\.[0-9]+\.[0-9]+' | while read -r ip; do
  result=$(ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -o BatchMode=yes "$ip" 'hostname' 2>/dev/null)
  if [[ -n "$result" ]]; then
    echo "  ✅ $ip — hostname: $result"
    # Check if it's an old MacBook
    model=$(ssh -o ConnectTimeout=2 -o BatchMode=yes "$ip" 'sysctl hw.model 2>/dev/null' 2>/dev/null)
    [[ -n "$model" ]] && echo "     Hardware: $model"
  fi
done

echo ""
echo "To enable SSH on Mickey-P:"
echo "  System Settings → General → Sharing → Remote Login → ON"
echo ""
echo "Or check your router's DHCP table for the device list."
echo "Mickey-P MAC address hint: look for an older Apple device."
