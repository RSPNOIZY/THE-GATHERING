import { Router } from "express";
import { z } from "zod";
import { makeRunId } from "../services/runId.js";
import { verifyDnsSkeleton } from "../services/cloudflare.js";
import { dispatchDeployWorkflow } from "../services/github.js";
import { writeRunLog } from "../services/notion.js";
import { notifyN8n } from "../services/n8n.js";

const router = Router();

const commandSchema = z.object({
  intent: z.enum(["deploy_system", "check_dns", "run_ci", "get_status"]),
  confirmed: z.boolean().optional().default(false),
  source: z.string().optional().default("dreamchamber_ui"),
  actor: z.string().optional().default("RSP001"),
});

router.post("/", async (req, res) => {
  const parsed = commandSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { intent, confirmed, source, actor } = parsed.data;
  const runId = makeRunId();

  try {
    await writeRunLog({
      runId,
      intent,
      status: "Queued",
      summary: `Accepted ${intent} from ${source}`,
    });

    if (intent === "check_dns") {
      const dns = await verifyDnsSkeleton();

      await writeRunLog({
        runId,
        intent,
        status: dns.ok ? "Succeeded" : "Failed",
        summary: dns.ok
          ? "DNS skeleton verified"
          : `Missing DNS: ${dns.missing.join(", ")}`,
      });

      return res.json({
        ok: dns.ok,
        run_id: runId,
        summary: dns.ok
          ? "DNS verified"
          : `Missing DNS: ${dns.missing.join(", ")}`,
      });
    }

    if (intent === "deploy_system") {
      if (!confirmed) {
        return res.status(400).json({
          ok: false,
          run_id: runId,
          error: "deploy_system requires confirmed=true",
        });
      }

      await writeRunLog({
        runId,
        intent,
        status: "Running",
        summary: "Starting deploy sequence",
      });

      const dns = await verifyDnsSkeleton();
      if (!dns.ok) {
        await writeRunLog({
          runId,
          intent,
          status: "Failed",
          summary: "Deploy blocked by DNS",
          error: `Missing DNS: ${dns.missing.join(", ")}`,
        });

        return res.status(409).json({
          ok: false,
          run_id: runId,
          summary: `Deploy blocked. Missing DNS: ${dns.missing.join(", ")}`,
        });
      }

      const gh = await dispatchDeployWorkflow(runId);

      await notifyN8n({
        run_id: runId,
        intent,
        source,
        actor,
        phase: "workflow_dispatched",
        github: gh,
      });

      await writeRunLog({
        runId,
        intent,
        status: "Succeeded",
        summary: "DNS verified and GitHub deploy workflow dispatched",
      });

      return res.json({
        ok: true,
        run_id: runId,
        summary: "DNS verified, GitHub deploy workflow dispatched",
      });
    }

    return res.json({
      ok: true,
      run_id: runId,
      summary: `${intent} acknowledged`,
    });
  } catch (error: any) {
    try {
      await writeRunLog({
        runId,
        intent,
        status: "Failed",
        summary: "Command failed",
        error: error.message,
      });
    } catch {}

    return res.status(500).json({
      ok: false,
      run_id: runId,
      error: error.message,
    });
  }
});

export default router;
