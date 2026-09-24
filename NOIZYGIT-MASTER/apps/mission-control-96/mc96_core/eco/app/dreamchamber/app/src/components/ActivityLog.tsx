type Props = {
  entries: string[];
};

export default function ActivityLog({ entries }: Props) {
  return (
    <div style={card}>
      <h2 style={title}>Activity Log</h2>
      <div style={{ maxHeight: 240, overflowY: "auto", fontFamily: "'SF Mono',monospace", fontSize: 11 }}>
        {entries.length === 0 ? (
          <div style={{ color: "#555570" }}>No activity yet.</div>
        ) : (
          entries.map((e, i) => (
            <div key={i} style={{ padding: "3px 0", borderBottom: "1px solid rgba(30,30,46,0.5)", color: "#8888a8" }}>{e}</div>
          ))
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: 16, gridColumn: "1 / -1" };
const title: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#555570", marginBottom: 12 };
