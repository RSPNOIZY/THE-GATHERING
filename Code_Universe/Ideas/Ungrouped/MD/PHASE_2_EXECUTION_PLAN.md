# ⚡ PHASE 2: RESTORATION, CONSOLIDATION & HARDENING
## NOIZYLAB Domain Liberation - Execution Plan
**Status:** ACTIVE | **Date:** March 29, 2026 | **Objective:** Full Cloudflare Enterprise Consolidation

---

## 🎯 STRATEGIC DIRECTIVE: ALL FOUR OPERATIONS

This phase executes all four critical operations in parallel:

1. ✅ **Restore noizy.ai** → Point to Cloudflare nameservers
2. ✅ **Verify Enterprise** → Confirm plan level for existing 2 domains
3. ✅ **Consolidate** → Single Enterprise account (all 3 domains)
4. ✅ **Harden Security** → WAF/DDoS/SSL enabled globally

---

## 🚀 STRATEGY 1: RESTORE noizy.ai TO CLOUDFLARE

### Current State
```
noizy.ai Status:  NO NAMESERVERS CONFIGURED
Result:           SERVFAIL (domain unreachable)
Registrar:        GoDaddy
Action:           SET NAMESERVERS → CLOUDFLARE
```

### Restoration Steps (Manual at GoDaddy)

**Step 1: Access GoDaddy Domain Settings**
```
1. Go to https://www.godaddy.com/
2. Sign in with your GoDaddy account
3. Click "Products" → "Domains"
4. Click "noizy.ai" domain
```

**Step 2: Update Nameservers**
```
1. Find "Nameservers" or "DNS" section
2. Click "Change" or "Edit"
3. Replace current nameservers with Cloudflare defaults:

   OPTION A: Standard Cloudflare (Use these for now)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NS1: ns1.cloudflare.com
   NS2: ns2.cloudflare.com
   
   OPTION B: After Enterprise activated (better)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   (Cloudflare will provide custom ones after you add noizy.ai)
```

**Step 3: Save Changes**
```
- Click "Save" or "Update"
- GoDaddy will confirm change
- Wait 5-10 minutes for processing
```

### Verification
```bash
# After 5 minutes, run:
nslookup -type=NS noizy.ai

# Should show:
# noizy.ai        nameserver = ns1.cloudflare.com.
# noizy.ai        nameserver = ns2.cloudflare.com.

# Test resolution:
dig noizy.ai @ns1.cloudflare.com +short
```

---

## ☁️ STRATEGY 2: VERIFY CLOUDFLARE ENTERPRISE STATUS

### Current Domains on Cloudflare
- ✅ fishmusicinc.com (ACTIVE)
- ✅ noizyfish.com (ACTIVE)
- ⏳ noizy.ai (PENDING RESTORATION)

### How to Check Enterprise Status

**Option A: Cloudflare Dashboard (Easiest)**
```
1. Go to https://dash.cloudflare.com
2. Log in to your Cloudflare account
3. Select a domain (e.g., fishmusicinc.com)
4. Look for "Plan" information:
   - If you see "Enterprise" → ✅ GOOD
   - If you see "Pro", "Free", etc. → ⚠️ NEED UPGRADE
5. Repeat for noizyfish.com
```

**Option B: Domain Details**
```
1. For each domain in Cloudflare:
2. Go to Overview page
3. Look at right sidebar for "Plan" badge
4. Check if it says "Enterprise"
```

**Option C: Account Settings** (Find Dedicated Account Manager)
```
1. Go to https://dash.cloudflare.com
2. Click avatar (bottom left)
3. Click "Account"
4. Look for "Plan" or "Billing" section
5. If you see "Dedicated Support" → Usually ✅ Enterprise
```

### What to Do If NOT Enterprise

**If current plan is NOT Enterprise:**

```
STEP 1: Contact Cloudflare Enterprise Sales
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phone:  +1-888-99-CLOUDFLARE
Email:  enterprise@cloudflare.com
Web:    https://www.cloudflare.com/plans/enterprise/

STEP 2: Provide Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "I have 3 domains (noizy.ai, fishmusicinc.com, noizyfish.com)"
- "Currently on fishmusicinc.com & noizyfish.com"
- "Want to upgrade to Enterprise"
- "Need to consolidate all 3 under single account"

STEP 3: Complete Sales Process
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Meet with Cloudflare Enterprise team
- Discuss custom pricing (if applicable)
- Sign contract
- Account upgraded to Enterprise
```

---

## 🧬 STRATEGY 3: CONSOLIDATE ALL 3 UNDER SINGLE ENTERPRISE ACCOUNT

### Current State Assessment
```
fishmusicinc.com
    └─ Cloudflare Account: [UNKNOWN - VERIFY]
    
noizyfish.com
    └─ Cloudflare Account: [UNKNOWN - VERIFY]
    
noizy.ai
    └─ Cloudflare Account: [NONE - NEEDS ADDING]
```

### Consolidation Strategy

