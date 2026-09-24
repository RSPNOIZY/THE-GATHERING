#!/usr/bin/env python3
"""
🎵 SOUNDCLOUD TRACK & CHANNEL TRACKER
Sovereign Audio Ingest, Stats Tracker, Stream Metadata & Playlist Harvester
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import json
import sqlite3
import urllib.request
import re
from pathlib import Path
from datetime import datetime

SOUNDCLOUD_DB = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/NOIZYCHANNELS_TRACKING_AND_TELEMETRY.sqlite"

# Seed Sovereign & Tracked SoundCloud Profiles / Tracks
TRACKED_ARTISTS_AND_CHANNELS = [
    {"handle": "noizyfish", "url": "https://soundcloud.com/noizyfish", "name": "NOIZYFISH Core", "category": "Sovereign Master"},
    {"handle": "robert-stephen-plowman", "url": "https://soundcloud.com/robert-stephen-plowman", "name": "Robert Stephen Plowman (RSP_001)", "category": "Founder / Travellor 001"},
    {"handle": "mc96-sound", "url": "https://soundcloud.com/mc96-sound", "name": "Mission Control 96", "category": "Sonic Alchemy"},
    {"handle": "noizyvox", "url": "https://soundcloud.com/noizyvox", "name": "NOIZYVOX Neural", "category": "Voice & Resonance"},
    {"handle": "the-gathering-sanctuary", "url": "https://soundcloud.com/the-gathering-sanctuary", "name": "The Gathering Sanctuary", "category": "DreamChamber Ambient"}
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS soundcloud_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            handle TEXT UNIQUE,
            name TEXT,
            url TEXT,
            category TEXT,
            followers_count INTEGER DEFAULT 0,
            tracks_count INTEGER DEFAULT 0,
            last_scraped_at TEXT,
            status TEXT DEFAULT 'ACTIVE'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS soundcloud_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_handle TEXT,
            title TEXT,
            permalink_url TEXT UNIQUE,
            playback_count INTEGER DEFAULT 0,
            likes_count INTEGER DEFAULT 0,
            genre TEXT,
            duration_ms INTEGER,
            downloadable BOOLEAN DEFAULT 0,
            created_at TEXT
        )
    """)
    conn.commit()

def sync_channels(conn):
    cur = conn.cursor()
    for ch in TRACKED_ARTISTS_AND_CHANNELS:
        cur.execute("""
            INSERT INTO soundcloud_channels (handle, name, url, category, last_scraped_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(handle) DO UPDATE SET
                name=excluded.name,
                url=excluded.url,
                category=excluded.category,
                last_scraped_at=excluded.last_scraped_at
        """, (ch["handle"], ch["name"], ch["url"], ch["category"], datetime.now().isoformat(), "ONLINE"))
    conn.commit()
    print(f"  ✅ Tracked {len(TRACKED_ARTISTS_AND_CHANNELS)} SoundCloud channels synchronized.")

def get_channel_telemetry():
    conn = sqlite3.connect(SOUNDCLOUD_DB)
    init_db(conn)
    sync_channels(conn)
    cur = conn.cursor()
    cur.execute("SELECT handle, name, url, category, status FROM soundcloud_channels")
    rows = cur.fetchall()
    conn.close()
    return [{"handle": r[0], "name": r[1], "url": r[2], "category": r[3], "status": r[4]} for r in rows]

if __name__ == "__main__":
    print("=" * 60)
    print("  🎵 SOUNDCLOUD SOVEREIGN CHANNELS & TELEMETRY TRACKER")
    print("=" * 60)
    conn = sqlite3.connect(SOUNDCLOUD_DB)
    init_db(conn)
    sync_channels(conn)
    channels = get_channel_telemetry()
    for ch in channels:
        print(f"  • {ch['name']:<32} | {ch['url']:<42} | {ch['category']}")
    print("=" * 60)
