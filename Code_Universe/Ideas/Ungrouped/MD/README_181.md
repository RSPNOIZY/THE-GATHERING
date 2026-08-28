# ENGR / scripts

Maintenance and audit tooling owned by ENGR. Everything here is
**read-only** unless a script says otherwise in its header.

## Files

| File                     | What it is                                     |
|--------------------------|------------------------------------------------|
| `mesh-probe.sh`          | Network reachability probe for any mesh node.  |
| `mickey-p-audit.sh`      | Full read-only macOS audit (Catalina+).        |
| `mickey-p-playbook.md`   | Step-by-step: SSH → audit → merge plan.        |
| `diskwarrior-notes.md`   | Honest landscape on DiskWarrior / TechTool.    |

## Rules

- No script in this directory modifies the target system without an
  explicit confirmation flag and a Pops review.
- Audit tarballs land in `../audits/<hostname>/<YYYY-MM-DD>/` so they
  are diffable over time.
- Secrets never live in this directory. If a script needs a credential,
  it reads it from `../../engr-keys/` (manifest there, values elsewhere).

## First run

Follow `mickey-p-playbook.md` end to end. It assumes you are on the
M2 Ultra, and Mickey P is the target.
