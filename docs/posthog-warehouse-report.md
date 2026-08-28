# PostHog Data Warehouse — Source Setup Report

**Date:** 2026-07-02  
**PostHog Project:** Default project (ID: 474175)

---

## Summary

No new sources were created automatically during this session. Credentials were not provided for the 5 `in-cli` sources, so all 8 detected sources have been assigned pre-filled browser setup URLs below.

No project source code was modified.

---

## Sources — Browser Setup Required

Open each URL while logged into PostHog to complete the connection. OAuth sources (Linear, Slack, GitHub) require browser authorization; the rest need credentials entered in the UI.

### In-CLI Sources (credentials not provided — complete in app)

| Source | Kind | Setup URL |
|--------|------|-----------|
| PostgreSQL | Postgres | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Postgres |
| Snowflake | Snowflake | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Snowflake |
| Supabase | Supabase | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Supabase |
| Resend | Resend | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Resend |
| Notion | Notion | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Notion |

### OAuth / Deep-Link Sources (require browser authorization)

| Source | Kind | Setup URL |
|--------|------|-----------|
| Linear | Linear | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Linear |
| Slack | Slack | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Slack |
| GitHub | Github | https://us.posthog.com/project/474175/data-warehouse/new-source?kind=Github |

---

## Files Modified

None. This skill does not modify project source code.

---

## Manual Steps

### For Supabase (important credential details)
- Use the **Session pooler** host, not the direct connection host (the direct host is IPv6-only and unreachable from PostHog)
- Host format: `aws-0-<region>.pooler.supabase.com`
- Username format: `postgres.<project-ref>`
- Port: **6543** (not 5432)
- Password: your **database** password from Supabase → Settings → Database (not the anon/service_role JWT key)

### For Resend
- Your existing `RESEND_API_KEY` may be a send-only restricted key
- The warehouse sync requires a full/read-access key — create one at [resend.com/api-keys](https://resend.com/api-keys)

### For Notion
- Create an internal integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
- After connecting, **share** each page or database you want synced via `•••` → Connections → your integration

### For PostgreSQL / Snowflake
- Ensure the database host is publicly reachable from PostHog's network
- `localhost`, `127.0.0.1`, and private/RFC-1918 IPs (`10.x`, `172.16–31.x`, `192.168.x`) are not supported
- If your database is behind a firewall, allowlist [PostHog's egress IPs](https://posthog.com/docs/cdp/sources/postgres) first

---

## What Was Skipped and Why

All sources were left blank during the credential prompts, triggering the deep-link fallback path for each. No sources were skipped permanently — they can all be connected via the URLs above.
