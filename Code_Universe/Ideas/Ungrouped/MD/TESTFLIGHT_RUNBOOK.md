# LUCY iPad · TESTFLIGHT RUNBOOK

**Owner:** RSP_001 (Apple Developer account holder) + GABRIEL (CI/build assistance)
**Target:** First TestFlight build of LUCY iPad app
**Status as of 2026-04-20:** Heaven.xcodeproj exists, signing config NOT YET set
**Capability backing:** RSP confirmed Apple Developer + Creators Studio access (`reference_rsp_developer_credentials.md`)

---

## Where we are

This `mc96/Lucy-Fork/` directory contains:

- `Heaven.xcodeproj` — main Xcode project
- `Heaven/` — main app source
- `HeavenTests/` + `HeavenUITests/` — test bundles
- `Lucy/` + `LucyPersona.swift` — LUCY persona module
- `Package.swift` + `Package.resolved` — Swift package dependencies
- `scripts/` + `Docker/` — build and ops support

`Heaven.xcodeproj/project.pbxproj` currently has **no PRODUCT_BUNDLE_IDENTIFIER, no DEVELOPMENT_TEAM, no CODE_SIGN_STYLE** — the project has never been signing-configured. TestFlight needs that done first.

## RSP-ONLY STEPS (require Xcode GUI + interactive signing)

These cannot be automated by GABRIEL — Apple's signing flow requires Rob's hands in Xcode at least once.

### Step 1 · Open in Xcode and configure signing

1. `open /Users/m2ultra/NOIZYANTHROPIC/mc96/Lucy-Fork/Heaven.xcodeproj`
2. Select the `Heaven` target → **Signing & Capabilities** tab
3. ✅ Check "Automatically manage signing"
4. **Team:** select your Apple Developer Team from the dropdown (the one tied to `rsp@noizy.ai` or your developer Apple ID)
5. **Bundle Identifier:** suggested `ai.noizy.lucy.heaven` (matches the empire's domain doctrine; reverse-DNS form Apple expects)
6. Xcode will auto-create a provisioning profile + signing certificate

### Step 2 · Configure for distribution

1. Set **iOS Deployment Target** ≥ 16.0 (matches LUCY's required APIs)
2. Add capabilities you'll need:
   - **Background Modes** → Audio, Voice over IP (LUCY voice mode)
   - **Push Notifications** (DAZEFLOW alerts via APNs)
   - **iCloud → CloudKit** (optional, for cross-device LUCY state)
   - **Sign in with Apple** (consent kernel onboarding)

### Step 3 · App Store Connect record

1. Go to https://appstoreconnect.apple.com → My Apps → **+ New App**
2. Platform: iOS
3. Name: **LUCY** (or "Lucy by NOIZY.ai" if "LUCY" is taken)
4. Primary Language: English (Canada) or English (US)
5. Bundle ID: select the one created in Step 1
6. SKU: `LUCY-IPAD-001`
7. User Access: Full

### Step 4 · Create the archive

In Xcode:

1. Select destination: **Any iOS Device (arm64)** (not a simulator)
2. **Product → Archive**
3. Wait for archive to complete (~2-5 min)
4. Organizer window opens automatically with the archive

### Step 5 · Upload to App Store Connect

In Organizer:

1. Select the archive → **Distribute App**
2. App Store Connect → Upload
3. Sign with automatic signing (the cert/profile from Step 1)
4. Upload — Xcode handles the rest (~5-10 min)

### Step 6 · TestFlight

In App Store Connect:

1. My Apps → LUCY → TestFlight tab
2. Wait for processing (~10-30 min after upload)
3. Add yourself as **Internal Tester** (no review needed)
4. Install TestFlight on your iPad → install LUCY beta
5. **First non-RSP creator** can be added as External Tester (requires brief Apple review, ~24-48h)

---

## GABRIEL-AUTOMATABLE STEPS (after Step 1 is done)

Once Rob completes Step 1 (Xcode signing setup), GABRIEL can automate the rest via `xcodebuild` + `altool`. Save these as `scripts/testflight-ship.sh`:

```bash
#!/bin/bash
set -e
PROJECT="/Users/m2ultra/NOIZYANTHROPIC/mc96/Lucy-Fork/Heaven.xcodeproj"
SCHEME="Heaven"
ARCHIVE_PATH="/tmp/Heaven.xcarchive"
EXPORT_PATH="/tmp/Heaven-export"
EXPORT_OPTIONS="$(dirname $0)/ExportOptions.plist"

# 1. Clean
xcodebuild -project "$PROJECT" -scheme "$SCHEME" clean

# 2. Archive
xcodebuild -project "$PROJECT" -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  archive

# 3. Export IPA
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS"

# 4. Upload to App Store Connect via altool
xcrun altool --upload-app \
  --type ios \
  --file "$EXPORT_PATH/Heaven.ipa" \
  --apiKey "$ASC_API_KEY_ID" \
  --apiIssuer "$ASC_API_KEY_ISSUER"

echo "✅ Uploaded. Check App Store Connect → TestFlight tab in 10-30 min."
```

**ASC_API_KEY_ID + ASC_API_KEY_ISSUER** come from App Store Connect → Users and Access → Keys → App Store Connect API. RSP creates the key once, GABRIEL stores in `wrangler secret`-equivalent or local `.env`.

`ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key><string>app-store</string>
    <key>uploadSymbols</key><true/>
    <key>uploadBitcode</key><false/>
    <key>destination</key><string>upload</string>
    <key>signingStyle</key><string>automatic</string>
</dict>
</plist>
```

## Constitutional alignment

LUCY iPad ships under the same doctrine as everything else:

- **Article II (Consent is Structural)** → Sign in with Apple becomes the consent-kernel onboarding surface for iPad-bound creators
- **Article III (Provenance Mandatory)** → every voice capture on LUCY iPad gets a C2PA manifest stamped in-app before it leaves the device
- **Article V (Revocation Real)** → Kill Switch button in LUCY's settings revokes any active session, propagates to HEAVEN within 1 hour SLA
- **Family Covenant** → LUCY operates with Moira voice, DAZEFLOW law, archive-first FLOW
- **9 Never Clauses** → all checked client-side before any voice or token leaves the iPad

## Vol III milestone

When the **first non-RSP creator** installs LUCY via TestFlight and issues their first consent token through the app, that is the moment Vol III opens.

## Companion

- `reference_rsp_developer_credentials.md` — the capability backing
- `apps/GABRIEL/prompts/GABRIEL_MASTER.md` — LUCY's voice + role definition
- `.claude/rules/family-covenant.md` — LUCY's LIFELUV + FLOW commitments
- `.claude/rules/consent-kernel.md` — the doctrine LUCY enforces
