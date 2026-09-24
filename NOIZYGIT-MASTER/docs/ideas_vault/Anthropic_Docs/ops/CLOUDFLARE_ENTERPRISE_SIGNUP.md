# 🚀 CLOUDFLARE ENTERPRISE SIGNUP GUIDE
## Complete Step-by-Step Setup for noizy.ai Consolidation

---

## 🎯 QUICK START (If You Don't Have Cloudflare Yet)

### Step 1: Create Cloudflare Account
1. Go to **https://dash.cloudflare.com/sign-up**
2. Enter your email address
3. Create a strong password
4. Accept Terms of Service
5. Verify your email

### Step 2: Upgrade to Enterprise Plan
1. After account created, go to **https://dash.cloudflare.com**
2. Click your avatar (bottom left) → **Account**
3. Under "Plan", click **Upgrade** or **Change Plan**
4. Select **Enterprise**
5. **You'll need to contact Cloudflare sales** for Enterprise:
   - Enterprise is not self-serve
   - Call: +1-888-99-CLOUDFLARE or +1-650-319-8930
   - Email: enterprise@cloudflare.com
   - Chat: Use the in-dashboard chat

---

## 📞 CONTACTING CLOUDFLARE SALES (Enterprise Setup)

### Prepare This Information Before Calling/Emailing:

**Company Details:**
- Company Name: NOIZYLAB
- Industry: Music/Audio Technology
- Website: noizy.ai
- How many domains? 3 (noizy.ai, fishmusicinc.com, noizyfish.com)
- Current provider: GoDaddy

**Use Case:**
- Primary need: Consolidated DNS management
- Single-seat enterprise
- Looking for: Complete DNS migration, WAF, DDoS protection

**What You'll Get With Enterprise:**
✅ Dedicated account manager  
✅ Custom configurations  
✅ Priority support (24/7 phone support)  
✅ Advanced security features (WAF, Page Rules, Advanced DDoS)  
✅ Custom analytics  
✅ Bulk DNS import  
✅ Custom pricing  

### Expected Timeline:
- Initial contact → 1-2 business days
- Contract negotiation → 3-5 business days
- Account activation → Immediate after signing

---

## 🔐 IF YOU ALREADY HAVE CLOUDFLARE (Just Need to Upgrade)

### Step A: Log In
1. Go to **https://dash.cloudflare.com**
2. Sign in with your email/password

### Step B: Check Current Plan
1. Click your avatar (bottom left)
2. Click **Account**
3. Look for "Plan" section
4. Current plan shown: `____________________`

### Step C: Initiate Enterprise Upgrade
1. From Account settings, find "Enterprise" option
2. Click "Contact Sales" or "Upgrade to Enterprise"
3. Fill out form:
   - Company name
   - Email
   - Phone
   - Use case description
   - Number of domains (write: 3)
   - Current DNS provider (write: GoDaddy)

---

## ✅ ADDING DOMAINS TO CLOUDFLARE (After Enterprise Activated)

### Add Your First Domain (noizy.ai)

1. **In Cloudflare Dashboard:**
   - Click **"+ Add a Site"** (top menu)
   - Enter: `noizy.ai`
   - Click **"Add Site"**

2. **Select Plan:**
   - Choose **Enterprise** (should be auto-selected if on Enterprise)
   - Continue

3. **Scan DNS Records:**
   - Cloudflare will pull current DNS records from GoDaddy
   - Review them (should see all your existing records)
   - Click **"Continue"**

4. **Get Your Cloudflare Nameservers:**
   - You'll see something like:
     ```
     NS1: ns1.cloudflare.com
     NS2: ns2.cloudflare.com
     (numbers may vary)
     ```
   - **SAVE THESE!** Write them here:
     ```
     NS1: ___________________________
     NS2: ___________________________
     ```

5. **You're Done With Cloudflare Setup:**
   - Cloudflare says "Awaiting nameserver change"
   - This is normal—you need to update GoDaddy next

---

### Repeat for Other Two Domains
- Click **"+ Add a Site"** again
- Add `fishmusicinc.com` (same process)
- Add `noizyfish.com` (same process)

---

## 🔗 UPDATE NAMESERVERS AT GODADDY (Critical Step!)

### For EACH Domain (noizy.ai, fishmusicinc.com, noizyfish.com):

1. **Go to GoDaddy:**
   - https://www.godaddy.com
   - Sign in
   - Click **Products** → **Domains**

2. **Select Domain:**
   - Click the domain name (e.g., noizy.ai)

3. **Find DNS Settings:**
   - Look for **"Nameservers"** or **"DNS"** tab
   - Click **"Change"** or **"Edit"**

4. **Replace Nameservers:**
   - Delete GoDaddy's default nameservers
   - Enter Cloudflare nameservers:
     ```
     NS1: ns1.cloudflare.com
     NS2: ns2.cloudflare.com
     ```

