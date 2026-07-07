/**
 * THE-GATHERING — Master PM2 Ecosystem Config
 * RSP_001 / GOD.local / M2 Ultra 192GB
 *
 * Start all: pm2 start infrastructure/pm2/ecosystem.master.cjs
 * Save:      pm2 save
 * Resurrect: pm2 resurrect
 */

module.exports = {
  apps: [
    // ── GABRIEL — The Dispatcher ──────────────────────────────────────────
    {
      name: "gabriel-core",
      script: "agents/gabriel/daemon/index.js",
      cwd: "/Users/m2ultra/THE-GATHERING",
      args: "--daemon",
      interpreter: "node",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        GABRIEL_FOSS_ONLY: "true",        // use local Ollama, no cloud API
        OLLAMA_HOST: "http://127.0.0.1:11434",
        GABRIEL_MODEL: "gabriel-brain:latest",
      },
    },

    // ── LUCY — File Intelligence ──────────────────────────────────────────
    {
      name: "lucy-core",
      script: "agents/lucy/lucy_async_core.py",
      cwd: "/Users/m2ultra/THE-GATHERING",
      interpreter: "python3",
      watch: false,
      autorestart: true,
      max_restarts: 5,
      env: {
        LUCY_DB: "/Users/m2ultra/NOIZYANTHROPIC/mc96_catalog.db",
        CHROMA_HOST: "http://127.0.0.1:8765",
      },
    },

    // ── CHROMA — Vector DB ───────────────────────────────────────────────
    {
      name: "chroma",
      script: "run",
      interpreter: "/opt/homebrew/bin/chroma",
      args: "--host 127.0.0.1 --port 8765 --path /Users/m2ultra/NOIZYLAB/memory/chroma",
      watch: false,
      autorestart: true,
    },

    // ── OLLAMA — Local LLM Host ──────────────────────────────────────────
    {
      name: "ollama",
      script: "/usr/local/bin/ollama",
      args: "serve",
      interpreter: "none",
      watch: false,
      autorestart: true,
      max_restarts: 20,
    },

    // ── GABRIEL MONITOR — Health Watchdog ────────────────────────────────
    {
      name: "gabriel-monitor",
      script: "agents/gabriel/gabriel_monitor.py",
      cwd: "/Users/m2ultra/THE-GATHERING",
      interpreter: "python3",
      args: "--watch",
      watch: false,
      autorestart: true,
      max_restarts: 5,
    },

    // ── SUPERBUILDER INBOX WATCHER ───────────────────────────────────────
    {
      name: "superbuilder-watch",
      script: "/opt/homebrew/bin/fswatch",
      args: "-o /Users/m2ultra/.superbuilder/inbox.md",
      interpreter: "none",
      watch: false,
      autorestart: true,
    },
  ],
};
