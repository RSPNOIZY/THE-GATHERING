#!/bin/zsh
# ============================================================================
# turbo_zap.sh
# The "Hammer" for Network Issues.
# ============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚡ TURBO ZAP: INITIATING NETWORK RESET SEQUENCE...${NC}"

# 1. Flush DNS
echo -e "\n${GREEN}[1/5] Flushing DNS Cache...${NC}"
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
echo "      DNS Flushed."

# 2. Renew DHCP (Ethernet en0)
echo -e "\n${GREEN}[2/6] Renewing DHCP Lease on en0 (Ethernet)...${NC}"
sudo ipconfig set en0 DHCP
echo "      Ethernet DHCP Renewed."

# 3. Wi-Fi Flush (en1)
echo -e "\n${GREEN}[3/6] Flushing Wi-Fi (en1)...${NC}"
sudo ifconfig en1 down
sleep 2
sudo ifconfig en1 up
echo "      Wi-Fi Interface Cycled."

# 4. Interface Toggle (Soft Reset en0)
echo -e "\n${GREEN}[4/6] Power Cycling Ethernet Interface (en0)...${NC}"
sudo ifconfig en0 down
sleep 2
sudo ifconfig en0 up
echo "      Ethernet Interface Cycle Complete."

# 5. Wait for Negotiation
echo -e "\n${GREEN}[5/6] Waiting for Link Negotiation (5s)...${NC}"
sleep 5

# 6. The Physical Ask
echo -e "\n${RED}============================================================${NC}"
echo -e "${RED}⚠️  MANUAL INTERVENTION REQUIRED FOR 'rogers' MODEM ⚠️${NC}"
echo -e "${RED}============================================================${NC}"
echo -e "${YELLOW}I have flushed the Wi-Fi cache and reset Ethernet.${NC}"
echo -e "${YELLOW}To fix the STREAMING TV, you MUST:${NC}"
echo -e "  1. Walk to the Rogers Modem."
echo -e "  2. Unplug the power cable."
echo -e "  3. Count to 10."
echo -e "  4. Plug it back in."
echo -e "${RED}============================================================${NC}"

echo -e "\nChecking connectivity to Switch (10.0.0.132)..."
ping -c 2 -W 1000 10.0.0.132 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Switch is reachable.${NC}"
else
    echo -e "${RED}✗ Switch unreachable (Might be resetting?)${NC}"
fi

echo -e "\n${GREEN}⚡ ZAP SEQUENCE COMPLETE. PLEASE REBOOT MODEM NOW.${NC}"
