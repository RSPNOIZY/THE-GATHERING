// PM2 Ecosystem Configuration
// Production process management for DreamChamber

module.exports = {
  apps: [
    {
      name: "dreamchamber",
      script: "./src/server.js",
      instances: 1, // WebSocket requires single instance (StateManager is in-memory; no sticky session store)
      exec_mode: "fork",

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 7777,
        DEFAULT_MODEL: "claude-sonnet-4",
        PREFERRED_SEARCH_MODEL: "command-r-plus",
        HEAVEN_URL: "https://heaven.rsp-5f3.workers.dev",
        GABRIEL_VOICE_NAME: "Daniel",
        GABRIEL_SPEECH_RATE: "180",
      },

      // Restart policy
      max_memory_restart: "2G",
      restart_delay: 3000,
      autorestart: true,

      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Monitoring
      instance_var: "INSTANCE_ID",
      merge_logs: true,

      // Watch (disabled in production)
      watch: false,
      ignore_watch: ["node_modules", "logs", ".git"],
    },
  ],

  deploy: {
    production: {
      user: "nodejs",
      host: "dreamchamber.noizy.ai",
      ref: "origin/main",
      repo: "git@github.com:NOIZYLAB/dreamchamber.git",
      path: "/var/www/dreamchamber",
      "post-deploy":
        "npm ci --production && pm2 reload ecosystem.config.js --env production",
      "pre-deploy-local": 'echo "Deploying DreamChamber to production"',
    },
  },
};
