/**
 * DriverSessionDO.ts
 * Cloudflare Durable Object: Per-Driver / Per-Session Ordered State & Handoff Engine.
 * Object Key: driver-session/{driver_id}/{session_id}
 */

export interface DriverSessionState {
    driverId: string;
    sessionId: string;
    currentMission: string | null;
    lastAcceptedIntent: any | null;
    latestRouteReceipt: string | null;
    pendingApproval: any | null;
    handoffStatus: "IDLE" | "PREPARED" | "APPROVED" | "HANDED_OFF" | "ABSTAINED";
    lastSequenceNumber: number;
    updatedAt: string;
}

export class DriverSessionDO {
    private state: DurableObjectState;
    private session: DriverSessionState | null = null;

    constructor(state: DurableObjectState) {
        this.state = state;
    }

    private async initialize() {
        if (!this.session) {
            const stored = await this.state.storage.get<DriverSessionState>("session_state");
            if (stored) {
                this.session = stored;
            } else {
                this.session = {
                    driverId: "RSP_001",
                    sessionId: "SESS_DEFAULT",
                    currentMission: "IDLE",
                    lastAcceptedIntent: null,
                    latestRouteReceipt: null,
                    pendingApproval: null,
                    handoffStatus: "IDLE",
                    lastSequenceNumber: 0,
                    updatedAt: new Date().toISOString()
                };
            }
        }
    }

    async fetch(request: Request): Promise<Response> {
        await this.initialize();
        const url = new URL(request.url);

        // 1. GET State
        if (request.method === "GET" && url.pathname === "/state") {
            return new Response(JSON.stringify(this.session), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // 2. POST Sequence-Ordered Intent Packet
        if (request.method === "POST" && url.pathname === "/intent") {
            const body = await request.json() as any;
            const seq = body.sequenceNumber || 0;

            // Enforce Strict Monotonic Ordering & Deduplication
            if (seq <= (this.session!.lastSequenceNumber)) {
                return new Response(JSON.stringify({
                    status: "DEDUPLICATED",
                    message: `Sequence ${seq} already processed.`
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            }

            this.session!.lastSequenceNumber = seq;
            this.session!.lastAcceptedIntent = body.intent;
            this.session!.pendingApproval = body.pendingApproval || null;
            this.session!.handoffStatus = body.pendingApproval ? "PREPARED" : "IDLE";
            this.session!.updatedAt = new Date().toISOString();

            await this.state.storage.put("session_state", this.session);

            return new Response(JSON.stringify({
                status: "ACCEPTED",
                session: this.session
            }), { headers: { "Content-Type": "application/json" } });
        }

        // 3. POST Approve Handoff
        if (request.method === "POST" && url.pathname === "/approve") {
            this.session!.pendingApproval = null;
            this.session!.handoffStatus = "APPROVED";
            this.session!.updatedAt = new Date().toISOString();

            await this.state.storage.put("session_state", this.session);

            return new Response(JSON.stringify({
                status: "HANDOFF_APPROVED",
                session: this.session
            }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("Not Found", { status: 404 });
    }
}
