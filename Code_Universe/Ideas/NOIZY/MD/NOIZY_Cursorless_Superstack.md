# NOIZY CURSORLESS SUPERSTACK
## Voice Coding: Zero to Hot Rod — The Complete Progressive System

*Talon Voice + Cursorless + VS Code Insiders — Fully Integrated*

---

## THE ONE MENTAL MODEL

Every single Cursorless command is always:

```
ACTION  +  TARGET
```

Target is always: `[color]` + `[letter-word]`

```
"chuck bat"         → delete the token where the hat is on 'b'
"take blue sun"     → select the token where a BLUE hat is on 's'
"copy funk red air" → copy the whole function where a RED hat is on 'a'
```

That's the entire system. Everything below is just expanding your vocabulary for ACTION and TARGET.

---

## THE HAT ALPHABET (Learn This First)

Cursorless puts colored hats on characters visible in your editor. You reference them by their phonetic word.

```
air    = a       bat    = b       cap    = c       drum   = d
each   = e       fine   = f       gust   = g       harp   = h
sit    = i       jury   = j       crunch = k       look   = l
made   = m       near   = n       odd    = o       pit    = p
quench = q       red    = r       sun    = s       trap   = t
urge   = u       vest   = v       whale  = w       plex   = x
yank   = y       zip    = z
```

### Hat Colors (when two tokens share a letter)

```
(none)    = default hat — most common, say nothing
blue      = blue hat
green     = green hat
red       = red hat (careful — "red" is also a letter word for 'r')
pink      = pink hat
yellow    = yellow hat
```

When you have two tokens starting with `s`, one gets a plain hat, one gets a colored hat:
- `"sun"` = the one with the default hat
- `"blue sun"` = the one with the blue hat

---

## THE SIX-PHASE RAMP SYSTEM

---

### PHASE 1 — WEEKS 1–2: Hats for Navigation
**Mission:** Replace your mouse clicks with hat targets. Nothing else.

**The 4 commands you need:**

| Voice Command | Action | Example |
|---|---|---|
| `"take [target]"` | Select the token | `"take bat"` |
| `"pre [target]"` | Move cursor before token | `"pre bat"` |
| `"post [target]"` | Move cursor after token | `"post bat"` |
| `"chuck [target]"` | Delete the token | `"chuck bat"` |

**Daily Drill — Phase 1:**
Every time you reach for your mouse to click somewhere, stop. Say `"pre [letter]"` or `"post [letter]"` instead. Do this for two weeks. Only this. Navigation before everything.

**Phase 1 Wins:**
- No mouse clicks to position cursor
- No highlighting with mouse
- Basic word deletion by voice

---

### PHASE 2 — WEEKS 3–4: Clipboard + Movement
**Mission:** Move code around without keyboard shortcuts.

**New commands:**

| Voice Command | Action |
|---|---|
| `"copy [target]"` | Copy token to clipboard |
| `"carve [target]"` | Cut token |
| `"paste [target]"` | Paste at target location |
| `"bring [target]"` | Copy token TO your cursor |
| `"move [target]"` | Move token TO your cursor (cut + paste) |
| `"clone [target]"` | Duplicate token at cursor |
| `"swap [target1] with [target2]"` | Swap two tokens |

**The two commands that replace drag-and-drop forever:**
```
"bring bat"   → pulls token 'b' to where your cursor is (non-destructive)
"move bat"    → cuts token 'b' and pastes it at your cursor
```

**Daily Drill — Phase 2:**
Every time you copy/paste with keyboard, do it with `"bring"` or `"move"` instead. Time yourself — you'll be faster within a week.

---

### PHASE 3 — WEEKS 5–6: Scopes
**Mission:** Stop targeting letters — start targeting CODE STRUCTURES.

This is where Cursorless becomes superhuman. Instead of navigating to a character, you describe WHAT the thing IS.

**Core scope words:**

