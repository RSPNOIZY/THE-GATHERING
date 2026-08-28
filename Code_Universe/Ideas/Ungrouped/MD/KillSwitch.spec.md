# SHORTCUT · KILL SWITCH ⚠️

**Trigger:** "Hey Siri, kill switch" OR Apple Watch complication force-press
**Endpoint:** `POST https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/all/revoke`
**Result:** ALL active consent tokens for RSP_001 revoked; propagation begins (Article V 1-hour SLA)
**Severity:** DESTRUCTIVE — requires double confirmation

This is the most dangerous shortcut. It implements **Article V (Revocation is Real)** at the device-edge layer. After this fires, every NOIZY surface stops accepting synthesis requests using RSP_001 consent until re-issuance.

## Actions in order (Shortcuts.app)

1. **Show Alert** (FIRST CONFIRMATION)
   - Title: "⚠️ KILL SWITCH"
   - Message: "This revokes ALL active RSP_001 consent tokens. Propagates within 1 hour. Cannot be undone without re-issuance ceremony. Continue?"
   - Buttons: "Cancel" (default) · "Confirm Kill Switch"

2. **If** result is "Confirm Kill Switch":

3. **Get Authentication** (FACE ID / TOUCH ID)
   - Reason: "Authorize Kill Switch"
   - On failure: stop shortcut, show "Authentication failed"

4. **Dictate Text** (SECOND CONFIRMATION via voice)
   - Prompt: "Speak the word 'revoke' to confirm"
   - Save as: `Confirmation`

5. **If** `Confirmation` matches "revoke" (case-insensitive):

6. **Get Password** (Keychain) — fetch `NOIZY_API_KEY` (Option B per shortcuts/README — Keychain only for KillSwitch)
   - Service: `noizy.ai`
   - Account: `NOIZY_API_KEY`
   - Save as: `ApiKey`

7. **Text** — build the request body

   ```json
   {
     "actor_id": "RSP_001",
     "reason": "Kill Switch invoked via [Device Name] · [Current Date]",
     "device": "[Device Name]",
     "auth_method": "Face ID + voice 'revoke'"
   }
   ```

8. **Get Contents of URL**
   - URL: `https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/all/revoke`
   - Method: POST
   - Headers:
     - `X-NOIZY-Key`: `[ApiKey]`
     - `Content-Type`: `application/json`
   - Request Body: JSON from step 7
   - Timeout: 30s

9. **Get Dictionary Value**
   - Get: `revoked_count`
   - Save as: `RevokedCount`

10. **Speak Text** (urgency voice — Daniel for GABRIEL gravitas)
    - Text: "Kill Switch fired. [RevokedCount] tokens revoked. Propagation begins now. SHIRL is monitoring. POPS is informed."
    - Voice: Daniel (English UK)

11. **Show Notification** (PERSISTENT — requires manual dismiss)
    - Title: "KILL SWITCH FIRED"
    - Body: "[RevokedCount] tokens revoked. Propagation 0/60 min."
    - Sound: critical alert (override silent mode)

12. **Send Message** (iMessage to Rob's emergency contact)
    - To: Rob's spouse / family member
    - Body: "Kill Switch fired at [Current Date]. RSP_001 voice consent fully revoked. This is automated."
    - (Optional — for spouse/family awareness if Rob is in distress)

## Voice phrasing

- "Hey Siri, kill switch" → triggers full ceremony
- Watch: force-press complication → "Confirm Kill Switch?" → tap → Face ID → speak "revoke" → fired

## What happens server-side

HEAVEN receives POST:

1. Validates `X-NOIZY-Key`
2. Looks up all `consent_tokens` WHERE `actor_id = 'RSP_001' AND status = 'active'`
3. Updates each to `status = 'revoked'` + writes new row to `consent_events`
4. Fires Slack webhook (CF04) → notifies family + Rob's emergency contact
5. Fires Discord webhook (CF01) → notifies Wisdom Project Council
6. Logs `KILL_SWITCH_FIRED` to `noizy_ledger`
7. Returns `{ revoked_count: N, ledger_event_id: <uuid> }`

**Within 1 hour:** every dependent system (NOIZYVOX, NOIZYFISH, all CF Workers) re-checks consent and rejects any pending synth using revoked tokens.

## Why double confirmation + Face ID + voice phrase

Per Article V, revocation is real. But it's also not casual. The triple gate (alert + Face ID + speak "revoke") prevents:

- Accidental swipe of complication
- Pocket-Siri triggers
- Voice-mimicry attacks (the speak-the-word step requires Rob's voice biometric implicitly)
- Rob himself triggering it in an emotionally compromised moment without conscious confirmation

Per `feedback_family_covenant.md` SHIRL role: this shortcut DOES NOT bypass the wellbeing layer. SHIRL receives notification of every Kill Switch fire and can flag to POPS if the pattern indicates founder distress.

## Constitutional alignment

- **Article V (Revocation Real)** — implemented at the device edge
- **Article VII (Auditability)** — fully ledgered with auth method + device + reason
- **Family Covenant SHIRL** — wellbeing flag on Kill Switch frequency
- **Family Covenant POPS** — 100-year frame reminds even the founder this is a serious decision
- **Nobody Says No** — Kill Switch is a CONSTITUTIONAL "no" — the only kind permitted (per `feedback_nobody_says_no.md`)

## Recovery (after Kill Switch fires)

Re-issuance ceremony (Rob's hands · interactive):

1. Open HEAVEN admin endpoint (CF Access-gated)
2. For each previously-active token, decide: re-issue with same scope · re-issue with adjusted scope · leave revoked
3. Sign each new token with RSP_001 Ed25519 private key (per April 17 data-integrity blockers — once those are closed)
4. New tokens get fresh `expires_at`, fresh `signature`, new `mc_tag`
5. Ledger entries: `KILL_SWITCH_RECOVERY · token_id_old · token_id_new`
