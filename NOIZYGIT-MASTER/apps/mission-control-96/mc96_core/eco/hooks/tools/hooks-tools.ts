// @hooks MCP tools — Integration and webhook operations

const N8N_BASE = 'https://noizy.app.n8n.cloud/webhook';

/** Trigger n8n enterprise sync webhook */
export async function triggerEnterpriseSync(payload: {
  event: string;
  repository: string;
  commit_sha: string;
  author: string;
  message: string;
}): Promise<unknown> {
  const res = await fetch(`${N8N_BASE}/enterprise-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      environment: 'manual',
      system: 'hooks-agent',
    }),
  });
  return { status: res.status, ok: res.ok };
}

/** List available n8n workflows (from local catalog) */
export function listWorkflows(): Array<{ name: string; file: string; trigger: string }> {
  return [
    { name: 'GitHub → GABRIEL', file: '01_github_to_gabriel.json', trigger: 'webhook: github-push' },
    { name: 'Stripe → Ledger', file: '02_stripe_to_ledger.json', trigger: 'webhook: stripe-event' },
    { name: 'Voice → DreamChamber', file: '03_voice_to_dreamchamber.json', trigger: 'webhook: voice-event' },
    { name: 'Health Monitor', file: '04_health_monitor_alerts.json', trigger: 'cron or webhook' },
    { name: 'Notion Sync', file: '05_notion_sync.json', trigger: 'webhook: notion-update' },
    { name: 'Consent Killswitch', file: '06_consent_revoke_killswitch.json', trigger: 'webhook: consent-revoke' },
    { name: 'Notion → GitHub Deploy', file: '07_notion_to_github_deploy.json', trigger: 'webhook: notion-task-trigger' },
    { name: 'GitHub Deploy Pipeline', file: 'github_deploy_pipeline.json', trigger: 'webhook: github-push' },
    { name: 'DreamChamber Auto', file: 'dreamchamber_automation.json', trigger: 'webhook' },
    { name: 'Heaven Webhook', file: 'heaven_webhook.json', trigger: 'webhook' },
    { name: 'Complete Orchestrator', file: 'noizy_complete_webhook_orchestrator.json', trigger: 'webhook' },
    { name: 'Notion Watcher', file: 'notion_sync_watcher.json', trigger: 'polling' },
    { name: 'Enterprise Sync', file: 'github_enterprise_sync.json', trigger: 'webhook: enterprise-sync' },
    { name: 'Evidence Pack', file: 'generate_evidence_workflow.json', trigger: 'webhook: generate-evidence' },
  ];
}

/** Check n8n cloud reachability */
export async function n8nPing(): Promise<{ reachable: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch('https://noizy.app.n8n.cloud', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return { reachable: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { reachable: false, latencyMs: Date.now() - start };
  }
}
