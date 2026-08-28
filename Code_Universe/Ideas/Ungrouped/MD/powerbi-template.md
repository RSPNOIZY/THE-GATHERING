# NOIZY Power BI Report Template
## Ingest / Enrichment / Feedback Metrics Dashboard

**Version:** 1.0  
**Data source:** NOIZY Azure Function + Heaven D1 export  
**Refresh cadence:** Daily (08:00 UTC)  
**Owner:** rsp@noizyfish.com

---

## Data Sources

### Source 1 — NOIZY Intake API (Azure Function)
Connect via **Web connector** (REST → JSON).

```
GET https://<your-function-app>.azurewebsites.net/api/noizyIngest/summary
Headers:
  x-noizy-key: <NOIZY_API_KEY>
  x-functions-key: <AZURE_FUNCTION_KEY>
```

Expected JSON shape:
```json
{
  "period": "2026-01-01/2026-01-31",
  "intakes": [
    {
      "intake_id": "string",
      "source": "teams-channel | api | email",
      "timestamp": "ISO8601",
      "content_type": "voice_sample | license_request | revocation | general | unknown",
      "recommended_action": "create_ncp | escalate | log_only | revocation_urgent | review",
      "priority": "P0 | P1 | P2 | P3",
      "requires_human_review": true,
      "confidence": 0.95,
      "processing_ms": 1240,
      "compliance_flags": {
        "no_fakes_act": false,
        "eu_ai_act": false
      }
    }
  ]
}
```

### Source 2 — Heaven D1 Export (Cloudflare)
Connect via **Web connector** or **Azure Blob** (export via scheduled Worker cron).

```
GET https://heaven.rsp-5f3.workers.dev/stats
Headers:
  X-NOIZY-Key: <NOIZY_API_KEY>
```

Tables used: `audit_log`, `usage_events`, `royalty_events`, `revocation_events`, `consent_records`

### Source 3 — Gabriel Feedback (DreamChamber API)
```
GET http://localhost:7777/api/gabriel/profile
```
*(Expose a read-only metrics endpoint if needed)*

---

## Report Pages

### Page 1 — Intake Overview

**Visuals:**

| Visual | Type | Fields | Filters |
|--------|------|--------|---------|
| Total Intakes | Card | COUNT(intake_id) | Date range |
| Intakes by Source | Donut chart | source, COUNT | Date range |
| Intakes by Content Type | Bar chart | content_type, COUNT | Date range |
| Daily Intake Volume | Line chart | DATE(timestamp), COUNT | Date range |
| Requires Human Review % | Gauge | SUM(requires_human_review)/COUNT*100 | Date range |
| P0/P1 Priority Intakes | Card (red) | COUNT where priority IN (P0, P1) | Today |

**KPI Targets:**

| KPI | Target | Alert threshold |
|-----|--------|----------------|
| Daily intake volume | Trending up | Drop >20% WoW → alert |
| Human review rate | < 15% | > 25% → escalate |
| P0 incidents | 0 per day | Any P0 → Teams alert |
| Avg processing time | < 3,000 ms | > 5,000 ms → infra alert |

---

### Page 2 — Enrichment Quality

**Visuals:**

| Visual | Type | Fields |
|--------|------|--------|
| Avg Claude Confidence Score | Gauge (0–1) | AVG(confidence) |
| Confidence Distribution | Histogram | confidence buckets (0-0.5, 0.5-0.8, 0.8-1.0) |
| Recommended Action Breakdown | Stacked bar | recommended_action, DATE(timestamp) |
| Compliance Flag Rate | Bar | no_fakes_act Y/N, eu_ai_act Y/N, COUNT |
| Parse Error Rate | Card | COUNT(risk_flags contains "parse_error") / COUNT * 100 |
| Avg Processing Time by Source | Bar | source, AVG(processing_ms) |

**DAX Measures:**

```dax
AvgConfidence = AVERAGE(Intakes[confidence])

ConfidenceLow = 
    CALCULATE(
        COUNT(Intakes[intake_id]),
        Intakes[confidence] < 0.5
    )

ComplianceFlagRate_NoFakes = 
    DIVIDE(
        CALCULATE(COUNT(Intakes[intake_id]), Intakes[no_fakes_act] = TRUE()),
        COUNT(Intakes[intake_id])
    )

ParseErrorRate = 
    DIVIDE(
        CALCULATE(COUNT(Intakes[intake_id]), CONTAINSSTRING(Intakes[risk_flags], "parse_error")),
        COUNT(Intakes[intake_id])
    )
```

---

### Page 3 — Consent & Revocation

**Data:** Heaven D1 `consent_records`, `revocation_events`, `audit_log`

**Visuals:**

