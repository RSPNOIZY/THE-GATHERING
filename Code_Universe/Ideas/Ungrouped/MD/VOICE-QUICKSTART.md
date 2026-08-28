# 🎤 Voice Quick Start

## **Talk to Cascade & Gabriel NOW**

### **Step 1: Add Your API Key**
```bash
# Edit .env file and add your key:
OPENAI_API_KEY=sk-...your-key-here
```

### **Step 2: Open VSCode**
```bash
code /Users/m2ultra/NOIZYANTHROPIC/NOIZYLAB
```

### **Step 3: Start Talking**
- **Hotkey:** `Ctrl+Shift+Space`
- Or Command Palette → "DreamChamber: Toggle Recording"

## **Voice Modes**

### **🎯 Command Mode (Default)**
- Talk directly to Claude/Cascade
- Voice → Text → AI Response → Voice

### **📝 Dictate Mode** 
- Pure transcription at cursor
- No AI processing

### **💡 Intake Mode**
- Capture ideas to `ideas/inbox.md`
- Auto-timestamps

### **🎬 Capture Mode**
- Create timestamped session entries

## **Switch Modes**
- Command Palette → "DreamChamber: Set Voice Mode"
- Or click mode in status bar

## **Voice Settings**
Located in `.vscode/settings.json`:
- **Sample Rate:** 48kHz (studio quality)
- **Voice:** Samantha (macOS)
- **Engine:** Whisper API

## **Test Voice Right Now**
1. Open any file
2. Press `Ctrl+Shift+Space`
3. Say: "Hello Cascade, can you hear me?"
4. I'll respond with voice!

## **Gabriel Integration**
Gabriel responds to voice when you:
- Use "command" mode
- Ask coding questions
- Request file edits

## **Troubleshooting**

### **No Audio Input?**
Check mic permissions:
System Preferences → Security → Privacy → Microphone → VSCode ✓

### **No API Key?**
Get one from: https://platform.openai.com/api-keys

### **Want Local Processing?**
```bash
# Install Whisper locally
pip3 install openai-whisper

# Run Moonshine server
python3 moonshine-server.py

# Change settings to "moonshine"
```
