import type { Session, SessionStatus, SignalQuality } from "./session.js";
import type { LineageEvent } from "./lineage.js";

export function promoteStatus(
  current: SessionStatus,
  target: SessionStatus
): boolean {
  const order: SessionStatus[] = [
    "draft",
    "unlocked",
    "blessed",
    "locked",
    "archived",
  ];
  return order.indexOf(target) > order.indexOf(current);
}

export function buildSessionPath(
  brand: string,
  createdAt: string,
  sessionId: string
): string {
  const d = new Date(createdAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${brand}/${sessionId}.json`;
}

export function makeLineageEvent(
  event: LineageEvent["event"],
  actor: string,
  detail?: string
): LineageEvent {
  return {
    event,
    actor,
    timestamp: new Date().toISOString(),
    detail,
  };
}

export function sessionSummary(session: Session): string {
  const { meta } = session;
  const speakers = new Set(session.transcript.map((t) => t.speaker));
  return [
    `[${meta.status}]`,
    meta.title,
    `| ${meta.brand}`,
    `| ${speakers.size} speakers`,
    `| ${session.transcript.length} turns`,
    `| conf=${meta.confidence.toFixed(2)}`,
    `| quality=${meta.signal_quality}`,
  ].join(" ");
}
