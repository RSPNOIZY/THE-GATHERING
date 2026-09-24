# NOIZY macOS Bridge

Native macOS event bridge for the NOIZY chamber. It captures Accessibility, workspace, and Scripting Bridge snapshots, journals every event locally, and forwards durable batches into a LangGraph webhook.

## What It Does

- Captures frontmost app changes, app launch/terminate events, focused window changes, focused UI element changes, title/value/selection changes, window creation, and main-window changes.
- Adds Scripting Bridge snapshots of the frontmost app/window on activation.
- Journals all observed events to `~/.noizy/macos-bridge/events.jsonl`.
- Spools outbound LangGraph deliveries under `~/.noizy/macos-bridge/pending` and removes them only after a 2xx webhook response.
- Exposes local REST/SSE endpoints on `127.0.0.1:9788` by default.
- Redacts text values and selected text by default.

## Build

```bash
cd /Users/m2ultra/NOIZYLAB/swift-library/noizy-macos-bridge
swift build -c release
```

## First Run

```bash
.build/release/noizy-macos-bridge setup
.build/release/noizy-macos-bridge --check-permissions
.build/release/noizy-macos-bridge
```

Grant Accessibility permission to the terminal app or the built binary when macOS prompts. The Scripting Bridge snapshot may also trigger an Automation prompt for System Events.

## Configuration

The daemon reads `~/.noizy/macos-bridge/.env` by default. Generate it with `setup`; use `.env.example` as the repo copy.

Minimum useful fields:

- `LANGGRAPH_WEBHOOK_URL`: local or remote LangGraph ingress URL. Leave blank for local-only capture.
- `NOIZY_BRIDGE_SHARED_SECRET`: optional HMAC secret. When set, outbound webhooks include `X-NOIZY-Signature: sha256=<hex>`.
- `NOIZY_BRIDGE_AUTH_TOKEN`: optional bearer token for local REST endpoints.

## Local Endpoints

```text
GET  /health
GET  /permissions
GET  /events/recent?limit=50
GET  /events/stream
POST /events/test
```

If `NOIZY_BRIDGE_AUTH_TOKEN` is set, include:

```text
Authorization: Bearer <token>
```

## LangGraph Payload

Outbound webhooks receive:

```json
{
  "bridgeId": "m2-ultra",
  "version": "0.1.0",
  "sentAt": "2026-08-30T03:43:08.000Z",
  "events": [
    {
      "id": "uuid",
      "sequence": 1,
      "observedAt": "2026-08-30T03:43:08.000Z",
      "monotonicNanos": 123,
      "source": "accessibility",
      "name": "focuseduielement-changed",
      "pid": 1234,
      "bundleIdentifier": "com.apple.systempreferences",
      "applicationName": "System Settings",
      "elementRole": "AXRow",
      "elementTitle": "Displays",
      "payload": {}
    }
  ]
}
```

Delivery is at-least-once. The LangGraph receiver should dedupe by `id` or by `(bridgeId, sequence)`.

## Launchd

After building a release binary and editing `~/.noizy/macos-bridge/.env`, copy the plist template:

```bash
cp launchd/com.noizy.macos-bridge.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.noizy.macos-bridge.plist
launchctl kickstart -k gui/$(id -u)/com.noizy.macos-bridge
```

## Tests

```bash
swift test
```
