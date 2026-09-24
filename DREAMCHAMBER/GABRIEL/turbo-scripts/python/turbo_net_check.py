#!/usr/bin/env python3
"""
turbo_net_check.py
Instant Network Health Verification for MC96ECOUNIVERSE
"""

import os
import socket
import sys
import subprocess
from concurrent.futures import ThreadPoolExecutor

# Emojis
CHECK = "✅"
FAIL = "❌"
WARN = "⚠️"
INFO = "ℹ️"

def print_status(message, status=INFO):
    print(f"{status} {message}")

def check_internet():
    """1. Check Basic Connectivity (Google DNS)"""
    try:
        # Try to connect to Google's DNS server (8.8.8.8) on port 53 (DNS)
        # This checks if there's a route to the internet and if basic connectivity is available.
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        print_status("Internet Connectivity (8.8.8.8:53)", CHECK)
        return True
    except OSError:
        print_status("Internet Connectivity (8.8.8.8:53)", FAIL)
        return False

def ping(host, count=1, timeout=2):
    """Ping a host and return True if reachable."""
    try:
        # macOS ping flags: -c count, -t timeout (seconds)
        cmd = ["ping", "-c", str(count), "-t", str(timeout), host]
        subprocess.check_output(cmd, stderr=subprocess.STDOUT)
        return True
    except subprocess.CalledProcessError:
        return False

def check_dns(domain):
    """Try to resolve a domain."""
    try:
        socket.gethostbyname(domain)
        return True
    except socket.error:
        return False

def get_default_gateway():
    """Get default gateway IP."""
    try:
        # netstat -rn | grep default
        cmd = "netstat -rn | grep default | awk '{print $2}' | head -n 1"
        gateway = subprocess.check_output(cmd, shell=True).decode().strip()
        return gateway
    except:
        return None

def get_public_ip():
    """Fetch Public IP."""
    try:
        ip = subprocess.check_output(["curl", "-s", "--max-time", "3", "ifconfig.me"], text=True).strip()
        return ip
    except:
        return "Unavailable"

def get_wifi_stats():
    """Get detailed Wi-Fi stats via airport utility."""
    try:
        airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
        if os.path.exists(airport_path):
            output = subprocess.check_output([airport_path, "-I"], text=True)
            stats = {}
            for line in output.split('\n'):
                parts = line.split(':')
                if len(parts) >= 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
                    stats[key] = val
            return stats
    except:
        pass
    return None

def check_stability():
    """Check Jitter and Packet Loss to 8.8.8.8"""
    # Ping 10 times, fast interval (0.2s)
    # Parsing ping output depends on OS. macOS:
    # round-trip min/avg/max/stddev = 13.064/16.126/22.450/2.845 ms
    cmd = ["ping", "-c", "10", "-i", "0.2", "8.8.8.8"]
    
    try:
        output = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
        
        # Packet Loss
        loss_line = [l for l in output.split('\n') if "packet loss" in l]
        loss_pct = 100.0
        if loss_line:
            # "10 packets transmitted, 10 packets received, 0.0% packet loss"
            parts = loss_line[0].split(',')
            for p in parts:
                if "packet loss" in p:
                    loss_pct = float(p.strip().split('%')[0])
        
        # Jitter (stddev)
        jitter = 0.0
        stats_line = [l for l in output.split('\n') if "stddev" in l]
        if stats_line:
            # "round-trip min/avg/max/stddev = ..."
            val_part = stats_line[0].split('=')[1]
            # The instruction snippet includes a print statement here, but it uses `avg_ping` which is not defined in this function.
            # Assuming the intent was to just get the jitter value as before.
            jitter = float(val_part.split('/')[3].replace(' ms', '').strip())
            
        return loss_pct, jitter
    except:
        return 100.0, 999.0

