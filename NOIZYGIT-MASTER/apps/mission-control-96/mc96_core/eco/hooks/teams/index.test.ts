import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// ── Worker Routing Tests ──────────────────────────────────────
describe('Claude Proxy Worker Routing', () => {

  it('responds with 200 to /health endpoint', async () => {
    const request = new Request('http://example.com/health', { method: 'GET' });
    const ctx = createExecutionContext();

    // Dispatch request to the worker
    const response = await worker.fetch(request, env, ctx);

    // Ensure any waitUntil background tasks complete
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);

    const data = await response.json() as { status: string };
    expect(data.status).toBe('alive');
  });

  it('rejects POST to /claude/messages if unauthorized', async () => {
    const request = new Request('http://example.com/claude/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
    });
    const ctx = createExecutionContext();

    // env.NOIZY_SECRET is bound in your test configuration
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(401);
    const data = await response.json() as { error: string };
    expect(data.error).toBe('Unauthorized');
  });

  it('handles CORS preflight requests correctly', async () => {
    const request = new Request('http://example.com/claude/messages', { method: 'OPTIONS' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