| Voice Word | Targets |
|---|---|
| `"funk"` | Entire function / method |
| `"class"` | Entire class definition |
| `"state"` | Statement (one logical line) |
| `"line"` | The raw line |
| `"block"` | Indented block |
| `"arg"` | Function argument |
| `"string"` | String literal |
| `"comment"` | Comment |
| `"name"` | Name/identifier of a symbol |
| `"value"` | Value in an assignment |
| `"key"` | Key in a key-value pair |
| `"type"` | Type annotation |
| `"condition"` | Condition in if/while/for |
| `"unit"` | Test/spec block |
| `"section"` | Markdown section |
| `"paragraph"` | Paragraph of text |

**Syntax:**
```
"[action] [scope] [target]"

"chuck line bat"       → delete the whole line at 'b'
"take funk bat"        → select the whole function at 'b'
"copy state bat"       → copy the whole statement at 'b'
"bring arg bat"        → bring the argument at 'b' to cursor
"chuck arg bat"        → delete a function argument
"take string bat"      → select a string literal
```

**VISUALIZER — your best learning tool:**
```
"visualize funk"       → lights up all function scopes in your file
"visualize state"      → lights up all statements
"visualize arg"        → lights up all arguments
"visualize nothing"    → turn it off
```
Use the visualizer every time you learn a new scope. Watch what lights up.

**Daily Drill — Phase 3:**
Pick one scope per day to learn. Day 1: only use `"funk"`. Day 2: add `"state"`. Day 3: add `"arg"`. Etc.

---

### PHASE 4 — WEEKS 7–8: Ranges + Lists
**Mission:** Operate on multiple things at once.

**Ranges (from → to):**
```
"take [target1] past [target2]"

"take air past bat"            → select from 'a' token to 'b' token
"chuck line air past bat"      → delete lines from 'a' to 'b'
"take funk air past funk bat"  → select multiple functions
```

**Lists (this AND that simultaneously):**
```
"take [target1] and [target2]"

"take air and bat"             → select both (multi-cursor)
"chuck arg air and bat"        → delete two args at once
"copy sun and made"            → copy both tokens
```

**Special target words:**

| Word | Means |
|---|---|
| `"this"` | Your current cursor position / selection |
| `"that"` | The last target Cursorless used |
| `"row [N]"` | Line number N |
| `"up [N]"` | N lines above cursor |
| `"down [N]"` | N lines below cursor |

**Examples with specials:**
```
"chuck this"                   → delete current selection
"bring that"                   → bring last-used target here
"take row twenty four"         → select line 24
"chuck up three"               → delete 3 lines above
```

**Daily Drill — Phase 4:**
Every time you find yourself doing the same action on two similar things, try `"and"` to do them simultaneously.

---

### PHASE 5 — WEEKS 9–10: Power Modifiers
**Mission:** Expand or reshape targets without having to precisely aim.

**Positional modifiers:**

| Modifier | Does |
|---|---|
| `"next [scope]"` | The next occurrence of scope |
| `"previous [scope]"` | The previous occurrence |
| `"every [scope]"` | Every occurrence in the file |
| `"first [scope]"` | First child of a structure |
| `"last [scope]"` | Last child |
| `"second [scope]"` | Second child |
| `"third [scope]"` | Third child, etc. |

**Expansion modifiers:**

| Modifier | Does |
|---|---|
| `"head"` | From target to start of line |
| `"tail"` | From target to end of line |
| `"block [target]"` | The surrounding block |
| `"containing funk [target]"` | The function containing the target |
| `"containing class [target]"` | The class containing the target |

**Instance modifier:**

| Command | Does |
|---|---|
| `"every instance [target]"` | Select all occurrences of the word |

**Power combos:**
```
"chuck every comment"          → delete ALL comments in file
"take every arg bat"           → select all arguments in the function
"copy next funk"               → copy the next function
"move last arg bat past last arg cap" → move last arg from one call to another
"take every instance sun"      → select all occurrences of the token at 's'
"chuck containing funk bat"    → delete the whole function that contains 'b'
```

---

### PHASE 6 — WEEKS 11–12: Transform + Refactor Actions
**Mission:** Manipulate code structure, not just content.

**Wrapping:**
```
"wrap [target] with parens"         → surround with ()
"wrap [target] with curly"          → surround with {}
"wrap [target] with square"         → surround with []
"wrap [target] with quotes"         → surround with ""
"wrap [target] with tick"           → surround with ``
```

