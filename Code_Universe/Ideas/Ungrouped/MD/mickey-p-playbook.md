# Mickey P — audit & remote access playbook

Architect: Robert Stephen Plowman
Target machine: Mickey P (MacBook Pro, OSX Catalina 10.15, IP ~10.90.90.100)
Users on box: `fish` (RSPFISH) and `RSP` — to be blended
Owner: ENGR

## Goal

1. Establish a reliable command channel from the M2 Ultra to Mickey P.
2. Capture a full read-only audit of Mickey P.
3. Use the audit to design a safe merge of the `fish` and `RSP` user
   accounts without losing work.

## Phase 1 — Fix the command channel

Screen Sharing between modern macOS and Catalina is known to fail because
the auth handshake has drifted. Rather than fight it, establish SSH
first. SSH is lighter, survives age, and we can layer Screen Sharing
back on top later as a nice-to-have.

### On Mickey P (physical access, once)

1. System Preferences → Sharing.
2. Tick **Remote Login**. Scope "Allow access for" to the `RSP` and `fish`
   users specifically, not "All users".
3. While you're here, also tick **Screen Sharing**, and under
   *Computer Settings…* turn on **"VNC viewers may control screen with
   password"** and set a strong password. This is the fallback client
   path when Apple's Screen Sharing app won't auth against Catalina.
4. Note the IP shown at the top of the Sharing pane. Confirm it is still
   10.90.90.100. If it has drifted, capture the new one.
5. Make sure the Mac is awake. System Preferences → Energy Saver →
   "Prevent computer from sleeping automatically when the display is
   off" while we work. Revert after.

### On the M2 Ultra

Probe first, then connect:

```bash
cd "/CLAUDE TODAY/RSP-NOIZY/agents/engr/scripts"
chmod +x mesh-probe.sh
./mesh-probe.sh 10.90.90.100
```

Read the "Interpretation guide" section of the output.

If port 22 shows OPEN:

```bash
ssh rsp@10.90.90.100     # or: ssh fish@10.90.90.100
```

If it's the first connection, you will be asked to accept the host key.
Accept it. This pins the key; anyone intercepting later will fail the
check.

## Phase 2 — Run the audit

Once SSH works, copy the audit script over and run it. Two options.

### Option A — single user home

```bash
scp mickey-p-audit.sh rsp@10.90.90.100:~/
ssh rsp@10.90.90.100 "chmod +x ~/mickey-p-audit.sh && ~/mickey-p-audit.sh"
scp rsp@10.90.90.100:~/mickey-p-audit-*.tar.gz \
    "/CLAUDE TODAY/RSP-NOIZY/agents/engr/audits/"
```

### Option B — all users on the box (for the merge)

This is what you actually want, since the goal is to blend `fish` and
`RSP`. You need to run the audit from an admin account so it can
read every home.

```bash
scp mickey-p-audit.sh rsp@10.90.90.100:~/
ssh rsp@10.90.90.100 "chmod +x ~/mickey-p-audit.sh && ~/mickey-p-audit.sh --all-users"
scp rsp@10.90.90.100:~/mickey-p-audit-*.tar.gz \
    "/CLAUDE TODAY/RSP-NOIZY/agents/engr/audits/"
```

`--all-users` walks every readable `/Users/*` home directory. If the
`fish` home has restrictive perms, run the audit once from the `RSP`
admin account and once from the `fish` account so each can read its
own files cleanly.

## Phase 3 — Analyze

Bring the tarball back here and I'll:

1. Diff app lists between `fish` and `RSP`.
2. Identify true duplicates (same app, same version) vs divergent
   installs.
3. Map every plug-in to the user that owns it.
4. Produce a merge plan that says, for each piece of work:
   - keep in place
   - move from `fish` → `RSP`
   - move from `RSP` → `fish`
   - archive (neither user needs this daily)
   - delete after backup

Nothing gets deleted until you approve the plan. That's a Pops rule.

## Phase 4 — Fix Screen Sharing (optional, cosmetic)

Once SSH is solid, Screen Sharing is no longer on the critical path.
If you still want visual access, try in order:

1. Finder → Go → Connect to Server → `vnc://10.90.90.100`.
   If this auths, you're done.
2. If Apple's client fails, install **RealVNC Viewer** (free) or
   **Jump Desktop** (paid, better) on the M2 Ultra. Connect to
   `10.90.90.100:5900` with the VNC password you set on Mickey P.
   One of these will get through where Apple's client won't.
3. If you need it to *feel* seamless, **Screens by Edovia** is the
   mac-native answer. It handles Catalina gracefully.

## Safety rails

- Nothing in this playbook modifies Mickey P. The audit reads only.
- No user account is deleted or merged until the architect approves
  a written merge plan.
- Pops reviews the plan before any `rm`.
- All remote sessions should be logged. SSH naturally logs to
  `/var/log/system.log` on the target.
- If DiskWarrior is ever run on Mickey P, do it from a known-good
  boot drive or from the Recovery partition, **never against a
  mounted active system volume without a current backup.**
