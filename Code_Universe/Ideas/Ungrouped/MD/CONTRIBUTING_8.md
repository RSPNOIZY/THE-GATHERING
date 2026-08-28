# Contributing to THE-GATHERING

Thank you for your interest in contributing to NOIZY.AI. This document outlines the ground rules.

## The Non-Negotiables

1. **The 9 Never Clauses are constitutional.** No PR can weaken, remove, or circumvent them.
2. **The 75/15/10 royalty split is law.** No PR can change the artist's 75% share.
3. **Consent logic must remain a pure function.** No side effects in `consent.ts`.
4. **The append-only ledger must remain append-only.** No UPDATE or DELETE on consent_log.
5. **All API endpoints must be under /v1/.** No breaking changes to existing endpoints.

## How to Contribute

1. Fork THE-GATHERING
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Write tests for your changes
4. Ensure all 52+ consent tests pass (`cd heaven && npm test`)
5. Open a Pull Request against `main`

## Code Style

- TypeScript for all new backend code
- Strict mode enabled
- No `any` types without justification in a comment
- Pure functions preferred — side effects isolated to edge handlers

## Commit Messages

Use conventional commits:
- `feat(heaven): add new consent check rule`
- `fix(landing): correct signup form validation`
- `docs: update architecture diagram`
- `test(heaven): add edge case for expired tokens`

## Review Process

All PRs require review from @RSPNOIZY. Changes to `heaven/src/consent.ts` require extra scrutiny — this is constitutional code.
