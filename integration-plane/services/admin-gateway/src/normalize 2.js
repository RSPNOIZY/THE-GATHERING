/**
 * Webhook event normalization functions
 * Transforms platform-specific event formats into NOIZY canonical event shape
 */

export function normalizeLinearEvent(payload) {
  return {
    source: 'linear',
    event_type: payload.type || 'unknown',
    payload
  };
}

export function normalizeNotionEvent(payload) {
  return {
    source: 'notion',
    event_type: determineNotionEventType(payload),
    payload
  };
}

export function normalizeGitHubEvent(payload, headers) {
  return {
    source: 'github',
    event_type: headers['x-github-event'] || 'unknown',
    payload
  };
}

export function normalizeZapierEvent(payload) {
  return {
    source: 'zapier',
    event_type: payload.event_type || 'trigger',
    payload
  };
}

export function normalizeGooglePubSubEvent(envelope) {
  // Google Pub/Sub wraps messages in a message object
  const message = envelope.message?.data ?
    JSON.parse(Buffer.from(envelope.message.data, 'base64').toString()) :
    envelope.message || {};

  return {
    source: 'google',
    event_type: message.eventType || 'pubsub.message',
    payload: message
  };
}

export function normalizeMicrosoftEvent(payload) {
  return {
    source: 'microsoft',
    event_type: determineMicrosoftEventType(payload),
    payload
  };
}

function determineNotionEventType(payload) {
  if (payload.type) return payload.type;
  if (payload.object === 'page') return 'page.created';
  if (payload.object === 'database') return 'database.updated';
  return 'unknown';
}

function determineMicrosoftEventType(payload) {
  if (payload.value && Array.isArray(payload.value)) {
    if (payload.value[0]?.changeType) return payload.value[0].changeType;
  }
  return 'unknown';
}
