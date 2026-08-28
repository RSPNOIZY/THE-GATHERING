# FOSS Operator Stack: GoLand + JBang + Local AI

This stack keeps operations local-first while adding JetBrains + Java automation support.

## Core layout

1. **Primary local runtimes**: Go, Java, Python, Node.
2. **IDE options**: GoLand, IntelliJ IDEA Community, VSCodium, Fleet.
3. **Automation runner**: JBang for Java CLI jobs and utility tasks.
4. **Control plane**: DesktopCommander + n8n + NOIZY Autonomy Center.
5. **Governance**: MC96 receipts, no destructive sync, metadata mirror only.

## One-command checks

```bash
npm run autonomy:foss:doctor
```

or:

```bash
npm run autonomy:center -- 9
```

## Minimal voice flow

1. `npm run autonomy:center -- 1` (dashboard)
2. `npm run autonomy:center -- 3` (dry-run sync)
3. `npm run autonomy:center -- 5` (duplicates)
4. `npm run autonomy:center -- 7` (ship gate)
5. `npm run autonomy:center -- 9` (FOSS/JetBrains/JBang readiness)

## JetBrains open-source support

https://www.jetbrains.com/community/opensource/#support
