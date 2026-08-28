import os
import json
import subprocess
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
try:
    from personas.runners.noizy_agent import PERSONAS
except ModuleNotFoundError:
    from noizy_agent import PERSONAS

def scan_agent_skills():
    print("==== GLOBAL SCAN: AGENT SKILLS, TALENTS & CODE ====\n")
    
    for agent, config in PERSONAS.items():
        print(f"[{agent.upper()}]")
        profile_path = config.get("profile")
        server_path = config.get("server")
        
        # 1. Scan Profile JSON for talents/roles
        if os.path.exists(profile_path):
            try:
                with open(profile_path, "r") as f:
                    data = json.load(f)
                    identity = data.get("identity", {})
                    role = identity.get("role", "No role defined")
                    print(f"  Role: {role}")
                    
                    skills = identity.get("skills", [])
                    if skills:
                        print(f"  Talents: {', '.join(skills)}")
            except Exception as e:
                print(f"  [!] Error reading profile: {e}")
        else:
            print(f"  [!] Profile missing: {profile_path}")
            
        # 2. Grep MCP Server code for tools (skills)
        if os.path.exists(server_path):
            print("  Code Tools (from MCP Server):")
            # Grep for tool declarations or names in index.js
            cmd = f"grep -iE 'name:|description:|tool' {server_path} | sed 's/^[[:space:]]*//' | head -n 10"
            try:
                result = subprocess.check_output(cmd, shell=True, text=True)
                for line in result.strip().split('\n'):
                    if line:
                        print(f"    - {line.strip()}")
            except subprocess.CalledProcessError:
                print("    (No explicit tool definitions found or grep failed)")
        else:
            print(f"  [!] MCP server code missing: {server_path}")
        
        print("-" * 50)

if __name__ == "__main__":
    scan_agent_skills()