**Transformation:**
```
"drink [target]"               → unwrap / remove surrounding delimiters
"indent [target]"              → indent
"dedent [target]"              → dedent
"join [target]"                → join lines
"reverse [target]"             → reverse order of list/args
"sort [target]"                → sort items alphabetically
```

**Case conversion:**
```
"camel [target]"               → camelCase
"pascal [target]"              → PascalCase
"snake [target]"               → snake_case
"kebab [target]"               → kebab-case
"title [target]"               → Title Case
"upper [target]"               → UPPER CASE
"lower [target]"               → lower case
```

**Refactor (LSP-powered):**
```
"extract [target]"             → extract to variable
"define [target]"              → go to definition
"reference [target]"           → find all references
"rename [target]"              → trigger rename refactor
"hover [target]"               → show hover documentation
"quick fix [target]"           → show quick fix menu
"scout [target]"               → open search for this term
```

**Insert actions:**
```
"clone [target]"               → duplicate to next line
"clone up [target]"            → duplicate above
"pour [target]"                → insert blank line after and move cursor there
"drink [target]"               → insert blank line before
```

---

## COMPLETE ACTION REFERENCE

### Navigation & Selection
| Command | Action |
|---|---|
| `"pre [target]"` | Cursor before target |
| `"post [target]"` | Cursor after target |
| `"take [target]"` | Select target |
| `"give [target]"` | Add target to selection (extend) |
| `"chop [target]"` | Select and delete with smart whitespace cleanup |

### Clipboard
| Command | Action |
|---|---|
| `"copy [target]"` | Copy |
| `"carve [target]"` | Cut |
| `"paste [target]"` | Paste replacing target |
| `"bring [target]"` | Insert copy at cursor |
| `"move [target]"` | Move (cut + insert) to cursor |

### Deletion
| Command | Action |
|---|---|
| `"chuck [target]"` | Delete target |
| `"chop [target]"` | Delete with whitespace cleanup |
| `"clear [target]"` | Delete contents, keep structure (e.g., empty a function body) |

### Editing
| Command | Action |
|---|---|
| `"change [target]"` | Delete + enter insert mode at target |
| `"crown [target]"` | Select and move cursor to start |
| `"clone [target]"` | Duplicate |
| `"swap [t1] with [t2]"` | Swap two targets |
| `"reverse [target]"` | Reverse order |
| `"sort [target]"` | Sort children |
| `"join [target]"` | Join lines |

### Insertion
| Command | Action |
|---|---|
| `"pour [target]"` | New line after, cursor there |
| `"drink [target]"` | New line before, cursor there |
| `"snip [target]"` | Insert snippet at target |

### Code Structure
| Command | Action |
|---|---|
| `"wrap [target] with [pair]"` | Wrap with delimiters |
| `"rewrap [target] with [pair]"` | Replace existing wrapping |
| `"indent [target]"` | Indent |
| `"dedent [target]"` | Dedent |
| `"extract [target]"` | Extract to variable (LSP) |
| `"rename [target]"` | Rename symbol (LSP) |

### Navigation
| Command | Action |
|---|---|
| `"define [target]"` | Go to definition |
| `"reference [target]"` | Find references |
| `"hover [target]"` | Show hover info |
| `"quick fix [target]"` | Open quick fix menu |
| `"scout [target]"` | Search for term |

---

## TALON SETUP — THE FOUNDATION

### Installation Order (do this exactly once)
```
1. Install Talon Voice       → talonvoice.com
2. Install VS Code Insiders  → already done
3. Install Cursorless        → VS Code Extensions panel
4. Install community Talon files:
   git clone https://github.com/talonhub/community ~/.talon/user/community
5. Restart everything
6. Say "help alphabet" to verify Talon is working
```

### Your Talon Folder Structure
```
~/.talon/
├── user/
│   ├── community/              ← community scripts (don't edit these)
│   ├── cursorless-settings/    ← your Cursorless customizations
│   │   ├── actions.csv
│   │   ├── scope_types.csv
│   │   ├── colors.csv
│   │   ├── shapes.csv
│   │   └── experimental/
│   │       └── actions_custom.csv
│   └── noizy/                  ← YOUR personal Talon files
│       ├── noizy_code.talon
│       ├── noizy_vscode.talon
│       └── noizy_snippets.talon
```

