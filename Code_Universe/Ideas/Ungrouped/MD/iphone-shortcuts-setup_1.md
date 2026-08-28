# iPhone → GOD Pipeline — Shortcut Setup Guide

**iPhone 15 Pro Max → Postman/Shortcuts → ALL NOIZY Services**

---

## Method 1: Apple Shortcuts (Zero friction, voice-first)

### Shortcut: "Hey Siri, GORUNFREE"
1. Open **Shortcuts** app
2. Tap **+** → **Add Action**
3. Search "Get Contents of URL"
4. URL: `http://10.90.90.10:8080/claude`
5. Method: **POST**
6. Headers: `Authorization: Bearer YOUR_VOICE_TOKEN`, `Content-Type: application/json`
7. Body: `{"text": "Ask Siri Input", "tower": "max"}`
8. Add **Ask for Input** before the URL action → pipe result into `text` field
9. Add **Show Result** after → displays Claude's response
10. Name it: **GORUNFREE**

### Shortcut: "Hey Siri, Morning Briefing"
1. Get Contents of URL → `http://10.90.90.10:7777/brief`
2. POST → `{"context": "iPhone morning briefing"}`
3. Show Result

### Shortcut: "Hey Siri, Empire Status"
1. Get Contents of URL → `http://10.90.90.10:9090/api/status`
2. GET
3. Show Result (score %, services up/down)

### Shortcut: "Hey Siri, Emergency Revoke"
1. Get Contents of URL → `http://10.90.90.10:8080/webhook/heaven`
2. POST → `{"source":"consent","event":"consent.revoke","summary":"Emergency iPhone revoke","creator_id":"RSP_001"}`
3. Headers: `Authorization: Bearer YOUR_VOICE_TOKEN`
4. Show Alert: "CONSENT REVOKED — Kill Switch Active"

---

## Method 2: Postman on iPhone

1. Install **Postman** from App Store
2. Sign in with your Postman account
3. Import collection: `NOIZY_EMPIRE_COMPLETE.postman_collection.json`
4. Set environment variables:
   - `GOD` = `http://10.90.90.10`
   - `HEAVEN` = `https://heaven.rsp-5f3.workers.dev`
   - `VOICE_AUTH_TOKEN` = your token from `.env`
   - `NOIZY_API_KEY` = your Heaven API key
5. All 50+ endpoints ready to fire from iPhone

---

## Method 3: Power Automate → Voice Bridge

Already wired. iPhone → Siri → Power Automate → `/power-automate-webhook` on GOD.

---

## Quick Reference: iPhone → Service Map

| Say This | Hits | Port | Endpoint |
|---|---|---|---|
| "GORUNFREE" | Voice Bridge → Claude Max | :8080 | POST /claude |
| "Morning briefing" | GABRIEL | :7777 | POST /brief |
| "Empire status" | Health Monitor | :9090 | GET /api/status |
| "Deploy heaven" | Voice Bridge → deploy | :8080 | POST /voice-command |
| "Emergency revoke" | Voice Bridge → Heaven | :8080 | POST /webhook/heaven |
| "Start session" | NOIZYSTREAM | :4040 | POST /sessions |
| "AirPlay connect" | AirPlay monitor | :3001 | GET /state |

All routes: `10.90.90.10` (GOD.local on your network)
