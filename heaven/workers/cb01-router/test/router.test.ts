// Vitest unit tests — cb01-router
// RSP_001 | NOIZY Empire | 2026
// Tests: full path forwarding, no segment stripping, 404 on unknown

import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../src/index.js";

const ENV = { CONSENT_GATEWAY_URL: "https://consent.noizy.ai" };

function makeReq(path: string, method = "GET", body?: unknown): Request {
  return new Request(`https://router.noizy.ai${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-NOIZY-Key": "test-key" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// The router passes a Request object (or URL string) to fetch — extract the URL either way
function capturedUrl(call: unknown[]): string {
  const arg = call[0];
  if (typeof arg === "string") return arg;
  if (arg instanceof Request) return arg.url;
  return String(arg);
}

// The router forwards the original request headers — check the forwarded Request
function capturedHeader(call: unknown[], name: string): string | null {
  const arg = call[0];
  if (arg instanceof Request) return arg.headers.get(name);
  const init = call[1] as RequestInit | undefined;
  if (init?.headers) return new Headers(init.headers as HeadersInit).get(name);
  return null;
}

beforeEach(() => { vi.restoreAllMocks(); });

describe("Path forwarding — full path must be preserved", () => {
  it("forwards /health intact", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "LIVE" }), {
        status: 200, headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    await (worker as any).fetch(makeReq("/health"), ENV);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(capturedUrl(mockFetch.mock.calls[0])).toBe("https://consent.noizy.ai/health");
  });

  it("forwards /verify intact", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", mockFetch);
    // POST with no body — router forwards path, not body content
    await (worker as any).fetch(makeReq("/verify", "POST"), ENV);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(capturedUrl(mockFetch.mock.calls[0])).toBe("https://consent.noizy.ai/verify");
  });

  it("forwards /revoke intact", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", mockFetch);
    await (worker as any).fetch(makeReq("/revoke", "POST"), ENV);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(capturedUrl(mockFetch.mock.calls[0])).toBe("https://consent.noizy.ai/revoke");
  });

  it("forwards /status/:creatorId with query string intact", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", mockFetch);

    await (worker as any).fetch(makeReq("/status/creator_123?view=min"), ENV);
    expect(capturedUrl(mockFetch.mock.calls[0])).toBe(
      "https://consent.noizy.ai/status/creator_123?view=min"
    );
  });

  it("passes X-NOIZY-Key header through transparently", async () => {
    const mockFetch = vi.fn(async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", mockFetch);

    await (worker as any).fetch(makeReq("/verify", "POST"), ENV);
    expect(capturedHeader(mockFetch.mock.calls[0], "x-noizy-key")).toBe("test-key");
  });
});

describe("404 for unknown routes", () => {
  it("returns 404 for /unknown", async () => {
    const req = makeReq("/unknown");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(404);
  });
});

describe("OPTIONS — CORS preflight", () => {
  it("returns 204 for any preflight", async () => {
    const req = new Request("https://router.noizy.ai/verify", { method: "OPTIONS" });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(204);
  });
});
