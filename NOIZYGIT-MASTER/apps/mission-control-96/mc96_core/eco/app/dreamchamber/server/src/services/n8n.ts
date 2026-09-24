export async function notifyN8n(payload: any) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { skipped: true };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`n8n webhook failed: ${res.status}`);
  }

  return res.json().catch(() => ({ ok: true }));
}
