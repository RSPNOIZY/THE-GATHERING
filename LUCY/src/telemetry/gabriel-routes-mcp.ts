import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createHash, createHmac } from "node:crypto";

// ==============================================================================
// gabriel-routes-mcp.ts (v2.4.0-PROD Hardened)
// Architecture: Option A (Local Stdio MCP Server + HTTPS Ledger/Consent Gateway)
// Complies with: Google Maps Platform ToS, Quebec Law 25, Cloudflare D1 Boundary
// ==============================================================================

const HARMONY_WORKER_URL = process.env.HARMONY_LEDGER_URL || "https://mcp.noizyfish.com";
const NOIZY_INTERNAL_KEY = process.env.NOIZY_INTERNAL_KEY;
const CONSENT_TOKEN_HMAC_SECRET = process.env.CONSENT_TOKEN_HMAC_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const ALLOW_LOCAL_CONSENT_STUB = process.env.ALLOW_LOCAL_CONSENT_STUB === "true";
const ALLOW_MOCK_ROUTES = process.env.ALLOW_MOCK_ROUTES === "true" || process.env.NODE_ENV === "test";
const REQUIRE_REMOTE_RECEIPT = process.env.REQUIRE_REMOTE_RECEIPT !== "false";

// 1. Safe Protobuf Duration Parser (handles "124.5s", "120s", etc.)
export function parseDurationSeconds(value: unknown): number {
    if (typeof value !== "string") {
        throw new Error("Routes API returned an invalid duration (non-string)");
    }
    const match = /^([0-9]+(?:\.[0-9]+)?)s$/.exec(value.trim());
    if (!match) {
        throw new Error(`Unsupported duration format: ${value}`);
    }
    const seconds = Number(match[1]);
    if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error("Routes API returned an invalid numerical duration");
    }
    return Math.round(seconds);
}

// 2. Tool Input Schema
const ComputeRoutesObjectSchema = z.object({
    driver_id: z.string().describe("Canonical driver identifier (e.g., DRV-RSP-001)"),
    session_token: z.string().describe("HMAC-verifiable session token"),
    origin: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }),
    destination: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }),
    routing_preference: z.enum([
        "TRAFFIC_UNAWARE",
        "TRAFFIC_AWARE",
        "TRAFFIC_AWARE_OPTIMAL",
    ]).default("TRAFFIC_AWARE"),
    travel_mode: z.enum(["DRIVE", "TWO_WHEELER"]).default("DRIVE"),
    idempotency_key: z.string().uuid().describe("Unique execution UUID"),
});

const ComputeRoutesInputSchema = ComputeRoutesObjectSchema.shape;
type ComputeRoutesInput = z.infer<typeof ComputeRoutesObjectSchema>;

// 3. Consent Verification via HTTPS Gateway (Cloudflare D1 isolation)
async function verifyConsentOverHttp(
    driverId: string,
    sessionToken: string
): Promise<{ granted: boolean; consentId?: string; error?: string }> {
    if (!NOIZY_INTERNAL_KEY) {
        return { granted: false, error: "NOIZY_INTERNAL_KEY is required for consent verification." };
    }

    if (!CONSENT_TOKEN_HMAC_SECRET) {
        return { granted: false, error: "CONSENT_TOKEN_HMAC_SECRET is required for consent token hashing." };
    }

    const tokenHash = createHmac("sha256", CONSENT_TOKEN_HMAC_SECRET).update(sessionToken).digest("hex");

    try {
        const res = await fetch(`${HARMONY_WORKER_URL}/api/v1/consent/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-noizy-key": NOIZY_INTERNAL_KEY
            },
            body: JSON.stringify({
                subject_id: driverId,
                policy_code: "NC-01-10-v2",
                token_hash: tokenHash,
                allowed_purpose: "traffic_eta"
            })
        });

        if (!res.ok) {
            return { granted: false, error: `Consent verification failed (HTTP ${res.status})` };
        }

        const data = await res.json() as any;
        if ((data.granted === true || data.allowed === true) && data.consent_id) {
            return { granted: true, consentId: data.consent_id };
        }

        return { granted: false, error: data.error || "Consent worker denied or omitted consent_id." };
    } catch (err: any) {
        if (
            ALLOW_LOCAL_CONSENT_STUB &&
            driverId.startsWith("DRV-") &&
            /^ST-AUTH-ACTIVE-[A-Za-z0-9_-]+$/.test(sessionToken)
        ) {
            return { granted: true, consentId: `CNS_DEV_${driverId}` };
        }

        return { granted: false, error: `Consent verification failed closed: ${err.message}` };
    }
}

// 4. Commit Harmony Signed Receipt via HTTPS Gateway
async function commitReceiptOverHttp(receiptPayload: Record<string, any>): Promise<string> {
    if (!NOIZY_INTERNAL_KEY) {
        throw new Error("NOIZY_INTERNAL_KEY is required for receipt commitment.");
    }

    const rawData = JSON.stringify(receiptPayload);
    const dataHash = createHash("sha256").update(rawData).digest("hex");

    try {
        const res = await fetch(`${HARMONY_WORKER_URL}/api/v1/ledger/commit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-noizy-key": NOIZY_INTERNAL_KEY
            },
            body: JSON.stringify({
                receipt_id: receiptPayload.idempotency_key,
                data_hash: dataHash,
                payload: rawData,
                status: "SUCCEEDED",
                tier_gate: "TIER-1"
            })
        });

        if (!res.ok && REQUIRE_REMOTE_RECEIPT) {
            const text = await res.text();
            throw new Error(`Receipt commit failed (HTTP ${res.status}): ${text}`);
        }
    } catch (err: any) {
        if (REQUIRE_REMOTE_RECEIPT) {
            throw new Error(`Receipt commitment failed closed: ${err.message}`);
        }
    }

    return dataHash;
}

