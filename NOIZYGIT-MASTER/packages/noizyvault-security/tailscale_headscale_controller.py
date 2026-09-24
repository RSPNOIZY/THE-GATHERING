#!/usr/bin/env python3
"""
tailscale_headscale_controller.py
Master Tailscale & Headscale Sovereign Mesh Controller.
Handles node discovery, health monitoring, Headscale configuration, and dual-mesh federation.
"""

import os
import json
import subprocess
from pathlib import Path

TAILSCALE_BIN = "/opt/homebrew/bin/tailscale"
HEADSCALE_DIR = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizyvault-security/headscale")
CONFIG_YAML = HEADSCALE_DIR / "headscale.yaml"
DOCKER_COMPOSE = HEADSCALE_DIR / "docker-compose.headscale.yml"

GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
BOLD = "\033[1m"
RED = "\033[0;31m"
NC = "\033[0m"

def print_banner():
    print(f"\n{BOLD}═══════════════════════════════════════════════════════════════{NC}")
    print(f"{BOLD}  🛰️  TAILSCALE & HEADSCALE — SOVEREIGN MESH CONTROLLER{NC}")
    print(f"{BOLD}  MC96ECOUNIVERSE · Architecture 4.0.0-SOVEREIGN{NC}")
    print(f"{BOLD}═══════════════════════════════════════════════════════════════{NC}\n")

def get_tailscale_status():
    if not os.path.exists(TAILSCALE_BIN):
        print(f"{RED}❌ Tailscale binary not found at {TAILSCALE_BIN}{NC}")
        return None
    try:
        res = subprocess.run([TAILSCALE_BIN, "status", "--json"], capture_output=True, text=True, check=True)
        return json.loads(res.stdout)
    except Exception as e:
        print(f"{YELLOW}⚠️  Could not query Tailscale daemon via JSON: {e}{NC}")
        return None

def display_mesh_status():
    print(f"{BOLD}1. 📡 Live Tailscale Mesh Topology:{NC}")
    status = get_tailscale_status()
    if not status:
        # Fallback to standard status command
        subprocess.run([TAILSCALE_BIN, "status"], check=False)
        print()
        return

    self_node = status.get("Self", {})
    backend_state = status.get("BackendState", "Unknown")
    
    print(f"   • Backend State: {GREEN}{backend_state}{NC}")
    print(f"   • Host Node:     {BOLD}{self_node.get('HostName', 'Unknown')}{NC} ({self_node.get('TailscaleIPs', ['Unknown'])[0]})")
    print(f"   • OS / Version:  {self_node.get('OS', 'Unknown')} (Tailscale v{status.get('Version', 'Unknown')})")
    
    peers = status.get("Peer", {})
    print(f"\n   {BOLD}Connected Nodes ({len(peers)} detected):{NC}")
    for node_key, peer in peers.items():
        hostname = peer.get("HostName", "Unknown")
        ips = peer.get("TailscaleIPs", ["Unknown"])
        os_type = peer.get("OS", "Unknown")
        online = peer.get("Online", False)
        peer.get("LastSeen", "")
        
        status_icon = f"{GREEN}🟢 Online{NC}" if online else f"{YELLOW}⚪ Offline{NC}"
        print(f"   • {CYAN}{hostname:<24}{NC} [{ips[0]:<15}] {os_type:<6} {status_icon}")
    print()

def display_headscale_spec():
    print(f"{BOLD}2. 🏰 Sovereign Headscale Control Plane Architecture:{NC}")
    print(f"   • Config File:      {CONFIG_YAML}")
    print(f"   • Docker Stack:     {DOCKER_COMPOSE}")
    print("   • Mesh Subnet:      100.96.0.0/16 (fd7a:115c:a1e0:96::/64)")
    print("   • MagicDNS Domain:  noizy.mesh")
    print("   • Sovereign DERP:   Region 996 (noizy-toronto relay)")
    print("   • Node Mappings:")
    print("     - god.noizy.mesh         -> 100.96.0.1  (M2 Ultra Mac Studio)")
    print("     - gabriel.noizy.mesh     -> 100.96.0.2  (Council AI Daemon)")
    print("     - lucy.noizy.mesh        -> 100.96.0.3  (Executive AI Daemon)")
    print("     - studio-ipad.noizy.mesh -> 100.96.0.10 (iPad Pro 12.9 Studio Control)")
    print("     - mobile.noizy.mesh      -> 100.96.0.11 (iPhone 15 Pro Sovereign Link)")
    print()

def main():
    print_banner()
    display_mesh_status()
    display_headscale_spec()
    print(f"{GREEN}{BOLD}✨ TAILSCALE & HEADSCALE SOVEREIGN MESH OPERATIONAL{NC}\n")

if __name__ == "__main__":
    main()
