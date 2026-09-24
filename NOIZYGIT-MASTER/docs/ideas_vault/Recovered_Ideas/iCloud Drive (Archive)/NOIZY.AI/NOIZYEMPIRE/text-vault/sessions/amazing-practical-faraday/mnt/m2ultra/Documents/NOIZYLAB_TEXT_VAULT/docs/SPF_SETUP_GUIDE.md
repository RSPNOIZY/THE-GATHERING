# SPF Setup Guide - Step by Step

## Quick Decision Tree

```
Do you send emails from GoDaddy?
├─ NO  → Use: v=spf1 include:spf.protection.outlook.com -all
└─ YES → Use: v=spf1 include:spf.protection.outlook.com include:secureserver.net -all
```

## Recommended Setup (Microsoft 365 Only)

### ✅ This is the winner - Use this!

```
v=spf1 include:spf.protection.outlook.com -all
```

**Why?**
- Clean and simple
- Corporate-ready
- Ultra-lean
- Best security
- Easier to manage

### DNS Setup

1. **Log into your DNS provider** (GoDaddy, Cloudflare, etc.)
2. **Find DNS Management / DNS Records**
3. **Add TXT Record:**
   - **Type**: `TXT`
   - **Name/Host**: `@` (or your domain name)
   - **Value**: `v=spf1 include:spf.protection.outlook.com -all`
   - **TTL**: `3600` (or default)

4. **Save and wait** (usually 5-15 minutes for propagation)

## Hybrid Setup (Microsoft 365 + GoDaddy)

### ⚠️ Only use if you actually send from GoDaddy!

```
v=spf1 include:spf.protection.outlook.com include:secureserver.net -all
```

**When to use:**
- You send emails from Microsoft 365
- AND you also send emails from GoDaddy email servers
- You've verified both are needed

**DNS Setup:**
- Same as above, but use the hybrid value

## Verification

### Check Your SPF Record

```bash
# Using dig
dig TXT yourdomain.com | grep spf

# Using nslookup
nslookup -type=TXT yourdomain.com

# Online tools
https://mxtoolbox.com/spf.aspx
https://www.spf-record.com/
```

### Expected Output

For Microsoft 365 only:
```
"v=spf1 include:spf.protection.outlook.com -all"
```

For Hybrid:
```
"v=spf1 include:spf.protection.outlook.com include:secureserver.net -all"
```

## Common Providers

### GoDaddy DNS
1. Go to GoDaddy → My Products → DNS
2. Add Record → Type: TXT
3. Name: `@`
4. Value: `v=spf1 include:spf.protection.outlook.com -all`
5. Save

### Cloudflare
1. Go to Cloudflare Dashboard → DNS
2. Add Record → Type: TXT
3. Name: `@`
4. Content: `v=spf1 include:spf.protection.outlook.com -all`
5. Save

### Namecheap
1. Go to Domain List → Manage → Advanced DNS
2. Add New Record → Type: TXT Record
3. Host: `@`
4. Value: `v=spf1 include:spf.protection.outlook.com -all`
5. Save

## Testing

### Test Email Delivery
1. Send test email from Microsoft 365
2. Check headers for SPF pass
3. Verify no bounce messages

### SPF Check Tools
- **MXToolbox**: https://mxtoolbox.com/spf.aspx
- **SPF Record Checker**: https://www.spf-record.com/
- **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/

## Troubleshooting

### SPF Not Working?
1. Wait 15-30 minutes for DNS propagation
2. Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
3. Verify record with `dig` command
4. Check for typos in the record

### Multiple SPF Records?
- **Problem**: You can only have ONE SPF record
- **Solution**: Combine includes into one record
- **Example**: `v=spf1 include:spf.protection.outlook.com include:secureserver.net -all`

### Record Too Long?
- SPF records must be under 255 characters
- Your records are well under this limit ✅

## Tools

### SPF Manager
```bash
cd ~/NOIZYLAB/email-intelligence
python3 spf-manager.py
```

### DNS Security Manager
```bash
python3 dns-security-manager.py
```

## Next Steps

1. ✅ Set up SPF (you're doing this now)
2. ⏳ Add DKIM records (from Microsoft 365 Admin)
3. ⏳ Add DMARC policy
4. ⏳ Monitor email delivery

---

**Remember: Start simple with Microsoft 365 only. Add GoDaddy only if you actually need it!** 🎯