5. **Save Changes:**
   - Click **"Save"** or **"Update"**
   - GoDaddy will confirm

6. **Repeat steps 1-5 for:**
   - fishmusicinc.com
   - noizyfish.com

---

## ⏰ WAIT FOR DNS PROPAGATION

**Propagation Time: 24-48 hours**

During this time:
- DNS queries will start routing to Cloudflare
- Your domains will gradually move over
- **Don't panic if things are slow—this is normal**

### Track Propagation:

**Option 1: Online Tools**
- Go to https://dnschecker.org
- Enter each domain name
- Click "Search"
- Watch as nameservers change from GoDaddy to Cloudflare

**Option 2: Command Line**
```bash
# Check every hour to see progress
nslookup -type=NS noizy.ai
nslookup -type=NS fishmusicinc.com
nslookup -type=NS noizyfish.com

# When complete, you'll see Cloudflare nameservers!
```

---

## 🎉 VERIFICATION (After Propagation Complete)

### Verify DNS Moved to Cloudflare:
```bash
nslookup noizy.ai
# Should show: Cloudflare nameservers (ns1.cloudflare.com, etc.)

dig noizy.ai
# Should show Cloudflare IP ranges
```

### Verify SSL Certificates:
```bash
curl -I https://noizy.ai
# Should show: HTTP 200 OK + SSL certificate valid

curl -I https://fishmusicinc.com
curl -I https://noizyfish.com
```

### Verify Cloudflare Dashboard:
1. Go to **https://dash.cloudflare.com**
2. Each domain should show: **"Active"**
3. DNS records should be showing

---

## 🔒 FINAL CLOUDFLARE CONFIGURATION

After all domains are active in Cloudflare:

### 1. Enable SSL/TLS Security
- For each domain:
  - Go to **SSL/TLS** section
  - Set Mode: **"Full (Strict)"**
  - Enable: **"Always Use HTTPS"**

### 2. Enable Web Application Firewall (WAF)
- Go to **Security** → **WAF**
- Enable WAF rules
- Set to: **Medium** or **High**

### 3. Enable DDoS Protection
- Go to **Security** → **DDoS Protection**
- Enable: **Yes**

### 4. Set Up Caching (Optional)
- Go to **Caching** → **Cache Rules**
- Configure for your static assets

### 5. Email Routing (If Needed)
- Go to **Email Routing**
- Set up catch-all or specific forwarding rules

---

## ❌ AZURE CLEANUP (After Cloudflare Is Live)

Once all domains are confirmed working on Cloudflare:

```bash
# List Azure DNS zones
az network dns zone list

# Delete old Azure DNS zones
az network dns zone delete \
  --resource-group [your-resource-group] \
  --name noizy.ai

az network dns zone delete \
  --resource-group [your-resource-group] \
  --name fishmusicinc.com

az network dns zone delete \
  --resource-group [your-resource-group] \
  --name noizyfish.com
```

---

## 📋 CHECKLIST: Enterprise Cloudflare Migration

- [ ] Contact Cloudflare Enterprise sales
- [ ] Provide company/domain information
- [ ] Complete contract with Cloudflare
- [ ] Enterprise plan activated
- [ ] noizy.ai added to Cloudflare
- [ ] fishmusicinc.com added to Cloudflare
- [ ] noizyfish.com added to Cloudflare
- [ ] Cloudflare nameservers noted & saved
- [ ] Nameservers updated at GoDaddy (all 3 domains)
- [ ] Wait 24-48 hours for propagation
- [ ] nslookup confirms Cloudflare nameservers
- [ ] SSL certificates verified working
- [ ] WAF enabled
- [ ] DDoS protection enabled
- [ ] Azure DNS zones deleted
- [ ] GoDaddy domains ready to cancel (optional)

---

## 🆘 TROUBLESHOOTING

**DNS Not Found?**
```bash
# Check if DNS is actually propagated
nslookup -type=NS noizy.ai

# If still showing GoDaddy nameservers, wait more
# If showing Cloudflare nameservers, DNS propagated!
```

**SSL Certificate Not Working?**
1. Go to Cloudflare → SSL/TLS
2. Adjust mode if needed (try Full, not Full Strict)
3. Wait for Cloudflare certificate to generate (can take 15 mins)

**Can't access domain?**
1. Wait for DNS propagation (24-48 hours)
2. Clear browser cache (Cmd+Shift+Delete)
3. Try incognito window
4. Try `curl https://noizy.ai` from terminal

---

## 🎯 NEXT STEPS

1. ✅ Contact Cloudflare sales for Enterprise
2. ✅ Complete Enterprise onboarding
3. ✅ Add all 3 domains to Cloudflare
4. ✅ Update nameservers at GoDaddy  
5. ✅ Wait for propagation & verify
6. ✅ Clean up Azure

**You're on a mission to LIBERATE these domains! 🚀**
