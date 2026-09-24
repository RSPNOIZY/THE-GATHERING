import { useEffect, useState } from "react";
import Header from "./components/Header";
import SystemStatus from "./components/SystemStatus";
import DeployPanel from "./components/DeployPanel";
import ActivityLog from "./components/ActivityLog";
import { getStatus, sendCommand } from "./lib/api";

export default function App() {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<string[]>([]);

  async function refresh() {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch {
      setStatus({
        dns: "BROKEN",
        cloudflare: "DISCONNECTED",
        githubActions: "UNKNOWN",
        worker: "UNKNOWN",
        alerts: ["Backend unreachable"],
      });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setEntries((prev) => [`[${ts}] ${msg}`, ...prev]);
  }

  async function handleCheckDns() {
    setBusy(true);
    log("Checking DNS...");
    const result = await sendCommand("check_dns");
    log(`[${result.run_id}] ${result.summary || result.error}`);
    await refresh();
    setBusy(false);
  }

  async function handleDeploy() {
    const confirmed = window.confirm(
      "Deploy system now? This triggers the GitHub Actions pipeline."
    );
    if (!confirmed) return;

    setBusy(true);
    log("Deploying system...");
    const result = await sendCommand("deploy_system", true);
    log(`[${result.run_id}] ${result.summary || result.error}`);
    await refresh();
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e4e4ef" }}>
      <Header />
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16 }}>
        <SystemStatus status={status} />
        <DeployPanel onCheckDns={handleCheckDns} onDeploy={handleDeploy} busy={busy} />
        <ActivityLog entries={entries} />
      </main>
    </div>
  );
}
