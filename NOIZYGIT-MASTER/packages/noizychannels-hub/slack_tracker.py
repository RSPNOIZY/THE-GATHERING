#!/usr/bin/env python3
"""
💼 SLACK CHANNELS & WORKSPACE TRACKER
Sovereign Team Comms, Alert Dispatcher & Channel Ingest Hub
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

TRACKED_SLACK_CHANNELS = [
    {"channel_id": "C01_SOVEREIGN_HQ", "name": "sovereign-hq", "workspace": "NOIZY LABS", "purpose": "Executive Decisions & Sovereign Roadmap", "is_private": True},
    {"channel_id": "C02_AUDIO_ENGINEERING", "name": "audio-dsp-engineering", "workspace": "NOIZY LABS", "purpose": "CoreAudio, Logic Pro & VST3 DSP", "is_private": False},
    {"channel_id": "C03_ARTISTS_WISDOM", "name": "artists-wisdom-travellors", "workspace": "NOIZY LABS", "purpose": "Wisdom Project & Creator Royalties", "is_private": False},
    {"channel_id": "C04_SYSTEM_ALERTS", "name": "infra-system-alerts", "workspace": "NOIZY LABS", "purpose": "Cloudflare, D1, Tailscale & Daemon Health", "is_private": False},
    {"channel_id": "C05_FINANCE_CRA", "name": "finance-invoices-cra", "workspace": "FISH MUSIC INC", "purpose": "Invoices, HST/GST & CRA Corporate Records", "is_private": True},
    {"channel_id": "C06_FOSS_CURATION", "name": "foss-top-universe", "workspace": "NOIZY LABS", "purpose": "Daily Top-of-the-Universe FOSS Radar", "is_private": False}
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS slack_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT UNIQUE,
            name TEXT,
            workspace TEXT,
            purpose TEXT,
            is_private BOOLEAN DEFAULT 0,
            last_activity_at TEXT,
            status TEXT DEFAULT 'ACTIVE'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS slack_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT,
            user TEXT,
            text TEXT,
            timestamp TEXT,
            blocks TEXT
        )
    """)
    conn.commit()

def sync_channels(conn):
    cur = conn.cursor()
    for ch in TRACKED_SLACK_CHANNELS:
        cur.execute("""
            INSERT INTO slack_channels (channel_id, name, workspace, purpose, is_private, last_activity_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(channel_id) DO UPDATE SET
                name=excluded.name,
                workspace=excluded.workspace,
                purpose=excluded.purpose,
                is_private=excluded.is_private,
                last_activity_at=excluded.last_activity_at
        """, (ch["channel_id"], ch["name"], ch["workspace"], ch["purpose"], 1 if ch["is_private"] else 0, datetime.now().isoformat(), "ONLINE"))
    conn.commit()
    print(f"  ✅ Tracked {len(TRACKED_SLACK_CHANNELS)} Slack channels synchronized.")

def post_message(channel_id, text, webhook_url=None):
    conn = sqlite3.connect(CHANNELS_DB)
    init_db(conn)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO slack_messages (channel_id, user, text, timestamp)
        VALUES (?, ?, ?, ?)
    """, (channel_id, "RSP_001_MASTER_BOT", text, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    if webhook_url:
        try:
            payload = json.dumps({"text": text, "channel": channel_id}).encode("utf-8")
            req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status in [200, 204]
        except Exception:
            return False
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("  💼 SLACK SOVEREIGN CHANNELS & WORKSPACE TRACKER")
    print("=" * 60)
    conn = sqlite3.connect(CHANNELS_DB)
    init_db(conn)
    sync_channels(conn)
    cur = conn.cursor()
    cur.execute("SELECT name, workspace, purpose, is_private FROM slack_channels")
    for r in cur.fetchall():
        privacy = "🔒 Private" if r[3] else "🌐 Public"
        print(f"  • #{r[0]:<25} | {r[1]:<18} | {r[2]:<40} | {privacy}")
    conn.close()
    print("=" * 60)
