const express = require("express");
const router = express.Router();
const { version } = require("../../package.json");

router.get("/", (req, res) => {
  const stats = req.stateManager.getStats();

  res.json({
    status: "healthy",
    service: "DreamChamber",
    version,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    stats: {
      conversations: stats.conversations,
      connections: stats.connections,
    },
  });
});

router.get("/ready", (req, res) => {
  // Check if all required services are ready
  const checks = {
    stateManager: !!req.stateManager,
    cache: req.stateManager && req.stateManager.cache.keys() !== undefined,
    gabriel: !!req.gabriel,
    providers: true, // TODO: actual provider health checks
  };

  const ready = Object.values(checks).every((v) => v === true);

  if (ready) {
    res.json({ ready: true, checks });
  } else {
    res.status(503).json({ ready: false, checks });
  }
});

module.exports = router;
