# Audio Vector Search

Index local audio files with CLAP embeddings and search them with `sqlite-vec`.

The ingest path decodes several mono 48 kHz windows per track with `ffmpeg`, embeds
each window with CLAP, L2-normalizes the vectors, mean-pools them, normalizes the
mean vector, and stores one vector per track in SQLite. Very short files may use
fewer decoded windows than requested; the database records both values.

## Requirements

- Python 3.10+
- `ffmpeg` and `ffprobe` on your PATH
- Enough disk/network access for Hugging Face to download `laion/clap-htsat-fused`

Install Python dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If macOS Python cannot load SQLite extensions, use a Homebrew Python build.

## Index Audio

```bash
python ingest.py ~/Music/Samples --db audio_tracks.sqlite
```

You can pass individual files, folders, or a mix of both. Folders are scanned
recursively for common audio extensions.

Useful options:

```bash
python ingest.py ~/Music/Samples \
  --db audio_tracks.sqlite \
  --window-seconds 7 \
  --window-count 5
```

Re-running ingest skips unchanged files. Use `--force` if you want to rebuild
vectors anyway, or `--keep-going` to continue through decode errors in a large
library:

```bash
python ingest.py ~/Music/Samples --db audio_tracks.sqlite --keep-going
```

## Search By Text

```bash
python search.py --text "dusty boom bap drum loop" --db audio_tracks.sqlite --limit 10
```

For scripts or downstream tools:

```bash
python search.py --text "wide cinematic riser" --db audio_tracks.sqlite --json
```

## Search By Audio

```bash
python search.py --audio ./query.wav --db audio_tracks.sqlite --limit 10
```

## Test The Lightweight Pieces

These tests do not download CLAP or touch your audio library:

```bash
python -m unittest discover -s tests
```

## SQL Shape

The search query is:

```sql
SELECT
    t.id,
    t.path,
    t.title,
    t.duration_seconds,
    v.distance
FROM vec_audio_tracks AS v
JOIN audio_tracks AS t ON t.id = v.rowid
WHERE v.embedding MATCH ?
  AND k = ?
ORDER BY v.distance;
```

The bound query value is a 512-dimensional float32 vector serialized with:

```python
np.asarray(vector, dtype=np.float32).tobytes()
```

Because all stored and query vectors are L2-normalized, sqlite-vec's default L2
ranking tracks cosine similarity closely for CLAP embeddings.
