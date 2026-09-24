# 💎 VS CODE & LIBRARY DEEP DIVE DISCOVERIES
*Rob's Hidden Configuration Vault*

## 🚀 VS Code Settings Highlights
From `/Library/Application Support/Code/User/settings.json`:

### Performance Optimizations (M2 Ultra tuned!)
- **ALL sounds disabled** for zero latency
- Telemetry completely off
- GPU acceleration enabled
- Minimap disabled
- Smooth scrolling off
- File watcher exclusions for node_modules, .git, build folders

### AI Tool Integrations Found
- **GitMind** with multiple models configured:
  - Anthropic API key present (Claude Opus 4)
  - OpenAI (GPT-4o)
  - Together AI (Llama 3.3 70B)
  - DeepSeek, Grok, Perplexity ready
- **Gemini Code Assist** enabled with project ID
- **GitHub Copilot** configured
- **MCP servers**: markitdown + netdata

### Key Settings
```json
"workbench.colorTheme": "Claude Dark Theme",
"editor.fontFamily": "monospace",
"editor.inlayHints.fontFamily": "jetbrains",
"chat.tools.terminal.autoApprove": true,
"jdk.jdkhome": "/.../oracleJdk-25.jdk/Contents/Home"
```

## 🎯 Cursor Keybindings (Rob's Flow State)
From `/Library/Application Support/Cursor/User/keybindings.json`:
```
🔥 ROB'S MAXIMUM FLOW KEYBINDINGS - GORUNFREE! 🎸🔥
CB_01 - Fish Music Inc
```
- **Cmd+I**: Composer mode agent
- **Cmd+K**: Quick fix
- **Cmd+L**: New AI chat
- **Cmd+Shift+L**: Insert selection into chat
- **Ctrl+Shift+C**: Generate from comment

## 📁 Workspace Projects Found (37 total)
### Active NOIZY Workspaces:
1. `/Users/m2ultra/NOIZYLAB` 
2. `/Users/m2ultra/NOIZYANTHROPIC`
3. `vscode-vfs://github/NOIZYLAB-io/GABRIEL_CODE`
4. `vscode-vfs://github/NOIZYLAB-io/fishmusic-cockpit`
5. `vscode-vfs://github/NOIZYLAB-io/NOIZYLAB` (remote)

### Other Key Workspaces:
- `/Volumes/SOUND_DESIGN`
- `/Volumes/RED DRAGON`
- `/Users/m2ultra/Documents`
- `/Users/m2ultra/Library/Mobile Documents/com~apple~CloudDocs`
- GitHub Codespaces remote connections

## 🔑 Preferences Goldmine
From `/Library/Preferences/` (400+ plist files!):

### Developer Tools
- **com.apple.dt.Xcode.plist** (27KB)
- **com.apple.dt.Instruments.plist** (46KB)
- **com.parallels.Parallels Desktop.plist** (19KB)
- **com.github.GitHubClient.plist**

### AI & Coding Apps
- **com.anthropic.claudefordesktop.plist**
- **com.openai.atlas.plist** (23KB)
- **com.openai.chat.plist** (3.5MB!)
- **com.microsoft.VSCode.plist**
- **com.exafunction.windsurf.plist**

### Audio Production
- **com.apple.logic10.plist** (455KB!)
- **com.apple.audio.AudioComponentCache.plist** (294KB)
- **com.rogueamoeba.audiohijack.plist**
- **com.uaudio.uad.plist**

### Cloud Services
- **com.microsoft.OneDrive.plist**
- **com.google.drivefs.plist**
- **com.apple.cloudd.plist**

## 💾 Cache Discoveries
From `/Library/Caches/`:

### Claude CLI Cache Projects
All your project paths cached:
- `-Users-m2ultra-NOIZYLAB/`
- `-Users-m2ultra-NOIZYANTHROPIC-NOIZYLAB/`
- `-Users-m2ultra-Desktop-CLAUDE-TODAY/`
- `-Volumes-MAG-4TB-NOIZYFISH-THE-AQAURIUM/`
- Google Drive GABRIEL workspace

### Other Notable Caches
- 200+ app caches including all AI tools
- Siri cache with conversation handlers
- Docker Desktop states
- Homebrew packages
- MS-Playwright for browser automation

## 🎵 Special Finds

### Logic Pro X Settings (455KB!)
Your complete Logic Pro configuration at:
`com.apple.logic10.plist`

### OpenAI Atlas Installer (691KB)
Massive configuration at:
`com.apple.openai.atlas.installer.plist`

### ChatGPT Helper (3.5MB!)
`com.openai.chat.plist` - Your entire ChatGPT history/config

### Apple Terminal Config
`com.apple.Terminal.plist` (18KB) with backup

## 📊 Summary Stats
- **400+ preference files** tracking every app
- **37 VS Code workspaces** with project history
- **200+ app caches** in Library/Caches
- **Multiple AI tool integrations** configured
- **Complete audio production setup** preserved

---

The Library folder truly is gold—it's where macOS stores the soul of your workflow!