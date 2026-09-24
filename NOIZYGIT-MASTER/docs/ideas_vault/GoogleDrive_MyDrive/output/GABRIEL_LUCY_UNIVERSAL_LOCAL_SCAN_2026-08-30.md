# GABRIEL ALAMEIDA + LUCY CORTEZ Universal Local Scan

**Date:** 2026-08-30
**Mode:** Read-only discovery; no files moved, renamed, overwritten, or deleted

## Scan roots

- `/Users/m2ultra`
- `/Volumes`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive`
- `/Users/m2ultra/NOIZYANTHROPIC`
- `/Users/m2ultra/Library/Services/Copy Full Path.workflow/noizy-core`

## Results

### GABRIEL ALAMEIDA

- Google Drive exact-name scan: 49 matches.
- Local NOIZYANTHROPIC exact-name scan: 1,514 matches, largely code, extracted Drive snapshots, launch agents, and project history.
- Confirmed meaningful Drive locations:
  - `NOIZYLAB_WORKSPACES/GABRIEL/`
  - `NOIZYLAB_WORKSPACES/THE-GATHERING/Noizyfish:GABRIEL.webloc`
  - `NOIZYLAB_WORKSPACES/THE-GATHERING/Noizyfish:NOIZYLAB-GABRIEL.webloc`
  - `Google AI Studio/Gabriel's Chamber`
  - `Google AI Studio/_GABRIEL.jpg`
  - `Google AI Studio/YOU HAVE GABRIELS VOICE READY?`
- Important false positives: 30+ music filenames containing `Peter Gabriel`, `Gabriel's Oboe`, or ordinary uses of the name. These must not be assigned to the GABRIEL agent group.

### LUCY CORTEZ

- Local NOIZYANTHROPIC exact-name scan: 198 matches.
- Confirmed meaningful local locations:
  - `NOIZYANTHROPIC/apps/lucy/`
  - `NOIZYANTHROPIC/apps/lucy-ios/`
  - `NOIZYANTHROPIC/lucy/`
  - `NOIZYANTHROPIC/registry/agents/LUCY.md`
  - `NOIZYANTHROPIC/mc96/LucyMCP/`
  - `NOIZYANTHROPIC/mc96/Lucy-Fork/`
  - `NOIZYANTHROPIC/NOIZYBEAST/static/manifesto/manifesto_lucy.wav`
  - `NOIZYANTHROPIC/RSPNOIZY/startup/launchagents/com.noizyworld.lucy.plist`
  - `NOIZYANTHROPIC/RSPNOIZY/extracted_gdrive/` Lucy snapshots, workflows, reports, and assets
- The Google Drive filename scan for LUCY was still traversing the large synced tree when this report was written; the local repository scan already establishes the principal Lucy locations.

## Correct classification rules

1. `GABRIEL` means the NOIZY/MC96 agent and its code, prompts, runtime, voice, UI, documentation, and assets.
2. `LUCY` means the NOIZY/MC96 archivist agent and its code, prompts, runtime, MCP, workflows, voice, UI, documentation, and assets.
3. Artist/title references such as `Peter Gabriel`, `Gabriel's Oboe`, or unrelated personal names are **not** agent assets.
4. A file is not moved solely because its filename contains Gabriel or Lucy; surrounding project path and content context must agree.
5. Audio/video masters stay in the 5 TB canonical media tree. Only agent-specific voice, soundtrack, UI, or project assets should be assigned to GABRIEL or LUCY.
6. Ambiguous material goes to `UNASSIGNED_REVIEW`.

## Proposed family destinations

```text
5TB_DREAMCHAMBER_GALAXY/
├── GABRIEL ALAMEIDA/
│   ├── AUDIO_VIDEO_AGENT_ASSETS/
│   ├── VOICE/
│   ├── CODE_AND_RUNTIME/
│   ├── PROMPTS_AND_DOCS/
│   └── ARCHIVE/
├── LUCY CORTEZ/
│   ├── AUDIO_VIDEO_AGENT_ASSETS/
│   ├── VOICE/
│   ├── CODE_AND_RUNTIME/
│   ├── PROMPTS_AND_DOCS/
│   └── ARCHIVE/
├── SHILEY MARIE/
├── POPS PLOWMAN/
└── UNASSIGNED_REVIEW/
```

This report is a discovery artifact only. Any move or merge requires a separate approval after exact files and destination paths are reviewed.
.

## Expanded label and tag policy

