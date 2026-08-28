# HOT ROD Git Leader Mode

This gives you a single-command operator flow for GitHub + GitKraken/GitLens usage when you want the agent to lead.

## One command

```bash
npm run git:hotrod
```

## Modes

```bash
# status board
npm run git:hotrod -- status

# review/comment triage
npm run git:hotrod -- triage

# pre-ship quality gate
npm run git:hotrod -- ship

# fetch/prune/branch sync
npm run git:hotrod -- sync
```

## How this maps to your tools

- **GitHub (`gh`)**: source of truth for PR state/checks/comments
- **GitKraken/GitLens**: visual graph, commit grouping, merge context
- **Leader mode**: run hotrod script first, then execute only the next action it surfaces

## Operator doctrine

1. One command.
2. One next action.
3. One receipt-level outcome.
