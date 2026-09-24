# NOIZYEMPIRE Portal Structure

## Portal Purpose

NOIZYEMPIRE is the operating portal for creative projects, family-safe learning, music/media production, agentic assistance, and system stewardship. It should feel like a command center, not a marketing site.

## Primary Information Architecture

```text
NOIZYEMPIRE Portal
  Home Command
  Identity + Roles
  Projects
  Creative Studio
  Learning Lab
  Data Vault
  Agent HQ
  Family / Guardian Center
  Publishing + Distribution
  Systems Health
  Archive + Recovery
```

## Sections

### Home Command

Purpose: one-screen status, current missions, quick actions, and alerts.

Core modules:
- Active missions
- Gabriel/Lucy status
- Drive/data health
- Recent project activity
- Safe next actions

### Identity + Roles

Purpose: define who is using the portal, what they can access, and which experience they get.

Core modules:
- Profile identity
- Role selector
- Permissions
- Guardian controls
- Contribution history

### Projects

Purpose: track NOIZY projects from idea to shipped asset.

Core modules:
- Project registry
- Ideation notes
- Status board
- Source files
- Deliverables
- Decision log

### Creative Studio

Purpose: music, visuals, voice, video, campaign, and brand creation.

Core modules:
- Audio sessions
- Visual boards
- Voice tools
- Prompt packs
- Export queue
- Asset approvals

### Learning Lab

Purpose: child-safe and builder-safe learning journeys.

Core modules:
- Lessons
- Skill trees
- Exercises
- Progress
- Parent/guardian review
- Reflection notes

### Data Vault

Purpose: preserve, inventory, deduplicate, and restore all important files.

Core modules:
- Drive map
- Google Docs/Slides collection
- Duplicate plans
- Empty-folder plans
- Backup snapshots
- Recovery instructions

### Agent HQ

Purpose: operate Gabriel, Lucy, and future app agents.

Core modules:
- Agent chat
- Memory browser
- Tool status
- Scheduled jobs
- Agent task queue
- Audit logs

### Family / Guardian Center

Purpose: safety, privacy, family role controls, and age-appropriate access.

Core modules:
- Guardian dashboard
- Child profiles
- Safety boundaries
- Content review
- Sharing approvals
- Emergency lockout

### Publishing + Distribution

Purpose: prepare content for release.

Core modules:
- Release checklist
- Social captions
- Metadata
- Rights/licensing
- Distribution targets
- Post-release analytics

### Systems Health

Purpose: show infrastructure status and operational risks.

Core modules:
- PM2 process status
- Ollama model status
- Chroma memory status
- Drive capacity
- Network mounts
- Cloud connector health

### Archive + Recovery

Purpose: restore anything important.

Core modules:
- Snapshot browser
- Restore plans
- Cold archives
- Deletion logs
- External drive manifests
- Cloud vault manifests

## Core User Flows

### Start a New Project

1. Pick identity/role.
2. Create project idea.
3. Attach notes, prompts, references, files.
4. Assign Gabriel/Lucy assistance mode.
5. Choose output type.
6. Save into Project Registry and Data Vault.

### Collect and Protect Data

1. Select one drive.
2. Run inventory.
3. Generate duplicate candidates.
4. Generate empty-folder plan.
5. Review plan.
6. Approve staging, not deletion.
7. Update vault manifest.

### Child-Safe Learning Session

1. Guardian selects child profile.
2. Portal loads allowed learning path.
3. Lucy adjusts tone and UX.
4. Gabriel enforces boundaries.
5. Session output saved for guardian review.

### Publish a Creative Asset

1. Select project.
2. Attach final assets.
3. Run rights/checklist review.
4. Generate captions/metadata.
5. Guardian/owner approval if required.
6. Export package.

## Permission Model

Default rule: read is broader than write; delete is always gated.

Sensitive actions requiring approval:
- Delete files or folders
- Move cloud sync roots
- Reformat drives
- Share links externally
- Publish content
- Change child permissions
- Run paid/external automations

