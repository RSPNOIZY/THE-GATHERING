import React, { useEffect, useRef, useState } from "react";

/**
 * Lucy Mesh — 3-panel touch-native interface.
 * Left:   MESH_NETWORK   (live agent heartbeats)
 * Center: CONVERSATION   (chat against Claude via the Lucy worker)
 * Right:  SYSTEM_STATE   (worker health, clock, device identity)
 *
 * Configured entirely via Vite env at build time:
 *   VITE_LUCY_API        e.g. https://lucy-worker.<subdomain>.workers.dev
 *   VITE_LUCY_AUTH       shared secret matching worker's LUCY_SHARED_SECRET
 *   VITE_DEVICE_ID       'ipad-primary' | 'iphone-gabriel' | 'm2ultra-shell'
 *   VITE_AGENT_ID        e.g. 'Dream' on iPad, 'Gabriel' on iPhone
 */
const API = import.meta.env.VITE_LUCY_API || "";
const AUTH = import.meta.env.VITE_LUCY_AUTH || "";
const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || "ipad-primary";
const AGENT_ID = import.meta.env.VITE_AGENT_ID || "Dream";

// stable session per install; regenerate by clearing localStorage
function getSessionId() {
  try {
    const key = "lucy.session_id";
    let s = localStorage.getItem(key);
    if (!s) {
      s = `${DEVICE_ID}-${crypto.randomUUID()}`;
      localStorage.setItem(key, s);
    }
    return s;
  } catch {
    return `${DEVICE_ID}-ephemeral`;
  }
}

export default function LucyDashboard() {
  const sessionId = useRef(getSessionId());
  const [mesh, setMesh] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [workerOk, setWorkerOk] = useState(null);
  const [time, setTime] = useState("");
  const scroller = useRef(null);

  // clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // mesh poll + heartbeat
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch(`${API}/api/mesh`, { method: "GET" });
        const data = await res.json();
        if (!cancelled) {
          setMesh(data.mesh || []);
          setWorkerOk(true);
        }
      } catch {
        if (!cancelled) setWorkerOk(false);
      }
    }

    async function ping() {
      try {
        await fetch(`${API}/api/ping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-lucy-auth": AUTH },
          body: JSON.stringify({ agent_id: AGENT_ID, status: "idle", current_task: "PWA open" }),
        });
      } catch {
        /* offline is ok */
      }
    }

    refresh();
    ping();
    const mId = setInterval(refresh, 15000);
    const pId = setInterval(ping, 30000);
    return () => {
      cancelled = true;
      clearInterval(mId);
      clearInterval(pId);
    };
  }, []);

  // rehydrate history
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API}/api/history?session_id=${encodeURIComponent(sessionId.current)}&limit=50`
        );
        const data = await res.json();
        setConversation(
          (data.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            ts: m.timestamp,
          }))
        );
      } catch {
        /* empty history is fine */
      }
    })();
  }, []);

  // autoscroll
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [conversation, sending]);

  async function send(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setConversation((c) => [...c, { role: "user", content: text }]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lucy-auth": AUTH },
        body: JSON.stringify({
          session_id: sessionId.current,
          device_id: DEVICE_ID,
          agent_id: AGENT_ID,
          message: text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setConversation((c) => [
          ...c,
          { role: "system", content: `Lucy worker responded ${res.status}: ${errText.slice(0, 300)}` },
        ]);
      } else {
        const data = await res.json();
        setConversation((c) => [...c, { role: "assistant", content: data.response }]);
      }
    } catch (err) {
      setConversation((c) => [
        ...c,
        { role: "system", content: `Offline — message queued locally only. (${String(err)})` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row p-safe font-mono bg-neutral-900 text-neutral-100">
      {/* MESH_NETWORK */}
      <aside className="md:w-1/4 w-full p-4 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col">
        <h2 className="text-xs font-bold mb-4 tracking-[0.25em] text-neutral-500">
          MESH_NETWORK
        </h2>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {mesh.length === 0 && (
            <div className="text-xs text-neutral-600">
              No mesh data. Worker offline or not yet deployed.
            </div>
          )}
          {mesh.map((m) => (
            <div
              key={m.agent_id}
              className="flex items-center p-3 bg-neutral-800/60 rounded-lg border border-neutral-700"
            >
              <span
                className={
                  "w-2.5 h-2.5 rounded-full mr-3 " +
                  (m.live ? "bg-green-500 animate-pulse" : "bg-neutral-600")
                }
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">{m.agent_id}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  {m.surface} · {m.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CONVERSATION */}
      <main className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 min-h-0">
        <div ref={scroller} className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversation.length === 0 && (
            <div className="text-neutral-500 text-sm">
              Lucy is listening. Speak freely — everything routes through Claude and persists in D1.
            </div>
          )}
          {conversation.map((m, i) => (
            <div
              key={i}
              className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={
                  "px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed text-[15px] " +
                  (m.role === "user"
                    ? "bg-blue-600 text-white"
                    : m.role === "assistant"
                    ? "bg-neutral-800 text-neutral-100 border border-neutral-700"
                    : "bg-amber-900/40 text-amber-200 border border-amber-800 text-xs")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-neutral-800 text-neutral-400 border border-neutral-700 text-[13px]">
                Claude is thinking…
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={send}
          className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command Lucy…"
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-[16px] focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition"
          >
            Send
          </button>
        </form>
      </main>

      {/* SYSTEM_STATE */}
      <aside className="md:w-1/4 w-full p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xs font-bold mb-4 tracking-[0.25em] text-neutral-500">
            SYSTEM_STATE
          </h2>
          <div className="bg-neutral-800/60 p-4 rounded-xl text-[11px] space-y-2 border border-neutral-700">
            <Row k="DEVICE" v={DEVICE_ID} tone="neutral" />
            <Row k="AGENT" v={AGENT_ID} tone="neutral" />
            <Row
              k="WORKER"
              v={workerOk === null ? "CHECKING…" : workerOk ? "ONLINE" : "OFFLINE"}
              tone={workerOk ? "ok" : workerOk === false ? "err" : "neutral"}
            />
            <Row
              k="SESSION"
              v={sessionId.current.slice(-8)}
              tone="neutral"
            />
          </div>
        </div>
        <div className="text-right text-3xl font-light tracking-widest text-neutral-600 mt-4">
          {time}
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v, tone }) {
  const color =
    tone === "ok" ? "text-green-400" : tone === "err" ? "text-red-400" : "text-blue-300";
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{k}</span>
      <span className={`${color} truncate`}>{String(v)}</span>
    </div>
  );
}
