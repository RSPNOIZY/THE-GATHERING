#!/usr/bin/env node
/**
 * NOIZY Consent MCP Server
 * Exposes 4 tools over stdio: consent_grant, consent_revoke, consent_check, consent_audit.
 * Delegates to the live noizy-app Cloudflare worker.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = process.env.NOIZY_WORKER_URL || "https://noizy-app.rsp-5f3.workers.dev";

const tools = [
	{
		name: "consent_grant",
		description: "Issue a new consent token for an actor. Applies Never Clauses automatically. Returns token_id and split (default 75/25).",
		inputSchema: {
			type: "object",
			properties: {
				actor_id: { type: "string", description: "Registered actor id (e.g. RSP_001)" },
				scope: { type: "string", description: "Consent scope (voice, image, text, etc.)", default: "voice" },
				granted_permissions: { type: "array", items: { type: "string" }, description: "Specific permissions granted" },
				split_actor: { type: "number", default: 75 },
				split_platform: { type: "number", default: 25 },
				metadata: { type: "object" },
				durable: { type: "boolean", description: "If true, uses the durable Workflow path", default: false }
			},
			required: ["actor_id"]
		}
	},
	{
		name: "consent_revoke",
		description: "Sacred revocation — updates D1, purges KV, queues kill switch. Irreversible audit entry.",
		inputSchema: {
			type: "object",
			properties: {
				actor_id: { type: "string" },
				token_id: { type: "string" },
				reason: { type: "string", default: "Creator revocation" }
			},
			required: ["actor_id", "token_id"]
		}
	},
	{
		name: "consent_check",
		description: "Verify an active consent token (fast KV path, D1 fallback).",
		inputSchema: {
			type: "object",
			properties: {
				actor_id: { type: "string" },
				token_id: { type: "string" }
			},
			required: ["actor_id", "token_id"]
		}
	},
	{
		name: "consent_audit",
		description: "Full audit trail for a token or actor (events: issued, verified, suspended, revoked, expired).",
		inputSchema: {
			type: "object",
			properties: {
				token_id: { type: "string" },
				actor_id: { type: "string" }
			}
		}
	}
];

async function callTool(name, args) {
	if (name === "consent_grant") {
		if (args.durable) {
			const r = await fetch(`${BASE}/v1/workflow/consent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
			return await r.json();
		}
		const r = await fetch(`${BASE}/v1/consent/issue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
		return await r.json();
	}
	if (name === "consent_revoke") {
		const r = await fetch(`${BASE}/v1/consent/revoke`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
		return await r.json();
	}
	if (name === "consent_check") {
		const q = new URLSearchParams({ actor_id: args.actor_id, token_id: args.token_id });
		const r = await fetch(`${BASE}/v1/consent/verify?${q}`);
		return await r.json();
	}
	if (name === "consent_audit") {
		const q = new URLSearchParams(args.token_id ? { token_id: args.token_id } : { actor_id: args.actor_id });
		const r = await fetch(`${BASE}/v1/consent/audit?${q}`);
		return await r.json();
	}
	throw new Error(`Unknown tool: ${name}`);
}

const server = new Server(
	{ name: "noizy-consent", version: "1.0.0" },
	{ capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const { name, arguments: args } = req.params;
	try {
		const result = await callTool(name, args || {});
		return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
	} catch (err) {
		return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
	}
});

await server.connect(new StdioServerTransport());
