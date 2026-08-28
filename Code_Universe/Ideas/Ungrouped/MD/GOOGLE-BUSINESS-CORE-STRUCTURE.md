# NOIZY.AI — Google Business Core Structure
## Operational Blueprint & Implementation Guide

**Author:** Robert Stephen Plowman  
**Date:** 2026-04-13  
**Status:** Active Blueprint  
**Version:** 1.0

---

## EXECUTIVE SUMMARY

This document defines the complete Google ecosystem architecture that serves NOIZY.AI — a trust-native voice infrastructure company. It is the single source of truth for:

- How Google Workspace enables team collaboration
- Email routing and organizational structure
- Drive architecture and document management
- Calendar synchronization with product development
- GCP infrastructure for production systems
- Search, Analytics, and discovery layer
- Security, compliance, and data governance

NOIZY.AI leverages the full Google stack as operational backbone: workspace collaboration, secure email, cloud infrastructure, and discovery tools. This document is the blueprint for implementing and maintaining these systems.

---

## 1. GOOGLE WORKSPACE ORGANIZATION

### 1.1 Domain & Setup
- **Primary Domain:** `noizy.ai`
- **Secondary Domain:** `gabriel.noizy.ai` (for AI agent systems)
- **Workspace Edition:** Standard (upgrade to Business Standard or Plus as team grows)
- **Admin Console URL:** `https://admin.google.com`
- **Set-up Date:** Pre-configured
- **Timezone:** America/Toronto (Robert's primary timezone)
- **Language:** English (US)

### 1.2 User Accounts & Roles

#### Super Administrators
- **rsp@noizy.ai** — Robert Stephen Plowman
  - Full admin access
  - Primary email for all external communications
  - Calendar and Drive governance
  - Security policy enforcement

#### Service Accounts
- **info@noizy.ai** — Information/General Inquiries (managed by rsp@noizy.ai)
- **hello@noizy.ai** — Friendly first contact (managed by rsp@noizy.ai)
- **support@noizy.ai** — Customer support triage (managed by support team)

#### Team Accounts (Future)
- **gabriel@noizy.ai** — Gabriel AI voice agent
  - Service account for automated workflows
  - Drive access for asset management
  - Email for agent-generated communications
  - Tied to n8n orchestration layer

#### Organizational Groups (Ready to Add)
- **team@noizy.ai** — All core team members
- **engineering@noizy.ai** — Product & engineering
- **finance@noizy.ai** — Accounting and ops
- **partnerships@noizy.ai** — BD and integrations
- **creators@noizy.ai** — Creator community managers

### 1.3 Organizational Units (OUs) Structure

```
noizy.ai (Root)
├── Engineering
│   ├── Cloud Services (GCP, Cloudflare, Hosting)
│   └── Product Development
├── Operations
│   ├── Finance & Admin
│   └── Legal & Compliance
├── Growth
│   ├── Marketing
│   └── Partnerships
├── Support & Community
│   └── Creator Relations
└── Archived
    └── Offboarded team members
```

**Implementation Note:** Each OU can have custom security policies:
- Engineering: Relaxed password requirements, unlimited device access
- Operations: 2FA mandatory, device restrictions
- Growth: Standard policies

### 1.4 Security Settings

#### Multi-Factor Authentication (2FA)
**Admin Console Path:** `https://admin.google.com/u/2/ac/security`

- **Enforcement:** Mandatory for all users (tier: Security Key recommended)
- **Grace Period:** 30 days for new users
- **Methods Allowed:** 
  - Security keys (FIDO2) — preferred
  - Authenticator app (Google Authenticator, Microsoft Authenticator)
  - SMS backup (only with security key enrolled)
  - Phone prompts (for users without security key)

**Robert's Setup:**
- Primary: YubiKey (USB + NFC)
- Secondary: Google Authenticator app

#### App Passwords Policy
**Admin Console Path:** `https://admin.google.com/u/2/ac/security/app-passwords`

- **Status:** Enabled only for approved apps
- **Approved Apps:**
  - n8n (for workflow orchestration)
  - Cloudflare Workers (for API integration)
  - Apple Mail (for Mail.app access)
- **Revocation:** Every 90 days, reviewed and renewed

#### OAuth & Third-Party App Control
**Admin Console Path:** `https://admin.google.com/u/2/ac/security/security-investigation-tool`

**Allowlist Criteria:** Apps must be vetted by Robert before team access granted

**Current Allowlist:**
- Linear (project management)
- Figma (design)
- Notion (documentation — read-only for team)
- n8n (workflow engine)
- Slack (team communication)
- Zapier (workflow automation — limited)

**Blocklist:** Any app requesting excessive permissions

#### Session Management
**Admin Console Path:** `https://admin.google.com/u/2/ac/security/session-management`

- **Maximum Session Duration:** 24 hours (engineering); 12 hours (operations)
- **Concurrent Sessions:** Maximum 5 devices per user
- **Trusted Device Reset:** Manual only by admin

### 1.5 Google Vault (Data Retention & eDiscovery)

**Admin Console Path:** `https://admin.google.com/u/2/ac/vault`

**Purpose:** Legal holds, compliance audit trails, and data archival

#### Retention Policies
- **Default:** 18 months (archive after)
- **Legal Holds:** Indefinite
- **Finance Records:** 7 years (compliance requirement)
- **Customer Data:** 3 years minimum

#### Audit Log Monitoring
**Admin Console Path:** `https://admin.google.com/u/2/ac/adminlogs`

- **Enabled Logs:**
  - Admin console activity
  - Drive document modifications
  - Gmail account changes
  - Security event logs
- **Retention:** 2 years
- **Review Frequency:** Monthly (automated report to rsp@noizy.ai)

---

## 2. GMAIL ARCHITECTURE

### 2.1 Primary Account

- **Email:** rsp@noizy.ai
- **Display Name:** Robert Stephen Plowman
- **Account Type:** Workspace admin
- **Recovery Email:** rspplowman@gmail.com (personal Gmail backup)
- **Phone Number:** On file with Google Workspace admin

### 2.2 Aliases & Delegation

**Aliases** (forward to rsp@noizy.ai):
- **info@noizy.ai** — General inquiries, investor relations
- **hello@noizy.ai** — Friendly first contact for partnerships
- **support@noizy.ai** — Customer support inbox (delegated to support team)

**Delegation Setup** (Grant send-as permissions):
- Gabriel (gabriel@noizy.ai) — can send as rsp@noizy.ai for automated communications
- Support team users — can send as support@noizy.ai

**Gmail Setting Path:** Settings → Accounts and Import → Send mail as

### 2.3 Inbox Routing Rules & Filters

**Master Filter List:**

| Filter Trigger | Action | Label | Archive | Starred |
|---|---|---|---|---|
| From: investors@* | Label | NOIZY/Investors | No | Yes |
| From: legal@* OR subject: contract | Label | NOIZY/Legal | No | Yes |
| From: partner@* OR subject: partnership | Label | NOIZY/Partners | No | No |
| To: support@noizy.ai | Label | NOIZY/Support | No | No |
| From: creator@* | Label | NOIZY/Creators | No | No |
| From: github OR subject: deployment | Label | ENGINEERING/Alerts | Yes | No |
| Filename: .pdf AND from: finance | Label | FINANCE/Invoices | No | No |
| Size > 25MB | Auto-delete after 90 days | ARCHIVE/Large Files | Yes | No |
| From: noreply@* | Skip inbox, label | AUTOMATION/Alerts | Yes | No |

**Gmail Filter Path:** Settings → Filters and Blocked Addresses

### 2.4 Label Hierarchy

```
NOIZY/
├── Investors
├── Legal
├── Partners
├── Support
└── Creators

ENGINEERING/
├── Alerts
├── Deployments
├── Code Review
└── Issues

FINANCE/
├── Invoices
├── Receipts
├── Contracts
└── Payroll

PARTNERSHIPS/
├── API Integrations
├── Creator Programs
└── Channel Partners

AUTOMATION/
├── Alerts
├── Scheduled Reports
└── Bot Messages

ARCHIVE/
├── 2024
├── 2025
└── Large Files
```

**Implementation:** Create all parent labels first, then child labels. Enable "Show in label list" for parent labels.

### 2.5 Signature Template

**Primary Signature** (rsp@noizy.ai):

```
Robert Stephen Plowman
Founder & CEO, NOIZY.AI

Building trust-native voice infrastructure.

Website: https://noizy.ai
Email: rsp@noizy.ai
Phone: [office number]

---
NOIZY.AI — Voice Sovereignty, Creator Protected
```

**Support Signature** (support@noizy.ai):

```
NOIZY Support Team

We're here to help builders protect voice rights.

Website: https://noizy.ai/support
Email: support@noizy.ai

---
NOIZY.AI — Voice Sovereignty, Creator Protected
```

**Gmail Signature Path:** Settings → General → Signature

### 2.6 Email Integration with n8n

**Workflow 1: Investor Inquiry Routing**
- **Trigger:** Email arrives at info@noizy.ai with "investor" keywords
- **Action:** 
  - Label as NOIZY/Investors
  - Send to Linear as Issue (tagged #investors)
  - Notify rsp@noizy.ai with 2-hour snooze option

**Workflow 2: Support Ticket Creation**
- **Trigger:** Email arrives at support@noizy.ai
- **Action:**
  - Create Linear ticket
  - Auto-reply with ticket number (via support@noizy.ai)
  - Add to support escalation board

**Workflow 3: Contract Notification**
- **Trigger:** PDF attachment + "contract" in subject
- **Action:**
  - Upload to Drive: NOIZY.AI/01_LEGAL/Contracts
  - Create Linear task for legal review
  - Notify rsp@noizy.ai

**n8n Integration Path:** n8n → Gmail trigger → Action (Label, Create task, Send reply)

**Gmail API Enablement Required:**
- OAuth: `https://oauth.googleapis.com/` (enable in GCP)
- Service Account: Created in GCP project (noizy-production)
- Scopes: `https://www.googleapis.com/auth/gmail.modify`

### 2.7 Email Templates

**Investor Response Template:**
```
Subject: Re: NOIZY.AI Partnership Inquiry

Hi [Name],

Thank you for your interest in NOIZY.AI.

[Custom response about opportunity]

I'd like to schedule a 30-minute call to discuss further.
[Calendar link]

Looking forward to it.

Robert
—
[signature]
```

**Creator Onboarding Email:**
```
Subject: Welcome to NOIZY.AI

Hi [Creator Name],

Welcome to the NOIZY community.

Your voice rights matter. Here's what you should know about NOIZY:
[Key benefits]

Next steps:
1. Review our creator agreement (attached)
2. Complete your profile: [link]
3. Schedule onboarding call: [calendar link]

Questions? Reply to this email.

NOIZY Support
—
[signature]
```

**Gmail Template Path:** Compose → More options → Templates

---

## 3. GOOGLE DRIVE STRUCTURE

### 3.1 Folder Architecture

```
My Drive/
├── NOIZY.AI/                    [Main Company Folder]
│   ├── 00_EXECUTIVE/
│   │   ├── Board Decks
│   │   ├── Investor Presentations
│   │   ├── Strategic Plans
│   │   ├── OKR Tracking
│   │   └── Board Minutes
│   │
│   ├── 01_LEGAL/
│   │   ├── Contracts
│   │   │   ├── Master Service Agreements
│   │   │   ├── Creator Agreements
│   │   │   ├── Investor Agreements
│   │   │   └── Partnership Agreements
│   │   ├── Compliance
│   │   │   ├── PIPEDA Audit Trail
│   │   │   ├── Terms of Service
│   │   │   └── Privacy Policy
│   │   ├── IP Filings
│   │   │   ├── Trademarks
│   │   │   ├── Patents
│   │   │   └── Copyright Registrations
│   │   └── Insurance
│   │
│   ├── 02_ENGINEERING/
│   │   ├── Architecture
│   │   │   ├── System Design Docs
│   │   │   ├── API Specifications
│   │   │   ├── Data Flow Diagrams
│   │   │   └── Infrastructure Diagrams
│   │   ├── Specifications
│   │   │   ├── Voice Inference API
│   │   │   ├── Consent Engine
│   │   │   └── Creator Dashboard
│   │   ├── Code Review Checklist
│   │   ├── Deployment Procedures
│   │   └── Technical Debt Log
│   │
│   ├── 03_PRODUCT/
│   │   ├── PRDs (Product Requirements)
│   │   │   ├── Voice Sovereign 1.0
│   │   │   ├── Creator Dashboard
│   │   │   └── API Client
│   │   ├── Wireframes & Mockups
│   │   ├── User Research
│   │   │   ├── Creator Interviews
│   │   │   ├── Dev Interviews
│   │   │   └── Persona Documents
│   │   ├── Feature Roadmap
│   │   └── Competitive Analysis
│   │
│   ├── 04_CREATIVE/
│   │   ├── Brand Assets
│   │   │   ├── Logo (variants)
│   │   │   ├── Color Palette
│   │   │   ├── Typography
│   │   │   └── Icon Library
│   │   ├── Audio
│   │   │   ├── Voice Demos
│   │   │   ├── Marketing Audio
│   │   │   └── Product Sounds
│   │   ├── Video
│   │   │   ├── Demo Videos
│   │   │   ├── Explainers
│   │   │   └── Testimonials
│   │   ├── Illustration
│   │   └── Design System
│   │
│   ├── 05_MARKETING/
│   │   ├── Content
│   │   │   ├── Blog Posts
│   │   │   ├── Email Sequences
│   │   │   ├── Social Copy
│   │   │   └── Ad Copy
│   │   ├── Campaigns
│   │   │   ├── Launch Campaign (2024)
│   │   │   ├── Creator Program Launch
│   │   │   └── Partnership Campaign
│   │   ├── Analytics
│   │   │   ├── Monthly Reports
│   │   │   ├── Traffic Data
│   │   │   └── Conversion Funnels
│   │   ├── Email Lists
│   │   │   ├── Subscribers
│   │   │   ├── Creators
│   │   │   └── Investors
│   │   └── Event Materials
│   │
│   ├── 06_FINANCE/
│   │   ├── Invoices
│   │   │   ├── 2024
│   │   │   ├── 2025
│   │   │   └── 2026
│   │   ├── Receipts
│   │   ├── Contracts
│   │   ├── Financial Projections
│   │   ├── Monthly P&L
│   │   ├── Budget Tracking
│   │   └── Cap Table
│   │
│   ├── 07_HR/
│   │   ├── Employment Agreements
│   │   ├── Onboarding Materials
│   │   ├── Company Handbook
│   │   ├── Team Directory
│   │   └── Performance Reviews
│   │
│   ├── 08_PARTNERSHIPS/
│   │   ├── Partner Agreements
│   │   ├── MOUs (Memoranda of Understanding)
│   │   ├── Integration Plans
│   │   ├── Revenue Sharing Documents
│   │   └── Partner Roadmap
│   │
│   └── 09_ARCHIVE/
│       ├── 2024
│       ├── 2025
│       ├── Deprecated Docs
│       └── Historical Context
│
├── GABRIEL/                     [Gabriel AI Agent Assets]
│   ├── Voice Models
│   │   ├── Training Data
│   │   ├── Fine-tuned Models
│   │   └── Testing Recordings
│   ├── Conversations
│   │   ├── Conversation Logs
│   │   ├── Training Transcripts
│   │   └── User Feedback
│   ├── Documentation
│   │   ├── Agent Capabilities
│   │   ├── Integration Guides
│   │   └── API Docs
│   └── Assets
│       ├── Response Templates
│       ├── Knowledge Base
│       └── Decision Trees
│
├── MC96ECO/                     [MC96 Ecosystem Documentation]
│   ├── Partners
│   ├── API Integrations
│   ├── Reference Materials
│   └── Ecosystem Notes
│
└── PERSONAL/                    [Robert's Personal Folder]
    ├── Contracts (personal)
    ├── Financial (personal)
    ├── Projects (side)
    └── Reference Materials
```

### 3.2 Access & Sharing Rules

#### NOIZY.AI Folder Permissions
- **rsp@noizy.ai** — Owner (full access)
- **team@noizy.ai** — Editor (except 06_FINANCE, 01_LEGAL/IP)
- **engineering@noizy.ai** — Editor (02_ENGINEERING only)
- **Public Links** — Disabled by default

#### Restricted Subfolders
- **01_LEGAL/** — rsp@noizy.ai only (except general legal templates)
- **06_FINANCE/** — rsp@noizy.ai + accountant (as needed)
- **00_EXECUTIVE/** — rsp@noizy.ai + board members (as needed)

#### Sharing Protocol
1. **Default:** Internal only (noizy.ai domain)
2. **External Sharing:** Requires rsp@noizy.ai approval
3. **Public Links:** Only for marketing materials (05_MARKETING/)
4. **Expiration:** Set 90-day expiration on all temporary external shares

**Drive Sharing Path:** Right-click folder → Share → Advanced → Custom permissions

### 3.3 File Naming Convention

**Format:** `[DATE] - [PROJECT] - [DESCRIPTION] - [VERSION]`

**Examples:**
- `2026-04-13 - INVESTOR - Seed Round Pitch Deck - v3.pdf`
- `2026-04-10 - CONSENT-ENGINE - API Specification - v1.0.md`
- `2026-03-15 - CREATOR-PROGRAM - Onboarding Flow - FINAL.png`

### 3.4 Integration with n8n

**Workflow 1: Email to Drive**
- **Trigger:** Email attachment received (labeled NOIZY/Legal)
- **Action:** Save to `01_LEGAL/Contracts/`
- **Naming:** Auto-generated using email subject + date

**Workflow 2: Drive Backup to R2**
- **Trigger:** New file in NOIZY.AI folder
- **Action:** Sync to Cloudflare R2 bucket (daily, 2 AM)
- **Retention:** Keep 30-day rolling backup

**Workflow 3: Drive to Google Sheets**
- **Trigger:** New spreadsheet created
- **Action:** Auto-publish to team dashboard (read-only view)

### 3.5 Version Control & Archive

**Archive Schedule:**
- Completed projects: Move to `09_ARCHIVE/[YEAR]/` after 12 months
- Legal documents: Keep in active folder indefinitely (7-year retention)
- Marketing materials: Archive after campaign ends
- Financial: Archive after fiscal year close

**Version Management:**
- Keep last 3 versions of active documents
- Delete draft versions after approval
- Use "Version history" for critical files (Drive settings)

---

## 4. GOOGLE CALENDAR STRUCTURE

### 4.1 Calendar Setup

#### Primary Calendar
- **Name:** Robert Stephen Plowman (rsp@noizy.ai)
- **Timezone:** America/Toronto
- **Working Hours:** 9 AM – 6 PM (customize availability)
- **Show as:** Busy (except personal time blocks)

#### Shared Team Calendars

**NOIZY Sprint**
- **Purpose:** Product sprint cycles and milestones
- **Shared With:** team@noizy.ai
- **Update Frequency:** Weekly (Friday 4 PM sync)
- **Events:**
  - Sprint Start (Mondays)
  - Sprint End (Fridays)
  - Sprint Review (Fridays, 3 PM)
  - Release Windows

**NOIZY Releases**
- **Purpose:** Product releases and deployment windows
- **Shared With:** engineering@noizy.ai
- **Events:**
  - Scheduled releases
  - Deployment windows
  - Hotfix windows
  - Post-release review

**NOIZY Meetings**
- **Purpose:** Company-wide meetings and all-hands
- **Shared With:** team@noizy.ai
- **Events:**
  - Weekly all-hands (Wednesdays, 10 AM)
  - Monthly investor updates
  - Quarterly planning sessions
  - Board meetings

### 4.2 Recurring Events

| Event | Frequency | Time | Duration | Attendees | Purpose |
|---|---|---|---|---|---|
| Daily Standup | Weekdays | 9:30 AM | 15 min | Engineering team | Sync on blockers |
| Sprint Planning | Every 2 weeks | Monday, 10 AM | 2 hours | Team | Plan sprint goals |
| Sprint Review | Every 2 weeks | Friday, 3 PM | 1 hour | Team | Demo completed work |
| Investor Check-in | Monthly | 1st Tuesday, 2 PM | 1 hour | rsp + investors | Progress update |
| Product Review | Bi-weekly | Thursdays, 11 AM | 1 hour | Product + engineering | Roadmap review |
| Creator Calls | Weekly | Tuesdays, 2 PM | 30 min | Support team | Community feedback |
| Founder Time | Daily | 8 AM (1 hour block) | 1 hour | rsp | Focus time |
| Finance Review | Monthly | 25th, 4 PM | 1 hour | rsp + accountant | Monthly close |

### 4.3 Calendar Integration with Linear

**Automatic Sync:**
1. Create milestone in Linear (e.g., "Q2 Release")
2. Webhook triggers Google Calendar event creation
3. Calendar invite sent to engineering@noizy.ai
4. Linear milestone linked in calendar event description

**Setup:**
- Linear Webhook: `https://calendars.google.com/calendar/u/0/r/eventedit` (manual for now)
- Future: n8n automation layer

**Calendar Link in Linear Issues:**
- When creating milestone: Add calendar link
- When planning release: Share calendar event in Linear board

### 4.4 Calendar Settings

**Default Event Duration:** 1 hour  
**Default Notification:** 15 minutes before  
**Show Availability:** Visible to domain (team can see "Busy" slots)  
**Conference Software:** Google Meet (auto-add to all meetings)

**Calendar Settings Path:** `https://calendar.google.com/calendar/u/0/r/settings`

### 4.5 Time Blocking Strategy

**Founder's Calendar (rsp@noizy.ai):**
- **Mornings (8–9:30 AM):** Deep work/strategic thinking
- **Mid-day (1–2 PM):** Admin/emails
- **Afternoons (3–5 PM):** Meetings
- **Evenings (5–6 PM):** Buffer time

**Sharing:** Mark "Tentative" slots as "Busy" so others can't book

---

## 5. GOOGLE CLOUD PLATFORM (GCP) PROJECTS

### 5.1 Project Structure

#### noizy-production
- **Project ID:** `noizy-production`
- **Billing Account:** [Attached to corporate card]
- **Region:** us-central1 (default), Canada-central1 (PIPEDA preferred)
- **Purpose:** Production APIs, Cloud Functions, Pub/Sub
- **Access:** rsp@noizy.ai (owner), gabriel@noizy.ai (editor)

#### noizy-staging
- **Project ID:** `noizy-staging`
- **Purpose:** Pre-production testing, staging environment
- **Access:** engineering@noizy.ai (editor)
- **Data:** Synthetic/anonymized only

#### noizy-dev
- **Project ID:** `noizy-dev`
- **Purpose:** Development playground, testing services
- **Access:** engineering@noizy.ai (editor)
- **Data:** Sandbox only

### 5.2 Enabled APIs

**Production Project (noizy-production):**

| API | Purpose | Quota Limit |
|---|---|---|
| Cloud Functions | Serverless functions for voice API | 100,000 invocations/day |
| Cloud Run | Containerized services (voice inference) | 2 vCPU × 512 MB minimum |
| Pub/Sub | Message queue for async processing | 1 GB/day |
| Secret Manager | Store API keys, credentials | 100 secrets |
| Cloud Storage | File storage (models, audio samples) | 100 GB initial |
| BigQuery | Analytics and data warehouse | 1 TB/month free tier |
| Cloud Tasks | Task queue for delayed operations | 100,000 tasks/day |
| Cloud Logging | Application logs and monitoring | 50 GB/day free |
| Cloud Trace | Distributed tracing | Included with Logging |
| Cloud Monitoring | Metrics and alerts | Included with Logging |

**Enable APIs Path:** `https://console.cloud.google.com/apis/dashboard`

### 5.3 Billing & Budgets

**Billing Account:** `https://console.cloud.google.com/billing`

**Initial Budget Limits:**
- **Warning Alert:** $50/month (email to rsp@noizy.ai)
- **Hard Stop:** $100/month (API calls throttled)
- **Review Frequency:** Daily alerts via Monitoring

**Cost Optimization:**
- Use committed use discounts (reserved capacity)
- Enable autoscaling with max cap
- Archive old logs after 30 days
- Use Cloud Storage lifecycle policies

**Budget Alert Setup:**
1. Click "Budgets & alerts"
2. Create budget: $100/month
3. Set notification: $50, $80, $100 thresholds
4. Alert channel: Email to rsp@noizy.ai

### 5.4 GCP Service Accounts

**Gabriel Service Account (gabriel@noizy.ai)**
- **Key Type:** JSON key (stored in Secret Manager)
- **Permissions:**
  - Cloud Functions invoker
  - Pub/Sub publisher
  - Cloud Storage viewer
  - BigQuery data viewer
- **Rotation:** Every 90 days

**n8n Service Account**
- **Key Type:** JSON key (stored in n8n vault)
- **Permissions:**
  - Cloud Functions invoker
  - Pub/Sub publisher
  - Cloud Storage viewer
- **Scopes:** Limited to specific functions only

### 5.5 Service Account Creation Checklist

**To create a GCP service account:**

1. Go to `https://console.cloud.google.com/iam-admin/serviceaccounts`
2. Click "Create Service Account"
3. Fill in:
   - **Service Account Name:** e.g., "Gabriel Voice Agent"
   - **Service Account ID:** e.g., gabriel-voice-agent
   - **Description:** "AI voice agent for NOIZY.AI"
4. Grant roles:
   - Cloud Functions Invoker
   - Pub/Sub Editor (or Publisher)
   - Storage Object Viewer
5. Create JSON key
6. Store key in Cloud Secret Manager
7. Document in 02_ENGINEERING/Architecture/GCP-Service-Accounts.md

---

## 6. GOOGLE SEARCH CONSOLE

**Console URL:** `https://search.google.com/search-console/`

### 6.1 Setup

**Domain Verification:**
- Method: DNS TXT record (via Cloudflare)
- Record: `google-site-verification=XXXXX` (TXT)
- Status: Verified

**Add to Console:**
1. Go to Search Console
2. Click "URL prefix"
3. Enter: `https://noizy.ai`
4. Click "Continue"
5. Follow DNS verification (Cloudflare)

### 6.2 Sitemap Submission

**Sitemap URL:** `https://noizy.ai/sitemap.xml`

**Submit in Console:**
1. Left menu → "Sitemaps"
2. Click "Add/test sitemap"
3. Enter: `sitemap.xml`
4. Click "Submit"

**Sitemap Structure (Dynamic, generated by Next.js):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://noizy.ai/</loc>
    <lastmod>2026-04-13</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://noizy.ai/about</loc>
    <lastmod>2026-04-13</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://noizy.ai/api-docs</loc>
    <lastmod>2026-04-13</lastmod>
    <priority>0.9</priority>
  </url>
  <!-- Additional pages as added -->
</urlset>
```

### 6.3 Performance Monitoring

**Dashboard Metrics to Review (Weekly):**
- **Total Clicks** — How often users click NOIZY in search results
- **Average CTR** — Click-through rate (target: >2%)
- **Average Position** — Average ranking (target: page 1 for branded terms)
- **Impressions** — How often NOIZY appears in search results

**Important Searches to Target:**
- "voice sovereignty"
- "creator protection AI"
- "AI consent"
- "voice rights platform"
- "AI voice agent"

### 6.4 Core Web Vitals Monitoring

**Path in Console:** Performance → Core Web Vitals

**Metrics:**
- **Largest Contentful Paint (LCP):** < 2.5 seconds (target)
- **First Input Delay (FID):** < 100 milliseconds (target)
- **Cumulative Layout Shift (CLS):** < 0.1 (target)

**Action if Issues Found:**
1. Check actual page performance: `PageSpeed Insights`
2. Share report with engineering@noizy.ai
3. Create Linear issue with "web-performance" tag
4. Track fix in Drive: `05_MARKETING/Analytics/Performance-Audits/`

---

## 7. GOOGLE ANALYTICS 4 (GA4)

**GA4 Dashboard:** `https://analytics.google.com/analytics/web/`

### 7.1 Property Setup

**Property Name:** NOIZY.AI  
**Property ID:** UA-XXXXX (replace with actual)  
**Website URL:** `https://noizy.ai`  
**Reporting Timezone:** America/Toronto  
**Currency:** CAD

### 7.2 Data Streams

#### Web Stream: noizy.ai
- **Stream Name:** Website (Production)
- **Measurement ID:** G-XXXXX
- **Tag Implementation:** Google Tag Manager (GTM)

**Key Events to Track:**
- `page_view` — Page loads (auto-tracked)
- `signup` — User sign-up initiated
- `waitlist_join` — Waitlist submission
- `consent_granted` — Privacy consent accepted
- `consent_revoked` — Privacy consent revoked
- `voice_demo_played` — User played demo
- `api_signup` — Developer API sign-up
- `pricing_viewed` — Pricing page visit

#### App Stream: NOIZY Mobile (Future)
- Platform: iOS (post-launch)
- Measurement ID: G-YYYYY
- Event tracking: Same as web

### 7.3 Conversion Goals

| Goal | Event | Trigger | Value |
|---|---|---|---|
| Signup Complete | signup | Form submitted | 10 |
| Waitlist Join | waitlist_join | Waitlist submitted | 5 |
| API Access | api_signup | Dev signup form submitted | 20 |
| Content Download | file_download | PDF/guide downloaded | 3 |
| Demo Play | voice_demo_played | Demo audio played | 1 |
| Contact Form | form_submit | Contact form submitted | 15 |

### 7.4 Custom Events (Implementation)

**Setup in Google Tag Manager (GTM):**

**Event: Signup (signup)**
```javascript
gtag('event', 'signup', {
  'method': 'email',
  'timestamp': new Date().toISOString()
});
```

**Event: Waitlist (waitlist_join)**
```javascript
gtag('event', 'waitlist_join', {
  'use_case': 'voice_sovereignty',  // or 'creator_protection', 'api_access'
  'timestamp': new Date().toISOString()
});
```

**Event: Demo Play (voice_demo_played)**
```javascript
gtag('event', 'voice_demo_played', {
  'demo_type': 'inference_api',  // or 'consent_engine', 'creator_dashboard'
  'duration_seconds': 45,
  'timestamp': new Date().toISOString()
});
```

### 7.5 Audiences & Segments

**Audience: Early Adopters**
- Condition: Joined waitlist (2025) AND visited site 3+ times
- Purpose: Target for beta features
- Size: ~500 users

**Audience: Creators**
- Condition: Visited /creators path AND signed up
- Purpose: Creator program targeting
- Size: ~100 users

**Audience: Developers**
- Condition: Visited /api-docs AND joined API waitlist
- Purpose: Developer product targeting
- Size: ~50 users

### 7.6 Analytics Dashboard & Reports

**Weekly Report (auto-sent to team@noizy.ai):**
- New users acquired
- Conversion rate (signup/waitlist)
- Top traffic sources
- Core metrics summary

**Monthly Report (to rsp@noizy.ai):**
- Growth trends
- Cohort analysis
- Retention rates
- Recommendation for next month

**Monthly Report Path:** Analyze → Custom reports → Create new report

---

## 8. GOOGLE BUSINESS PROFILE

### 8.1 Setup (Pre-Configured)

**Business Profile URL:** `https://www.google.com/business/profile/?hl=en`

**Business Details:**
- **Business Name:** NOIZY.AI
- **Address:** [Registered address on file]
- **Phone:** [Main contact number]
- **Website:** `https://noizy.ai`
- **Category:** Technology Company / Software Development
- **Hours:** Business hours (or "Virtual" if fully remote)

**Verification Status:** Verified (postcard method)

### 8.2 Posting Schedule

**Minimum Posts:** 2x per week

**Post Types:**
- **Monday:** Product update or feature announcement
- **Thursday:** Industry insight or creator spotlight
- **Bonus:** Event announcements, partnerships, milestones

**Post Content Template:**
```
[Title/Headline]

[1-2 sentence description]

[Link to full article / CTA]

#VoiceSovereignty #CreatorProtection #AIConsent
```

**Examples:**
- "New API: Voice Inference with Consent Tracking"
- "Creator Spotlight: How [Creator] Uses NOIZY"
- "Building Trust-Native AI — Here's Why It Matters"

### 8.3 Photo Updates

**Minimum:** 1 photo update per month

**Photo Guidelines:**
- Team photos (when applicable)
- Office/workspace ambiance
- Event photos
- Brand imagery (hero graphics)
- Behind-the-scenes development

**Upload Path:** Business Profile → Photos → Add photos

### 8.4 Reviews & Q&A

**Response Protocol:**
- **All reviews:** Respond within 48 hours
- **Positive reviews:** Thank and ask for referral
- **Negative reviews:** Acknowledge, offer resolution, take offline
- **Q&A:** Answer within 24 hours

**Response Template (Positive):**
```
Thank you so much for the kind words! We're thrilled you're exploring 
voice sovereignty with us. Feel free to reach out if you have any questions.
```

**Response Template (Negative):**
```
We appreciate the feedback and want to make this right. 
Please reach out to us at support@noizy.ai so we can resolve this quickly.
```

---

## 9. YOUTUBE CHANNEL (Future — Phase 2)

### 9.1 Channel Setup (Ready to Create)

**Channel Name:** NOIZY.AI  
**Handle:** @NoizyAI  
**Description:** Building trust-native voice infrastructure. Creator-protected AI. Voice sovereignty tools for the future.  
**Profile Image:** NOIZY.AI logo (from Drive: 04_CREATIVE/Brand Assets/)  
**Banner:** NOIZY.AI hero graphic

### 9.2 Content Playlist Structure

Once channel is live, organize videos into these playlists:

**Tutorials**
- "Getting Started with NOIZY API"
- "Setting Up Voice Consent"
- "Integrating NOIZY with Your App"

**Demos**
- "Voice Sovereignty Engine Demo"
- "Creator Dashboard Walkthrough"
- "Real-time Consent Tracking"

**Philosophy**
- "What is Voice Sovereignty?"
- "Why Creator Protection Matters"
- "The Future of AI Consent"

**Behind the Build**
- "Building Trust-Native AI" (series)
- "Creator Interviews"
- "Technical Deep Dives"

### 9.3 Upload Schedule (Post-Launch)

- **Minimum:** 2 videos per month
- **Ideal:** 1 video per week
- **Premiere:** Live premiere for major releases

### 9.4 Video Metadata

**Title Format:** `[Type] - [Topic] - NOIZY.AI`  
Examples:
- "Tutorial - Getting Started with the Voice API - NOIZY.AI"
- "Demo - Creator Dashboard v1.0 - NOIZY.AI"
- "Philosophy - Voice Sovereignty Explained - NOIZY.AI"

**Description Template:**
```
[Video content summary - 2-3 sentences]

Learn more: https://noizy.ai/[relevant-page]

GitHub: https://github.com/noizy-ai/
Docs: https://docs.noizy.ai/

[Timestamps - if applicable]

[Subscribe CTA]
```

**Tags:** voice-sovereignty, ai-consent, creator-protection, trust-native-ai, voice-api

---

## 10. GOOGLE ADS (Future — Phase 3)

### 10.1 Campaign Structure (Ready to Launch When Appropriate)

**Launch Criteria:**
- Product-market fit validated (minimum 5,000 waitlist)
- Organic channels performing well (SEO, content)
- Budget: $0 initially, scale to $500–1,000/month if metrics support

### 10.2 Search Campaigns

**High-Value Keywords to Own:**

| Keyword | Intent | Max CPC | Status |
|---|---|---|---|
| voice sovereignty | Brand awareness | $2.00 | Organic first |
| AI consent | Educational | $1.50 | Organic first |
| voice rights platform | Purchase | $3.00 | Ready to bid |
| creator protection AI | Educational | $1.25 | Organic first |
| voice inference API | Developer | $5.00 | Developer budget |
| NOIZY.AI | Branded | $0.50 | Organic priority |

**Ad Copy Template (Search Ads):**
```
Headline 1: Trust-Native Voice Infrastructure
Headline 2: Creator-Protected AI For Developers
Headline 3: Voice Sovereignty Starts Here

Description 1: Build voice features that respect consent. 
NOIZY provides AI inference with real-time consent tracking.

Description 2: Use our API to add voice with built-in creator protection.
Learn more.

CTA: Get API Access
```

### 10.3 YouTube Campaigns (Brand Awareness)

**Target Audience:**
- Interests: AI/machine learning, creator economy, data privacy
- Keywords: voice-related content creators, developer channels
- Placements: AI educational channels, startup podcasts
- Budget: $100–500/month

**Video Ad (30 seconds):**
- Hook: "What if AI actually respected voice rights?"
- Body: 15-second product demo
- CTA: "Sign up for early access"

### 10.4 Search Campaign Metrics

**Target KPIs:**
- **CTR:** > 2%
- **Conversion Rate:** > 3%
- **Cost Per Signup:** < $5
- **ROAS:** > 300% (revenue from users / ad spend)

**Monthly Review:** Share performance in Drive: `05_MARKETING/Campaigns/Google-Ads-Performance/`

---

## 11. INTEGRATION MAP — How Google Serves NOIZY.AI

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOIZY.AI OPERATIONAL STACK                       │
└─────────────────────────────────────────────────────────────────────┘

                        EXTERNAL WORLD
                              ▲
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
   ORGANIC DISCOVERY                          PAID DISCOVERY
        │                                            │
    ┌───┴─────┐  ┌──────────┐             ┌────────┴──────┐
    │ SEO     │  │Analytics │             │  Google Ads   │
    │ Console │  │ GA4      │             │               │
    └────┬────┘  └─────┬────┘             └────────┬──────┘
         │             │                           │
         └─────────────┼───────────────────────────┘
                       │
           ┌───────────▼───────────┐
           │  Website Traffic      │
           │  Leads & Signups      │
           └───────────┬───────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   USER ENGAGEMENT               DATA COLLECTION
        │                             │
    ┌───┴────────┐             ┌─────┴──────┐
    │ Email      │             │ Analytics  │
    │ Newsletter │             │ Conversions│
    │ Contact    │             │ User Paths │
    └───┬────────┘             └─────┬──────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼───────────────┐
        │    GOOGLE WORKSPACE          │
        │  (Gmail, Drive, Calendar)    │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴─────────────────────┐
        │                                    │
    GMAIL ROUTING                      DRIVE ORGANIZATION
    & FILTERS                          & COLLABORATION
        │                                    │
    ┌───┴──────────┐               ┌────────┴────────┐
    │ Investor Mgmt│               │ 00_EXECUTIVE    │
    │ Support Mgmt │               │ 01_LEGAL        │
    │ Spam Filter  │               │ 02_ENGINEERING  │
    └───┬──────────┘               │ 03_PRODUCT      │
        │                          │ 04_CREATIVE     │
        │                          │ 05_MARKETING    │
        │                          │ 06_FINANCE      │
        │                          │ 07_HR           │
        │                          │ 08_PARTNERSHIPS │
        │                          │ 09_ARCHIVE      │
        │                          └────────┬────────┘
        │                                   │
    ┌───┴──────────────┬──────────────────┬─┘
    │                  │                  │
    ▼                  ▼                  ▼
 n8n WORKFLOWS    CALENDAR SYNC      BACKUP & ARCHIVE
    │                  │                  │
 [Email → Linear]  [Sprint Board]    [R2 Backup]
 [Drive Sync]      [Release Plan]    [Vault Archive]
 [Email to Drive]  [Team Meetings]
    │                  │                  │
    └──────────────────┴──────────────────┘
                       │
        ┌──────────────▼───────────────┐
        │  FOUNDATION LAYER            │
        │  (GCP, Security, Logging)    │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴─────────────────────────┐
        │                                        │
   GCP INFRASTRUCTURE                    SECURITY & COMPLIANCE
        │                                        │
    ┌───┴──────────────┐               ┌────────┴────────┐
    │ Cloud Functions  │               │ 2FA Enforcement │
    │ Pub/Sub          │               │ OAuth Control   │
    │ Cloud Storage    │               │ Secret Manager  │
    │ BigQuery         │               │ Audit Logging   │
    │ Cloud Run        │               │ Data Retention  │
    └────────────────┐ │               │ Vault (DLP)     │
                     └─┼───────────────┴────────┬────────┘
                       │                        │
                       └────────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ HIDDEN SERVICES      │
                         │ (Admin Infra)        │
                         │                      │
                         │• Workspace Admin     │
                         │ • Vault (eDiscovery) │
                         │ • Mobile Mgmt        │
                         │ • Reporting          │
                         └──────────────────────┘
```

**Data Flow Examples:**

1. **Investor Inquiry:**
   - Email arrives → info@noizy.ai
   - Gmail filter labels as NOIZY/Investors
   - n8n creates Linear issue + notifies rsp
   - Calendar invite for callback
   - Follow-up doc in 00_EXECUTIVE/

2. **Product Launch:**
   - Release date set in Linear milestone
   - Syncs to Google Calendar
   - Team calendar shows release window
   - Analytics GA4 tracks launch day traffic
   - Post-launch report goes to Drive

3. **Support Ticket:**
   - Email to support@noizy.ai
   - n8n creates Linear ticket
   - Auto-reply from support account
   - Filed in NOIZY/Support label
   - Analytics tracks resolution time

---

## 12. SECURITY & COMPLIANCE

### 12.1 Google Workspace Security Policies

**Applied to All Organizational Units:**

#### Password Policy
- **Minimum Length:** 12 characters
- **Complexity:** Uppercase, lowercase, numbers, symbols
- **History:** Cannot reuse last 10 passwords
- **Expiration:** 90 days (enforced for admin accounts)
- **Admin Console Path:** `https://admin.google.com/u/2/ac/security/password-management`

#### Device Management
**Mobile Device Management (MDM):** Off (enable if team grows >5)  
**Application Management:** Enabled for sensitive apps  
**Enrolled Devices:** Track in spreadsheet (Drive: 07_HR/Device-Inventory.xlsx)

#### API & OAuth Control
- **Approved Apps Only:** Enforce from allowlist (updated quarterly)
- **Scopes Review:** Quarterly audit of app permissions
- **Suspicious Activity:** Auto-alert on unusual OAuth activity
- **Admin Console Path:** `https://admin.google.com/u/2/ac/security/security-investigation-tool`

### 12.2 Data Residency & Regional Compliance

**Preferred Region:** Canada (Ontario) — for PIPEDA compliance  
**Fallback Region:** US (if Canada unavailable)  
**Data Residency Setting:** GCP can set region-specific storage

**PIPEDA Compliance Checklist:**
- ✅ Data stored in Canada (Workspace default + GCP Canada region)
- ✅ Privacy Policy updated for PIPEDA (Drive: 01_LEGAL/Compliance/)
- ✅ User consent mechanisms for analytics (GA4 consent mode)
- ✅ Data breach notification plan (Drive: 01_LEGAL/Compliance/)
- ✅ Data retention schedules (Vault settings)

**PIPEDA Compliance Path:** `https://admin.google.com/u/2/ac/security/data-regions`

### 12.3 Data Loss Prevention (DLP)

**Enable DLP Rules:**

| Rule | Trigger | Action | Purpose |
|---|---|---|---|
| Confidential Docs | Doc title contains "CONFIDENTIAL" | Warn before sharing externally | Prevent accidental leak |
| API Keys in Email | Email contains "APIKEY" or "sk-" | Block send | Prevent credential leak |
| SSN/Tax IDs | Regex pattern (9-digit) | Warn + label | Compliance |
| Credit Cards | 16-digit patterns | Block send | PCI compliance |
| Customer Data | Files shared with external users | Alert to admin | Data governance |

**DLP Setup Path:** `https://admin.google.com/u/2/ac/security/dlp`

### 12.4 Audit Logging & Monitoring

**Audit Logs Enabled:**
- Admin console activity
- Gmail logs (send, receive, forwarding)
- Drive document activity
- Calendar event changes
- User account changes

**Log Retention:** 2 years (in Vault)  
**Log Review Frequency:** Monthly (rsp@noizy.ai gets report)

**Audit Log Export (Optional):**
1. Go to `https://admin.google.com/u/2/ac/adminlogs`
2. Select date range
3. Click "Download" (CSV export)
4. Store in Drive: `01_LEGAL/Compliance/Audit-Logs/`

### 12.5 OAuth App Vetting Process

**Before Adding Any New App to Allowlist:**

1. **Security Assessment:**
   - What scopes does it request? (List each)
   - Is the publisher known/reputable?
   - Any security incidents reported?

2. **Data Access Check:**
   - Does it need Gmail access? (If yes, why?)
   - Does it need Drive access? (If yes, which folders?)
   - Does it access Calendar or Contacts?

3. **Approval Process:**
   - rsp@noizy.ai reviews and approves
   - Add to allowlist in Admin Console
   - Document in Drive: `02_ENGINEERING/OAuth-App-Inventory.md`
   - Notify team@noizy.ai

**Review Schedule:** Quarterly (every 3 months)

### 12.6 Security Incident Response

**If Suspicious Activity Detected:**

1. **Immediate Actions:**
   - Revoke compromised credentials
   - Reset affected user passwords
   - Disable OAuth apps if needed
   - Take screenshot/log evidence

2. **Investigation:**
   - Check Audit Logs for unauthorized access
   - Review Drive sharing changes
   - Check Gmail forwarding rules
   - Review recovery email changes

3. **Documentation:**
   - Create incident report (Drive: `01_LEGAL/Compliance/Incidents/`)
   - Notify affected parties
   - Update security procedures if needed

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- [x] Google Workspace domain (noizy.ai) — Pre-configured
- [x] Primary admin account (rsp@noizy.ai) — Pre-configured
- [x] Gmail aliases and filters — Ready to implement
- [x] Drive folder structure — Ready to create
- [x] Calendar setup — Ready to configure
- [ ] GCP project creation (3 projects)
- [ ] Security settings finalization

**Checklist:**
1. Create Drive folder structure (20 min)
2. Set up Gmail filters & labels (30 min)
3. Configure calendar events (1 hour)
4. Create GCP projects (30 min)
5. Enable required APIs (1 hour)
6. Set up billing alerts (15 min)

### Phase 2: Integration (Week 3-4)
- [ ] n8n email workflows (email → Drive, email → Linear)
- [ ] Calendar sync with Linear milestones
- [ ] Analytics 4 implementation & goal setup
- [ ] Search Console verification & sitemap
- [ ] Business Profile optimization
- [ ] Security policies enforcement

### Phase 3: Expansion (Month 2+)
- [ ] Team member account setup (when hiring)
- [ ] YouTube channel creation & upload schedule
- [ ] Google Ads campaigns (when product-market fit)
- [ ] Advanced analytics dashboards
- [ ] Automated reporting to team

### Phase 4: Scale (Month 6+)
- [ ] Mobile device management
- [ ] Advanced DLP rules
- [ ] Custom role-based access controls
- [ ] Enterprise integration (Salesforce, HubSpot, etc.)

---

## QUICK REFERENCE: KEY URLs

| System | URL | Purpose |
|---|---|---|
| **Admin Console** | `https://admin.google.com` | Main workspace admin |
| **Gmail** | `https://mail.google.com/mail/u/0/#inbox` | Email |
| **Drive** | `https://drive.google.com/drive/u/0/home` | File storage |
| **Calendar** | `https://calendar.google.com/calendar/u/0/r` | Scheduling |
| **Analytics** | `https://analytics.google.com/analytics/web/` | GA4 dashboard |
| **Search Console** | `https://search.google.com/search-console/` | SEO |
| **GCP Console** | `https://console.cloud.google.com` | Cloud infrastructure |
| **Business Profile** | `https://www.google.com/business/` | Business listing |
| **Workspace Security** | `https://admin.google.com/u/2/ac/security` | Security policies |
| **Vault** | `https://admin.google.com/u/2/ac/vault` | Data archival |

---

## DOCUMENT MANAGEMENT

**This Document:**
- **File Path:** `/CLAUDE TODAY/GOOGLE-BUSINESS-CORE-STRUCTURE.md`
- **Storage:** Google Drive (Drive: 02_ENGINEERING/)
- **Last Updated:** 2026-04-13
- **Owner:** Robert Stephen Plowman (rsp@noizy.ai)
- **Version Control:** GitHub (if in repo) OR Drive version history

**Updates to This Document:**
1. Quarterly security policy review (every 3 months)
2. Team structure changes → Update section 1.2
3. New services added → Add to section 11 (Integration Map)
4. Compliance changes → Update section 12

**Review Schedule:**
- Monthly: Security policies, quota usage
- Quarterly: Service account rotation, app allowlist
- Annually: Full audit of all systems

---

## SUPPORT & TROUBLESHOOTING

### Common Issues & Solutions

**Gmail not syncing with n8n:**
1. Check service account has Gmail API enabled
2. Verify OAuth scopes in GCP
3. Check app password is correct (not password)
4. Restart n8n workflow

**Drive organization getting messy:**
1. Run monthly archive job (move old docs to 09_ARCHIVE)
2. Delete duplicates in 04_CREATIVE/
3. Consolidate versions (keep last 3)
4. Review sharing permissions (quarterly)

**GCP billing spike:**
1. Check Cloud Functions logs for errors
2. Review Pub/Sub queue sizes
3. Check for runaway processes in Cloud Run
4. Set up cost anomaly alerts

**Calendar out of sync with Linear:**
1. Check webhook configuration
2. Verify n8n workflow is running
3. Check for timezone mismatches
4. Re-test webhook endpoint

### Getting Help

**For technical issues:**
- Check GCP Cloud Logging: `https://console.cloud.google.com/logs`
- Check Gmail forwarding rules & labels
- Search Google Workspace Help: `https://support.google.com/a`

**For team support:**
- Email: team@noizy.ai
- Issue: Create Linear task with "google-workspace" tag
- Documentation: Drive: `02_ENGINEERING/Google-Workspace-Guide.md`

---

## APPENDIX: Service Checklist

### Monthly Checklist
- [ ] Review Google Workspace Security Alerts
- [ ] Check GCP billing and set budgets
- [ ] Audit team member access levels
- [ ] Review failed email filters
- [ ] Check analytics funnel performance
- [ ] Rotate API keys (every 90 days)
- [ ] Review and approve OAuth apps (quarterly)
- [ ] Archive old Drive documents

### Quarterly Checklist
- [ ] Full security audit (passwords, 2FA, apps)
- [ ] Review data retention policies
- [ ] Check Search Console crawl errors
- [ ] Update Analytics conversion goals
- [ ] Review GCP service account permissions
- [ ] Audit email forwarding rules
- [ ] Check for stale shared files
- [ ] Update this document if needed

### Annual Checklist
- [ ] Complete Workspace security audit
- [ ] Review and update all policies
- [ ] Audit all OAuth apps and remove unused ones
- [ ] Data retention & privacy compliance review
- [ ] Team training on security best practices
- [ ] Disaster recovery plan review
- [ ] Budget forecasting for next year

---

**End of Document**

*This document is the operational blueprint for NOIZY.AI's Google ecosystem. It should evolve as the company grows, but its core structure remains the foundation for how we work together, protect our data, and scale our systems.*

*Last Updated: 2026-04-13 by Robert Stephen Plowman*
