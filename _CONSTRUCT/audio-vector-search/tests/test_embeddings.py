from __future__ import annotations

import unittest

import numpy as np

from audio_search.embeddings import EMBEDDING_DIM, normalize, to_sqlite_vec_blob


class EmbeddingHelperTests(unittest.TestCase):
    def test_normalize_returns_float32_unit_vector(self) -> None:
        vector = normalize(np.array([3.0, 4.0], dtype=np.float64))

        self.assertEqual(vector.dtype, np.float32)
        self.assertAlmostEqual(float(np.linalg.norm(vector)), 1.0)

    def test_normalize_rejects_zero_vector(self) -> None:
        with self.assertRaises(ValueError):
            normalize(np.zeros(3, dtype=np.float32))

    def test_sqlite_blob_requires_expected_dimension(self) -> None:
        with self.assertRaises(ValueError):
            to_sqlite_vec_blob(np.ones(3, dtype=np.float32))

    def test_sqlite_blob_uses_float32_bytes(self) -> None:
        blob = to_sqlite_vec_blob(np.ones(EMBEDDING_DIM, dtype=np.float64))

        self.assertEqual(len(blob), EMBEDDING_DIM * 4)


if __name__ == "__main__":
    unittest.main()
