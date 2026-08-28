# AGENT_STACK.md — NOIZY Empire Free All-Star Team

> Every free-forever API and OSS tool across the NOIZY Empire multi-hive Python swarm.
> GOD.local M2 Ultra 192GB + Replit NOIZYBEAST_RP | May 5, 2026

---

## STACK PHILOSOPHY

| Rule | Law |
|------|-----|
| Free-Forever First | Every tool has a permanent free tier or is fully OSS |
| Local Before Cloud | GOD.local inference preferred; cloud is fallback |
| Multi-Hive | Tools split: Audio, Video, Code, Admin, Creative, LLM |
| Sovereignty | No vendor lock-in. Every tool self-hostable |
| aski.ai Bridge | Cloud APIs route via aski.ai, never direct from Workers |

---

## AUDIO HIVE — A.I.V.A.

| Package | Install | Use Case |
|---------|---------|----------|
| demucs (Meta) | pip install demucs | Stem sep: vocals/drums/bass/other/piano |
| librosa | pip install librosa | BPM, key, spectrograms, MFCC |
| openai-whisper | pip install openai-whisper | STT, transcription, captions |
| faster-whisper | pip install faster-whisper | 4x faster, Apple Silicon native |
| audiocraft (Meta) | pip install audiocraft | MusicGen text-to-music, AudioGen |
| pyannote.audio | pip install pyannote.audio | Speaker diarization, voice ID |
| essentia (MTG) | pip install essentia-tensorflow | 400+ music descriptors |
| spleeter (Deezer) | pip install spleeter | Fast 2/4/5-stem separation |
| basic-pitch (Spotify) | pip install basic-pitch | Audio-to-MIDI transcription |
| pedalboard (Spotify) | pip install pedalboard | VST/AU quality effects |
| noisereduce | pip install noisereduce | AI noise reduction |
| matchering | pip install matchering | Automated mastering |

### Free Cloud Audio APIs
| API | Free | Use |
|-----|------|-----|
| HuggingFace Inference | 1000 req/day | Any audio model |
| Cloudflare Workers AI Whisper | ~10K min/mo | @cf/openai/whisper |
| ElevenLabs | 10K chars/mo | TTS, voice cloning |
| Deepgram | 200 hours free | STT |
| AssemblyAI | 5 hours free | STT + analysis |

---

## VIDEO HIVE — VizBeast

| Package | Install | Use Case |
|---------|---------|----------|
| ffmpeg-python | pip install ffmpeg-python | Full video pipeline |
| yt-dlp | pip install yt-dlp | Download from 1000+ sites |
| moviepy | pip install moviepy | Python video editor |
| opencv-python | pip install opencv-python | Frame analysis, scene detection |
| scenedetect | pip install scenedetect | Shot boundary detection |

### Free Cloud Video APIs
| API | Free | Use |
|-----|------|-----|
| Cloudflare Stream | 1000 min stored + 1000 min/mo | Video hosting |
| Mux | 1000 encoding mins/mo | Video API + analytics |
| RunwayML | 125 credits | Gen-3 video generation |

---

## CODE HIVE — CB-01

| Package | Install | Use Case |
|---------|---------|----------|
| ruff | pip install ruff | Fast linter + formatter |
| black | pip install black | Opinionated formatter |
| mypy | pip install mypy | Static type checking |
| bandit | pip install bandit | Security scanner |
| pytest | pip install pytest pytest-cov | Testing + coverage |
| pre-commit | pip install pre-commit | Git hooks |
| semgrep | pip install semgrep | Static analysis patterns |

### Free Cloud Code APIs
| API | Free | Use |
|-----|------|-----|
| GitHub API | Unlimited | Repos, commits, PRs, webhooks |
| GitHub Actions | 2000 min/mo | CI/CD |
| Cloudflare Workers | 100K req/day | Serverless deploy |
| Replit | Free tier | NOIZYBEAST_RP always-on |
| Render | 750h/mo | Web hosting |

---

## LLM / AI HIVE — Gabriel + Shirl

### Local Models via Ollama (Free on M2 Ultra)
```
ollama pull llama3.3        # Meta 70B - best all-rounder
ollama pull phi4            # Microsoft 14B - compact+smart
ollama pull qwen2.5-coder  # Alibaba - best code model
ollama pull deepseek-r1    # DeepSeek - reasoning
ollama pull nomic-embed-text  # embeddings
```

### Open Source AI Frameworks
| Package | Install | Use Case |
|---------|---------|----------|
| ollama | pip install ollama | Local LLM inference |
| llama-cpp-python | pip install llama-cpp-python | GGUF on Apple Silicon Metal |
| transformers | pip install transformers | HuggingFace model hub |
| langchain | pip install langchain langchain-community | Chains, RAG |
| langgraph | pip install langgraph | Multi-agent graph |
| crewai | pip install crewai | Crew multi-agent tasks |
| autogen | pip install autogen-agentchat | Microsoft multi-agent |
| chromadb | pip install chromadb | Local vector DB |
| instructor | pip install instructor | Structured LLM output |

### Free Cloud LLM APIs
| API | Free Quota | Models |
|-----|-----------|--------|
| Groq | 14,400 req/day | Llama 3.3 70B, Mixtral, Gemma2 |
| Google Gemini | 1500 req/day | Gemini 2.0 Flash |
| Mistral AI | Free tier | Mistral 7B |
| Together AI | $25 free credit | Llama 3.3, FLUX |
| HuggingFace | 1000 req/day | Any Hub model |
| Cloudflare Workers AI | Included | Llama 3, Phi, Mistral |
| Cohere | 100 req/day | Command R, Embed |
| Replicate | Free credits | Llama, SDXL, FLUX, Whisper |
| OpenRouter | $1 free | 200+ models |
| Cerebras | Free tier | Ultra-fast Llama |

