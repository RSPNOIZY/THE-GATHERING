---
name: browser-automation
description: "Load a web page in a headless browser and report what actually happened — console errors, failed network requests, page title, and optional DOM assertions or a screenshot. Use to verify your own web work instead of asking the user to look at the screen. Triggers on: check the page, does it render, verify the UI, QA the app, is it broken, console errors, did my change work."
allowed-tools: Bash(node *skills/browser-automation/browser.mjs:*)
---

# browser-automation

Closes the edit → run → **look at it** → fix loop that otherwise requires the
user to describe what is on their screen.

## Usage

```bash
node <this-skill-dir>/browser.mjs <url> [options]
```

`<this-skill-dir>` is the folder you just read this file from — `browser.mjs`
sits beside it. Use that path literally rather than guessing at a home
directory.

| option | meaning |
|---|---|
| `--snapshot`        | list every interactive element with a clickable ref (add `--full` for the whole accessibility tree) |
| `--wait <selector>` | block until the selector appears (default: DOM ready) |
| `--eval <js>`       | run an expression in the page, print the JSON result |
| `--script <file>`   | drive a sequence — see **Scripting** below |
| `--screenshot <p>`  | write a PNG — read it afterwards to look at it |
| `--timeout <ms>`    | navigation timeout, default 30000 |
| `--session <id>`    | keep ONE page alive across calls — see **Sessions** below |
| `--close`           | with `--session <id>`, tear that session's browser down |

## Driving by ref, not by selector

`--snapshot` returns the page's interactive elements, each with a ref:

```
@e5 button "Audit my code"
@e9 button "Select your model" [haspopup=menu]
@e10 button "Manual" [haspopup=menu]
@e11 button "Send" [disabled]
```

Click `@e10` and you get what the page says is there — no selector to author
from a DOM you cannot see. This matters most for **icon-only buttons**, which
have no accessible name at all: `getByRole('button', {name: …})` cannot find
them, and they show up here as `@e1 button [haspopup=dialog]`.

A ref is stamped into the page, so it dies on navigation or a re-render.
**Re-snapshot after anything that changes the page** — the refs renumber, and a
stale one matches nothing.

`--full` returns the accessibility tree instead (headings, text, links). Use
refs to *act*, `--full` to *read*.

## Scripting a sequence

`--script` runs a file that default-exports `async (page, ui) => result`.

**`page` is a Playwright `Page`** (the driver is patchright, a Playwright fork),
so use the Playwright API — `page.locator`, `page.getByRole`, `page.getByText`,
`page.waitForFunction`, `page.evaluate`. It is NOT Puppeteer: `page.$` and
friends mostly work, but `getByRole` and `locator` do not exist there, so code
written against Puppeteer will fail in confusing ways.

**`ui` is the ref helper**, and is usually the shorter path:

| call | does |
|---|---|
| `await ui.snapshot()` | the ref listing above, as a string |
| `await ui.snapshot({full: true})` | the accessibility tree instead |
| `await ui.click('@e7')` | click that element |
| `await ui.fill('@e3', 'text')` | fill an input |
| `await ui.text('@e5')` | its inner text |
| `ui.ref('@e5')` | the raw locator, for anything else |

Whatever you return is printed as JSON. The runner owns the browser, the
console/network capture and the teardown; the script only drives and asserts.

```js
// qa.mjs  —  node <this-skill-dir>/browser.mjs http://localhost:3000 --script ./qa.mjs
export default async function run(page, ui) {
  // Look at what is there before deciding what to click.
  const before = await ui.snapshot()
  const signIn = before.match(/@(e\d+) button "Sign in"/)?.[1]
  if (!signIn) return { error: 'no sign-in button', snapshot: before }

  await ui.click(signIn)
  await page.waitForTimeout(500)

  // The page changed, so the old refs are gone — snapshot again.
  const after = await ui.snapshot()
  return { opened: after.includes('textbox'), after }
}
```

Navigation to the URL argument has already happened before your function runs.
You can navigate further with `page.goto(...)`.

## Read the text before the pixels

`--screenshot` writes a PNG and **you can read it** — a read of an image returns
the picture. If it comes back as `[binary file: png …]` this host has no image
path; say so rather than guessing at what rendered.

Even so, reach for text first. It is not just cheaper — it is more precise:

