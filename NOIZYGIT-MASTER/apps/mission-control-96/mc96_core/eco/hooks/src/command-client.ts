/**
 * NOIZY Command Router — TypeScript client
 * Targets: https://noizy.app.n8n.cloud/webhook/noizy-command
 */

const DEFAULT_BASE_URL = "https://noizy.app.n8n.cloud";

export type Intent =
  | "check_dns"
  | "deploy_system"
  | "plan_dns"
  | "apply_dns"
  | "health_check"
  | "sync_notion"
  | "consent_revoke";

export interface CommandPayload {
  intent: Intent;
  params: Record<string, unknown>;
  source: string;
}

export interface CommandResult {
  ok: boolean;
  intent: Intent;
  request_id: string;
  source: string;
  result: unknown;
  responded_at: string;
}

export interface DeploySystemParams {
  confirmed: true;
  repo: string;
  workflow_id: string;
  ref?: string;
  inputs?: Record<string, string>;
}

export interface ApplyDnsParams {
  confirm: true;
  [key: string]: unknown;
}

export interface ConsentRevokeParams {
  user_id: string;
  scope?: string;
  reason?: string;
  [key: string]: unknown;
}

async function sendCommand(
  payload: CommandPayload,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<CommandResult> {
  const url = `${baseUrl}/webhook/noizy-command`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Command router returned ${res.status}: ${text}`);
  }
  return res.json() as Promise<CommandResult>;
}

export function createCommandClient(
  source: string,
  baseUrl: string = DEFAULT_BASE_URL
) {
  return {
    checkDns(params: Record<string, unknown> = {}) {
      return sendCommand({ intent: "check_dns", params, source }, baseUrl);
    },
    deploySystem(params: DeploySystemParams) {
      return sendCommand({ intent: "deploy_system", params, source }, baseUrl);
    },
    planDns(params: Record<string, unknown> = {}) {
      return sendCommand({ intent: "plan_dns", params, source }, baseUrl);
    },
    applyDns(params: ApplyDnsParams) {
      return sendCommand({ intent: "apply_dns", params, source }, baseUrl);
    },
    healthCheck(params: Record<string, unknown> = {}) {
      return sendCommand({ intent: "health_check", params, source }, baseUrl);
    },
    syncNotion(params: Record<string, unknown> = {}) {
      return sendCommand({ intent: "sync_notion", params, source }, baseUrl);
    },
    consentRevoke(params: ConsentRevokeParams) {
      return sendCommand({ intent: "consent_revoke", params, source }, baseUrl);
    },
  };
}

// Direct exports for one-off calls
export const checkDns = (source: string, params?: Record<string, unknown>) =>
  sendCommand({ intent: "check_dns", params: params ?? {}, source });

export const deploySystem = (source: string, params: DeploySystemParams) =>
  sendCommand({ intent: "deploy_system", params, source });

export const planDns = (source: string, params?: Record<string, unknown>) =>
  sendCommand({ intent: "plan_dns", params: params ?? {}, source });

export const applyDns = (source: string, params: ApplyDnsParams) =>
  sendCommand({ intent: "apply_dns", params, source });

export const healthCheck = (source: string, params?: Record<string, unknown>) =>
  sendCommand({ intent: "health_check", params: params ?? {}, source });

export const syncNotion = (source: string, params?: Record<string, unknown>) =>
  sendCommand({ intent: "sync_notion", params: params ?? {}, source });

export const consentRevoke = (source: string, params: ConsentRevokeParams) =>
  sendCommand({ intent: "consent_revoke", params, source });