# GABRIEL HIVE STACK -- COMPLETE OPEN SOURCE INTEGRATION
Master reference: JADE hive, Django, Node.js, Python packages, Home Assistant,
open source orchestration, music/voice/video tools, GABRIEL voice recording.
Part of MC96ECO Universe | RSP_001 | NOIZYANTHROPIC

---

## 1. GABRIEL JADE HIVE -- Maven + Docker

Five agents form the GABRIEL hive core:
- GabrielCore: Orchestrator and decision spine. Registers in JADE DF. Routes all tasks.
- CloudflareAgent: API/policy/router layer for edge infrastructure.
- HomeAssistantAgent: Physical device and automation sync via HA REST API.
- AudioAgent: OSC and MC96 routing control. Interfaces with NOIZYBEAST audio pipeline.
- NoizyVoxAgent: Voice intake and transcription. Feeds Coqui/Whisper pipeline.

### pom.xml (Maven)

Group: ai.noizy | Artifact: gabriel-hive | Version: 1.0.0
Dependencies: JADE 4.6.0, Jackson 2.15.2, SLF4J 2.0.7
Build: maven-shade-plugin 3.4.1 shaded JAR
Main class: ai.noizy.gabriel.GabrielBootstrap

### GabrielBootstrap.java

package ai.noizy.gabriel;

import jade.core.Profile;
import jade.core.ProfileImpl;
import jade.core.Runtime;
import jade.wrapper.AgentContainer;
import jade.wrapper.AgentController;

public class GabrielBootstrap {
    public static void main(String[] args) throws Exception {
        Runtime rt = Runtime.instance();
        Profile p = new ProfileImpl();
        p.setParameter(Profile.MAIN_HOST, "localhost");
        p.setParameter(Profile.GUI, "false");
        AgentContainer mainContainer = rt.createMainContainer(p);

        String[][] agents = {
            {"GabrielCore",        "ai.noizy.gabriel.GabrielCoreAgent"},
            {"CloudflareAgent",    "ai.noizy.gabriel.CloudflareAgent"},
            {"HomeAssistantAgent", "ai.noizy.gabriel.HomeAssistantAgent"},
            {"AudioAgent",         "ai.noizy.gabriel.AudioAgent"},
            {"NoizyVoxAgent",       "ai.noizy.gabriel.NoizyVoxAgent"}
        };

        for (String[] agent : agents) {
            AgentController ac = mainContainer.createNewAgent(agent[0], agent[1], new Object[]{});
            ac.start();
            System.out.println("Started: " + agent[0]);
        }
    }
}

### GabrielCoreAgent.java

package ai.noizy.gabriel;

import jade.core.Agent;
import jade.core.behaviours.CyclicBehaviour;
import jade.domain.DFService;
import jade.domain.FIPAAgentManagement.DFAgentDescription;
import jade.domain.FIPAAgentManagement.ServiceDescription;
import jade.lang.acl.ACLMessage;

public class GabrielCoreAgent extends Agent {
    @Override
    protected void setup() {
        DFAgentDescription dfd = new DFAgentDescription();
        dfd.setName(getAID());
        ServiceDescription sd = new ServiceDescription();
        sd.setType("gabriel-orchestrator");
        sd.setName("GABRIEL-CORE");
        dfd.addServices(sd);
        try {
            DFService.register(this, dfd);
            System.out.println("GabrielCore registered in DF");
        } catch (Exception e) { e.printStackTrace(); }

        addBehaviour(new CyclicBehaviour(this) {
            public void action() {
                ACLMessage msg = myAgent.receive();
                if (msg != null) {
                    System.out.println("GabrielCore received: " + msg.getContent());
                } else { block(); }
            }
        });
    }
    protected void takeDown() {
        try { DFService.deregister(this); } catch (Exception e) {}
    }
}
### Dockerfile

FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/gabriel-hive-1.0.0.jar gabriel-hive.jar
EXPOSE 1099 7778
CMD ["java", "-jar", "gabriel-hive.jar"]

### docker-compose.yml

version: "3.9"
services:
  gabriel-hive:
    build: .
    container_name: gabriel-hive
    ports:
      - "1099:1099"
      - "7778:7778"
    environment:
      - JADE_HOST=localhost
      - HA_URL=http://host.docker.internal:8123
      - HA_TOKEN=your_ha_token_here
      - CF_API_TOKEN=your_cf_token_here
    restart: unless-stopped

Build and run:
  mvn package
  docker-compose up -d

---

## 2. FREE OPEN SOURCE HTML AGENTS (same shell as NOIZYBEAST)

