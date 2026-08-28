# Audio Upload -> Use Profile

Actors can upload their own audio media and NOIZY converts it into their persistent use profile.

## Endpoint

`POST /profile/{ava_slug}/audio` (multipart form field: `file`)

Supported uploads:

- `.wav`
- `.mp3`
- `.flac`
- `.m4a`
- `.aac`
- `.ogg`

## Processing Pipeline

1. Save raw file to `storage/uploads/{ava_slug}/`
2. Build derivative WAVs with FFmpeg when available:
   - 22,050 Hz
   - mono
   - 16-bit
   - plus archival master: 48kHz stereo float
   - plus immersive derivative: 48kHz stereo float
3. Transcribe analysis derivative with configured STT provider
4. Segment long analysis WAV files into manageable chunks (FFmpeg segment mode)
5. Store asset metadata and quality profile:
   - duration
   - sample rate
   - channels
   - transcript excerpt
   - quality profile name
   - analysis / archival / immersive derivative paths
   - quality report JSON
6. Extract voice features (Librosa if available, basic fallback)
7. Update actor `use_profile` aggregate:
   - upload count
   - total duration
   - sample rates seen
   - channels seen
   - feature backend
   - pitch/rms/zcr summary stats
   - segments processed
   - latest transcript preview
   - quality profiles seen
   - archival/immersive derivative counts
   - latest quality report snapshot

## Query Results

- `GET /profile/{ava_slug}/audio`
- `GET /profile/{ava_slug}/use-profile`
- `GET /profile/{ava_slug}/quality-report`
