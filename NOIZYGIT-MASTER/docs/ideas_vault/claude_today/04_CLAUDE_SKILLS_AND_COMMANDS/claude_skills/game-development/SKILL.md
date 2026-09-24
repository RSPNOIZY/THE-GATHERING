---
name: game-development
description: "Build, launch and inspect a game or game mod from the editor — read its log with errors mapped to workspace files, capture a frame to actually look at it, and drive it over RCON or keystrokes. Use instead of asking the user to run the game and describe what happened. Triggers on: run the game, launch the mod, why did it crash, read the game log, is the mod loading, test my mod, Minecraft/Fabric/NeoForge, FiveM, Balatro/SMODS, Godot, Unity, Unreal, Stride, Ren'Py, love2d."
allowed-tools: Bash(node *skills/game-development/game.mjs:*), Bash(node *skills/game-development/bytes.mjs:*), Bash(node *skills/game-development/ide.mjs:*), Bash(node *skills/game-development/archive.mjs:*)
---

# game-development

Closes the edit → build → run → **look at it** → fix loop for games, so you stop
asking the user to launch the thing and tell you what the console said.

```bash
node <this-skill-dir>/game.mjs <command> [options]
```

`<this-skill-dir>` is the folder you just read this file from. Use that path
literally rather than guessing at a home directory.

## The loop

```bash
node <dir>/game.mjs detect     # what kind of project is this?
node <dir>/game.mjs init       # write .codegpt-game.json (edit it, commit it)
node <dir>/game.mjs run        # build → install → launch → wait for ready → report
# … you edit code …
node <dir>/game.mjs run --restart
node <dir>/game.mjs logs --errors   # only what is NEW since the last call
```

`run` is the one that matters. It builds, copies the artifact where the game
loads mods from, launches detached, waits for the manifest's `ready` pattern,
and then prints the errors it found — grouped, and **mapped to files in this
workspace**:

```
ERRORS
  java.lang.NullPointerException: Cannot invoke "com.example.Thing.get()" …
  	at com.example.MyMod.onInitialize(MyMod.java:42)
  → workspace: src/main/java/com/example/MyMod.java:42
```

That arrow is the point. `MyMod.java:42` is not a file you can open; the mapped
path is.

## Commands

| command | does |
|---|---|
| `detect` | identify the engine from files on disk |
| `init [--preset <name>]` | write `.codegpt-game.json` from a preset |
| `run [--restart] [--no-build] [--timeout s] [--all]` | the whole loop; exits non-zero if the game died |
| `logs [--errors] [--grep re] [--lines n] [--reset]` | **new** output since last call |
| `doctor` | check the manifest against this machine before running |
| `install` | just the copy-into-the-game step |
| `shot [--show]` | capture a frame — read it yourself; `--show` also shows the user |
| `rcon "<cmd>"` / `reload` | Source RCON: Minecraft servers, FiveM |
| `key "<keys>"` / `type "<text>"` | send input to the game window |
| `logs --wait "<re>" [--timeout s]` | block until that line appears |
| `status` / `stop` | sessions |

Add `--session <id>` to run two things at once (a server and a client are two
sessions). `--dir <path>` if the project is not the cwd.

### `doctor` first, when something will not start

```
  ok    all ${VARS} resolve
  ok    launch.cmd ./gradlew
  FAIL  install target parent /home/me/.balatro/Mods — does not exist
```

It checks the things that fail *after* a long build — unset vars, a launch
command that is not on PATH, an install target whose parent is missing, an
unreachable RCON port. A missing log file is reported but not a failure: most
are written by the game at runtime.

### `--wait` instead of sleep-and-hope

`reload` then guessing is unreliable — sometimes the resource has not restarted
yet, sometimes it restarted and already failed. Wait for the line that proves it:

```bash
node <dir>/game.mjs reload
node <dir>/game.mjs logs --wait "Started resource my-res" --timeout 20
```

It exits non-zero if the line never came, and tells you if errors appeared while
waiting.

## The manifest

Everything engine-specific lives in `.codegpt-game.json`, so this script never
needs to know what Balatro is:

