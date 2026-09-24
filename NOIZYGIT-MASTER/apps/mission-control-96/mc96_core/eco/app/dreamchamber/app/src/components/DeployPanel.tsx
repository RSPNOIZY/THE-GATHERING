type Props = {
  onCheckDns: () => void;
  onDeploy: () => void;
  busy: boolean;
};

export default function DeployPanel({ onCheckDns, onDeploy, busy }: Props) {
  return (
    <div style={card}>
      <h2 style={title}>Deploy Controls</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button style={btn} onClick={onCheckDns} disabled={busy}>Check DNS</button>
        <button style={{ ...btn, ...btnDeploy }} onClick={onDeploy} disabled={busy}>Deploy System</button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: 16 };
const title: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#555570", marginBottom: 12 };
const btn: React.CSSProperties = { padding: "10px 14px", borderRadius: 6, border: "1px solid #1e1e2e", background: "#0a0a0f", color: "#e4e4ef", fontFamily: "'SF Mono',monospace", fontSize: 12, cursor: "pointer" };
const btnDeploy: React.CSSProperties = { background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.3)", color: "#4ade80" };