---

## CUSTOM CSV OVERRIDES
### Location: `~/.talon/user/cursorless-settings/`

### actions.csv — Rename or alias any action
```csv
# Format: spoken_form, action_name
# Use | to add multiple spoken forms
# Prefix with - to disable

# Rename chuck to something that feels better
nuke|chuck, remove

# Give bring a shorter alias
grab|bring, insertCopyBefore

# Rename carve
cut, cutToClipboard
```

### scope_types.csv — Rename scopes
```csv
# Format: spoken_form, scope_type_name

# Make "function" work in addition to "funk"
function|funk, namedFunction

# Add aliases for common scopes
stmt|state, statement
def|funk, namedFunction
test|unit, unit
```

### colors.csv — Rename or disable hat colors
```csv
# Format: spoken_form, color_name

# Rename colors to taste
azure|blue, blue
lime|green, green

# Disable colors you never use
-, pink
-, yellow
```

### experimental/actions_custom.csv — Map voice to ANY VSCode command
```csv
# Format: spoken_form, vscode_command_id

# Refactor tools
rename that, editor.action.rename
format file, editor.action.formatDocument
organize imports, editor.action.organizeImports
fix all, editor.action.fixAll

# Git
stage file, git.stageSelectedRanges
blame line, gitlens.toggleLineBlame
show history, gitlens.showFileHistoryInPanel

# Terminal
split terminal, workbench.action.terminal.split
new terminal, workbench.action.terminal.new

# AI helpers (if using GitHub Copilot)
explain this, github.copilot.explainThis
fix this, github.copilot.fixThis
```

---

## PERSONAL TALON FILES
### Location: `~/.talon/user/noizy/`

### noizy_vscode.talon — VSCode shortcuts by voice
```talon
# This file activates only when VS Code is focused
app.name: Code - Insiders
-

# Panel control
open terminal: key(ctrl-grave)
close terminal: key(ctrl-grave)
split right: key(cmd-backslash)
split down: key(cmd-k cmd-backslash)
zoom in: key(cmd-=)
zoom out: key(cmd--)
full screen: key(cmd-ctrl-f)
toggle sidebar: key(cmd-b)
focus editor: key(cmd-1)
focus tree: key(cmd-shift-e)

# File operations
new file: key(cmd-n)
save file: key(cmd-s)
save all: key(cmd-alt-s)
close tab: key(cmd-w)
next tab: key(cmd-shift-])
prev tab: key(cmd-shift-[)
reopen tab: key(cmd-shift-t)

# Navigation
go to line <number>:
    key(ctrl-g)
    insert("{number}")
    key(enter)

go to file: key(cmd-p)
go to symbol: key(cmd-shift-o)
go to definition: key(f12)
find references: key(shift-f12)
find all: key(cmd-shift-f)
replace all: key(cmd-shift-h)

# Build / run
build it: key(cmd-shift-b)
run task: key(cmd-shift-p)
    insert("Tasks: Run Task")
    key(enter)
run tests: key(cmd-shift-p)
    insert("Test: Run All Tests")
    key(enter)

# Multi-cursor
add cursor up: key(alt-cmd-up)
add cursor down: key(alt-cmd-down)
select word: key(cmd-d)
select all matching: key(cmd-shift-l)

# Folding
fold: key(cmd-alt-[)
unfold: key(cmd-alt-])
fold all: key(cmd-k cmd-0)
unfold all: key(cmd-k cmd-j)

# Comments
comment line: key(cmd-slash)
block comment: key(alt-shift-a)

# Format
format: key(alt-shift-f)
```

