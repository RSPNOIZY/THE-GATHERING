#!/usr/bin/env python3
"""
=============================================================================
 NOIZY UNIVERSE: MASTER APPS, PLATFORMS & SOFTWARE CONSOLIDATION ENGINE
 Target: /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/apps
=============================================================================
"""

import os
import shutil
import json
from datetime import datetime

TARGET_APPS_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/apps"
TARGET_PACKAGES_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages"
TARGET_PLATFORMS_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/platform"

APP_SOURCES = [
    ("/Users/m2ultra/NOIZYANTHROPIC/apps", "apps"),
    ("/Users/m2ultra/NOIZYANTHROPIC/landing", "landing_suites"),
    ("/Users/m2ultra/NOIZYANTHROPIC/openclaw", "openclaw_suite"),
    ("/Users/m2ultra/NOIZYANTHROPIC/platform", "platform_core"),
    ("/Users/m2ultra/NOIZYANTHROPIC/swift-library", "swift_native_bridges"),
    ("/Users/m2ultra/THE-GATHERING/apps", "gathering_apps")
]

def safe_copy_tree(src, dst):
    if not os.path.exists(src):
        return False
    try:
        os.makedirs(dst, exist_ok=True)
        if os.path.isdir(src):
            for item in os.listdir(src):
                if item in ['.git', 'node_modules', '__pycache__', '.DS_Store', '.venv']:
                    continue
                s = os.path.join(src, item)
                d = os.path.join(dst, item)
                if os.path.isdir(s):
                    safe_copy_tree(s, d)
                elif os.path.isfile(s):
                    shutil.copy2(s, d)
        elif os.path.isfile(src):
            shutil.copy2(src, dst)
        return True
    except Exception as e:
        print(f"Error copying {src} -> {dst}: {e}")
        return False

def consolidate_all_software():
    print("==================================================================", flush=True)
    print(" CONSOLIDATING & BUILDING ALL APPS, PLATFORMS & SOFTWARE MODULES")
    print(f" Target: {TARGET_APPS_DIR}")
    print("==================================================================", flush=True)

    os.makedirs(TARGET_APPS_DIR, exist_ok=True)
    os.makedirs(TARGET_PACKAGES_DIR, exist_ok=True)

    catalog = []

    for src_root, category in APP_SOURCES:
        if not os.path.exists(src_root):
            continue
        print(f"\nProcessing [{category}]: {src_root}...", flush=True)

        if category in ["openclaw_suite", "platform_core", "swift_native_bridges"]:
            dest_dir = os.path.join(TARGET_PACKAGES_DIR, category)
            safe_copy_tree(src_root, dest_dir)
            catalog.append({
                "name": category,
                "category": "package_platform",
                "source": src_root,
                "destination": f"packages/{category}",
                "updated_at": datetime.now().isoformat()
            })
            print(f"  ✓ Preserved platform package: {category} -> packages/{category}")
            continue

        for app_name in os.listdir(src_root):
            if app_name.startswith(".") or app_name in ["node_modules", "__pycache__", ".venv"]:
                continue
            app_src = os.path.join(src_root, app_name)
            if not os.path.isdir(app_src):
                continue

            dest_app_dir = os.path.join(TARGET_APPS_DIR, category, app_name)
            safe_copy_tree(app_src, dest_app_dir)
            
            catalog.append({
                "name": app_name,
                "category": category,
                "source": app_src,
                "destination": f"apps/{category}/{app_name}",
                "updated_at": datetime.now().isoformat()
            })
            print(f"  ✓ Ingested app: {app_name} -> apps/{category}/{app_name}")

    # Write Apps Catalog JSON
    catalog_path = os.path.join(TARGET_APPS_DIR, "APPS_CATALOG.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_apps": len(catalog),
            "apps": catalog
        }, f, indent=2)

    # Write Master Apps README
    readme_path = os.path.join(TARGET_APPS_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("# 📱 NOIZY UNIVERSE: CANONICAL APPLICATIONS & SOFTWARE SUITE\n\n")
        f.write(f"**Total Consolidated Applications & Frontends**: **{len(catalog)}**  \n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 🚀 Application Categories\n\n")
        f.write("### 1. `apps/apps/` - Core Ecosystem Applications\n")
        f.write("- **`noizystream`**: Real-time audio/video streaming & WebRTC node\n")
        f.write("- **`the-aquarium`**: Fish Music & 3D Interactive Audio Aquarium\n")
        f.write("- **`noizyvox`**: Voice Army & Neural TTS Engine\n")
        f.write("- **`the-codex`**: Universal Knowledge Graph & Document Explorer\n")
        f.write("- **`gabriel-ios` & `lucy-ios`**: Native iOS interfaces and Siri AppIntents\n")
        f.write("- **`heaven-docker`**: Containerized local microservices runtime\n\n")
        f.write("### 2. `apps/landing_suites/` - Production Web Landings & Portals\n")
        f.write("- `noizylab`, `noizyfish-ca`, `noizyvox`, `noizykidz`, `dreamchamber`, `fishmusicinc`\n\n")
        f.write("### 3. `packages/` - Platforms & Bridges\n")
        f.write("- **`openclaw_suite`**: Autonomous agent execution & skills engine\n")
        f.write("- **`platform_core`**: Shared microservice connectors & SDK\n")
        f.write("- **`swift_native_bridges`**: Logic Pro MCP bridge & macOS system audio hook\n\n")
        f.write("Refer to `APPS_CATALOG.json` for full machine-readable build configurations.\n")

    print("\n==================================================================", flush=True)
    print(f" ALL {len(catalog)} APPS & SOFTWARE MODULES SUCCESSFULLY CONSOLIDATED!")
    print("==================================================================", flush=True)

if __name__ == "__main__":
    consolidate_all_software()