**SCENARIO A: All 3 Already in Same Cloudflare Account** ✅
```
If fishmusicinc.com & noizyfish.com are in SAME account:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Add noizy.ai to that existing account
2. Verify all 3 show in Cloudflare dashboard
3. Upgrade account to Enterprise (if not already)
4. Done! All consolidated.
```

**SCENARIO B: All 3 in DIFFERENT Cloudflare Accounts** ⚠️
```
If 2+ domains in DIFFERENT accounts:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Consolidation requires account merger or re-add
2. Contact Cloudflare support for guidance
3. Typically:
   a) Identify primary account (where noizy.ai will go)
   b) Remove domains from other accounts
   c) Add all 3 to primary account
   d) Migrate DNS records if needed
```

### How to Add noizy.ai (After Restoration)

**Step 1: In Cloudflare Dashboard**
```
1. Go to https://dash.cloudflare.com
2. Click "+ Add a Site"
3. Enter: noizy.ai
4. Click "Add Site"
```

**Step 2: Choose Plan**
```
1. Select "Enterprise" (or appropriate plan)
2. Continue
```

**Step 3: Scan DNS Records**
```
1. Cloudflare scans current records
2. Review the records it finds
3. Click "Continue"
```

**Step 4: Get Nameservers**
```
1. Cloudflare provides custom nameservers for noizy.ai
2. Take note:
   NS1: ns[X].cloudflare.com
   NS2: ns[Y].cloudflare.com
3. DON'T use generic ns1/ns2 (use Cloudflare-provided ones)
```

**Step 5: Update GoDaddy**
```
1. Return to GoDaddy domain settings for noizy.ai
2. Update nameservers with Cloudflare-provided ones
3. Save changes
4. Wait 24-48 hours for propagation
```

---

## 🔒 STRATEGY 4: HARDEN SECURITY - WAF/DDoS/SSL FOR ALL DOMAINS

### Security Hardening Checklist

**For EACH domain (noizy.ai, fishmusicinc.com, noizyfish.com):**

#### ✅ SSL/TLS Configuration
```
Location: Cloudflare Dashboard → Domain → SSL/TLS

1. Click "SSL/TLS" tab
2. Under "Overview":
   - Encryption mode: Select "Full (Strict)" 
     (NOT "Flexible" - that's insecure)
     
3. Under "Edge Certificates":
   - Enable "Always Use HTTPS" ✅
   
4. Under "Firewall Settings":
   - Enable "Automatic HTTPS Rewrites" ✅
   - Enable "Opportunistic Encryption" ✅
   
5. Verify status shows "✅ Your site is protected"
```

**Expected Result:**
- All traffic → HTTPS (encrypted)
- SSL/TLS certificate: ✅ Valid Cloudflare certificate
- No "Not Secure" warnings

#### ✅ Web Application Firewall (WAF)
```
Location: Cloudflare Dashboard → Domain → Security → WAF

1. Click "WAF" tab (or "Web Application Firewall")

2. Enable WAF Rules:
   - Click "Managed Rules" or "Ruleset"
   - Select "Cloudflare Managed Ruleset" (or similar)
   - Enable the ruleset
   
3. Set Sensitivity Level:
   - For production: "Medium" (good balance)
   - For strict: "High" (more blocks, fewer false positives)
   
4. Custom Rules:
   - Block common attack patterns
   - Whitelist known good traffic (if needed)
   
5. Monitor: Check "Security Events" dashboard
```

**Expected Result:**
- Malicious traffic: 🚫 BLOCKED
- Good traffic: ✅ PASSING
- Attack logs: 📊 VISIBLE in dashboard

#### ✅ DDoS Protection
```
Location: Cloudflare Dashboard → Domain → Security → DDoS

1. Click "DDoS Protection" tab

2. Verify Status:
   - Should already be enabled (default for Enterprise)
   - If not: Enable it
   
3. DDoS Sensitivity:
   - Default: "High" (recommended)
   - Setting affects how aggressively attacks are blocked
   
4. Advanced (if available):
   - Rate limiting: Enable if needed
   - Bot Management: Enable for extra protection
   
5. Monitor: Check "Analytics" → "DDoS Report"
```

**Expected Result:**
- DDoS attacks: 🚫 BLOCKED automatically
- Legitimate traffic: ✅ PASSES through
- Attack statistics: 📊 VISIBLE in analytics

#### ✅ Firewall Rules (Additional Layer)
```
Location: Cloudflare Dashboard → Domain → Security → Firewall Rules

1. Create rules to:
   - Block known malicious IPs
   - Rate limit excessive requests
   - Block access by geography (if needed)
   - Challenge suspicious traffic
   
Example rule:
   IF: Request count > 100 per minute
   THEN: Challenge with CAPTCHA
   
   IF: Country = [suspicious]
   THEN: Block
```

### Quick Hardening Script (Reference)