def check_jumbo_frames():
    """Check for Jumbo Frames (MTU 9000) on en0."""
    print("\n🐘 CHECKING JUMBO FRAMES (MTU)...")
    try:
        # Get MTU for en0 (Primary Ethernet usually)
        result = subprocess.run(["networksetup", "-getMTU", "en0"], capture_output=True, text=True)
        output = result.stdout.strip()
        
        if "9000" in output:
            print("   ✅ JUMBO FRAMES ACTIVE (MTU 9000)")
            print("   -> Optimized for DGS-1210-10 & Large Data Transfers.")
        else:
            print(f"   ⚠️  STANDARD MTU DETECTED: {output}")
            print("   -> Run 'networksetup -setMTU en0 9000' to enable if supported.")
            
    except Exception as e:
        print(f"   ❌ Error checking MTU: {e}")

def main():
    print("========================================")
    print("🚀 TURBO NETWORK DIAGNOSTIC v3.0 (PARALLEL)")
    print("========================================")

    # Run all checks in parallel — cuts total time from ~15s to ~3s
    with ThreadPoolExecutor(max_workers=6) as pool:
        fut_internet = pool.submit(check_internet)
        fut_wifi = pool.submit(get_wifi_stats)
        fut_gateway = pool.submit(get_default_gateway)
        fut_stability = pool.submit(check_stability)
        fut_ip = pool.submit(get_public_ip)
        domains = ["google.com", "netflix.com", "apple.com"]
        fut_dns = {pool.submit(check_dns, d): d for d in domains}

    # Results (all already done)
    fut_internet.result()
    check_jumbo_frames()

    # 0. Wi-Fi Stats
    wifi = fut_wifi.result()
    if wifi:
        ssid = wifi.get('SSID', 'Unknown')
        rssi = int(wifi.get('agrCtlRSSI', -100))
        noise = int(wifi.get('agrCtlNoise', -100))
        rate = wifi.get('lastTxRate', 'Unknown')

        signal_grade = CHECK
        if rssi < -70: signal_grade = WARN
        if rssi < -80: signal_grade = FAIL

        print_status(f"Wi-Fi: {ssid} (Rate: {rate} Mbps)", INFO)
        print_status(f"Signal: {rssi} dBm / Noise: {noise} dBm", signal_grade)
    else:
        print_status("Wi-Fi Stats Unexpectedly Unavailable", WARN)

    # 1. Local Gateway
    gateway = fut_gateway.result()
    if gateway:
        if ping(gateway):
            print_status(f"Router ({gateway}) is REACHABLE", CHECK)
        else:
            print_status(f"Router ({gateway}) is UNREACHABLE", FAIL)
    else:
        print_status("Could not determine Default Gateway", WARN)

    # 2. Internet Stability (Loss & Jitter)
    loss, jitter = fut_stability.result()

    loss_grade = CHECK
    if loss > 0: loss_grade = WARN
    if loss > 5: loss_grade = FAIL
    print_status(f"Packet Loss: {loss}%", loss_grade)

    jitter_grade = CHECK
    if jitter > 10: jitter_grade = WARN # >10ms jitter affects gaming/calls
    if jitter > 30: jitter_grade = FAIL # >30ms visible buffering
    print_status(f"Jitter (Stability): {jitter:.2f} ms", jitter_grade)

    public_ip = fut_ip.result()
    print_status(f"Public IP: {public_ip}", INFO)

    # 3. DNS Resolution
    success_count = sum(1 for f in fut_dns if f.result())

    if success_count == len(domains):
        print_status("DNS Resolution (Core Services)", CHECK)
    elif success_count > 0:
        print_status("DNS Resolution (Partial)", WARN)
    else:
        print_status("DNS Resolution (FAILED)", FAIL)

    print("========================================")
    if success_count == len(domains) and loss == 0.0 and jitter < 30:
        print("✨ NETWORK STATUS: OPTIMAL")
        sys.exit(0)
    else:
        print("💀 NETWORK STATUS: DEGRADED")
        sys.exit(1)

if __name__ == "__main__":
    main()
