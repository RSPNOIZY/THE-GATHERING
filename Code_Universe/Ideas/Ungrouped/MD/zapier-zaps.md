# Lucy Stack — Zapier Zaps

## Zap 1: Liner → Notion
**Trigger:** New Liner highlight saved
**Action:** Create Notion page in Lucy Research DB
- Map: highlight.text → Notion "Content"
- Map: highlight.url → Notion "Source"
- Map: highlight.tags → Notion "Tags"

## Zap 2: n8n Webhook → Slack/Notify
**Trigger:** n8n webhook fires (device event)
**Action:** Send notification (email/Slack/push)
- Map: event.type → Message subject
- Map: event.device → Device name
- Map: event.timestamp → Time

## Zap 3: Notion → LANDR
**Trigger:** New Notion page created in Sessions DB
**Action:** POST to LANDR API to create session
- Map: page.title → session.name

## Zap 4: Airfoil Status → Notion Log
**Trigger:** Webhook from n8n (audio_started event)
**Action:** Append to Notion Audio Log database
- Map: device → speaker
- Map: source → audio_source
- Map: timestamp → started_at
