#!/usr/bin/env python3
"""
turbo_vitals.py
Real-time System Vitals Monitor
"""

import os
import subprocess
import shutil

# Emojis
CPU = "🧠"
RAM = "💾"
DISK = "💽"
CHECK = "✅"
WARN = "⚠️"
CRIT = "🔥"

def get_cpu_load():
    try:
        # uptime returns "load averages: 1.23, 1.45, 1.67"
        output = subprocess.check_output("uptime", shell=True).decode()
        load = output.split("load averages:")[-1].strip()
        return load
    except:
        return "Unknown"

def get_memory_usage():
    try:
        # simplistic parsing of vm_stat. simpler: use 'ps' or 'top' is hard in batch.
        # let's use a rough heuristic or just stick to swap which is critical.
        # actually, `vm_stat` is good.
        # specific simplified check: Swap Usage
        cmd = "sysctl vm.swapusage"
        output = subprocess.check_output(cmd, shell=True).decode().strip()
        # vm.swapusage: total = 0.00M  used = 0.00M  free = 0.00M  (encrypted)
        return output.replace("vm.swapusage: ", "")
    except:
        return "Unknown"

def get_disk_usage(path="/"):
    try:
        total, used, free = shutil.disk_usage(path)
        percent = (used / total) * 100
        gb_free = free / (1024**3)
        return f"{percent:.1f}% Used ({gb_free:.1f} GB Free)"
    except:
        return "Unknown"

def main():
    print("========================================")
    print("🩺 TURBO SYSTEM VITALS")
    print("========================================")
    
    # CPU
    load = get_cpu_load()
    print(f"{CPU} CPU Load: {load}")
    
    # RAM (Swap is a good proxy for "out of memory" on macOS)
    swap = get_memory_usage()
    print(f"{RAM} RAM Swap: {swap}")
    
    # Disk
    disk_root = get_disk_usage("/")
    print(f"{DISK} Disk (/): {disk_root}")
    
    disk_user = get_disk_usage(os.path.expanduser("~"))
    # print(f"{DISK} Disk (~): {disk_user}") # Likely same as / on modern macs

    print("========================================")

if __name__ == "__main__":
    main()