### noizy_code.talon — Language-agnostic coding shortcuts
```talon
# Active whenever any code editor is focused
tag: user.code_generic
-

# Quick inserts
new line above:
    key(up end)
    key(enter)

new line below:
    key(end enter)

duplicate line:
    key(alt-shift-down)

delete line:
    key(cmd-shift-k)

move line up:
    key(alt-up)

move line down:
    key(alt-down)

# Surround selection with common pairs
surround parens:
    insert("(")
    key(shift-end)
    insert(")")

surround square:
    insert("[")
    key(shift-end)
    insert("]")

surround curly:
    insert("{")
    key(shift-end)
    insert("}")
```

### noizy_snippets.talon — Personal code snippets
```talon
# Your personal snippet library
# Fires everywhere

snip log:
    insert("console.log()")
    key(left)

snip arrow:
    insert("() => {}")
    key(left left)

snip async:
    insert("async () => {}")
    key(left left)

snip import:
    insert("import  from ''")
    key(left left left left left left left left)

snip try:
    insert("try {\n  \n} catch (err) {\n  console.error(err)\n}")

snip tern:
    insert("condition ? trueVal : falseVal")

snip todo:
    insert("// TODO: ")

snip fixme:
    insert("// FIXME: ")
```

---

## VSCODE HOT-ROD CONFIGURATION

### settings.json additions for Cursorless
```json
{
  // ── CURSORLESS ──────────────────────────────────────────────────────
  "cursorless.wordSeparators": ["-", "_"],
  "cursorless.decorations.hatScaleFactor": 1.5,
  "cursorless.decorations.hatVerticalOffset": -15,

  // Enable extra hat colors (add these to increase available targets)
  "cursorless.hatEnablement.colors": {
    "blue": "enabled",
    "green": "enabled",
    "red": "enabled",
    "pink": "enabled",
    "yellow": "enabled",
    "userColor1": "disabled",
    "userColor2": "disabled"
  },

  // Enable hat shapes (extra disambiguation beyond color)
  "cursorless.hatEnablement.shapes": {
    "ex": "enabled",
    "fox": "enabled",
    "wing": "enabled",
    "hole": "enabled",
    "curve": "enabled",
    "eye": "enabled",
    "play": "enabled",
    "bolt": "enabled",
    "crosshairs": "disabled",
    "frame": "disabled"
  },

  // ── EDITOR (optimized for voice coding) ─────────────────────────────
  "editor.fontSize": 16,
  "editor.lineHeight": 1.8,
  "editor.wordWrap": "on",
  "editor.minimap.enabled": false,
  "editor.renderLineHighlight": "all",
  "editor.cursorBlinking": "solid",
  "editor.cursorWidth": 3,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.inlineSuggest.enabled": true,
  "editor.formatOnSave": true,

  // ── WORKBENCH ────────────────────────────────────────────────────────
  "workbench.colorTheme": "One Dark Pro",
  "workbench.activityBar.location": "bottom",
  "workbench.statusBar.visible": true,
  "workbench.editor.showTabs": "multiple",

  // ── TERMINAL ─────────────────────────────────────────────────────────
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.cursorStyle": "line",
  "terminal.integrated.scrollback": 5000
}
```

### Recommended Extensions (Full Hot-Rod Stack)

| Extension | Publisher | Why It Matters for Voice Coding |
|---|---|---|
| **Cursorless** | Cursorless | Core — the whole system |
| **Talon** | pokey | `.talon` file syntax highlighting |
| **Error Lens** | usernamehw | Inline errors — no mouse hover needed |
| **GitLens** | GitKraken | Git blame/history navigable by voice |
| **Path Intellisense** | christian-kohler | Autocomplete paths so you don't spell them |
| **Bracket Pair Colorizer** | Built-in | Visual nesting depth at a glance |
| **TODO Highlight** | wayou | TODOs become voice-targetable visual marks |
| **Indent Rainbow** | oderwat | Indentation levels visible as color bands |
| **Auto Rename Tag** | formulahendry | Renames HTML tag pairs automatically |
| **ES7+ Snippets** | dsznajder | JS/TS snippets callable from Talon |
| **Prettier** | Prettier | Format on save = one less voice command |
| **ESLint** | Microsoft | Catch errors before you hear them |
| **GitHub Copilot** | GitHub | AI suggestions you accept/reject by voice |

---

## POWER COMBOS CHEAT SHEET

### The Everyday 20

