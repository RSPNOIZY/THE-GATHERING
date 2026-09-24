import { Router } from "express";
import { verifyDnsSkeleton } from "../services/cloudflare.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const dns = await verifyDnsSkeleton();

    res.json({
      dns: dns.ok ? "OK" : "BROKEN",
      cloudflare: dns.zoneStatus === "active" ? "CONNECTED" : "DISCONNECTED",
      githubActions: "UNKNOWN",
      worker: "UNKNOWN",
      lastDeploy: null,
      alerts: dns.missing.length
        ? [`Missing DNS: ${dns.missing.join(", ")}`]
        : [],
    });
  } catch (error: any) {
    res.status(500).json({
      dns: "BROKEN",
      cloudflare: "DISCONNECTED",
      githubActions: "UNKNOWN",
      worker: "UNKNOWN",
      lastDeploy: null,
      alerts: [error.message],
    });
  }
});

export default router;
