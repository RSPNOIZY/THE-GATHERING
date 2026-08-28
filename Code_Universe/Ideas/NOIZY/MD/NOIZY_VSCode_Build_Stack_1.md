# VS Code Insiders — Sequential Build Stack
## How to Build Things in Order, Every Time

---

## THE CORE IDEA

In VS Code Insiders, a "build stack" is controlled by one file:

```
your-project/
└── .vscode/
    └── tasks.json
```

That file defines every step in your build sequence. You run it with **Ctrl+Shift+B** (Mac: **Cmd+Shift+B**), and VS Code runs your steps in the order you define them.

---

## YOUR BUILD PATTERN (NOIZY)

Every document you build follows the same three steps:

```
Step 1 → Write / edit the .js script
Step 2 → node yourscript.js         (generates the .docx)
Step 3 → python validate.py         (confirms it's valid)
```

The goal is to run Steps 2 and 3 automatically, in sequence, with one keystroke.

---

## STEP 1 — SET UP YOUR PROJECT FOLDER

Create this structure on your machine:

```
NOIZY-BUILD/
├── .vscode/
│   └── tasks.json        ← the build stack lives here
├── scripts/
│   ├── noizy_canada.js
│   ├── noizy_gaps_complete.js
│   ├── noizy_voice_library.js
│   └── noizy_manifesto.js
├── output/               ← .docx files land here
└── validate.py           ← the validator script
```

Open the **NOIZY-BUILD** folder in VS Code Insiders:
> File → Open Folder → select NOIZY-BUILD

---

## STEP 2 — THE tasks.json FILE

Create `.vscode/tasks.json` with this content:

```json
{
  "version": "2.0.0",
  "tasks": [

    // ── INDIVIDUAL BUILD TASKS ─────────────────────────────────────────────

    {
      "label": "Build: Canada Fortress Economy",
      "type": "shell",
      "command": "node scripts/noizy_canada.js",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    {
      "label": "Build: Critical Gaps Complete",
      "type": "shell",
      "command": "node scripts/noizy_gaps_complete.js",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    {
      "label": "Build: Voice Library",
      "type": "shell",
      "command": "node scripts/noizy_voice_library.js",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    {
      "label": "Build: Human Experiment Manifesto",
      "type": "shell",
      "command": "node scripts/noizy_manifesto.js",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    // ── VALIDATE TASK ──────────────────────────────────────────────────────

    {
      "label": "Validate: All Outputs",
      "type": "shell",
      "command": "for f in output/*.docx; do echo \"Checking $f...\"; python validate.py \"$f\"; done",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    // ── SEQUENTIAL COMPOUND TASKS ──────────────────────────────────────────
    // These chain multiple tasks together. dependsOn = runs FIRST.

    {
      "label": "🔨 BUILD + VALIDATE: Canada Fortress Economy",
      "dependsOn": ["Build: Canada Fortress Economy"],
      "dependsOrder": "sequence",
      "type": "shell",
      "command": "python validate.py output/NOIZY_Canada_Fortress_Economy.docx",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    {
      "label": "🔨 BUILD + VALIDATE: Voice Library",
      "dependsOn": ["Build: Voice Library"],
      "dependsOrder": "sequence",
      "type": "shell",
      "command": "python validate.py output/NOIZY_Voice_Library.docx",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },

    // ── FULL CORPUS BUILD ──────────────────────────────────────────────────
    // Builds ALL documents in sequence, then validates everything.

    {
      "label": "🚀 BUILD ALL NOIZY DOCUMENTS",
      "dependsOn": [
        "Build: Canada Fortress Economy",
        "Build: Critical Gaps Complete",
        "Build: Voice Library",
        "Build: Human Experiment Manifesto"
      ],
      "dependsOrder": "sequence",
      "type": "shell",
      "command": "echo 'All builds complete. Running validation...' && for f in output/*.docx; do python validate.py \"$f\"; done",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    }

  ]
}
```

---

## STEP 3 — HOW TO RUN YOUR BUILDS

### Run a specific task:
1. Press **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows)
2. Type: `Tasks: Run Task`
3. Pick from the list — e.g., `🔨 BUILD + VALIDATE: Voice Library`

### Run the default build (Cmd+Shift+B):
The task marked `"isDefault": true` runs automatically.
In the config above, that's **BUILD + VALIDATE: Canada Fortress Economy**.
Change `isDefault` to `true` on whichever task you use most.

### Run ALL documents:
1. Cmd+Shift+P → `Tasks: Run Task`
2. Select `🚀 BUILD ALL NOIZY DOCUMENTS`
3. Watch the terminal — each script runs, then all outputs validate.

---

## STEP 4 — HOW dependsOn WORKS (SEQUENTIAL LOGIC)

```
"dependsOn": ["Task A", "Task B", "Task C"],
"dependsOrder": "sequence"
```

This means:
- Run Task A → wait for it to finish
- Then run Task B → wait for it to finish  
- Then run Task C → wait for it to finish
- Then run the current task

Without `"dependsOrder": "sequence"`, tasks run in PARALLEL (at the same time).
With `"sequence"`, they run one after another — like a proper build pipeline.

---

## STEP 5 — ADDING A NEW DOCUMENT TO THE STACK

When you write a new script (e.g., `noizy_talent_architecture.js`):

1. Add an individual build task:
```json
{
  "label": "Build: Talent Architecture",
  "type": "shell",
  "command": "node scripts/noizy_talent_architecture.js",
  "group": "build"
}
```

2. Add it to the full corpus build's `dependsOn` list:
```json
"dependsOn": [
  "Build: Canada Fortress Economy",
  "Build: Talent Architecture",    ← add here
  ...
]
```

That's it. The new document slots into the sequence automatically.

---

## RECOMMENDED EXTENSIONS FOR VS CODE INSIDERS

Install these from the Extensions panel (Cmd+Shift+X):

| Extension | Why |
|---|---|
| **Task Runner** (sanaajani) | Adds a sidebar showing all your tasks with run buttons |
| **Error Lens** | Shows errors inline while you type |
| **ESLint** | Catches JavaScript errors before you run |
| **Path Intellisense** | Autocompletes file paths in your scripts |
| **GitLens** | Tracks which version of a script generated which doc |

---

## THE MENTAL MODEL

Think of your build stack like a recording session signal chain:

```
Preamp (write script) → Compressor (node build) → EQ (validate) → Output (docx)
```

Each piece has one job. `tasks.json` is the patchbay — it connects them in the right order and makes sure no signal hits the output until everything upstream is clean.

---

## QUICK REFERENCE

| Action | Shortcut |
|---|---|
| Run default build | Cmd+Shift+B |
| Run any task | Cmd+Shift+P → "Tasks: Run Task" |
| Rerun last task | Cmd+Shift+P → "Tasks: Rerun Last Task" |
| Open terminal | Ctrl+` (backtick) |
| Open tasks.json | Cmd+Shift+P → "Tasks: Open User Tasks" |

---

*Build stack designed for the NOIZY.ai document corpus — Node.js + docx + Python validation.*
