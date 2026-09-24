"""turbo_video_ai — graceful stub for VideoForge.

Real implementation is gated on Veo 3.1 + google-genai. Until that's wired,
this stub satisfies the import in turbo_gabriel_omega.py and reports honestly
when called.
"""
from __future__ import annotations

from pathlib import Path


class VideoForge:
    def __init__(self) -> None:
        self.available = False  # flip to True once Veo creds are wired

    def generate_veo(self, prompt: str) -> Path | None:
        # Honest failure — Gabriel will speak this back to the user.
        print(f"[VideoForge] Stub mode. Veo not wired. Prompt was: {prompt}")
        return None