```json
{
  "name": "my-mod",
  "engine": "fabric",
  "build":  { "cmd": "./gradlew build" },
  "install": [{ "from": "build/libs/*.jar", "to": "${MC_DIR}/mods" }],
  "launch": { "cmd": "./gradlew", "args": ["runClient"] },
  "log":    { "format": "java", "stdout": true, "paths": ["run/logs/latest.log"] },
  "ready":  "Sound engine started",
  "window": "Minecraft",
  "rcon":   { "host": "127.0.0.1", "port": 25575, "password": "${RCON_PASSWORD}" },
  "reload": "restart my-mod",
  "sourceRoots": ["src/main/java"],
  "vars":   { "MC_DIR": "/home/me/.minecraft" }
}
```

`${VARS}` resolve from `vars` first, then the environment. **Machine-specific
paths belong in `vars` or the environment, never hardcoded** — the manifest is
meant to be committed, and a teammate's Balatro is not at your path.

`init` leaves `${…}` placeholders in for anything it cannot know. `run` refuses
to start until they are filled, and names them.

`log.paths` accepts globs, and that matters more than it sounds: **Minecraft
writes the useful post-mortem to `crash-reports/crash-<timestamp>.txt`, not to
`latest.log`**, and Unity/Unreal rotate. `"crash-reports/*.txt"` resolves to the
newest match on every read, so a file that did not exist at launch is still
picked up.

`engines.md`, beside this file, has the per-engine recipes (what to put in
`launch`, where each engine writes its log, what `ready` looks like) for Fabric,
NeoForge, FiveM, Balatro/SMODS, love2d, Godot, Unity, Unreal, Stride and Ren'Py.
Read it when you meet a target you have not set up before.

## Archives: `archive.mjs`

`.jar`, `.love`, `.apk` and many `.pak` are ZIP. Reading another mod's source is
one of the most common things in modding, and it does not require unzipping
anything to disk:

```bash
node <dir>/archive.mjs find other-mod.jar "Registry.register" --in "*.java"
node <dir>/archive.mjs list other-mod.jar --filter "*.json"
node <dir>/archive.mjs cat other-mod.jar RubyBlock.java     # basename works
node <dir>/archive.mjs extract other-mod.jar --filter "*.png" --to ./out
```

**`find` is usually the question you actually have.** It greps every entry at
once — "which of these 400 classes registers the block" is one call. `list` on a
big archive prints the busiest directories so you can see its shape instead of
scrolling an alphabetical list.

A pattern with no `/` matches at any depth (`*.json` finds
`data/mod/recipes/x.json`); a pattern with a `/` is anchored. Without `--in`,
`find` only scans source-like extensions — pass `--in "*"` to search everything,
including class-file constant pools.

Ren'Py `.rpa`, Unreal `.pak` and Quake `.pak` are **not** ZIP; `archive.mjs`
says so and points you at `bytes.mjs --struct`.

## Binary files: `bytes.mjs`

Modding runs into binary constantly — ROMs, save files, asset archives
(`.rpa`/`.pak`/`.love`), and signature scanning where offsets move every patch.

```bash
node <dir>/bytes.mjs <file> --struct "magic:char[8],ver:u32le,index:u64le"
node <dir>/bytes.mjs <file> --find "48 8B 05 ?? ?? ?? ??" [--mask xxx????]
node <dir>/bytes.mjs <file> --find-text "RPA-3.2"
node <dir>/bytes.mjs save1.bin --diff save2.bin
node <dir>/bytes.mjs <file> --strings [--min 6]
node <dir>/bytes.mjs <file> --at 0x100 --len 128
node <dir>/bytes.mjs <file> --patch "0x1234=90 90"     # keeps a .bak
```

**Prefer every other verb over the raw dump.** A kilobyte of hex is a kilobyte
of the lowest-density text there is and it is almost never the answer; `--len`
is capped at 1024 for that reason. The question "what is in this file" is really
`--strings` or `--struct`; "where is X" is `--find`; "which byte holds the
score" is `--diff` between two saves taken either side of the change.