- `--snapshot` — every interactive element, with refs
- `--snapshot --full` — the accessibility tree: headings, text, links
- `--eval "…"` — ask the DOM a direct question
- the console/network report, which catches most breakage for almost nothing

A screenshot costs tens of thousands of tokens and answers "does this look
right", which is a narrower question than it seems. Use it for layout and visual
regressions, and use the tree for everything about structure, content and state.

## Interpreting the report

- `console.error` / uncaught exceptions → almost always a real bug.
- `requests failed` → a 404 on a JS chunk usually means a stale build is being
  served; a 500 means the server, not the page.
- `title` empty and `bodyChars` near zero → the app did not mount at all. Check
  the console section first, not the DOM.

## Examples

```bash
# Did my change render?
node <this-skill-dir>/browser.mjs http://localhost:3000

# Assert something specific about the DOM
node <this-skill-dir>/browser.mjs http://localhost:3000 \
  --eval "document.querySelectorAll('[data-testid=row]').length"

# Wait for a late-mounting element before judging the page
node <this-skill-dir>/browser.mjs http://localhost:3000 --wait "[data-testid=grid]"
```

## Gotchas found by using this

- **Keep the trailing slash** on a path-prefixed app. `http://host/app` and
  `http://host/app/` resolve relative asset URLs differently, and without it a
  page can return HTTP 200 with `bodyChars 0` and never mount. An app that 200s
  but renders nothing is usually this, not a crash.
- **A failing request is not automatically a bug.** Apps routinely probe for
  optional local services that are simply not running. Check whether the
  dependency is meant to exist before reporting it.
- **Never assert on text your own input put on the page.** A check for
  "console error" matches the prompt you just typed into the app as readily as
  the thing you were looking for, and the test passes while proving nothing.
  Match only strings that can come from the system under test.
- **Wait for content, not for a fixed delay.** A client-rendered app that is
  merely slow is indistinguishable from one that is broken unless you actually
  wait for something to appear.
- **Prefer a ref over a selector.** A selector that silently matches nothing and
  an element that is genuinely absent produce the same failure, and you cannot
  tell them apart without looking. `--snapshot` first, then act on what it
  listed. When a check still says something is missing, use `--snapshot --full`
  to read the tree before reporting it, and screenshot if the question is
  genuinely visual.
- Third-party analytics failures are filtered out; they are noise, not signal.

## One run, one browser (the default)

By default each invocation launches a browser, does the work, and closes it.
Cookies, logins and page state do **not** survive to the next invocation, so a
short sequence should happen inside a single `--script` run rather than across
several calls. This is the right default: most QA is "load this, tell me what
broke."

## Sessions — keep one page alive across calls

When you need to *think between steps* — drive a form, read the result, decide
the next action, drive again — a single `--script` can't help, because you don't
know step 3 until you've seen step 2. Use `--session <id>`: the browser stays
alive between separate invocations and every call reconnects to the **same page**
it left open.

```bash
# Step 1: open the app in a named session, set something up
node <this-skill-dir>/browser.mjs http://localhost:3000 --session qa1 --snapshot

# Step 2: NO url — act on the page the session already has open
node <this-skill-dir>/browser.mjs --session qa1 --eval "document.querySelector('#total').innerText"

# Step 3: re-navigate within the same session if you want, or keep acting
node <this-skill-dir>/browser.mjs --session qa1 --script ./next-step.mjs

# When done — always tear it down, or the browser stays running
node <this-skill-dir>/browser.mjs --session qa1 --close
```

Rules:
- **Omit the url** on follow-up calls to act on the current page; **pass a url**
  to navigate the session's page somewhere new.
- Refs from `--snapshot` still die on navigation/re-render — re-snapshot after
  anything that changes the page, same as one-shot mode.
- **Always `--close` when finished.** The browser is detached and outlives the
  call by design; without `--close` it keeps running until the machine reboots.
- Sessions are headless and use a throwaway profile per id under
  `~/.codegpt/ab-sessions/` — never the user's real browser or cookies.

## Notes

- Resolves `patchright` from an installed CodeGPT extension, then a dev
  checkout, then a global copy — so it normally needs no install of its own. If
  none is found it says what it looked for.
- Headless. It never touches the user's real browser profile or cookies.
