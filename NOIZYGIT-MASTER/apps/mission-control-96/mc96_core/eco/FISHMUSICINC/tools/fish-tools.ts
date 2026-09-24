// @fish MCP tools — FishMusicInc audio/streaming operations

/** Check NOIZYSTREAM control server status */
export async function streamStatus(): Promise<{
  control: string;
  signaling: string;
}> {
  const control = await fetch('http://localhost:7778/health')
    .then((r) => (r.ok ? 'LIVE' : `DOWN (${r.status})`))
    .catch(() => 'UNREACHABLE');

  const signaling = await fetch('http://localhost:7779/')
    .then((r) => (r.ok ? 'LIVE' : `DOWN (${r.status})`))
    .catch(() => 'UNREACHABLE');

  return { control, signaling };
}

/** List active audio sessions from NOIZYSTREAM */
export async function listSessions(): Promise<unknown> {
  const res = await fetch('http://localhost:7778/sessions');
  if (!res.ok) throw new Error(`NOIZYSTREAM control: ${res.status}`);
  return res.json();
}

/** Check royalty KV status via heaven worker */
export async function royaltyCheck(artistId: string): Promise<unknown> {
  const res = await fetch(
    `https://heaven-dns.rsp-5f3.workers.dev/health`
  );
  return {
    worker: res.ok ? 'reachable' : 'unreachable',
    note: `Royalty lookup for ${artistId} requires HEAVEN worker (not yet deployed to prod)`,
  };
}
