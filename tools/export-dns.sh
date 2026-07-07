#!/bin/bash

# 🚀 NOIZYLAB DNS EXPORT SCRIPT
# Automates DNS export from GoDaddy domains and generates Cloudflare import format
# Usage: bash export-dns.sh

echo "=================================="
echo "🚀 NOIZYLAB DNS EXPORT TOOL"
echo "=================================="
echo ""

# Define your domains
DOMAINS=("noizy.ai" "fishmusicinc.com" "noizyfish.com")
OUTPUT_DIR="dns-exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "📋 PHASE 1: DNS RECORD ENUMERATION"
echo "===================================="
echo ""

for domain in "${DOMAINS[@]}"; do
    echo "🔍 Querying $domain..."
    
    OUTPUT_FILE="$OUTPUT_DIR/${domain}_records_${TIMESTAMP}.txt"
    
    # Get all DNS record types
    {
        echo "# DNS Records for $domain - Exported $(date)"
        echo "# Source: GoDaddy (requires manual export from dashboard)"
        echo ""
        
        echo "## Nameservers"
        nslookup -type=NS $domain | grep nameserver
        echo ""
        
        echo "## A Records"
        dig +short A $domain
        echo ""
        
        echo "## AAAA Records (IPv6)"
        dig +short AAAA $domain
        echo ""
        
        echo "## CNAME Records"
        dig +short CNAME $domain
        echo ""
        
        echo "## MX Records (Mail)"
        dig +short MX $domain
        echo ""
        
        echo "## TXT Records (SPF, DKIM, DMARC)"
        dig +short TXT $domain
        echo ""
        
        echo "## SOA Record"
        dig +short SOA $domain
        echo ""
        
    } > "$OUTPUT_FILE"
    
    echo "✅ Exported to: $OUTPUT_FILE"
    echo ""
done

echo ""
echo "=================================="
echo "📋 PHASE 2: COMPLETE DNS DUMP"
echo "===================================="
echo ""

for domain in "${DOMAINS[@]}"; do
    echo "🔍 Full dig output for $domain..."
    
    OUTPUT_FILE="$OUTPUT_DIR/${domain}_full-dig_${TIMESTAMP}.txt"
    
    dig $domain @8.8.8.8 +noall +answer > "$OUTPUT_FILE"
    
    echo "✅ Exported to: $OUTPUT_FILE"
done

echo ""
echo "=================================="
echo "🎯 PHASE 3: GODADDY EXPORT GUIDE"
echo "===================================="
echo ""
cat << 'EOF'

❌ MANUAL STEP REQUIRED - GoDaddy Dashboard Export:

You'll need to manually export DNS records from GoDaddy because:
- GoDaddy doesn't expose DNS via API for security reasons
- You need to verify actual hostnames and configurations

📌 DO THIS FOR EACH DOMAIN (noizy.ai, fishmusicinc.com, noizyfish.com):

1. Go to https://www.godaddy.com/
2. Sign in → Products → Domains
3. Click the domain name
4. Under "DNS Records" tab:
   ✅ Take a screenshot of ALL records OR
   ✅ Use browser Inspector (F12) → Copy the HTML table
5. Create a file: domain_godaddy_export.txt

📋 Records to capture for each domain:
   - Name (subdomain)
   - Type (A, CNAME, MX, TXT, etc.)
   - Value (IP, hostname, etc.)
   - TTL (Time to Live)
   - Priority (for MX records)

Once you have this, I can help convert it to Cloudflare format!

EOF

echo ""
echo "=================================="
echo "✅ PHASE 4: WHAT'S NEXT?"
echo "===================================="
echo ""
cat << 'EOF'

1. ✅ Auto-exported DNS queries stored in: $OUTPUT_DIR/
2. ⚠️  NOW: Manually export from GoDaddy dashboard
3. ⚠️  THEN: Create conversion script for Cloudflare import

Commands to try manually:
- nslookup noizy.ai
- dig noizy.ai MX
- dig fishmusicinc.com ALL
- dig noizyfish.com +trace (shows full DNS path)

EOF

echo ""
echo "Export complete! Check $OUTPUT_DIR/"