The organization pass will use all meaningful labels and tags found in filenames, paths, document content, manifests, project metadata, and repository structure.

### Primary family labels

- `GABRIEL ALAMEIDA`
- `LUCY CORTEZ`
- `SHILEY MARIE`
- `POPS PLOWMAN`
- `DREAM`
- `ENGR_KEITH`
- `UNASSIGNED_REVIEW`

### Secondary brand/system labels

`NOIZY`, `NOIZYLAB`, `NOIZYFISH`, `DREAMCHAMBER`, `MC96`, `HVS`, `NOIZYBEAST`, `HEAVEN`, `AQUARIUM`.

### Functional tags

`VOICE`, `AUDIO`, `VIDEO`, `MUSIC`, `STEMS`, `SFX`, `PODCAST`, `CODE`, `MCP`, `IOS`, `WORKFLOW`, `PROMPT`, `DOCS`, `BUSINESS`, `ARCHIVE`, `BACKUP`, `RELEASE`, `MASTER`.

### State and evidence tags

`ACTIVE`, `ARCHIVE`, `DRAFT`, `EXPORT`, `SNAPSHOT`, `FORK`, `COPY`, `DUPLICATE`, `REVIEW`, plus source path, file type, date, version, checksum/hash, project/repository, and local-versus-cloud status.

Labels are evidence-based. Similar words alone do not establish ownership: for example, Peter Gabriel music is not automatically assigned to GABRIEL ALAMEIDA. Ambiguous items remain in `UNASSIGNED_REVIEW` until context confirms their family.

## Official brand labels

The organization pass must preserve these exact brand/product labels as separate from family/agent names:

- `NOIZYFISH`
- `NOIZYLAB`
- `NOIZYKIDS`
- `NOIZYVOX`
- `myFAMILY.ai`
- `OXYGEN.IO`

A file may carry both a family label and a brand label. Example: `GABRIEL ALAMEIDA` + `NOIZYLAB` + `CODE` + `MCP` + `ACTIVE`. Another example: `LUCY CORTEZ` + `myFAMILY.ai` + `VOICE` + `IOS` + `ARCHIVE`.

Preserve the exact capitalization and punctuation supplied by the owner. Do not collapse brand labels into the family names, and do not assign a brand based on a filename alone when path or content contradicts it.

## Official workspace and project labels

Preserve these exact workspace/project labels separately from family names and brand/product labels:

- `THE-GATHERING`
- `THE-DREAMCHAMBER`

A file may carry family, brand, workspace, function, and state labels at the same time. Examples:

- `GABRIEL ALAMEIDA` + `NOIZYLAB` + `THE-GATHERING` + `CODE` + `ACTIVE`
- `DREAM` + `THE-DREAMCHAMBER` + `AUDIO` + `VIDEO` + `MASTER`

Preserve the exact capitalization and hyphenation supplied by the owner.

## Upgrade and improvement rules

### Classification precedence

1. Exact canonical project or repository path.
2. Explicit folder ownership and manifest metadata.
3. Document or code content references.
4. Filename labels and aliases.
5. Weak name-only matches are never sufficient by themselves.

### Confidence values

Every indexed record must receive one confidence value: `confirmed`, `probable`, `ambiguous`, or `excluded`.

### False-positive protection

Exclude or separately flag system folders, application caches, dependency folders, generated build output, package registries, and unrelated artist/title names. `Peter Gabriel`, `Gabriel's Oboe`, and similar media titles are not automatically family assets.

### Version and state preservation

Never flatten version signals such as `COPY`, `FORK`, `DRAFT`, `EXPORT`, `SNAPSHOT`, `BACKUP`, `ARCHIVE`, or numbered variants. These become state tags and remain available for comparison.

### Repository and runtime protection

Do not move Git repositories, worktrees, symlinks, launch agents, runtime directories, package environments, or active configuration files as part of media grouping. They receive index tags and proposed destinations only.

### Canonical media rule

Audio and video master assets remain under `5TB_DREAMCHAMBER_GALAXY` as the canonical media location. Agent-specific voice, UI, soundtrack, and project assets may receive family tags, but no media is relocated solely from a filename match.

### Machine-readable record

Each index record should include: `path`, `relative_path`, `name`, `extension`, `size_bytes`, `modified_time`, `family_agent`, `brand_product`, `workspace_project`, `function`, `state`, `confidence`, `duplicate_status`, `source_root`, and `notes`.

### Safety gate

The index is read-only. Any move, rename, merge, or deletion requires a separate approved action list generated from the indexed results.