| Framework | Install | Strength |
|-----------|---------|----------|
| Playwright (Microsoft) | pip install playwright | BEST - headless, network intercept, CDP |
| Puppeteer (Google) | npm install puppeteer | Node.js native, Chrome DevTools Protocol |
| DrissionPage | pip install DrissionPage | Selenium+requests hybrid, fastest |
| browser-use | pip install browser-use | LLM-driven AI browser agent |
| AgentQL | pip install agentql | Natural language DOM queries |
| Crawl4AI | pip install crawl4ai | AI-optimized scraping + LLM extraction |
| Selenium | pip install selenium | Widest browser support |

Integration: GABRIEL dispatches browser tasks to PlaywrightAgent sidecar in NOIZYBEAST.
Results returned via webhook to heaven worker at heaven.noizy.ai

---

## 3. DJANGO -- GABRIEL REST BRIDGE

pip install django djangorestframework django-cors-headers

Project: gabriel-api/
  manage.py
  gabriel_api/settings.py
  agents/views.py  -- REST endpoints per agent
  agents/models.py
  agents/urls.py

Key settings:
  INSTALLED_APPS: rest_framework, corsheaders, agents
  CORS_ALLOW_ALL_ORIGINS = True (lock down in prod)

Endpoints:
  POST /api/dispatch/   -- route task to JADE agent
  GET  /api/status/     -- hive health check

views.py pattern:
  @api_view(['POST'])
  def gabriel_dispatch(request):
      task = request.data.get('task')
      agent = request.data.get('agent', 'GabrielCore')
      result = route_to_jade(agent, task)
      return Response({'status': 'dispatched', 'agent': agent, 'result': result})

Run: python manage.py runserver 0.0.0.0:8000

---

## 4. PYTHON PACKAGE PUBLISHING

### PyPI (pip install noizy-gabriel)

pyproject.toml:
  [build-system]
  requires = ["hatchling"]
  build-backend = "hatchling.build"

  [project]
  name = "noizy-gabriel"
  version = "0.1.0"
  description = "GABRIEL agent toolkit for the NOIZY Empire"
  requires-python = ">=3.10"
  dependencies = ["requests", "anthropic", "cloudflare"]

