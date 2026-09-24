# Per-engine recipes

What to put in `.codegpt-game.json` for each target. `init --preset <name>` writes
the skeleton; this file is the reference for filling in the `${VARS}` and for
targets with no preset.

Only the manifest changes between these — every command in `game.mjs` works the
same way regardless of engine. If you meet a target that is not here, copy the
closest one and change the coordinates.

---

## fabric / neoforge / forge (Minecraft, Java)

```json
{
  "build":  { "cmd": "./gradlew build" },
  "launch": { "cmd": "./gradlew", "args": ["runClient"] },
  "log":    { "format": "java", "stdout": true, "paths": ["run/logs/latest.log"] },
  "ready":  "Sound engine started",
  "window": "Minecraft",
  "sourceRoots": ["src/main/java", "src/main/resources"]
}
```

- Add `"crash-reports/*.txt"` to `log.paths`. A hard crash writes its real
  explanation there, not to `latest.log`, and the glob resolves to the newest
  file on every read.
- `runClient` builds and launches in one step, so `build` is redundant unless you
  want the compile error *before* a client starts. Keeping both is fine — the
  build is cached.
- For a **server**, use `runServer`, set `ready` to `Done \\(\\d`, and add
  `rcon` (enable it in `server.properties`: `enable-rcon=true`,
  `rcon.password=…`, `rcon.port=25575`). Then `rcon "reload"` beats a restart.
- The version matrix is the usual source of pain: `fabric-loom`, `yarn` mappings
  and `fabric-api` must agree with the Minecraft version. When the build fails on
  mappings, that is a version problem, not a code problem.
- Two sessions is the normal setup for multiplayer work:
  `run --session server` and `run --session client`.

## fivem (Cfx.re, Lua)

```json
{
  "install": [{ "from": ".", "to": "${FIVEM_SERVER}/resources/${NAME}" }],
  "launch":  { "cmd": "${FIVEM_SERVER}/run.sh", "args": ["+exec", "server.cfg"], "cwd": "${FIVEM_SERVER}" },
  "log":     { "format": "lua", "stdout": true },
  "ready":   "Started resource",
  "rcon":    { "host": "127.0.0.1", "port": 30120, "password": "${RCON_PASSWORD}" },
  "reload":  "restart ${NAME}",
  "sourceRoots": ["."]
}
```

- `install` → `reload` → `logs --wait "Started resource ${NAME}"` is the reliable
  inner loop; without the wait you are guessing whether the restart took.
- A resource is not built, it is copied. `install` then `reload` is the whole
  inner loop — **you almost never need to restart the server**, which is the
  single biggest time saver here.
- `rcon.password` must match `rcon_password` in `server.cfg`.
- The client (GTA V) is a separate program you cannot drive; `key`/`type` work
  against its window if it is focused, but server-side logic should be tested
  server-side.
- Framework matters for where the errors come from: ESX (`xPlayer`), QBCore
  (`QBCore.Functions.GetPlayer`), QBox. A nil player object is the most common
  runtime error and it is almost always a timing problem — the resource started
  before the framework did.

## balatro (Steamodded / SMODS / Lovely, Lua)

```json
{
  "install": [{ "from": ".", "to": "${BALATRO_MODS}/${NAME}" }],
  "launch":  { "cmd": "${BALATRO_EXE}" },
  "log":     { "format": "lua", "stdout": true, "paths": ["${LOVELY_LOG}"] },
  "ready":   "SMODS.*loaded|LOVELY.*injected",
  "window":  "Balatro",
  "sourceRoots": ["."]
}
```

- Typical paths — set these in `vars`:
  - Windows: `%APPDATA%/Balatro/Mods`, log under `%APPDATA%/Balatro/lovely/log/`
  - macOS: `~/Library/Application Support/Balatro/Mods`
  - Linux/Proton: inside the Proton prefix, under `pfx/drive_c/users/steamuser/AppData/Roaming/Balatro/Mods`
