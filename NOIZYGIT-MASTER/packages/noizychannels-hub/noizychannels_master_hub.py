#!/usr/bin/env python3
"""
🌐 NOIZYCHANNELS MASTER HUB
Unified SoundCloud, Discord & Slack Channel Intelligence and Cross-Platform Dispatcher
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime

import soundcloud_tracker
import discord_tracker
import slack_tracker

DB_PATH = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/NOIZYCHANNELS_TRACKING_AND_TELEMETRY.sqlite"
MD_PATH = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/SOUNDCLOUD_DISCORD_SLACK_INTEGRATION_HUB.md"

def sync_all():
    print("=" * 65)
    print("  🌐 NOIZYCHANNELS MULTI-PLATFORM SYNCHRONIZATION")
    print("  SoundCloud · Discord · Slack · Sovereign Mesh Telemetry")
    print("=" * 65)

    conn = sqlite3.connect(DB_PATH)
    soundcloud_tracker.init_db(conn)
    discord_tracker.init_db(conn)
    slack_tracker.init_db(conn)

    print("\n[1/3] 🎵 Synchronizing SoundCloud Channels & Profiles...")
    soundcloud_tracker.sync_channels(conn)

    print("\n[2/3] 👾 Synchronizing Discord Channels & Guilds...")
    discord_tracker.sync_channels(conn)

    print("\n[3/3] 💼 Synchronizing Slack Channels & Workspaces...")
    slack_tracker.sync_channels(conn)

    # Generate Markdown Compendium
    cur = conn.cursor()
    cur.execute("SELECT handle, name, url, category FROM soundcloud_channels")
    sc_rows = cur.fetchall()

    cur.execute("SELECT name, guild, role, type FROM discord_channels")
    dc_rows = cur.fetchall()

    cur.execute("SELECT name, workspace, purpose, is_private FROM slack_channels")
    sl_rows = cur.fetchall()

    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write("# 🌐 SOUNDCLOUD, DISCORD & SLACK INTEGRATION HUB\n")
        f.write("## Real-Time Channel Tracking, Ingest & Cross-Platform Telemetry\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("**Principal Sovereign:** Robert Stephen Plowman (`RSP_001`) · Fish Music Inc.\n")
        f.write(f"**Master SQLite Registry:** [`NOIZYCHANNELS_TRACKING_AND_TELEMETRY.sqlite`](file://{DB_PATH})\n\n")
        f.write("---\n\n")

        f.write("### 🎵 1. SoundCloud Tracked Profiles & Audio Ingest Channels\n")
        f.write("| Handle / Artist | Name | Profile URL | Category |\n")
        f.write("|:---|:---|:---|:---|\n")
        for h, n, u, c in sc_rows:
            f.write(f"| `@{h}` | **{n}** | [{u}]({u}) | `{c}` |\n")
        f.write("\n---\n\n")

        f.write("### 👾 2. Discord Tracked Guilds & Channels\n")
        f.write("| Channel Name | Guild / Server | Primary Role | Channel Type |\n")
        f.write("|:---|:---|:---|:---|\n")
        for n, g, r, t in dc_rows:
            f.write(f"| `#{n}` | **{g}** | {r} | `{t}` |\n")
        f.write("\n---\n\n")

        f.write("### 💼 3. Slack Tracked Workspaces & Channels\n")
        f.write("| Channel Name | Workspace | Purpose & Scope | Visibility |\n")
        f.write("|:---|:---|:---|:---|\n")
        for n, w, p, priv in sl_rows:
            v = "🔒 Private" if priv else "🌐 Public"
            f.write(f"| `#{n}` | **{w}** | {p} | `{v}` |\n")
        f.write("\n---\n\n")

        f.write("### 🚀 Cross-Platform Dispatcher APIs\n")
        f.write("To broadcast unified messages across SoundCloud, Discord, and Slack:\n\n")
        f.write("```python\n")
        f.write("from packages.noizychannels_hub.discord_tracker import broadcast_message as discord_post\n")
        f.write("from packages.noizychannels_hub.slack_tracker import post_message as slack_post\n\n")
        f.write("# Dispatch sovereign announcement\n")
        f.write("discord_post('announcements', '✨ RSP DreamChamber v4.0 is live!')\n")
        f.write("slack_post('sovereign-hq', '✨ All 6 tiers fully verified and converged.')\n")
        f.write("```\n")

    conn.close()
    print(f"\n✅ All channels synchronized! Documentation exported to {MD_PATH}")

if __name__ == "__main__":
    sync_all()