```bash
# This is a REFERENCE showing what needs to be done
# Actual execution requires Cloudflare API or dashboard

# Pseudo-code for hardening:
for domain in noizy.ai fishmusicinc.com noizyfish.com; do
  echo "Hardening $domain..."
  
  # Set SSL to Full Strict
  cf_update_ssl $domain "Full (Strict)"
  
  # Enable Always Use HTTPS
  cf_enable_always_https $domain true
  
  # Enable WAF
  cf_enable_waf $domain true
  cf_set_waf_level $domain "medium"
  
  # Enable DDoS (usually default, but verify)
  cf_enable_ddos $domain true
  
  # Enable automatic HTTPS rewrites
  cf_enable_https_rewrites $domain true
  
  echo "✅ $domain hardened"
done
```

---

## 📋 EXECUTION CHECKLIST: ALL STRATEGIES

### Strategy 1: Restore noizy.ai
- [ ] Access GoDaddy domain settings
- [ ] Update nameservers to Cloudflare
- [ ] Wait 5 minutes for GoDaddy processing
- [ ] Verify with `nslookup -type=NS noizy.ai`
- [ ] Confirm: `dig noizy.ai +short` returns Cloudflare IPs

### Strategy 2: Verify Enterprise Status
- [ ] Log in to Cloudflare dashboard
- [ ] Check fishmusicinc.com plan level
- [ ] Check noizyfish.com plan level
- [ ] If NOT Enterprise: Contact Cloudflare sales
- [ ] Document current plan for each domain

### Strategy 3: Consolidate to Single Account
- [ ] Determine: Are 2+ domains in different accounts?
- [ ] If yes: Merge or consolidate accounts
- [ ] Add noizy.ai to primary Cloudflare account
- [ ] Verify all 3 show in single dashboard
- [ ] Document consolidated account ID

### Strategy 4: Harden Security
- [ ] noizy.ai: Set SSL to Full (Strict)
- [ ] noizy.ai: Enable Always Use HTTPS
- [ ] noizy.ai: Enable WAF (Medium sensitivity)
- [ ] noizy.ai: Enable DDoS protection
- [ ] fishmusicinc.com: Repeat all above
- [ ] noizyfish.com: Repeat all above
- [ ] Verify: Check Security Events dashboard for each
- [ ] Test: Try suspicious traffic (should be blocked)

---

## 🚨 CRITICAL TIMING

### Immediate (Today)
1. Restore noizy.ai nameservers (GoDaddy manual)
2. Start Cloudflare Enterprise upgrade process (if needed)
3. Verify existing 2 domains' current status

### Short Term (This Week)
4. Add noizy.ai to Cloudflare (after nameservers updated)
5. Consolidate all 3 to single Enterprise account
6. Enable security features on all 3 domains

### Verification (Next 24-48 Hours)
7. Monitor DNS propagation for noizy.ai
8. Test SSL certificates on all 3
9. Verify WAF/DDoS active
10. Global DNS propagation check

---

## 📊 EXPECTED FINAL STATE

**After All 4 Strategies Complete:**

```
NOIZYLAB INFRASTRUCTURE (LIBERATED)
════════════════════════════════════════════

Registrar: GoDaddy (all 3 domains)

DNS Provider: Cloudflare Enterprise (all 3 consolidated)
  ├─ noizy.ai
  │  └─ Nameservers: Cloudflare custom NS
  │  └─ Status: ✅ Resolving globally
  │  └─ SSL: ✅ Full Strict
  │  └─ WAF: ✅ Enabled (Medium)
  │  └─ DDoS: ✅ Protected
  │
  ├─ fishmusicinc.com
  │  └─ Nameservers: alex.ns.cloudflare.com, melinda.ns.cloudflare.com
  │  └─ Status: ✅ Resolving globally
  │  └─ SSL: ✅ Full Strict
  │  └─ WAF: ✅ Enabled (Medium)
  │  └─ DDoS: ✅ Protected
  │
  └─ noizyfish.com
     └─ Nameservers: adam.ns.cloudflare.com, sandy.ns.cloudflare.com
     └─ Status: ✅ Resolving globally
     └─ SSL: ✅ Full Strict
     └─ WAF: ✅ Enabled (Medium)
     └─ DDoS: ✅ Protected

Plan Level: Enterprise (all 3)
Account: Single consolidated Cloudflare Enterprise account
Support: 24/7 priority support (included)
Advanced Features: ✅ All enabled

Azure Resources: NONE (cleaned)
GoDaddy DNS: REMOVED (delegated to Cloudflare)

RESULT: Complete liberation achieved. Full security hardening active.
```

---

## 🔥 NEXT STEPS

1. **Execute Strategy 1 NOW:** Restore noizy.ai nameservers at GoDaddy
2. **Execute Strategy 2 TODAY:** Verify Enterprise status in Cloudflare
3. **Execute Strategy 3 THIS WEEK:** Add noizy.ai to consolidate
4. **Execute Strategy 4 THIS WEEK:** Harden all domains with WAF/DDoS/SSL

---

**Status: READY FOR TOTAL DEPLOYMENT**

All four strategies documented and ready for immediate execution. 🚀
