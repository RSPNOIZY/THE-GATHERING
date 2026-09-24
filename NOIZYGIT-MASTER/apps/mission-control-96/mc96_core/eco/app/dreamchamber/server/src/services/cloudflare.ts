const CF_API = "https://api.cloudflare.com/client/v4";

function cfHeaders() {
  return {
    Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function getZoneStatus() {
  const zoneId = process.env.CF_ZONE_ID!;
  const res = await fetch(`${CF_API}/zones/${zoneId}`, {
    headers: cfHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare zone lookup failed: ${res.status}`);
  }

  const json: any = await res.json();
  return json.result;
}

export async function getDnsRecords() {
  const zoneId = process.env.CF_ZONE_ID!;
  const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, {
    headers: cfHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare DNS lookup failed: ${res.status}`);
  }

  const json: any = await res.json();
  return json.result as Array<any>;
}

export async function verifyDnsSkeleton() {
  const expected = [process.env.CF_EXPECTED_HOSTNAME || "noizy.ai", "www"];

  const zone = await getZoneStatus();
  const records = await getDnsRecords();

  const names = new Set(records.map((r: any) => r.name));
  const missing = expected.filter((host) => {
    if (host.includes(".")) return !names.has(host);
    return !records.some(
      (r: any) => r.name === `${host}.${process.env.CF_EXPECTED_HOSTNAME}`
    );
  });

  return {
    zoneName: zone.name,
    zoneStatus: zone.status,
    missing,
    ok: zone.status === "active" && missing.length === 0,
  };
}
