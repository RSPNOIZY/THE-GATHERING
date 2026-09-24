#!/usr/bin/env python3
"""
turbo_speed.py
Network Bandwidth & Streaming Readiness Test
"""

import time
import urllib.request

# Emojis
SPEED = "🚀"
STREAM = "📺"
CHECK = "✅"
WARN = "⚠️"
FAIL = "❌"

def test_download_speed():
    # URL for a small test file (approx 10-20MB is good for quick check)
    # Using Cloudflare speed test file or similar reliable fast CDN.
    # 10MB file from valid source.
    url = "http://speedtest.tele2.net/10MB.zip"
    file_size_mb = 10
    
    print(f"{SPEED} Testing Download Speed (Target: {file_size_mb}MB)...")
    
    try:
        start_time = time.time()
        with urllib.request.urlopen(url, timeout=15) as response:
            _ = response.read()
        end_time = time.time()
        
        duration = end_time - start_time
        speed_mbps = (file_size_mb * 8) / duration
        return speed_mbps
    except Exception as e:
        print(f"{FAIL} Speed Test Failed: {e}")
        return 0

def grade_speed(mbps):
    print(f"\n{SPEED} Measured Speed: {mbps:.2f} Mbps")
    
    if mbps >= 25:
        print(f"{CHECK} {STREAM} 4K UHD Streaming: READY (Required: 25 Mbps)")
        print(f"{CHECK} {STREAM} HD Streaming: READY")
    elif mbps >= 5:
        print(f"{WARN} {STREAM} 4K UHD Streaming: NOT READY")
        print(f"{CHECK} {STREAM} HD Streaming: READY (Required: 5 Mbps)")
    else:
        print(f"{FAIL} {STREAM} 4K/HD Streaming: NOT READY")
        print(f"{CHECK} {STREAM} SD Streaming: READY (Required: 3 Mbps)")

def main():
    print("========================================")
    print("🏎️  TURBO SPEED TEST")
    print("========================================")
    
    mbps = test_download_speed()
    if mbps > 0:
        grade_speed(mbps)
    else:
        print("Could not measure speed.")
        
    print("========================================")

if __name__ == "__main__":
    main()
