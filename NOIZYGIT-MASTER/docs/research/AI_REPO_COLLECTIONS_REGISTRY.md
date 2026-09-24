# 🧠 AI Research, Model Hubs & Academic Repositories Registry

**Canonical Reference for Open-Source AI, Audio/Voice Engineering, Datasets & Academic Institutions**  
*Compiled for: NOIZYGIT-MASTER / NOIZY Universe*  
*Domains: Hugging Face Hub, Kaggle Benchmarks, MIT CSAIL, Columbia LabROSA, Boston Audio AI*  

---

## 🌟 1. Hugging Face Foundation Models & Hub Collections

### 🎙️ SOTA Speech Synthesis, Voice Cloning & Audio Generation
| Model / Repository | Organization / Author | Key Features & Architecture | Canonical Task |
| :--- | :--- | :--- | :--- |
| **`Kokoro-82M`** | Hexgrad | 82M ultra-lightweight SOTA TTS, runs in real-time on CPU/Edge, studio quality | Real-Time Voice Synthesis |
| **`F5-TTS` / `E2-TTS`** | SWivid / Fairseq | Flow Matching with Diffusion Transformer, zero-shot 3s voice cloning | Instant Voice Cloning |
| **`StyleTTS 2`** | yl4579 (Columbia/MIT) | Diffusion-based style modeling, adversarial training, human parity MOS | Emotion & Expressive TTS |
| **`AudioCraft` (MusicGen, AudioGen)** | Meta FAIR | EnCodec neural audio codec with auto-regressive transformer conditioning | Text-to-Music & Sound FX |
| **`Whisper` (v3 / Large-v3-Turbo)** | OpenAI | Multilingual ASR, zero-shot timestamp alignment, robust acoustic modeling | Audio Transcriptions & Ingest |
| **`faster-whisper`** | Systran / CTranslate2 | 4x faster Whisper execution via 8-bit quantization & engine optimization | Production Live Transcription |
| **`Bark`** | Suno AI | GPT-style acoustic tokens, non-speech vocalizations (laughter, sighing, crying) | Expressive Generative Audio |
| **`OpenVoice v2`** | MyShell AI | Decoupled style and tone color transfer, instant cross-lingual voice cloning | Persona Tone Transfer |
| **`Fish-Speech`** | Fish Audio | LLaMA-based token-to-token speech engine with multi-speaker conditioning | Scalable Voice Army Hub |
| **`Qwen2-Audio`** | Alibaba Qwen | End-to-end multimodal audio-language understanding and dialogue | Conversational Voice Agent |

---

## 📊 2. Kaggle Audio, Music & Speech Intelligence Benchmarks

| Dataset / Benchmark | Size / Scope | Description & Use Case |
| :--- | :--- | :--- |
| **AudioSet (Google Research)** | 2.1M sound clips, 632 classes | Comprehensive ontology of human, musical, environmental sounds |
| **FSD50K (Freesound Dataset)** | 51,197 audio files, 200 classes | Open-science sound event recognition benchmark with verified annotations |
| **Lakh MIDI Dataset (LMD)** | 176,581 unique MIDI files | Universal symbolic music collection matched to Million Song Dataset |
| **MAESTRO Dataset** | 200+ hours virtuoso piano | Fine alignment between MIDI capture and acoustic audio recordings |
| **Common Voice (Mozilla)** | 30,000+ hours, 100+ languages | Massive open-source crowd-sourced voice corpus for acoustic modeling |
| **LibriTTS-R** | 585 hours restored audio | Studio-mastered speech dataset for text-to-speech training |
| **VoxCeleb 1 & 2** | 1M+ utterances, 7,000+ speakers | Large-scale speaker identification and acoustic verification benchmark |

---

## 🏛️ 3. Academic Research Hubs: MIT, Columbia & Boston Ecosystems

### 🎓 Massachusetts Institute of Technology (MIT)
- **MIT CSAIL (Computer Science and Artificial Intelligence Laboratory)**:
  - *Audio-Visual Scene Analysis & Invariance*: Joint learning of visual motion and acoustic waveforms.
  - *Physical Acoustics & Material Sound Modeling*: Neural impulse response prediction for room acoustics.
- **MIT Media Lab (Opera of the Future & Responsive Environments)**:
  - Directed by Tod Machover: Pioneers of hyperinstruments, expressive synthesis, and interactive orchestral AI.
  - Hyper-Score & Cognitive Audio Interfaces for creative composition.
- **MIT-IBM Watson AI Lab**:
  - Neuro-symbolic audio representations and foundation models for acoustic reasoning.

### 🎓 Columbia University
- **LabROSA (Laboratory for the Recognition and Organization of Speech and Audio)**:
  - Founded by Prof. Dan Ellis: The birthplace of modern computational music information retrieval (MIR).
  - Foundational algorithms for dynamic time warping, beat tracking, chroma feature extraction, and `librosa` lineage.
- **Columbia Center for Speech and Language Engineering (CSLE)**:
  - Speech emotion recognition, speaker diarization, and cross-modal acoustic translation.

### 🎓 Boston Academic & Sonic Innovation Hubs
- **Harvard NLP (Harvard Natural Language Processing Group)**:
  - OpenNMT, structured attention mechanisms, and sequence-to-sequence foundation architectures.
- **Boston University (Hearing Research Center & Neuromorphic AI)**:
  - Auditory cortex signal modeling, binaural sound localization, and real-time cochlear DSP filters.
- **Berklee College of Music + MIT CAST**:
  - Creative collaboration on AI generative music systems, MIDI orchestration agents, and real-time DAW hooks.

---

## 🛠️ 4. Essential Open-Source Audio & DSP Tooling

```
Audio AI & DSP Tooling Matrix
├── Analysis & MIR:
│   ├── librosa          # Python standard for audio analysis, spectrograms, MFCCs, chroma
│   ├── essentia         # High-performance C++/Python library for audio analysis & music descriptors
│   └── madmom           # Python audio processing library specialized in music information retrieval
├── Stems & Source Separation:
│   ├── demucs (Meta AI) # Hybrid Transformer Demucs v4 for 4/6-stem music separation
│   └── spleeter         # Fast pre-trained stem isolation by Deezer Research
├── Effects & Real-Time Processing:
│   ├── pedalboard       # Spotify's Python DSP library for guitar effects, EQ, compressors, VST3
│   └── deepfilternet    # Low-complexity real-time neural speech enhancement & noise removal
└── Symbolic & MIDI:
    ├── mido             # Clean Python MIDI message handling & streaming
    ├── pretty_midi      # Intuitive parsing, modification, and synthesis of MIDI files
    └── music21          # MIT computational musicology & chord-scale theory toolkit
```

---

## 🔗 5. Direct Integration into NOIZYGIT-MASTER

1. **`mcps/dream-mcp`**: Leverages `AudioCraft`, `Kokoro-82M`, and `pedalboard` for autonomous stem creation and effect chains.
2. **`agents/gabriel`**: Connects neural voice profiles with `F5-TTS` / `StyleTTS2` expressiveness.
3. **`audio_music/kontakt_lab`**: Bridges symbolic MIDI (`music21`, `mido`) with Native Instruments KSP script generation.
4. **`packages/hvs-sovereignty`**: Enforces verifiable metadata assertion (`C2PA`, `NOI-15`) on all AI-generated media outputs.

*Catalog indexed and synchronized within `NOIZYGIT-MASTER/docs/research/`.*
