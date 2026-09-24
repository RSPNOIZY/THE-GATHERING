# NOIZYEMPIRE Identity + Roles

## Role System

Each person can have multiple roles. The portal should adapt interface, permissions, tone, and available tools by role.

## Primary Roles

### Artist

Creates music, visuals, stories, performances, brands, and public-facing creative work.

Needs:
- Studio tools
- Asset library
- Release planning
- Creative feedback
- Rights and metadata support

Can:
- Create projects
- Upload assets
- Request Lucy creative direction
- Prepare release packages

### Child

Learns, creates, explores, and plays in a protected environment.

Needs:
- Simple navigation
- Age-appropriate content
- Encouragement without unsafe autonomy
- Guardian-visible progress

Can:
- Start approved lessons
- Create safe projects
- Save drafts
- Ask child-safe Gabriel/Lucy questions

Cannot:
- Publish externally
- Delete shared data
- Share files publicly
- Access unrestricted archives

### Builder

Builds apps, automations, agents, tools, code, and infrastructure.

Needs:
- Repos
- Specs
- Logs
- Agent tools
- Deployment status
- Data vault access

Can:
- Create technical projects
- Read system reports
- Run dry-run audits
- Propose changes

Destructive operations still require approval.

### Ally

Supports projects without full control.

Needs:
- Shared project context
- Commenting/review
- Limited asset access
- Clear next actions

Can:
- View shared projects
- Comment
- Upload requested files
- Review plans

Cannot:
- Change permissions
- Delete or reformat
- Access private family/child areas unless granted

### Guardian

Protects child users, privacy, publishing boundaries, and safety.

Needs:
- Clear approvals
- Activity overview
- Child profile controls
- Sharing/publication gates
- Emergency lockout

Can:
- Approve publishing
- Approve sharing
- Configure child access
- Review learning sessions
- Freeze risky actions

### Steward

Maintains data, backups, archives, drive health, and recovery.

Needs:
- Drive inventories
- Duplicate reports
- Backup status
- Recovery plans
- Cloud connector state

Can:
- Run inventories
- Generate cleanup plans
- Stage duplicates after approval
- Restore from vaults

Cannot:
- Delete without explicit approval
- Reformat without explicit approval

### Agent

AI actor such as Gabriel, Lucy, or future app-specific agents.

Needs:
- Scoped memory
- Tool permissions
- Audit logs
- Human approval gates

Can:
- Recommend
- Summarize
- Generate plans
- Execute safe read-only tools
- Execute approved write actions

Cannot:
- Override guardian/steward approval
- Hide actions
- Delete or reformat autonomously

## Role Matrix

| Capability | Artist | Child | Builder | Ally | Guardian | Steward | Agent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View own projects | Yes | Yes | Yes | Shared | Yes | Yes | Scoped |
| Create projects | Yes | Approved | Yes | Limited | Yes | Yes | Scoped |
| Publish externally | Yes | No | Yes | No | Approve | No | Recommend |
| Delete files | Approval | No | Approval | No | Approval | Approval | No |
| Reformat drives | No | No | No | No | Approval | Approval | No |
| Manage child safety | No | No | No | No | Yes | No | Enforce |
| Run data inventory | No | No | Yes | No | View | Yes | Scoped |
| Share externally | Approval | No | Approval | No | Approval | Approval | No |

## Identity Questions

When creating a user/profile, ask:

1. Who are you in NOIZYEMPIRE today?
2. Are you creating, learning, building, guarding, or stewarding?
3. What should Gabriel protect for you?
4. What should Lucy help you express?
5. What actions should require approval?

