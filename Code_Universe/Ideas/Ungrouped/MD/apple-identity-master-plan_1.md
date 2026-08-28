# 🍎 APPLE IDENTITY MASTER PLAN

## THE CORE: rsplowman@icloud.com + Passkeys

Everything flows through Apple. One identity. Zero passwords.

---

## TIER 1: INFRASTRUCTURE (Business Critical)

| Service | Login | Auth Method | Status |
|---------|-------|-------------|--------|
| **Apple ID** | rsplowman@icloud.com | Face ID / Touch ID | ✅ MASTER |
| **iCloud Keychain** | Automatic | Passkeys | ✅ VAULT |
| **Cloudflare** | rsplowman@icloud.com | Sign in with Apple | 🔄 IN PROGRESS |
| **GoDaddy** | rsplowman@icloud.com | Sign in with Apple | ⏳ TODO |
| **Microsoft 365** | rsplowman@icloud.com | Passkey | ⏳ TODO |

---

## TIER 2: BUSINESS SERVICES

| Service | Login | Auth Method |
|---------|-------|-------------|
| **GitHub** | rsplowman@icloud.com | Sign in with Apple |
| **Vercel** | rsplowman@icloud.com | Sign in with Apple |
| **Stripe** | rsplowman@icloud.com | Passkey |
| **Banking** | rsplowman@icloud.com | Passkey |

---

## TIER 3: COMMUNICATION

| Service | Login | Auth Method |
|---------|-------|-------------|
| **iMessage** | rsplowman@icloud.com | Native |
| **FaceTime** | rsplowman@icloud.com | Native |
| **Email** | @fishmusicinc.com | M365 via Passkey |

---

## THE DOMAIN STRUCTURE

```
fishmusicinc.com (PRIMARY BUSINESS)
├── Registrar: GoDaddy → Apple Sign-In
├── DNS: Cloudflare → Apple Sign-In
├── Email: Microsoft 365 → Passkey
├── Website: Cloudflare Pages (free)
└── SSL: Cloudflare (free, automatic)
```

---

## SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────┐
│           🍎 APPLE ID                    │
│        rsplowman@icloud.com             │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │     FACE ID / TOUCH ID          │    │
│  │     (Biometric Master Key)      │    │
│  └─────────────────────────────────┘    │
│                  │                       │
│  ┌───────────────┼───────────────┐      │
│  ▼               ▼               ▼      │
│ PASSKEYS    SIGN IN WITH    iCLOUD      │
│             APPLE           KEYCHAIN    │
│  │               │               │      │
│  ▼               ▼               ▼      │
│ M365      Cloudflare      Backup        │
│ Stripe    GoDaddy         Passwords     │
│ Banking   GitHub                        │
└─────────────────────────────────────────┘
```

---

## DEVICES (All Synced)

| Device | Role |
|--------|------|
| iPhone | Primary auth (Face ID) |
| iPad | Secondary auth |
| Mac | Workstation |
| Apple Watch | Backup auth / Unlock |

---

## RECOVERY PLAN

| Scenario | Recovery Method |
|----------|-----------------|
| Lost iPhone | iPad / Mac / Apple Watch |
| Lost all devices | Recovery Key + Trusted Contact |
| Account locked | Apple Support + ID verification |

### Setup Recovery:
1. **Recovery Key**: Generate & store in safe
2. **Trusted Contact**: Add family member
3. **Legacy Contact**: For worst case

---

## KILL LIST (DELETE THESE)

| Account | Email | Action |
|---------|-------|--------|
| Cloudflare | rsplowman@gmail.com | ✅ DELETED |
| Cloudflare | rsp@noizyfish.com | DELETE |
| Cloudflare | rsplowman@outlook.com | DELETE |
| GoDaddy | Old logins | DELETE after transfer |
| Any @gmail.com logins | All services | MIGRATE → iCloud |
| Any @outlook.com logins | All services | MIGRATE → iCloud |

---

## DOMAINS - FINAL STATE

| Domain | Status | Action |
|--------|--------|--------|
| fishmusicinc.com | ✅ KEEP | Primary business |
| noizylab.ca | ✅ DUMPED | Gone |
| noizfish.com | 🗑️ DUMP | Let expire |
| Any others | AUDIT | Keep or dump |

---

## COST OPTIMIZATION

| Before | After |
|--------|-------|
| Multiple GoDaddy services | Domain only (~$20/yr) |
| Multiple DNS providers | Cloudflare FREE |
| Multiple email services | M365 only |
| Multiple SSL certs | Cloudflare FREE |
| Multiple accounts everywhere | ONE Apple ID |

---

## IMPLEMENTATION ORDER

### Phase 1: NUKE (Today)
- [ ] Delete rogue Cloudflare accounts
- [ ] Cancel GoDaddy services
- [ ] Dump unwanted domains

### Phase 2: CONSOLIDATE (Today)
- [ ] GoDaddy → Apple Sign-In
- [ ] Cloudflare → Apple Sign-In (done)
- [ ] Move fishmusicinc.com to Cloudflare DNS

### Phase 3: SECURE (Today)
- [ ] Set up M365 with Passkey
- [ ] Generate Apple Recovery Key
- [ ] Add Trusted Contact

### Phase 4: REBUILD (Today)
- [ ] Add fishmusicinc.com to Cloudflare
- [ ] Configure M365 DNS records
- [ ] Test email

---

## FINAL ARCHITECTURE

```
🍎 rsplowman@icloud.com
│
├── 🔐 Authentication
│   ├── Face ID (primary)
│   ├── Touch ID (backup)
│   ├── Passkeys (passwordless)
│   └── Recovery Key (emergency)
│
├── 🌐 fishmusicinc.com
│   ├── GoDaddy (registrar only)
│   ├── Cloudflare (DNS + CDN + SSL)
│   └── Microsoft 365 (email)
│
├── 📱 Devices
│   ├── iPhone
│   ├── iPad
│   ├── Mac
│   └── Apple Watch
│
└── 🔄 Sync
    └── iCloud (everything)
```

---

## ONE IDENTITY. ZERO PASSWORDS. APPLE EVERYTHING.
