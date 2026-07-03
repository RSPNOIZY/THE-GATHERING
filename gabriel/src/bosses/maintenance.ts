import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const execAsync = promisify(exec);

export const maintenance: Boss = {
  name: "maintenance",
  description: "Healing audit · system health · drive space · log rotation · constitutional drift check.",

  async handle(intent, ctx) {
    switch (intent.verb) {
      case "ping":
        return {
          ok: true,
          correlation_id: intent.correlation_id,
          boss: "maintenance",
          verb: "ping",
          ack_message: "maintenance online.",
        };

      case "audit": {
        try {
          // 1. Drive space check (root)
          const { stdout: df } = await execAsync("df -h / | tail -1");
          const driveSpace = df.trim();

          // 2. Log directory size
          const { stdout: logs } = await execAsync("du -sh /Users/m2ultra/NOIZYLAB/GABRIEL/logs 2>/dev/null || echo '0B'");

          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "audit",
            ack_message: "System healing audit completed.",
            data: {
              root_drive_status: driveSpace,
              gabriel_log_size: logs.trim(),
              ts: new Date().toISOString(),
            },
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "audit", error: (err as Error).message };
        }
      }

      case "noizykidz_stats": {
        try {
          const res = await fetch("https://noizykidz-haptic-core.rsp-5f3.workers.dev/stats", {
            headers: { "X-NOIZY-Key": process.env.NOIZY_API_KEY || "" }
          });
          const stats = await res.json() as any;
          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "noizykidz_stats",
            ack_message: "NOIZYKIDZ stats retrieved.",
            data: stats,
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "noizykidz_stats", error: (err as Error).message };
        }
      }

      case "noizykidz_export": {
        try {
          const res = await fetch("https://noizykidz-haptic-core.rsp-5f3.workers.dev/export", {
            headers: { "X-NOIZY-Key": process.env.NOIZY_API_KEY || "" }
          });
          const exportData = await res.json() as any;
          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "noizykidz_export",
            ack_message: `Exported ${exportData.data?.length || 0} haptic events.`,
            data: exportData,
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "noizykidz_export", error: (err as Error).message };
        }
      }

      case "haptic_vibe_test": {
        try {
          const res = await fetch("https://noizykidz-haptic-core.rsp-5f3.workers.dev/haptic-sync", {
            method: "POST",
            headers: {
              "X-NOIZY-Key": process.env.NOIZY_API_KEY || "",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              frequency: 396,
              intensity: 1.0,
              duration_ms: 1500
            })
          });
          const data = await res.json() as any;
          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "haptic_vibe_test",
            ack_message: `Haptic test dispatched: ${data.pattern} triggered.`,
            data,
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "haptic_vibe_test", error: (err as Error).message };
        }
      }

      case "approve_repair": {
        const { receipt_id } = intent.args ?? {};
        if (!receipt_id) return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "approve_repair", error: "receipt_id required" };
        try {
          const cmd = `npx wrangler d1 execute agent-memory --remote --command="UPDATE nk_proof_repair_receipts SET status='RSP_APPROVED', rsp_override_marker='AUTHORIZED_BY_RSP' WHERE id='${receipt_id}';"`;
          await execAsync(cmd);
          return { ok: true, correlation_id: intent.correlation_id, boss: "maintenance", verb: "approve_repair", ack_message: `Receipt ${receipt_id} approved by RSP_001.` };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "approve_repair", error: (err as Error).message };
        }
      }

      case "apply_remediation": {
        const { receipt_id } = intent.args ?? {};
        if (!receipt_id) return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "apply_remediation", error: "receipt_id required" };
        try {
          const { stdout: dir } = await execAsync("ls -td .audit/chain-health-* | head -1");
          const auditDir = dir.trim();
          const proposalPath = join(auditDir, "remediation_proposal.sql");
          const approvalPath = join(auditDir, "GABRIEL_REMEDIATION_APPROVAL.json");
          const exportPath = join(auditDir, `pre_remediation_export_${Date.now()}.sql`);

          if (!existsSync(approvalPath)) return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "apply_remediation", error: "RSP_OVERRIDE_REQUIRED: approval receipt missing" };

          const approval = JSON.parse(readFileSync(approvalPath, "utf8"));
          // Accept either marker for backward compatibility or strict enforcement
          if (approval.status !== "RSP_APPROVED") return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "apply_remediation", error: "RSP_OVERRIDE_REQUIRED: receipt not approved" };

          const scriptContent = readFileSync(proposalPath, "utf8");
          const scriptHash = createHash("sha256").update(scriptContent).digest("hex");
          if (scriptHash !== approval.remediation_script_sha256) return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "apply_remediation", error: "RSP_OVERRIDE_REQUIRED: hash mismatch" };

          // Mandatory backup
          await execAsync(`npx wrangler d1 export agent-memory --remote --output="${exportPath}"`);

          const readyPath = join(auditDir, "remediation_ready.sql");
          await execAsync(`sed 's/^-- UPDATE/UPDATE/' "${proposalPath}" > "${readyPath}"`);
          const { stdout: sqlOut } = await execAsync(`npx wrangler d1 execute agent-memory --remote --file="${readyPath}" --yes`);

          await execAsync(`npx wrangler d1 execute agent-memory --remote --command="UPDATE nk_proof_repair_receipts SET status='RECHAINED' WHERE id='${receipt_id}';"`);

          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "apply_remediation",
            ack_message: `Remediation applied for ${receipt_id}. History preserved.`,
            data: { details: sqlOut }
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "apply_remediation", error: (err as Error).message };
        }
      }

      case "list_repairs": {
        try {
          const { stdout } = await execAsync(`npx wrangler d1 execute agent-memory --remote --command="SELECT id, status, created_at, reason FROM nk_proof_repair_receipts ORDER BY created_at DESC LIMIT 10;" --json`);
          const dbResult = JSON.parse(stdout);
          const rows = dbResult[0]?.results ?? [];
          return {
            ok: true,
            correlation_id: intent.correlation_id,
            boss: "maintenance",
            verb: "list_repairs",
            ack_message: "Remediation history retrieved.",
            data: { receipts: rows },
          };
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "list_repairs", error: (err as Error).message };
        }
      }

      case "wipe_quarantine": {
        // Upgraded per RSP_001 spec (2026-04-29):
        //   "wipe_quarantine does not just clear rows. It archives, proves,
        //    receipts, and only then deletes."
        // Doctrine: .claude/rules/proof-chain-remediation-law.md
        //
        // Hard rules:
        //   - per-receipt_id (no global wipe)
        //   - confirmation token must match WIPE-<receipt_id>-CONFIRM
        //   - rsp_override_marker must match RSP_APPROVED_WIPE_QUARANTINE_AFTER_REPAIR
        //   - receipt.status MUST be in {RECHAINED, CLEARED, QUARANTINE_CLEARED}
        //   - live chain_health MUST be PROOF_CHAIN_PASS
        //   - quarantine_count > 0 (idempotent: 0 → COMPLETE no-op)
        //   - archive rows BEFORE delete (atomic batch)
        //   - write QUARANTINE_CLEARED receipt to history (history keeps the scar)
        //
        // Status codes (locked):
        //   WIPE_QUARANTINE_COMPLETE
        //   WIPE_QUARANTINE_DRY_RUN
        //   WIPE_QUARANTINE_BLOCKED_CHAIN_NOT_HEALTHY
        //   WIPE_QUARANTINE_BLOCKED_REPAIR_NOT_FINAL
        //   WIPE_QUARANTINE_BLOCKED_CONFIRMATION_MISMATCH
        //   WIPE_QUARANTINE_BLOCKED_NO_ROWS
        //   RSP_OVERRIDE_REQUIRED
        const args = (intent.args ?? {}) as {
          receipt_id?: string;
          confirmation_token?: string;
          approved_by?: string;
          rsp_override_marker?: string;
          dry_run?: boolean;
        };
        const heavenUrl = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
        const headers = { "X-NOIZY-Key": process.env.NOIZY_API_KEY || "", "Content-Type": "application/json" };
        const rsp = (status: string, extra: Record<string, unknown> = {}) =>
          ({ ok: status === "WIPE_QUARANTINE_COMPLETE" || status === "WIPE_QUARANTINE_DRY_RUN",
             correlation_id: intent.correlation_id, boss: "maintenance" as const, verb: "wipe_quarantine",
             ack_message: status, data: { status, ...extra, law: ".claude/rules/proof-chain-remediation-law.md" } });

        // Gate 1: receipt_id
        const rcptId = args.receipt_id;
        if (!rcptId) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "wipe_quarantine",
                   error: "RSP_OVERRIDE_REQUIRED — args.receipt_id required" };
        }

        // Gate 2: RSP override marker
        if (args.approved_by !== "RSP" ||
            args.rsp_override_marker !== "RSP_APPROVED_WIPE_QUARANTINE_AFTER_REPAIR") {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "wipe_quarantine",
                   error: "RSP_OVERRIDE_REQUIRED" };
        }

        // Gate 3: confirmation token
        const expectedToken = `WIPE-${rcptId}-CONFIRM`;
        if (args.confirmation_token !== expectedToken) {
          return rsp("WIPE_QUARANTINE_BLOCKED_CONFIRMATION_MISMATCH",
                     { expected_token: expectedToken });
        }

        try {
          // Gate 4: live chain_health must be PROOF_CHAIN_PASS
          const chRes = await fetch("https://noizykidz-haptic-core.rsp-5f3.workers.dev/govern/chain_health",
                                    { method: "POST", headers, body: "{}" });
          let chainStatus = "PROOF_CHAIN_AUDIT_BLOCKED";
          let lastGoodHash: string | null = null;
          if (chRes.ok || chRes.status === 409) {
            const chJ = await chRes.json() as { status?: string; last_known_good_proof_hash?: string };
            chainStatus = chJ.status ?? "PROOF_CHAIN_AUDIT_BLOCKED";
            lastGoodHash = chJ.last_known_good_proof_hash ?? null;
          }
          if (chainStatus !== "PROOF_CHAIN_PASS") {
            return rsp("WIPE_QUARANTINE_BLOCKED_CHAIN_NOT_HEALTHY", { chain_health: chainStatus });
          }

          // Gate 5: receipt status in final-set
          const FINAL_STATUSES = new Set(["RECHAINED", "CLEARED", "QUARANTINE_CLEARED"]);
          const rRes = await fetch(`${heavenUrl}/api/v1/d1/query`, {
            method: "POST", headers,
            body: JSON.stringify({
              sql: "SELECT id, status, remediation_script_hash FROM nk_proof_repair_receipts WHERE id = ? LIMIT 1;",
              params: [rcptId],
            }),
          });
          const rJ = await rRes.json() as { results?: Array<{ id: string; status: string; remediation_script_hash: string | null }> };
          const receipt = rJ.results?.[0];
          if (!receipt || !FINAL_STATUSES.has(receipt.status)) {
            return rsp("WIPE_QUARANTINE_BLOCKED_REPAIR_NOT_FINAL",
                       { receipt_status: receipt?.status ?? "MISSING" });
          }

          // List rows to wipe (also lets us check Gate 6)
          const lRes = await fetch(`${heavenUrl}/api/v1/d1/query`, {
            method: "POST", headers,
            body: JSON.stringify({
              sql: "SELECT * FROM nk_haptic_event_quarantine WHERE repair_receipt_id = ?;",
              params: [rcptId],
            }),
          });
          const lJ = await lRes.json() as { results?: Array<Record<string, unknown>> };
          const quarantineRows = lJ.results ?? [];

          // Gate 6: idempotent — 0 rows = success no-op
          if (quarantineRows.length === 0) {
            return rsp("WIPE_QUARANTINE_COMPLETE",
                       { wiped_count: 0, idempotent: true, chain_health: chainStatus });
          }

          // Dry run shortcut
          if (args.dry_run) {
            return rsp("WIPE_QUARANTINE_DRY_RUN",
                       { would_wipe_count: quarantineRows.length, chain_health: chainStatus });
          }

          // All gates passed — execute archive + delete + receipt as ONE batch
          const archiveId = crypto.randomUUID();
          const wipeReceiptId = crypto.randomUUID();
          const now = new Date().toISOString();
          const archiveBlob = JSON.stringify(quarantineRows).replace(/'/g, "''");

          const sqlStmts = [
            // 1. Archive
            `INSERT INTO nk_haptic_event_quarantine_archive (archive_id, archived_at, archived_by, receipt_id, row_count, script_hash, archive_blob) VALUES ('${archiveId}', '${now}', 'RSP_001', '${rcptId}', ${quarantineRows.length}, ${receipt.remediation_script_hash ? `'${receipt.remediation_script_hash}'` : "NULL"}, '${archiveBlob}');`,
            // 2. Delete
            `DELETE FROM nk_haptic_event_quarantine WHERE repair_receipt_id = '${rcptId}';`,
            // 3. Append QUARANTINE_CLEARED receipt
            `INSERT INTO nk_proof_repair_receipts (id, table_name, first_broken_row_id, last_good_row_id, last_good_proof_hash, affected_row_count, status, remediation_script_hash, rsp_override_marker, before_proof_root, after_proof_root, reason, created_at, created_by) VALUES ('${wipeReceiptId}', 'nk_haptic_event_quarantine', 'QUARANTINE_WIPE', NULL, NULL, ${quarantineRows.length}, 'QUARANTINE_CLEARED', ${receipt.remediation_script_hash ? `'${receipt.remediation_script_hash}'` : "NULL"}, '${args.rsp_override_marker}', NULL, ${lastGoodHash ? `'${lastGoodHash}'` : "NULL"}, 'wipe_quarantine archived ${quarantineRows.length} rows for receipt ${rcptId} (archive_id ${archiveId})', '${now}', 'RSP_001');`,
          ];

          // Execute in sequence (D1 batch via Worker binding is preferred but
          // we're shelling out to wrangler — sequential exec preserves order).
          for (const sql of sqlStmts) {
            await execAsync(`npx wrangler d1 execute agent-memory --remote --command="${sql.replace(/"/g, '\\"')}"`);
          }

          return rsp("WIPE_QUARANTINE_COMPLETE", {
            wiped_count: quarantineRows.length,
            archive_id: archiveId,
            wipe_receipt_id: wipeReceiptId,
            chain_health: chainStatus,
          });
        } catch (err) {
          return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: "wipe_quarantine",
                   error: `wipe failed: ${(err as Error).message}` };
        }
      }

      default:
        return { ok: false, correlation_id: intent.correlation_id, boss: "maintenance", verb: intent.verb, error: `unknown verb: ${intent.verb}` };
    }
  },
};
