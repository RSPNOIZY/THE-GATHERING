/**
 * SonicPassportDO.ts
 * Cloudflare Durable Object: Multi-Node Audio Fingerprint & Provenance Correlation Worker.
 * Object Key: sonic-passport/{asset_family_id}
 */

export interface SonicPassportNode {
    assetId: string;
    title: string;
    derivativeType: string;
    exactHash: string;
    perceptualId: string;
    provenanceClaim: any;
    rightsClaim: {
        covenantSplit: string; // "75.00%"
        primaryAuthority: string;
    };
    watermarkSignal: any;
    parentAssetIds: string[];
    createdAt: string;
}

export class SonicPassportDO {
    private state: DurableObjectState;
    private assetNodes: Map<string, SonicPassportNode> = new Map();
    private fingerprintIndex: Map<string, string> = new Map(); // perceptualId -> assetId

    constructor(state: DurableObjectState) {
        this.state = state;
    }

    private async initialize() {
        const stored = await this.state.storage.get<Record<string, SonicPassportNode>>("passport_nodes");
        if (stored) {
            this.assetNodes = new Map(Object.entries(stored));
            for (const [id, node] of this.assetNodes.entries()) {
                this.fingerprintIndex.set(node.perceptualId, id);
            }
        }
    }

    async fetch(request: Request): Promise<Response> {
        await this.initialize();
        const url = new URL(request.url);

        // 1. POST /register-asset
        if (request.method === "POST" && url.pathname === "/register-asset") {
            const body = await request.json() as SonicPassportNode;

            // Enforce The Plowman Standard (75.00% split invariant)
            if (body.rightsClaim.covenantSplit !== "75.00%") {
                return new Response(JSON.stringify({
                    error: "C2PA_INVARIANT_VIOLATION: Only 75.00% split permitted under the Plowman Standard."
                }), { status: 403, headers: { "Content-Type": "application/json" } });
            }

            this.assetNodes.set(body.assetId, body);
            this.fingerprintIndex.set(body.perceptualId, body.assetId);

            const storageObj = Object.fromEntries(this.assetNodes.entries());
            await this.state.storage.put("passport_nodes", storageObj);

            return new Response(JSON.stringify({
                status: "REGISTERED",
                assetId: body.assetId,
                totalFamilyNodes: this.assetNodes.size
            }), { headers: { "Content-Type": "application/json" } });
        }

        // 2. GET /correlate-fingerprint?perceptual_id=CHR_...
        if (request.method === "GET" && url.pathname === "/correlate-fingerprint") {
            const pid = url.searchParams.get("perceptual_id");
            if (!pid || !this.fingerprintIndex.has(pid)) {
                return new Response(JSON.stringify({
                    matched: false,
                    disclaimer: "No match found in current family tree."
                }), { status: 404, headers: { "Content-Type": "application/json" } });
            }

            const matchedAssetId = this.fingerprintIndex.get(pid)!;
            const node = this.assetNodes.get(matchedAssetId)!;

            return new Response(JSON.stringify({
                matched: true,
                asset: node,
                disclaimer: "FINGERPRINT_IDENTIFIES_ACOUSTIC_SIMILARITY_NOT_LEGAL_OWNERSHIP"
            }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("Not Found", { status: 404 });
    }
}