`--patch` writes a `.bak` on first touch. Modding is destructive by nature and
someone's only copy of a ROM is not an acceptable thing to lose to a typo.

## Looking at the game

`shot` captures a frame, and **you can read the PNG** — a read of an image
returns the picture, not a placeholder.

```bash
node <dir>/game.mjs shot            # capture, then read the file to look at it
node <dir>/game.mjs shot --show     # also put it on the user's screen, beside the code
```

If a read comes back as `[binary file: png …]` instead, this host does not
support image reads — say so and ask the user what they see rather than
guessing. Never describe a frame you did not actually receive; a confident
description of a screen you never saw is the worst failure this skill has.

The log is still the cheaper answer and still the first move: it settles most
"why is it broken" questions for a few hundred tokens, where a frame costs
tens of thousands. Reach for `shot` when the question is genuinely visual — a
sprite in the wrong place, a UI element that does not react, layout that looks
wrong — and for `logs` otherwise.

`--show` is for the human: it opens the frame in a panel next to the code so you
and the user are looking at the same pixels while you talk about them.

## Putting things in front of the user: `ide.mjs`

The editor is reachable from a script — the extension host runs an HTTP driver
on loopback (54113–54500) and `ide.mjs` finds it.

```bash
node <dir>/ide.mjs open src/main/java/com/example/MyMod.java:42   # open + reveal
node <dir>/ide.mjs show frame.png                                 # panel beside editor
node <dir>/ide.mjs report "…"                                     # new untitled editor
node <dir>/ide.mjs say "mod reloaded"                             # toast
```

`game.mjs run --open` / `logs --open` uses this automatically to jump the user
to the first mapped error, so you are both looking at the same line before you
start explaining it.

**It degrades to nothing outside the VS Code host.** The standalone CLI,
JetBrains and Visual Studio have no driver; every command says so and does
nothing. Never make a step depend on a panel having opened.

## Interpreting the report

- `PROCESS EXITED (code N)` — the game died. If it says *"it DID reach ready
  first"*, startup was fine and the failure is in play, not in loading.
- `BUILD FAILED` — nothing was launched and nothing was installed. The build
  output is the whole answer; do not go looking at the game.
- `0 error(s)` with the mod missing in-game usually means the artifact never got
  copied (check `install`) or the loader silently skipped it (check the loader's
  own log path in `log.paths`, not just stdout).
- `(ambiguous: N matches)` on a mapped path — two files share that basename.
  Narrow `sourceRoots` in the manifest rather than guessing which one.
- `still running; ready pattern not seen` — either the game is slow (raise
  `--timeout`) or your `ready` regex does not match this version's banner. Check
  with `logs --all` before assuming the game hung.

## Gotchas found by using this

- **`logs` returns only what is new.** That is deliberate — a 40k-line log does
  not belong in the context window. Call it again after an action and you get
  just that action's output. `--reset` re-reads from the top when you need it.
- **Launch and ready are not the same event, and neither is "the mod loaded".**
  Most loaders print their own banner well after the engine's. Match `ready` on
  the loader's line, not the engine's, when you care about the mod.
- **A detached game survives this script.** Every command is a fresh process;
  the game keeps running between them. Use `stop` when you are done, or you will
  leave a game running on the user's machine.
- **stdin is not reachable.** Once launched detached, you cannot type into the
  process from a later call. Use `rcon` for servers, `key`/`type` for a window.
- **Input injection controls the user's actual desktop.** `key`/`type` activates
  the game window and sends real keystrokes. Do not use it to explore; use it to
  reach a specific state you have a reason to test, and say what you are doing.
- **On WSL, the game runs on the Windows host.** Screenshots go through
  `powershell.exe`; a Linux screenshot tool would capture an X server the game
  never drew to. This is handled, but it is why `shot` may need the game window
  focused.
- **Check that you actually got pixels.** A read that returns
  `[binary file: png …]` means this host has no image path — that is a real
  answer, not a frame. Nothing errors, so the only way to avoid describing a
  screen you never saw is to notice the placeholder.
- **Never claim the game works because the build passed.** A green `./gradlew
  build` proves compilation, not that the mod loads. Launch it and read the log.