```
"take funk bat"                → select whole function
"chuck state bat"              → delete whole statement
"bring funk bat"               → pull function to cursor
"copy class bat"               → copy entire class
"clear funk bat"               → empty function body, keep signature
"extract bat"                  → extract to variable (LSP)
"rename bat"                   → rename symbol everywhere
"wrap bat with parens"         → surround with ()
"drink bat"                    → new line before token, go there
"pour bat"                     → new line after token, go there
"chuck every comment"          → delete ALL comments in file
"take every instance sun"      → select all occurrences
"sort every arg bat"           → sort function arguments alphabetically
"reverse every arg bat"        → reverse argument order
"snake bat"                    → convert to snake_case
"camel bat"                    → convert to camelCase
"swap air with bat"            → swap two tokens
"move state bat past state cap"→ move one statement after another
"clone funk bat"               → duplicate entire function
"chuck containing funk bat"    → delete the whole function containing 'b'
```

### The Refactor Session Workflow (voice-only)

```
# Find a bad function name
"define bat"                   → jump to definition
"rename bat"                   → trigger rename
[dictate new name]
[press enter]

# Extract duplicated logic
"take state air past state bat"  → select multiple statements
"extract this"                   → extract to variable/function

# Clean up arguments
"take every arg bat"             → select all args
"sort this"                      → sort them

# Delete dead code
"chuck every comment"            → remove all comments
"chuck funk bat"                 → remove unused function
```

---

## DAILY PRACTICE PROTOCOL

### The 5-Minute Warmup (run this every morning)

```
Phase 1 focus:
  1. "pre air"  "post bat"  "take cap"  "chuck drum"
  Drill the alphabet — 5 random letters, navigate to each one

Phase 2 focus:
  1. Pick any two tokens: "swap [air] with [bat]"
  2. "bring cap" somewhere useful
  3. "move drum" to a new location

Phase 3 focus:
  1. "visualize funk" — count the functions
  2. "visualize state" — notice statement boundaries
  3. "chuck state bat" — delete one cleanly
  4. "visualize nothing"

Phase 4 focus:
  1. "take air past bat" — grab a range
  2. "take sun and made" — grab two non-adjacent things

Phase 5+:
  1. Free code — use voice only for 10 minutes
  2. Note every time you reach for keyboard
  3. Find the Cursorless command for it tomorrow
```

---

## TROUBLESHOOTING QUICK REFERENCE

| Problem | Fix |
|---|---|
| Hat not appearing on right letter | The hat follows the FIRST character of the token, not the character you're thinking of |
| Two tokens, same letter | Add a color: `"blue bat"` vs `"bat"` |
| Scope not working | Say `"visualize [scope]"` to see if it's being detected |
| Talon not responding | Say `"talon wake"` or check microphone input in Talon menu |
| Command not recognized | Say `"help cursorless"` to open the in-editor cheat sheet |
| Action does wrong thing | Add `"that"` to the end — target may have shifted |
| "That" not working | You need to use a Cursorless command first — "that" references the previous Cursorless target |

---

## THE PROGRESSION AT A GLANCE

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1    pre / post / take / chuck + hat alphabet             │
│  PHASE 2    bring / move / copy / carve / swap + colors          │
│  PHASE 3    scopes: funk / state / line / arg / string + visualize│
│  PHASE 4    ranges: air past bat | lists: air and bat | this/that │
│  PHASE 5    every / next / prev / containing + instance          │
│  PHASE 6    wrap / indent / extract / rename / case / refactor   │
│  HOT ROD    custom CSV aliases + .talon macros + IDE actions      │
└──────────────────────────────────────────────────────────────────┘
```

---

## THE GOLDEN RULE

> **Only learn a new command when you feel friction.**

When you catch yourself reaching for the mouse or keyboard to do something repetitive — that's the signal. Find the Cursorless or Talon command for it. Add it to your vocabulary. Move on.

The system rewards patience. After six weeks you'll be editing faster by voice than most developers type.

---

*Built for the NOIZY stack — Talon Voice + Cursorless + VS Code Insiders*
*Companion to: NOIZY_VSCode_Build_Stack.md*
