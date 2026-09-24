#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py scan \
  --root /Users/m2ultra/NOIZYANTHROPIC/projects/THE-GATHERING_REPO/M2ULTRA_ALL/_private/RSP_001_VAULT/voice_demos \
  --root-name RSP_001_VOICE_DEMOS \
  --limit-per-drive 100
