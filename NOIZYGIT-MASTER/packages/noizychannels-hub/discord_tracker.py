#!/usr/bin/env python3
"""
👾 DISCORD CHANNELS & COMMUNITY TRACKER
Sovereign Community Broadcaster, Webhook Gateway & Guild Telemetry Hub
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import json
import sqlite3
import urllib.request
from pathlib import Path
from datetime import datetime

CHANNELS_DB = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/NOIZYCHANNELS_TRACKING_AND_TELEMETRY.sqlite"

TRACKED_DISCORD_CHANNELS = [
    {"channel_id": "120000000000000001", "name": "announcements", "guild": "NOIZY EMPIRE HQ", "role": "Broadcast", "type": "Text"},
    {"channel_id": "120000000000000002", "name": "audio-vault", "guild": "NOIZY EMPIRE HQ", "role": "Stem Ingest & Drops", "type": "Media/Forum"},
    {"channel_id": "120000000000000003", "name": "dreamchamber-sanctuary", "guild": "THE GATHERING", "role": "Meditation & Sound", "type": "Voice/Stage"},
    {"channel_id": "120000000000000004", "name": "wisdom-project-travellors", "guild": "THE GATHERING", "role": "Philosophical Discourse", "type": "Text"},
    {"channel_id": "120000000000000005", "name": "haptic-events-alerts", "guild": "NOIZYKIDZ LAB", "role": "Real-time Telemetry", "type": "Alerts"},
    {"channel_id": "120000000000000006", "name": "bot-commands-mcp", "guild": "NOIZY ARMY", "role": "Agent Control Plane", "type": "Command"}
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS discord_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT UNIQUE,
            name TEXT,
            guild TEXT,
            role TEXT,
            type TEXT,
            last_event_at TEXT,
            status TEXT DEFAULT 'CONNECTED'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS discord_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT,
            author TEXT,
            content TEXT,
            created_at TEXT,
            has_media BOOLEAN DEFAULT 0
        )
    """)
    conn.commit()

def sync_channels(conn):
    cur = conn.cursor()
    for ch in TRACKED_DISCORD_CHANNELS:
        cur.execute("""
            INSERT INTO discord_channels (channel_id, name, guild, role, type, last_event_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(channel_id) DO UPDATE SET
                name=excluded.name,
                guild=excluded.guild,
                role=excluded.role,
                type=excluded.type,
                last_event_at=excluded.last_event_at
        """, (ch["channel_id"], ch["name"], ch["guild"], ch["role"], ch["type"], datetime.now().isoformat(), "ACTIVE"))
    conn.commit()
    print(f"  ✅ Tracked {len(TRACKED_DISCORD_CHANNELS)} Discord channels synchronized.")

def broadcast_message(channel_name, content, webhook_url=None):
    """Broadcasts a sovereign update to a Discord channel via webhook or internal bus."""
    conn = sqlite3.connect(CHANNELS_DB)
    init_db(conn)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO discord_messages (channel_id, author, content, created_at, has_media)
        VALUES (?, ?, ?, ?, ?)
    """, (channel_name, "RSP_001_SOVEREIGN_BOT", content, datetime.now().isoformat(), 0))
    conn.commit()
    conn.close()

    if webhook_url:
        try:
            payload = json.dumps({"content": content, "username": "NOIZY Sovereign Dispatcher"}).encode("utf-8")
            req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "NoizyBot/4.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status in [200, 204]
        except Exception as e:
            return False
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("  👾 DISCORD SOVEREIGN CHANNELS & COMMUNITY TRACKER")
    print("=" * 60)
    conn = sqlite3.connect(CHANNELS_DB)
    init_db(conn)
    sync_channels(conn)
    cur = conn.cursor()
    cur.execute("SELECT name, guild, role, type, status FROM discord_channels")
    for r in cur.fetchall():
        print(f"  • #{r[0]:<25} | {r[1]:<20} | {r[2]:<25} | {r[3]}")
    conn.close()
    print("=" * 60)
