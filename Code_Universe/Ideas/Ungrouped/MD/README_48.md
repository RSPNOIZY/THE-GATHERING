# D1 Database Schemas

All Cloudflare D1 database schemas for NOIZYLAB ecosystem.

## Databases

| Database | ID | Purpose |
|----------|-----|---------|
| noizylab-repairs | 2bd4aa06-f9b2-4761-b235-e92e8a21fe45 | Customer repairs |
| mc96-command-central | ef4eda10-7dda-4c31-839d-5d79d76da43f | Automation hub |
| agent-memory | 7b813205-fd12-4a23-84a6-ce83bc49ec70 | AI agent state |
| email-command-center | 313df650-60db-4392-b048-f5972c57903d | Email routing |
| ai-router-brain | df931d37-b367-4f81-ae32-149e05166cb6 | Model routing |
| rsp-master-budget | 74e6b824-5c10-4b02-8060-3c20217a8ba9 | Financials |
| tencc-pipeline | d1a5c748-6e27-43a6-b5f1-394e748da0dc | 10CC pipeline |
| subscription-killer | 145b3abb-8647-4514-b39e-79f3a9f03c6a | Sub cleanup |
| godaddy-escape-tracker | dfe9343e-c84c-49fd-8a02-052f37a7155b | Domain migration |
| aquarium-archive | e6f98279-656b-4f7a-979d-9197821193f5 | Archive catalog |

## Schema Files

- `noizylab-repairs.sql` - Repair tracking
- `mc96-command.sql` - Command routing
- `agent-memory.sql` - Agent state
- `email-routing.sql` - Email rules
- `aquarium.sql` - Archive metadata

## Deploy Schema

```bash
# Deploy to specific database
wrangler d1 execute noizylab-repairs --file=./noizylab-repairs.sql

# Deploy all
for f in *.sql; do
  db=$(basename "$f" .sql)
  wrangler d1 execute "$db" --file="$f"
done
```
