# Origin JWT Validation for Cloudflare Access

Requirement: protected origins must validate `Cf-Access-Jwt-Assertion`.

## Validation contract

For each protected request:

1. Read `Cf-Access-Jwt-Assertion` header
2. Verify JWT signature using Access JWKS
3. Validate claims:
   - `aud` includes expected Access app audience
   - `iss` matches Access issuer
   - `exp` and `nbf` are valid
4. Authorize identity (`email`, `sub`, or group claims)
5. Reject request with `401/403` on any failure

## Minimum route scoping

Enforce JWT validation on:

- `/admin/*`
- `/export/*`
- `/verify/*`
- Any mutation endpoint (`POST/PUT/PATCH/DELETE`) in privileged namespaces

## mTLS split

- Keep broad app access on Identity + WARP + posture
- Add mTLS to high-risk routes only (admin/export/verification)

## Quick test matrix

- Valid Access token + valid posture + valid WARP -> `200`
- Missing `Cf-Access-Jwt-Assertion` -> `401`
- Bad signature -> `401`
- Wrong `aud` -> `403`
- Expired token -> `401`

## Deployment checks

- `heaven.noizy.ai` protected and JWT validated
- `gabriel.dreamchamber.noizy.ai` protected and JWT validated
- Logs capture JWT validation pass/fail reason codes