| Visual | Type | Fields |
|--------|------|--------|
| Active Consent Tokens | Card | COUNT(consent_records where status=ACTIVE) |
| Revocations This Period | Card (orange) | COUNT(revocation_events) |
| Revocation SLA Met | Gauge | % revocations processed within 1 hour |
| Consent Decisions by Type | Donut | decision (ALLOW/DENY/HOLD/ESCALATE), COUNT |
| Never Clause Violations Attempted | Card (red) | COUNT(audit_log where event_type=never_clause_block) |
| Consent Timeline | Line chart | DATE(created_at), COUNT(consent_records) |

**DAX Measures:**

```dax
RevocationSLAMet =
    DIVIDE(
        CALCULATE(
            COUNT(Revocations[revocation_id]),
            Revocations[processing_minutes] <= 60
        ),
        COUNT(Revocations[revocation_id])
    )

ActiveConsentTokens = 
    CALCULATE(
        COUNT(Consents[consent_id]),
        Consents[consent_status] = "ACTIVE"
    )
```

---

### Page 4 — Royalty & Usage

**Data:** Heaven D1 `usage_events`, `royalty_events`

**Visuals:**

| Visual | Type | Fields |
|--------|------|--------|
| Total Royalties Routed | Card | SUM(royalty_events[amount]) |
| Creator 75% Share | Card | SUM * 0.75 |
| Platform 25% Share | Card | SUM * 0.25 |
| Royalties by Creator | Bar | creator_email, SUM(amount) |
| Usage by Tool | Bar | tool_name, COUNT(usage_events) |
| Monthly Royalty Trend | Line | MONTH(created_at), SUM(amount) |

**DAX Measures:**

```dax
TotalRoyalties = SUM(RoyaltyEvents[amount])

CreatorShare = [TotalRoyalties] * 0.75

PlatformShare = [TotalRoyalties] * 0.25

AvgRoyaltyPerUse = 
    DIVIDE([TotalRoyalties], COUNT(UsageEvents[usage_id]))
```

---

### Page 5 — Gabriel Feedback Loop

**Data:** DreamChamber Gabriel profile + learn logs

**Visuals:**

| Visual | Type | Fields |
|--------|------|--------|
| Total Learnings Logged | Card | COUNT(learnings) |
| Learnings by Category | Donut | category, COUNT |
| Consent-Tagged Learnings | Card | COUNT where tags contains "consent" |
| Profile Confidence | Gauge | profile.confidence_score |
| Learn Events Timeline | Line | DATE(timestamp), COUNT |
| Top Learn Categories | Horizontal bar | category, COUNT, sorted DESC |

---

## Power Query — Data Transform Steps

```powerquery
// Flatten intakes JSON array
let
    Source = Json.Document(Web.Contents("https://<function-url>/api/noizyIngest/summary", 
        [Headers=[#"x-noizy-key"=NOIZY_KEY, #"x-functions-key"=FUNC_KEY]])),
    intakes = Source[intakes],
    #"To Table" = Table.FromList(intakes, Splitter.SplitByNothing()),
    #"Expand Columns" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"intake_id","source","timestamp","content_type","recommended_action",
         "priority","requires_human_review","confidence","processing_ms",
         "compliance_flags"}),
    #"Expand Compliance" = Table.ExpandRecordColumn(#"Expand Columns", "compliance_flags",
        {"no_fakes_act","eu_ai_act"}),
    #"Parse Timestamp" = Table.TransformColumnTypes(#"Expand Compliance",
        {{"timestamp", type datetimezone}}),
    #"Add Date" = Table.AddColumn(#"Parse Timestamp", "Date", 
        each Date.From([timestamp]), type date)
in
    #"Add Date"
```

---

## Alerts & Subscriptions

Configure in Power BI Service under **Alerts**:

| Alert | Condition | Recipients |
|-------|-----------|------------|
| P0 Intake | Count (today) > 0 | rsp@noizyfish.com |
| Revocation SLA Breach | SLA% < 95% | rsp@noizyfish.com |
| Human Review Rate High | Rate > 25% | rsp@noizyfish.com |
| Never Clause Violation Attempted | Count > 0 | rsp@noizyfish.com, legal@noizy.ai |
| Daily Intake Drop | Volume < 50% of 7-day avg | rsp@noizyfish.com |

---

## Deployment Steps

1. Import this template into Power BI Desktop
2. Set parameters: `NOIZY_API_KEY`, `AZURE_FUNCTION_KEY`, `AZURE_FUNCTION_URL`
3. Configure Heaven D1 export endpoint or use Cloudflare Analytics API
4. Publish to Power BI Service workspace `NOIZY-Operations`
5. Set up daily refresh schedule (08:00 UTC)
6. Enable email subscriptions for executive summary (weekly, Monday 09:00 UTC)
7. Share with read-only access to board members

---

## Row-Level Security

Apply RLS to limit creator data visibility:

```dax
// Role: Creator — sees only own records
[creator_email] = USERPRINCIPALNAME()

// Role: Board — sees all records
TRUE()

// Role: Compliance — sees aggregate only (no creator PII)
// Implemented by filtering out creator_email column in the compliance role
```
