import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import {
  normalizeLinearEvent,
  normalizeNotionEvent,
  normalizeGitHubEvent,
  normalizeZapierEvent,
  normalizeGooglePubSubEvent,
  normalizeMicrosoftEvent
} from './normalize.js';

const app = new Hono();
const PORT = 3001;
const BUFFER_SIZE = 100;
const startTime = Date.now();

// In-memory circular event buffer
const eventBuffer = [];

/**
 * Add event to circular buffer (keeps last N events)
 */
function addToBuffer(event) {
  eventBuffer.push(event);
  if (eventBuffer.length > BUFFER_SIZE) {
    eventBuffer.shift();
  }
}

/**
 * Log webhook event with timestamp
 */
function logEvent(source, eventType, timestamp) {
  const ts = new Date(timestamp).toISOString();
  console.log(`[${ts}] ${source.toUpperCase()} webhook: ${eventType}`);
}

/**
 * Forward to Cloudflare Queue (placeholder for future implementation)
 */
async function forwardToQueue(event) {
  // TODO: Implement Cloudflare Queue integration
  // console.log(`[Queue] Forwarding event ${event.id} to Cloudflare Queue`);
}

// Linear webhook: issues, comments, projects
app.post('/webhook/linear', async (c) => {
  try {
    const payload = await c.req.json();
    const normalized = normalizeLinearEvent(payload);

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 202);
  } catch (err) {
    console.error('[Linear] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// Notion webhook: page/database changes
app.post('/webhook/notion', async (c) => {
  try {
    const payload = await c.req.json();
    const normalized = normalizeNotionEvent(payload);

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 202);
  } catch (err) {
    console.error('[Notion] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// GitHub webhook: push, pull_request, issues, etc.
app.post('/webhook/github', async (c) => {
  try {
    const signature = c.req.header('x-hub-signature-256');
    const payload = await c.req.text();

    // Verify GitHub signature (placeholder - requires GITHUB_WEBHOOK_SECRET)
    if (signature && process.env.GITHUB_WEBHOOK_SECRET) {
      const expected = 'sha256=' + crypto
        .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== expected) {
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    const parsed = JSON.parse(payload);
    const normalized = normalizeGitHubEvent(parsed, Object.fromEntries(c.req.raw.headers));

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 202);
  } catch (err) {
    console.error('[GitHub] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// Zapier webhook: multi-step workflow triggers
app.post('/webhook/zapier', async (c) => {
  try {
    const payload = await c.req.json();
    const normalized = normalizeZapierEvent(payload);

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 202);
  } catch (err) {
    console.error('[Zapier] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// Google Pub/Sub push endpoint
app.post('/webhook/google', async (c) => {
  try {
    const payload = await c.req.json();
    const normalized = normalizeGooglePubSubEvent(payload);

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 200);
  } catch (err) {
    console.error('[Google] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// Microsoft Graph change notifications
app.post('/webhook/microsoft', async (c) => {
  try {
    const payload = await c.req.json();

    // Microsoft may send validation request with validationToken
    if (payload.validationToken) {
      return c.text(payload.validationToken);
    }

    const normalized = normalizeMicrosoftEvent(payload);

    const event = {
      id: nanoid(),
      source: normalized.source,
      event_type: normalized.event_type,
      payload: normalized.payload,
      received_at: new Date().toISOString(),
      normalized_at: new Date().toISOString()
    };

    addToBuffer(event);
    logEvent(event.source, event.event_type, event.received_at);
    await forwardToQueue(event);

    return c.json({ success: true, event_id: event.id }, 202);
  } catch (err) {
    console.error('[Microsoft] Error processing webhook:', err.message);
    return c.json({ error: err.message }, 400);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  const uptime = Date.now() - startTime;
  return c.json({
    status: 'healthy',
    uptime_ms: uptime,
    uptime_sec: Math.floor(uptime / 1000),
    connected_services: [
      'linear',
      'notion',
      'github',
      'zapier',
      'google',
      'microsoft'
    ],
    event_buffer_size: eventBuffer.length,
    timestamp: new Date().toISOString()
  });
});

// Recent events endpoint
app.get('/events', (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const events = eventBuffer.slice(-limit);

  return c.json({
    count: events.length,
    events,
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log(`[Admin Gateway] Starting on port ${PORT}...`);
console.log('[Admin Gateway] Author: Robert Stephen Plowman');
console.log('[Admin Gateway] Ready to receive webhooks');

const server = app.listen(PORT, () => {
  console.log(`[Admin Gateway] Listening on http://localhost:${PORT}`);
});

export default app;
