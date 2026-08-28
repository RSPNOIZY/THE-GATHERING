# Xcode integration — Gabriel Sync Run Script

Add this as a **Build Phase → New Run Script Phase** on any Xcode target
(ideally the Gabriel iOS app target):

```sh
# Gabriel Sync — runs after build, fires the canonical sync script on GOD.
# Shell: /bin/bash
cd "/Users/m2ultra/NOIZYANTHROPIC"
if [ "${CONFIGURATION}" == "Release" ]; then
  bash ops/gabriel-to-all-brands.sh --push 2>&1
else
  bash ops/gabriel-to-all-brands.sh 2>&1   # dry-run in Debug
fi
```

**Also — add an Xcode custom scheme:**
1. Product → Scheme → Edit Scheme → New Scheme
2. Name: "Gabriel Sync (All Brands)"
3. Build target: External Build System — `/usr/bin/env bash`, args: `ops/gabriel-to-all-brands.sh --push`, working dir: `/Users/m2ultra/NOIZYANTHROPIC`

Then Cmd-B on that scheme fires the real push.
