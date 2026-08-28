import os
from pathlib import Path

def initialize_the_gathering():
    print("==== INITIALIZING THE-GATHERING MONOREPO ====\n")
    
    # Define the root of the new canonical repo
    root_dir = Path("/Users/m2ultra/THE-GATHERING")
    
    # The cellular expansion structure
    cells = [
        "core/orchestration",        # Where agent_orchestrator.py will live
        "core/shared_tools",         # Universal tools any agent can use
        "personas/profiles",         # The .json dreamchamber profiles
        "personas/mcp_servers",      # The MCP index.js files for Gabriel, Lucy, Pops, etc.
        "personas/runners",          # Where noizy_agent.py and scan_agents.py will live
        "gateways/discord",          # discord_bot.py
        "gateways/slack",            # slack_bot.py
        "gateways/desktop",          # dc_agent.py and desktop commander tools
        "projects/fish",             # FISH project specific code
        "projects/monetization",     # Automated monetization engines
        "docs/vision",               # Manifestos and architectural plans
    ]
    
    # Build the ecosystem
    for cell in cells:
        cell_path = root_dir / cell
        cell_path.mkdir(parents=True, exist_ok=True)
        print(f"Birthed cell: {cell}")
        
        # Add a .gitkeep so empty directories can be committed to GitHub
        with open(cell_path / ".gitkeep", "w") as f:
            f.write("")

    # Generate the Master README
    readme_path = root_dir / "README.md"
    if not readme_path.exists():
        with open(readme_path, "w") as f:
            f.write("# THE-GATHERING\n\n")
            f.write("The canonical master repo for all things NOIZY, FISH, and the cellular expansion of the artist's true power.\n\n")
            f.write("## The Ecosystem\n")
            f.write("- **Core:** Central nervous system and orchestrators.\n")
            f.write("- **Personas:** The noisy army, their profiles, and MCP skills.\n")
            f.write("- **Gateways:** How the army speaks to the world (Slack, Discord, Desktop).\n")
            f.write("- **Projects:** Organic, interconnecting ventures like FISH and Monetization.\n")
        print(f"\nForged Master Manifest: {readme_path}")

    print("\n==== EXPANSION READY ====")
    print("You can now `git init` or clone your repo into /Users/m2ultra/THE-GATHERING")

if __name__ == "__main__":
    initialize_the_gathering()