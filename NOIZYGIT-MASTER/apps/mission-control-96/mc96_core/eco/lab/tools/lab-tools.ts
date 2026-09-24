// @lab MCP tools — DevOps infrastructure operations

const HEAVEN_DNS = 'https://heaven-dns.rsp-5f3.workers.dev';

/** Check heaven-dns worker health */
export async function dnsHealth(): Promise<unknown> {
  const res = await fetch(`${HEAVEN_DNS}/health`);
  return res.json();
}

/** List DNS records for the configured zone */
export async function dnsList(): Promise<unknown> {
  const res = await fetch(`${HEAVEN_DNS}/dns/list`);
  return res.json();
}

/** Dry-run DNS plan for desired records */
export async function dnsPlan(desired: Array<{
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
}>): Promise<unknown> {
  const res = await fetch(`${HEAVEN_DNS}/dns/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ desired }),
  });
  return res.json();
}

/** Check all NOIZY services health */
export async function serviceHealth(): Promise<Record<string, string>> {
  const services = [
    { name: 'GABRIEL', url: 'http://localhost:7777/health' },
    { name: 'NOIZYSTREAM-Control', url: 'http://localhost:7778/health' },
    { name: 'DreamChamber', url: 'http://localhost:7780/health' },
    { name: 'Voice-Bridge', url: 'http://localhost:8080/health' },
    { name: 'Ollama', url: 'http://localhost:11434/api/tags' },
    { name: 'heaven-dns', url: `${HEAVEN_DNS}/health` },
  ];

  const results: Record<string, string> = {};
  await Promise.all(
    services.map(async (s) => {
      try {
        const r = await fetch(s.url, { signal: AbortSignal.timeout(5000) });
        results[s.name] = r.ok ? 'LIVE' : `DOWN (${r.status})`;
      } catch {
        results[s.name] = 'UNREACHABLE';
      }
    })
  );
  return results;
}

/** Check n8n cloud health */
export async function n8nHealth(): Promise<string> {
  try {
    const res = await fetch('https://noizy.app.n8n.cloud/healthz', {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? 'LIVE' : `DOWN (${res.status})`;
  } catch {
    return 'UNREACHABLE';
  }
}
