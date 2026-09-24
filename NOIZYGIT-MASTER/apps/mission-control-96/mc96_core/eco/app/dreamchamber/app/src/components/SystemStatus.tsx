type Props = {
  status: any;
};

const S: Record<string, string> = {
  OK: "#4ade80",
  CONNECTED: "#4ade80",
  BROKEN: "#f87171",
  DISCONNECTED: "#f87171",
  UNKNOWN: "#555570",
};

export default function SystemStatus({ status }: Props) {
  if (!status) {
    return (
      <div style={card}>
        <h2 style={title}>System Status</h2>
        <p style={{ color: "#555570" }}>Loading...</p>
      </div>
    );
  }

  const rows = [
    { label: "DNS", value: status.dns },
    { label: "Cloudflare", value: status.cloudflare },
    { label: "GitHub Actions", value: status.githubActions },
    { label: "Worker", value: status.worker },
  ];

  return (
    <div style={card}>
      <h2 style={title}>System Status</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r) => (
          <div key={r.label} style={row}>
            <span style={{ color: "#8888a8", fontSize: 13, fontFamily: "monospace" }}>{r.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, background: `${S[r.value] || S.UNKNOWN}22`, color: S[r.value] || S.UNKNOWN }}>{r.value}</span>
          </div>
        ))}
      </div>
      {status.alerts?.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 12, fontFamily: "monospace" }}>
          {status.alerts.map((a: string, i: number) => <div key={i}>{a}</div>)}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: 16 };
const title: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#555570", marginBottom: 12 };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#0a0a0f", borderRadius: 6 };
