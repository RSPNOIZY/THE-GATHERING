# SHORTCUT · Log Idea

**Trigger:** "Hey Siri, log idea"
**Endpoint:** `POST https://mesh.noizy.ai/deck/idea`
**Result:** new slide appears in THE_DREAMCHAMBER.pptx within ~30-60s

## Actions in order (Shortcuts.app)

1. **Dictate Text**
   - Stop Listening: "On Tap" (so Rob can pause naturally)
   - Language: English (Canada) or English (US)

2. **Get Variable** (or use Dictated Text directly)
   - Save as: `IdeaText`

3. **Text** action — build the JSON body

   ```json
   {
     "owner": "GABRIEL",
     "claim": "[IdeaText]",
     "device": "iPhone",
     "ts": "[Current Date · ISO 8601]"
   }
   ```

4. **Get Password** (Keychain) — fetch `NOIZY_API_KEY`
   - Service: `noizy.ai`
   - Account: `NOIZY_API_KEY`
   - Save as: `ApiKey`

5. **Get Contents of URL**
   - URL: `https://mesh.noizy.ai/deck/idea`
   - Method: POST
   - Headers:
     - `X-NOIZY-Key`: `[ApiKey]`
     - `Content-Type`: `application/json`
   - Request Body: JSON · the body from step 3

6. **Get Dictionary Value**
   - Get: Value for `mc_tag`
   - From: Contents of URL (response)
   - Save as: `McTag`

7. **Speak Text** (LUCY voice — Moira)
   - Text: "Idea logged as [McTag]. Slide added to DreamChamber."
   - Voice: Moira (English UK) — interim per `feedback_lucy_british_voice.md`

8. **Show Notification** (silent, badge only)
   - Title: "DreamChamber"
   - Body: "[McTag] added to ideas: block"

## Voice phrasing examples

- "Hey Siri, log idea: NOIZYKIDZ should ship with default Apple TV haptics"
- "Hey Siri, log idea: Vol III opens when Mike Nemesvary issues his first consent token"
- "Hey Siri, log idea: AEON v3 should include a heart-rate consent gate"

## What happens server-side

GABRIEL daemon receives POST → calls Claude Haiku to expand the one-line claim into the 8-section IDEA_TEMPLATE.yaml format (directive, prompt, code_link, dependencies, expected_outcome, why, lifeluv, flow) → appends to `checklist.yaml` `ideas:` block → LUCY commits → builder regenerates THE_DREAMCHAMBER.pptx → ops/onedrive-push.py uploads to OneDrive → all devices see the new slide.

**Round trip: 30-60s.**

## Pinning

- **Lock Screen widget:** Settings → Wallpaper → Customize → Add Widget → Shortcuts → "Log Idea"
- **Action Button (iPhone 15+):** Settings → Action Button → Shortcut → "Log Idea"
- **Watch complication:** Watch app → Complications → Shortcuts → "Log Idea"

## Failure handling

- If `mesh.noizy.ai` unreachable: Shortcut shows "Tunnel down — check `cloudflared` LaunchAgent"
- If 401 Unauthorized: Shortcut shows "API key invalid or expired — refresh in Keychain"
- If 500: response is captured, logged to local Notes app under "DreamChamber Errors"

## Constitutional alignment

- **Article II (Consent Structural)** — voice capture happens only when Rob explicitly invokes "Hey Siri" — no ambient listening
- **Article VII (Auditability)** — every invocation ledgered to `noizy_ledger`
- **Nobody Says No** — friction-removal as core feature; the shortcut IS the unblock
