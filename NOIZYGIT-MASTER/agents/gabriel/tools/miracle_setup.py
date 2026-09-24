#!/usr/bin/env python3
import platform
import subprocess
import sys
import shutil

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def log(msg, status="INFO"):
    color = RESET
    if status == "OK": color = GREEN
    elif status == "ERROR" or status == "FATAL": color = RED
    elif status == "ACTION": color = YELLOW
    print(f"{color}[{status}] {msg}{RESET}")

def run_cmd(cmd, shell=False, check=True):
    log(f"Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}...", "EXEC")
    try:
        subprocess.run(cmd, shell=shell, check=check)
        log("Command executed successfully", "OK")
    except subprocess.CalledProcessError as e:
        if check:
            log(f"Command failed with exit code {e.returncode}", "ERROR")
            sys.exit(e.returncode)
        else:
            log(f"Command failed (non-fatal): {e}", "WARN")

def install_mac():
    log("Detected macOS System", "OS")
    
    # 1. Check Homebrew
    if not shutil.which("brew"):
        log("Homebrew not found! Please install Homebrew first: https://brew.sh", "FATAL")
        sys.exit(1)
    
    # 2. Cleanup potential issues/locks (optional, but good for "Miracle" clean)
    log("Updating Homebrew...", "ACTION")
    run_cmd(["brew", "update"], check=False)
    
    # 3. Install Subversion
    log("Installing Subversion...", "ACTION")
    run_cmd(["brew", "install", "subversion"])
    
    # 4. Verify
    log("Verifying Installation...", "VERIFY")
    try:
        # Use simple version check to avoid hanging on auth/network if configured wrong
        result = subprocess.run(["svn", "--version", "--quiet"], capture_output=True, text=True, timeout=5)
        log(f"Subversion Installed: {result.stdout.strip()}", "OK")
        
        # Check if we are using the brew version
        svn_path = shutil.which("svn")
        log(f"SVN Location: {svn_path}", "INFO")
        if "/usr/bin/svn" in svn_path:
             log("WARNING: System SVN is still default. You may need to restart your shell run 'hash -r'", "WARN")
             
    except subprocess.TimeoutExpired:
        log("SVN version check timed out! This usually means authentication prompts are hanging.", "ERROR")
    except Exception as e:
        log(f"Verification failed: {e}", "ERROR")

def install_win():
    log("Detected Windows System", "OS")
    
    # Check for Winget
    if shutil.which("winget"):
        log("Winget detected.", "OK")
        log("Installing TortoiseSVN...", "ACTION")
        run_cmd("winget install TortoiseSVN.TortoiseSVN", shell=True, check=False)
        log("Installing Command Line Tools (SlikSVN)...", "ACTION")
        run_cmd("winget install SlikSvn.SlikSvn", shell=True, check=False)
    else:
        log("Winget not found. Please install TortoiseSVN manually from https://tortoisesvn.net/downloads.html", "WARN")

def main():
    print(f"{GREEN}=== MIRACLE SETUP APPLICATION ==={RESET}")
    print(f"{YELLOW}[GABRIEL]{RESET} Uplink Established. System ID: {platform.node()}")
    system = platform.system()
    if system == "Darwin":
        install_mac()
    elif system == "Windows":
        install_win()
    else:
        log(f"Unsupported OS: {system}", "ERROR")
    
    print(f"\n{GREEN}=== SETUP COMPLETED ==={RESET}")

if __name__ == "__main__":
    main()
