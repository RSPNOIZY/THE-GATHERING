#!/bin/bash
cd ~/Documents/NOIZYVOX_ENGINE
source venv/bin/activate
echo "🎤 Starting NOIZYVOX ENGINE..."
echo "   API: http://localhost:8420"
echo "   UI:  http://localhost:8421"
python3 scripts/noizyvox_ui.py
