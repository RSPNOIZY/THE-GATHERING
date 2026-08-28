from __future__ import annotations

import unittest

from audio_search.audio import choose_window_starts


class WindowSelectionTests(unittest.TestCase):
    def test_short_audio_uses_one_window_at_start(self) -> None:
        self.assertEqual(
            choose_window_starts(
                duration_seconds=3.0,
                window_seconds=7.0,
                window_count=5,
            ),
            [0.0],
        )

    def test_single_window_uses_midpoint_start(self) -> None:
        self.assertEqual(
            choose_window_starts(
                duration_seconds=17.0,
                window_seconds=7.0,
                window_count=1,
            ),
            [5.0],
        )

    def test_multiple_windows_are_ordered_and_inside_bounds(self) -> None:
        starts = choose_window_starts(
            duration_seconds=60.0,
            window_seconds=7.0,
            window_count=5,
        )

        self.assertEqual(len(starts), 5)
        self.assertEqual(starts, sorted(starts))
        self.assertGreater(starts[0], 0.0)
        self.assertLessEqual(starts[-1] + 7.0, 60.0)


if __name__ == "__main__":
    unittest.main()