- **Lovely's log is the one that matters**, not stdout — patch failures are
  reported there and nowhere else. If a `.lovely.toml` patch silently does
  nothing, that log says why.
- love2d prints Lua errors to stdout on Linux/macOS but not usefully on Windows,
  which is why `paths` carries the real log.
- The game source is Lua inside the love archive; SMODS docs are the API surface.
  Expect to read both — see the modding framework's own docs, not the game's.

## love2d (plain)

```json
{
  "launch": { "cmd": "love", "args": ["."] },
  "log":    { "format": "lua", "stdout": true },
  "sourceRoots": ["."]
}
```

Errors go to stdout; the blue error screen is also worth a `shot` because it
carries the traceback the log sometimes truncates.

## godot

```json
{
  "launch": { "cmd": "godot", "args": ["--path", "."] },
  "log":    { "format": "godot", "stdout": true },
  "ready":  "Godot Engine v",
  "sourceRoots": ["."]
}
```

- `--headless` for tests that need no window; keep the window when the question
  is visual.
- GDScript runtime errors print as `SCRIPT ERROR:` with `res://` paths — those
  map cleanly to workspace files.
- `--quit-after N` is useful for a smoke test that must not hang.

## unity

```json
{
  "launch": { "cmd": "${UNITY_EXE}", "args": ["-projectPath", "."] },
  "log":    { "format": "unity", "paths": ["${UNITY_LOG}"] },
  "sourceRoots": ["Assets"]
}
```

- **`Editor.log` / `Player.log` is the signal; stdout is noise.** Defaults:
  - Windows `%LOCALAPPDATA%/Unity/Editor/Editor.log`
  - macOS `~/Library/Logs/Unity/Editor.log`
  - Linux `~/.config/unity3d/Editor.log`
- For CI-style runs: `-batchmode -quit -logFile <path>` and read that file.
- A build in the Editor does not mean the player builds. Compile errors appear in
  the log with `Assets/…cs(12,34): error CS….`

## unreal

```json
{
  "launch": { "cmd": "${UE_EDITOR}", "args": ["${PROJECT}.uproject"] },
  "log":    { "format": "unreal", "paths": ["Saved/Logs/${NAME}.log"] },
  "sourceRoots": ["Source"]
}
```

- `Saved/Logs/` is authoritative; the editor's on-screen console is a filtered
  view of it.
- `-log` forces a console window, `-nullrhi` runs without rendering for smoke
  tests, `-ExecCmds="…"` runs console commands at startup — the closest thing to
  an RCON here.

## stride (C#)

```json
{
  "build":  { "cmd": "dotnet build" },
  "launch": { "cmd": "dotnet", "args": ["run"] },
  "log":    { "format": "dotnet", "stdout": true },
  "sourceRoots": ["."]
}
```

- .NET exceptions carry `in /abs/path/File.cs:line 42`, which maps exactly.
- Asset compilation is a separate step from code compilation and fails
  differently: a broken `.sdpkg`/asset reference shows up as an asset-compiler
  error, not a C# one.
- Engine source for a given version is not the same as `main` — check the tag
  matching your package version before reading upstream code.

## renpy

```json
{
  "launch": { "cmd": "${RENPY_SDK}/renpy.sh", "args": ["."] },
  "log":    { "format": "python", "stdout": true, "paths": ["log.txt"] },
  "sourceRoots": ["game"]
}
```

- `log.txt` in the project root holds the traceback; `errors.txt` holds lint and
  compile errors and is written *instead of* launching when the script is broken.
- Python tracebacks map through `File "game/script.rpy", line 12`.

## generic

Anything else: set `launch.cmd`, point `log.paths` at whatever file the thing
writes, set `sourceRoots` so paths resolve, and `ready` to a line that means it
is up. That is the whole contract — `format: "generic"` still finds
`ERROR`/`Exception`/`path:line`.
