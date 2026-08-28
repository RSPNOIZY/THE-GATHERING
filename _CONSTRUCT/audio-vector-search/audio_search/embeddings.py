from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


DEFAULT_MODEL_NAME = "laion/clap-htsat-fused"
EMBEDDING_DIM = 512


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vector)
    if norm == 0:
        raise ValueError("Cannot normalize a zero vector")
    return (vector / norm).astype(np.float32)


def to_sqlite_vec_blob(vector: np.ndarray) -> bytes:
    vector = np.asarray(vector, dtype=np.float32)
    if vector.shape != (EMBEDDING_DIM,):
        raise ValueError(f"Expected a {EMBEDDING_DIM}-dimensional vector, got {vector.shape}")
    return vector.tobytes()


@dataclass
class ClapEmbedder:
    processor: Any
    model: Any
    device: Any

    @classmethod
    def load(cls, model_name: str = DEFAULT_MODEL_NAME) -> "ClapEmbedder":
        import torch
        from transformers import ClapModel, ClapProcessor

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        processor = ClapProcessor.from_pretrained(model_name)
        model = ClapModel.from_pretrained(model_name).to(device)
        model.eval()
        return cls(processor=processor, model=model, device=device)

    def embed_audio_windows(
        self,
        windows: list[np.ndarray],
        *,
        sampling_rate: int,
    ) -> np.ndarray:
        inputs = self.processor(
            audio=windows,
            sampling_rate=sampling_rate,
            return_tensors="pt",
            padding=True,
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        import torch

        with torch.inference_mode():
            features = self.model.get_audio_features(**inputs)

        vectors = features.detach().cpu().numpy().astype(np.float32)
        vectors = np.stack([normalize(vector) for vector in vectors])
        return normalize(vectors.mean(axis=0))

    def embed_text(self, text: str) -> np.ndarray:
        inputs = self.processor(text=[text], return_tensors="pt", padding=True)
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        import torch

        with torch.inference_mode():
            features = self.model.get_text_features(**inputs)

        return normalize(features[0].detach().cpu().numpy().astype(np.float32))
