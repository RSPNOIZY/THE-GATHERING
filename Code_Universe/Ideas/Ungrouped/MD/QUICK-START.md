# 🚀 NOIZYLAB Quick Start

## **Projects Overview**

### **VSCode Extensions**
- **dreamchamber** - Voice AI with Claude integration
- **dreamchamber-extension** - Enhanced voice loop features  
- **noizy-voice** - Adaptive voice input system

### **APIs & Services**
- **rob_ava** - FastAPI trust & collaboration server (port 8091)
- **noizy_platform** - Main platform API (port 8090)
- **whatsapp-gabriel** - WhatsApp bot integration

## **Start Everything**
```bash
./start-all-services.sh
```

## **Individual Commands**

### **Rob AVA API**
```bash
python3 -m uvicorn rob_ava.server:app --reload --port 8091
```
- Docs: http://localhost:8091/docs

### **NOIZY Platform**
```bash
cd noizy_platform
python3 -m uvicorn app.main:app --reload --port 8090
```
- Docs: http://localhost:8090/docs

### **WhatsApp Bot**
```bash
node whatsapp-gabriel.js
```
⚠️ Configure `.env` first with your API keys

### **VSCode Extensions**
```bash
# Build all extensions
npm run compile --prefix dreamchamber
npm run compile --prefix dreamchamber-extension  
npm run compile --prefix noizy-voice

# Package extension
npm run package --prefix dreamchamber
```

## **Workspace**
Open in Windsurf/VSCode:
```bash
code .windsurf-workspace.code-workspace
```

## **Environment Setup**
1. Copy `.env.example` to `.env`
2. Add your API keys:
   - `COHERE_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`

## **Key NPM Scripts**
Run from main directory:
```bash
npm run platform:api      # Start platform API
npm run rob-ava-server   # Start Rob AVA
npm run slides:html      # Generate slides
```

## **Python Dependencies**
Already installed for:
- FastAPI + Uvicorn
- SQLAlchemy
- Audio analysis (librosa, scipy)
- Pydantic

## **Issues?**
- Python 3.9.6 compatible ✓
- All type hints fixed for 3.9 ✓
- Services tested and running ✓
