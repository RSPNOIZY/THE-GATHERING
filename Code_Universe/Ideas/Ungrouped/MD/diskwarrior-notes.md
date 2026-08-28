# DiskWarrior / TechTool Pro — honest landscape

Architect: Robert Stephen Plowman
Owner: ENGR
Date captured: 2026-04-15

## The direct answer

**DiskWarrior has no public API.** Alsoft never published an SDK. The product
is GUI-only. Its AppleScript surface is narrow (open a disk, run a rebuild,
quit) with no result object, no hooks, no programmatic access to the
previewed directory. You can script *launching* it. You cannot script
*orchestrating* it with anything else.

**TechTool Pro has no public API either.** Micromat exposes a thin
AppleScript dictionary for convenience, not for integration. No streaming
results, no partner integration path, no way to fuse results with another
tool's output in real time.

Neither vendor intends either tool to be a component in an automated
maintenance mesh. Both are end-user utilities.

## Why the API you want doesn't exist

The two companies are small, legacy, and have not been active on modern
automation interfaces. DiskWarrior 5.2 is the last Catalina-compatible
build. DiskWarrior 6 was announced years ago and has not shipped
commercially. Treat the DiskWarrior product line as frozen.

TechTool Pro still ships but moves slowly.

## What this means for RSP-NOIZY

Do not architect the mesh around a DiskWarrior API. That dependency will
never materialize. Instead, treat DiskWarrior and TechTool Pro as
**break-glass manual tools** that a human invokes when the automated
audit says something is wrong.

## What the automated layer can be built on

macOS ships the primitives. Every one of these is scriptable, loggable,
and can feed the `events` table in Lucy D1.

| Concern                        | Tool                                        |
|-------------------------------|---------------------------------------------|
| SMART drive health            | `smartctl` (via Homebrew `smartmontools`)   |
| Directory / FS verify         | `diskutil verifyVolume /`                   |
| APFS snapshots + integrity    | `diskutil apfs list`, `tmutil`              |
| File system activity          | `fs_usage`                                  |
| Hardware inventory            | `system_profiler`                           |
| Spotlight index health        | `mdutil -s /`                               |
| Security posture              | `spctl`, `csrutil`, `fdesetup`              |
| Package inventory             | `pkgutil --pkgs`, `brew list`               |
| Launch item inventory         | `launchctl list`                            |
| Network inventory             | `ifconfig`, `netstat -rn`, `arp -a`         |
| Time Machine state            | `tmutil destinationinfo`                    |

`mickey-p-audit.sh` in this directory captures all of the above.

## Maintenance loop (proposed)

1. `mickey-p-audit.sh` runs on a cadence (daily? weekly?) on each node.
2. The tarball is dropped in `RSP-NOIZY/agents/engr/audits/<hostname>/<date>/`.
3. `diskutil verifyVolume` result + SMART status feed an `events` row
   with `kind = 'health_check'`.
4. If any row comes back RED, ENGR posts a note to the mesh and Pops is
   notified.
5. **Only then** does DiskWarrior / TechTool Pro come out, run by hand.

This keeps the automated and the manual clearly separated.
Automation stays honest (no fake API it can't actually call).
Manual tools stay in the toolbox where they belong.

## Open questions for the architect

- How often should the audit run? (daily / weekly / on-login)
- Where should audit tarballs live long-term? (R2 bucket? local only?)
- Should audit results be summarized by Claude-God and posted back as
  `events` rows, or just kept as flat files?