---

## ADMIN HIVE — Gabriel

| Package | Install | Use Case |
|---------|---------|----------|
| fastapi | pip install fastapi uvicorn | Async API server |
| celery | pip install celery | Task queue |
| apscheduler | pip install apscheduler | Cron scheduler |
| loguru | pip install loguru | Structured logging |
| pydantic | pip install pydantic pydantic-settings | Validation + env |
| duckdb | pip install duckdb | In-process analytics SQL |

### Free Cloud DB/Storage
| Service | Free | NOIZY Use |
|---------|------|-----------|
| Cloudflare D1 | 5GB, 25B reads/day | gabriel_db (a31d68e2) |
| Cloudflare KV | 1GB, 100K reads/day | GABRIEL_KV |
| Cloudflare R2 | 10GB, 1M ops/mo | noizy-voice-vault |
| Cloudflare Queues | 1M messages/day | Async routing |
| Cloudflare Vectorize | 30M dims | Semantic search |
| Upstash Redis | 10K commands/day | Serverless Redis |
| Neon DB | 0.5GB Postgres | Relational backup |
| Turso | 9GB, 1B rows/mo | SQLite at edge |
| Supabase | 500MB + 1GB | Auth + DB |

---

## CREATIVE HIVE — Shirl

| Package | Install | Use Case |
|---------|---------|----------|
| Pillow | pip install Pillow | Image processing, watermarks |
| diffusers | pip install diffusers accelerate | HuggingFace diffusion SDK |
| bark (Suno) | pip install bark | TTS with voice cloning |
| outetts | pip install outetts | TTS cloning |

### Free Cloud Creative APIs
| API | Free | Use |
|-----|------|-----|
| Cloudflare Workers AI | Included | FLUX Schnell, SDXL |
| Stability AI | 25 credits/day | SDXL, SD3 |
| Fal.ai | Free credits | Fast FLUX |
| Ideogram | Free tier | Text-in-image |
| Canva | Free plan | Template automation |

---

## CLOUDFLARE FREE STACK (All Active)

| Product | Free | NOIZY Use |
|---------|------|-----------|
| Workers | 100K req/day | heaven - empire gateway |
| Workers AI | Included | LLM, audio, image at edge |
| D1 | 5GB, 25B reads/day | gabriel_db |
| KV | 1GB, 100K reads/day | GABRIEL_KV |
| R2 | 10GB, 1M ops/mo | noizy-voice-vault |
| Queues | 1M messages/day | Async routing |
| Vectorize | 30M dims | Semantic search |
| AI Gateway | Unlimited | API routing + caching |
| Pages | Unlimited | Brand landing pages |
| Stream | 1000 min | Video hosting |
| WAF | Free OWASP | Security |
| DNSSEC | Free | All 5 domains |
| Zero Trust Tunnel | Free | GOD.local exposure |

---

## BRIDGE — aski.ai

```
GOD.local:9777 (NOIZYBEAST)
     |
          +-- aski_bridge --> aski.ai (44.232.173.249)
               |                       +--> Groq, Gemini, Together
                    +-- cf_bridge ----> heaven.rsp-5f3.workers.dev
                         |                       +-- D1/KV/R2
                              +-- replit_bridge -> NOIZYBEAST_RP (always-on)
                              ```

                              ---

                              ## ONE-SHOT INSTALL

                              ```bash
                              pip install ollama llama-cpp-python transformers langchain langgraph crewai autogen-agentchat \
                                chromadb instructor demucs librosa openai-whisper faster-whisper audiocraft \
                                  pyannote.audio spleeter basic-pitch pedalboard noisereduce matchering \
                                    ffmpeg-python yt-dlp moviepy opencv-python scenedetect \
                                      fastapi uvicorn celery apscheduler loguru pydantic pydantic-settings \
                                        ruff black mypy bandit pytest duckdb Pillow diffusers accelerate bark \
                                          cloudflare anthropic groq google-generativeai cohere replicate

                                          ollama pull llama3.3 && ollama pull phi4 && ollama pull qwen2.5-coder && ollama pull nomic-embed-text
                                          ```

                                          ---

                                          ## NEVER CLAUSES

                                          1. NEVER store API keys in code - .env + pydantic-settings only
                                          2. NEVER use paid-only APIs without free fallback
                                          3. NEVER call cloud LLMs directly from Workers - use aski.ai bridge
                                          4. NEVER use Fishmusicinc CF account (2446d788) for empire operations
                                          5. NEVER disable local-first inference - GOD.local offline must work
                                          6. NEVER skip smoke tests before deploy

                                          ---

                                          ## CANONICAL IDs

                                          ```
                                          gabriel_db:    a31d68e2-f2d4-4203-a803-8039fdff31cb
                                          agent-memory:  7b813205-fd12-4a23-84a6-ce83bc49ec70
                                          GABRIEL_KV:    f205b56a9914413da0ec454a9dc4c2bd
                                          GABRIEL_VOICE: 16532a32b2e8455486cc966403f3442e
                                          GABRIEL_PORT:  9777
                                          CF Account:    5f36aa9795348ea681d0b21910dfc82a
                                          ```

                                          ---

                                          *AGENT_STACK.md - NOIZY Empire | rsp@noizy.ai | May 5, 2026 | Free. Sovereign. 500 years.*
                                          