// 5. Initialize MCP Server
const server = new McpServer({
    name: "gabriel-routes-engine",
    version: "2.4.0-PROD",
});

server.tool(
    "gabriel_compute_traffic_route",
    ComputeRoutesInputSchema,
    async (input: ComputeRoutesInput) => {
        const { driver_id, session_token, origin, destination, routing_preference, travel_mode, idempotency_key } = input;

        // Step 1: Verify NC-01-10-v2 Consent
        const consent = await verifyConsentOverHttp(driver_id, session_token);
        if (!consent.granted) {
            throw new Error(`NC-01-10-v2 Consent check failed: ${consent.error}`);
        }

        // Step 2: Call Google Routes API v2 REST Endpoint
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("MOCK")) {
            if (!ALLOW_MOCK_ROUTES) {
                throw new Error("GOOGLE_MAPS_API_KEY is required unless ALLOW_MOCK_ROUTES=true.");
            }

            // High-fidelity local simulation for canary verification
            const mockDuration = 1284; // 21.4 mins
            const mockStatic = 1040;   // 17.3 mins
            const mockDistance = 14250;
            const mockPolyline = "a~l~FjkztO_@r@vB_BwAcD";

            const receiptPayload = {
                idempotency_key,
                driver_id,
                consent_id: consent.consentId,
                origin,
                destination,
                duration_seconds: mockDuration,
                static_duration_seconds: mockStatic,
                distance_meters: mockDistance,
                polyline_hash: createHash("sha256").update(mockPolyline).digest("hex"),
                route_summary_hash: createHash("sha256").update("Primary Highway / Airport Corridor").digest("hex"),
                executed_at: new Date().toISOString()
            };

            const receiptHash = await commitReceiptOverHttp(receiptPayload);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        status: "SUCCESS",
                        provider: "google_routes",
                        idempotency_key,
                        duration_seconds: mockDuration,
                        static_duration_seconds: mockStatic,
                        distance_meters: mockDistance,
                        eta_minutes: +(mockDuration / 60).toFixed(2),
                        polyline_hash: receiptPayload.polyline_hash,
                        route_summary: "Traffic-aware route metrics ready",
                        harmony_receipt_hash: receiptHash
                    })
                }]
            };
        }

        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": "routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description"
            },
            body: JSON.stringify({
                origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
                destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
                travelMode: travel_mode,
                routingPreference: routing_preference,
                computeAlternativeRoutes: false,
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google Routes API Error: ${response.status} - ${errText}`);
        }

        const routeData = await response.json() as any;
        const primaryRoute = routeData.routes?.[0];
        if (!primaryRoute) {
            throw new Error("No feasible route identified by Google Routes API.");
        }

        const durationSeconds = parseDurationSeconds(primaryRoute.duration);
        const staticDurationSeconds = primaryRoute.staticDuration ? parseDurationSeconds(primaryRoute.staticDuration) : durationSeconds;
        const distanceMeters = primaryRoute.distanceMeters;
        const encodedPolyline = primaryRoute.polyline?.encodedPolyline;

        if (!Number.isFinite(distanceMeters) || !encodedPolyline) {
            throw new Error("Route response failed structural validation (missing polyline or distance).");
        }

        // Step 3: Commit Harmony Signed Receipt
        const receiptPayload = {
            idempotency_key,
            driver_id,
            consent_id: consent.consentId,
            origin,
            destination,
            duration_seconds: durationSeconds,
            static_duration_seconds: staticDurationSeconds,
            distance_meters: distanceMeters,
            polyline_hash: createHash("sha256").update(encodedPolyline).digest("hex"),
            route_summary_hash: createHash("sha256").update(primaryRoute.description || "Primary Route").digest("hex"),
            executed_at: new Date().toISOString()
        };

        const receiptHash = await commitReceiptOverHttp(receiptPayload);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    status: "SUCCESS",
                    provider: "google_routes",
                    idempotency_key,
                    duration_seconds: durationSeconds,
                    static_duration_seconds: staticDurationSeconds,
                    distance_meters: distanceMeters,
                    eta_minutes: +(durationSeconds / 60).toFixed(2),
                    polyline_hash: receiptPayload.polyline_hash,
                    route_summary: "Traffic-aware route metrics ready",
                    harmony_receipt_hash: receiptHash
                })
            }]
        };
    }
);

// Connect Stdio Transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
