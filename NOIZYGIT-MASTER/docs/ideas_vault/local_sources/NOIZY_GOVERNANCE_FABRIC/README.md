# NOIZY Sovereign Communications & Governance Fabric

This packet turns scattered NOIZY communication endpoints, asset references, rejected infrastructure, and provenance requirements into concrete governance files.

The immediate goal is not automation. The immediate goal is control:

- every endpoint has an owner and policy;
- every known rejected system is explicitly blocked;
- every recovery item has a tracked status;
- every governed action can produce a receipt.

## Operating Model

```text
Agent
-> Dreamchamber approval
-> Governed action
-> Receipt
-> Provenance graph
-> NOIZY collective memory
```

## Contents

- `governance/schemas/channel-passport.schema.yaml` defines communication endpoint passports.
- `governance/schemas/provenance-receipt.schema.yaml` defines action receipts.
- `governance/schemas/thunderbird-resource.schema.yaml` defines Thunderbird-governed resources.
- `governance/registries/rejected-infrastructure.yaml` blocks known dead or wrong-account D1 databases.
- `governance/registries/asset-recovery-ledger.yaml` tracks voice, archive, and Downloads recovery work.
- `governance/channel-passports/` contains seed Slack passports.
- `governance/receipts/examples/` contains example receipt records.
- `governance/graph/provenance-graph.seed.yaml` defines the first graph node, edge, query, and enforcement model.
- `reports/` contains scan and audit reports.
- `tools/scan-rejected-infrastructure.sh` scans a target directory for known rejected infrastructure IDs.
- `IMPLEMENTATION_PLAN.md` gives the execution path.

## First Enforcement Rule

No agent, script, MCP server, or deployment should connect to an infrastructure ID listed in `governance/registries/rejected-infrastructure.yaml`.

Run:

```bash
./tools/scan-rejected-infrastructure.sh /path/to/repo
```

or, from this packet:

```bash
make check
```

## First Build Rule

Do not build the provenance graph first. Build the passports first. The graph should ingest governed resources, not invent them.