Build and publish:
  pip install build twine
  python -m build
  twine upload dist/*

### Anaconda / Conda-forge
  Fork: https://github.com/conda-forge/staged-recipes
  Add recipes/noizy-gabriel/meta.yaml
  Open PR -- conda-forge bot handles the build and publish

### GitHub Packages (private)
  .npmrc: @rspnoizy:registry=https://npm.pkg.github.com
  GitHub Actions: publish on release event

---

## 5. NODE.JS PACKAGE -- GITHUB PACKAGES

package.json:
  name: @rspnoizy/gabriel-client
  version: 1.0.0
  publishConfig.registry: https://npm.pkg.github.com

GitHub Actions .github/workflows/publish-node.yml:
  on: release.created
  uses: actions/setup-node@v4 with registry-url: npm.pkg.github.com
  run: npm publish
  env: NODE_AUTH_TOKEN: secrets.GITHUB_TOKEN

---

## 6. HOME ASSISTANT ON OLDER MACS -- NO RASPBERRY PI NEEDED

HA runs perfectly on any Mac via Docker. No Pi required.

Method 1 - Docker (RECOMMENDED):
  docker run -d --name homeassistant --privileged --restart=unless-stopped \
    -e TZ=America/Toronto \
    -v ~/homeassistant:/config \
    -p 8123:8123 \
    ghcr.io/home-assistant/home-assistant:stable
  Access: http://localhost:8123
  Works on: Intel Mac, M1, M2, M3 -- all modern macOS

For older macOS (10.13/10.14) where Docker Desktop won't install:
  brew install orbstack   -- best Docker alternative, free tier
  brew install colima     -- lightweight Docker runtime
  colima start && docker run ... (same command)

Connect to GABRIEL:
  curl -H "Authorization: Bearer $HA_TOKEN" http://localhost:8123/api/states
  GABRIEL HomeAssistantAgent reads device states + fires service calls

---

## 7. TESTCONTAINERS -- FREE OPEN SOURCE

Testcontainers spins up real Docker containers for integration tests.
Free, open source, Java + Python + Node.js + Go.

Java:
  testcontainers:testcontainers:1.19.3 (test scope in pom.xml)
  @Testcontainers + @Container annotation
  GenericContainer, PostgresContainer, RedisContainer etc.

Python:
  pip install testcontainers
  from testcontainers.core.container import DockerContainer

Node.js:
  npm install testcontainers
  import { GenericContainer } from 'testcontainers'

---

## 8. GABRIEL TOOL SELECTOR -- UPGRADED

The Tool Selector is GABRIEL's routing brain. Upgraded from keyword matching
to semantic similarity + cost-aware routing + Claude claude-3-5-haiku + fallback chain.

Tools registered:
  cloudflare, home_assistant, audio, voice, browser, email, discord,
  code, music, filesystem, n8n, gabriel_core

ToolDecision dataclass: tool, confidence (0-1), reason, fallback

ToolSelector.select(task) uses claude-3-5-haiku-20241022 with JSON schema.
ToolSelector.route(task) executes the decision with fallback.

Sample routing:
  'Turn off kitchen lights'      -> home_assistant (0.98)
  'Deploy heaven worker'         -> cloudflare (0.97)
  'What BPM is this track?'      -> music (0.95)
  'Send to NOIZYARMY Discord'    -> discord (0.99)
  'Transcribe this audio'        -> voice (0.96)
  'Write a Python function'      -> code (0.94)

---

## 9. LCU (LOCAL CONTROL UNIT) & SHIRL AGENT

LCU - Local Control Unit (executes system commands on GOD.local):
  run_command(cmd, cwd): subprocess.run wrapper
  deploy_worker(name): npx wrangler deploy in worker dir
  restart_noizybeast(): kills + restarts NOIZYBEAST FastAPI
  git_pull_all(): pulls all empire repos

SHIRL - Scheduling + Helper Intelligence Relay Layer:
  add_task(task, priority, due): queues tasks for RSP_001
  get_priority_tasks(n): returns top-N priority tasks
  send_daily_brief(): SHIRL morning report via Discord/Email
  Runs on TickerBehaviour (every 24h) in JADE hive

---

## 10. EMAIL & DISCORD PERFECTION

### Email Agent (Gmail API)
  pip install google-auth google-api-python-client
  OAuth2 credentials: ~/.gabriel_gmail_token.json
  Methods: get_unread(max=10), send_email(to, subject, body)
  gabriel_daily_summary(): unread count + top subjects

### Discord Bot (discord.py)
  pip install discord.py
  DISCORD_BOT_TOKEN in environment
  Commands:
    !empire  -> empire status report
    !status  -> ping heaven worker, return green/red
    !mission -> current NEXT_25_MOVES top item
    !dispatch [task] -> route task to GABRIEL ToolSelector
  Runs in NOIZYBEAST as async background service

---

## 11. OPEN SOURCE n8n ALTERNATIVES

| Tool | Language | Strength | Docker command |
|------|----------|----------|----------------|
| Activepieces | TypeScript | Best n8n clone, 200+ integrations | docker run activepieces/activepieces |
| Windmill | Rust/Python | Code-first, scripts as workflows | docker run windmill/windmill |
| Prefect | Python | Data pipelines, great UI | pip install prefect |
| Temporal | Go | Enterprise fault-tolerant | docker run temporalio/auto-setup |
| Airflow | Python | DAG-based, huge ecosystem | pip install apache-airflow |
| Kestra | Java/YAML | YAML-first, very clean | docker run kestra/kestra |
| Automatisch | Node.js | Open Zapier clone | docker run automatisch/automatisch |

RECOMMENDED for GABRIEL: Activepieces
  docker run -d --name activepieces -p 8080:80 \
    -e AP_ENCRYPTION_KEY=noizy_empire_key \
    -e AP_JWT_SECRET=gabriel_jwt \
    activepieces/activepieces:latest
  GABRIEL webhooks Activepieces flows for complex automation chains

---

## 12. MUSIC / VOICE / VIDEO OPEN SOURCE MONSTERS

### VOICE SYNTHESIS & CLONING (GABRIEL's voice)

Coqui TTS (already in NOIZYVOX):
  pip install TTS
  tts --text "I am GABRIEL." --model_name tts_models/en/vctk/vits --out_path gabriel.wav

Coqui XTTS v2 (voice cloning -- 30 sec sample enough):
  from TTS.api import TTS
  tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
  tts.tts_to_file(text="GABRIEL online.", speaker_wav="rsp_sample.wav",
                  language="en", file_path="gabriel_cloned.wav")

RVC (Real-time Voice Conversion) -- BEST free voice cloning:
  git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
  Trains on 10-30 min of voice. Most realistic result available.

Bark (Suno AI) -- expressive emotional TTS:
  pip install suno-bark
  Very expressive, handles laughter/sighs/emotions

### MUSIC PROCESSING

Demucs (Meta) -- stem separation:
  pip install demucs
  demucs --two-stems=vocals track.mp3

AudioCraft (Meta) -- text-to-music generation:
  pip install audiocraft
  model = MusicGen.get_pretrained('facebook/musicgen-large')
  wav = model.generate(['epic NOIZY Empire theme 120 BPM'])

Basic Pitch (Spotify) -- audio to MIDI:
  pip install basic-pitch
  basic-pitch output/ input.mp3

Spleeter (Deezer) -- fast 5-stem separation:
  pip install spleeter
  spleeter separate -p spleeter:5stems input.mp3

Stable Audio (Stability AI):
  pip install stable-audio-tools

### VIDEO

MoviePy: pip install moviepy
yt-dlp: pip install yt-dlp  -- download from 1000+ sites
Whisper (OpenAI): pip install openai-whisper  -- transcription
faster-whisper: pip install faster-whisper  -- 4x faster, Apple Silicon
Manim: pip install manim  -- mathematical animation for explainers
FFmpeg: brew install ffmpeg  -- foundation of everything

---

## 13. GABRIEL VOICE RECORDING PROTOCOL

Goal: Clone RSP_001's voice for GABRIEL canonical voice.

Step 1: Setup recording
  brew install sox
  rec gabriel_voice_raw.wav rate 44100 channels 1

Step 2: Record 30+ minutes of doctrine reading
  - All 9 Never Clauses (slowly, with conviction)
  - The 4 Sacred Invariants
  - DREAMCHAMBER Codex excerpts
  - Technical terms: GABRIEL, NOIZYBEAST, Cloudflare, MCP, wrangler
  - Numbers and domain names: noizy.ai, heaven.noizy.ai, aski.noizy.ai

Step 3: Clone with Coqui XTTS v2 or RVC

Step 4: Generate canonical GABRIEL lines:
  'GABRIEL online. All systems operational. NOIZY Empire is live.'
  'Routing task to CloudflareAgent. Estimated completion: 3 seconds.'
  'SHIRL brief: 5 priority tasks. 0 blockers. Proceed.'

Step 5: Deploy:
  - Discord join sound
  - NOIZYBEAST boot sound
  - Notification sound on GOD.local
  - NOIZYVOX-LOCAL voice model

---

## 14. INTEGRATING ALL GITHUB WORK

NOIZYANTHROPIC canonical file map (May 2026):
  CLAUDE.md              - GABRIEL boot protocol, 21 skills, 10 agents
  NOIZY_AI_MASTER_BIBLE.md - canonical IDs, all infrastructure
  EMPIRE_MAP.md          - master navigation
  MASTER_REGISTRY.md     - all repos, domains, accounts
  NEXT_25_MOVES.md       - current mission queue
  AGENT_STACK.md         - free tool stack (Python/AI libs)
  GABRIEL_HIVE_STACK.md  - THIS FILE
  NOIZYARMY_DISCORD.md   - Discord server architecture
  WORLD_DOMINATION_STRATEGY.md - 4-phase empire strategy
  wrangler.jsonc         - Heaven v18.1.0 config
  RELEASE.md             - deploy runbook

Integration checklist:
  [ ] JADE hive boots from docker-compose
  [ ] GabrielCore registers in JADE DF
  [ ] Django REST bridge runs on port 8000
  [ ] ToolSelector routes tasks with claude-3-5-haiku
  [ ] Email agent reads Gmail via OAuth2
  [ ] Discord bot connects with DISCORD_BOT_TOKEN
  [ ] Home Assistant at localhost:8123 via Docker
  [ ] Activepieces replaces n8n at port 8080
  [ ] GABRIEL voice cloned with Coqui XTTS v2 or RVC
  [ ] AudioCraft generates NOIZY Empire theme
  [ ] All repos in sync via LCU git_pull_all()
  [ ] noizy-gabriel Python package on PyPI
  [ ] @rspnoizy/gabriel-client Node package on GitHub Packages

---

## MASTER BUILD SEQUENCE (GOD.local)

# 1. GABRIEL JADE Hive
cd ~/NOIZYANTHROPIC/gabriel-hive && mvn package && docker-compose up -d

# 2. Django REST Bridge
cd ~/NOIZYANTHROPIC/gabriel-api && pip install -r requirements.txt
python manage.py migrate && python manage.py runserver 0.0.0.0:8000 &

# 3. Home Assistant
docker run -d --name homeassistant -p 8123:8123 \
  -v ~/homeassistant:/config ghcr.io/home-assistant/home-assistant:stable

# 4. Activepieces (n8n replacement)
docker run -d --name activepieces -p 8080:80 activepieces/activepieces:latest

# 5. Heaven Worker
cd ~/NOIZYANTHROPIC && npx wrangler deploy

# 6. Discord Bot
DISCORD_BOT_TOKEN=xxx python gabriel_discord_bot.py &

# 7. Record GABRIEL voice
rec gabriel_voice.wav rate 44100 channels 1
python clone_gabriel_voice.py gabriel_voice.wav

---

GORUNFREE - The empire is built. GABRIEL is the product.
RSP_001 - rsp@noizy.ai - CF Account: 5f36aa9795348ea681d0b21910dfc82a
