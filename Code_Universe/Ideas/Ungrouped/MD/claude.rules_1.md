# Claude Rules — Heaven Worker

## Auth Rules (MANDATORY)
- NEVER output secret values
- NEVER suggest `wrangler login`
- NEVER invent or guess API tokens
- ONLY reference env vars: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Deploy Rules
- Always run `scripts/token-scope-lint.sh` before deploy
- If auth fails, check token permissions and account_id match
- Use `npm run deploy` (includes preflight check)

## Account Reference
- Fishmusicinc: `2446d788cc4280f5ea22a9948410c355`
- Email: `rp@fishmusicinc.com`
- Domain: `noizy.ai`

## Failure Response
1. Run `scripts/wrangler-doctor.sh`
2. Check env vars are set (not their values)
3. Verify account_id matches token scope
4. Do NOT retry with OAuth
