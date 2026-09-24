#!/bin/bash
# 🍎 FISHMUSICINC.COM → APPLE iCLOUD DNS FIX
# Run on M2Ultra or MacPro

#############################################
# CONFIGURATION - FILL THESE IN
#############################################

# Get from: dash.cloudflare.com/profile/api-tokens
CF_API_TOKEN="PASTE_YOUR_TOKEN_HERE"

# Get from: Cloudflare → fishmusicinc.com → Overview → right sidebar → Zone ID
CF_ZONE_ID="PASTE_YOUR_ZONE_ID_HERE"

# Get from: iPad → Settings → Apple ID → iCloud → Custom Email Domain → fishmusicinc.com
APPLE_DOMAIN_CODE="PASTE_APPLE_VERIFICATION_CODE"
APPLE_DKIM="PASTE_DKIM_CNAME_VALUE"

#############################################
# NUKE ALL EXISTING RECORDS
#############################################

echo "🗑️  NUKING ALL DNS RECORDS..."

RECORDS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

for RECORD_ID in $RECORDS; do
  curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" > /dev/null
  echo "  ☠️  Deleted: $RECORD_ID"
done

echo "✅ ALL RECORDS NUKED"
echo ""

#############################################
# ADD APPLE iCLOUD RECORDS
#############################################

echo "🍎 ADDING APPLE iCLOUD RECORDS..."

# MX 1
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"MX","name":"@","content":"mx01.mail.icloud.com","priority":10,"proxied":false}' > /dev/null
echo "  ✅ MX → mx01.mail.icloud.com"

# MX 2
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"MX","name":"@","content":"mx02.mail.icloud.com","priority":20,"proxied":false}' > /dev/null
echo "  ✅ MX → mx02.mail.icloud.com"

# SPF
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"@","content":"v=spf1 include:icloud.com ~all"}' > /dev/null
echo "  ✅ TXT → SPF for iCloud"

# Apple Domain Verification
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"TXT\",\"name\":\"@\",\"content\":\"apple-domain=$APPLE_DOMAIN_CODE\"}" > /dev/null
echo "  ✅ TXT → Apple domain verification"

# DKIM
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"sig1._domainkey\",\"content\":\"$APPLE_DKIM\",\"proxied\":false}" > /dev/null
echo "  ✅ CNAME → DKIM signature"

echo ""
echo "🍎 DONE!"
echo ""

#############################################
# VERIFY
#############################################

echo "🔍 VERIFYING..."
echo ""
echo "MX Records:"
dig fishmusicinc.com MX +short
echo ""
echo "TXT Records:"
dig fishmusicinc.com TXT +short
echo ""
echo "🍎 GORUNFREE - fishmusicinc.com → iCloud"
