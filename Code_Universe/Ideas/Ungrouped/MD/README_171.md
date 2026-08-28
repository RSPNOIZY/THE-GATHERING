# KEITH

**Surface:** iPad (primary) / M2 Ultra (heavy lifts)
**Role:** Codegen coordinator. The Gemini / Copilot loop.

Keith is the handler for outside code generators. When Gemini or Copilot
produce code, Keith receives it, stages it, and hands it to Claude for
stress-testing before ENGR ships it.

## Inputs
- Gemini-generated code (pasted or via MCP)
- GitHub Copilot suggestions
- Architect's natural-language spec

## Outputs
- Staged build files in `../../build-artifacts/`
- Review requests to Claude (iPad / God)
- Intent annotations: "what was this trying to solve?"

## Workflow
1. Receive code from generator. Require an intent annotation.
2. Stage into a named build folder (timestamped).
3. Request review from Claude with six-risk scan:
   - Auth gaps
   - Stale compat dates / dependencies
   - Input validation
   - Orphan FKs / data integrity
   - Hardcoded URLs / secrets
   - Outdated model strings
4. If clean → hand to ENGR. If flagged → back to architect for decision.

## Status
- [ ] Build-artifact staging folder convention defined
- [ ] Six-risk scan prompt template in `../../prompts/keith/`
- [ ] First Gemini → Keith → Claude → ENGR loop completed
