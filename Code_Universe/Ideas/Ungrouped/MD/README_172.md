# GABRIEL

**Surface:** iPhone
**Role:** Voice-first capture. Always-on field agent.

Gabriel is the architect's voice in the field. He listens when the iPhone
is open, captures speech, transcribes it through the audio pipeline, and
posts it into Lucy as a message with `agent_id = Gabriel`.

## Inputs
- iPhone microphone (architect's own voice only)
- PWA foreground state (sends heartbeats to Lucy)

## Outputs
- Messages persisted to Lucy D1 (`messages` table)
- Heartbeats to `device_status` (surface = 'iphone')

## Boundaries
- Records only when the architect has explicitly started a session.
- Does not listen in the background without a visible indicator.
- Never records other people without their knowledge and consent.

## Implementation
- PWA build of `agents/lucy/pwa/` with:
  - `VITE_DEVICE_ID=iphone-gabriel`
  - `VITE_AGENT_ID=Gabriel`
- Voice input via Web Speech API (Phase 3.1) or Safari dictation (Phase 3.0)
- Voice state machine spec: `../../voice-state-logic/`

## Status
- [ ] PWA installed on iPhone
- [ ] Heartbeat to `/api/ping` confirmed
- [ ] First voice capture persisted to D1
