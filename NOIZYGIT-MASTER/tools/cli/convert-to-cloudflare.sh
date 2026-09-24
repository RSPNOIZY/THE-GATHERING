#!/bin/bash

# 🔄 GODADDY → CLOUDFLARE DNS CONVERTER
# Converts GoDaddy DNS export to Cloudflare bulk upload format
# Usage: bash convert-to-cloudflare.sh <godaddy-export-file>

if [ -z "$1" ]; then
    echo "❌ Usage: bash convert-to-cloudflare.sh <godaddy-export-file>"
    echo ""
    echo "Example: bash convert-to-cloudflare.sh noizy.ai_godaddy_records.txt"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${INPUT_FILE%.txt}_cloudflare-import.txt"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ File not found: $INPUT_FILE"
    exit 1
fi

echo "🔄 Converting GoDaddy DNS records to Cloudflare format..."
echo "Input: $INPUT_FILE"
echo "Output: $OUTPUT_FILE"
echo ""

# Cloudflare expects this format:
# type,name,content,ttl,priority

cat > "$OUTPUT_FILE" << 'EOF'
type,name,content,ttl,priority
EOF

# Parse and convert (this assumes a specific GoDaddy export format)
# Adjust regex based on actual GoDaddy export format

awk -F',' '
NR > 1 {
    # Skip empty lines
    if (NF == 0) next
    
    # GoDaddy format typically:
    # Name,Type,Value,TTL,Priority (adjust to match your export)
    
    name = $1
    type = $2
    value = $3
    ttl = $4
    priority = $5
    
    # Clean up fields
    gsub(/^[ \t]+|[ \t]+$/, "", name)
    gsub(/^[ \t]+|[ \t]+$/, "", type)
    gsub(/^[ \t]+|[ \t]+$/, "", value)
    gsub(/^[ \t]+|[ \t]+$/, "", ttl)
    gsub(/^[ \t]+|[ \t]+$/, "", priority)
    
    # Convert @ to root (Cloudflare uses @ for root)
    if (name == "@" || name == "") name = "@"
    
    # Default TTL if missing
    if (ttl == "" || ttl == "0") ttl = "3600"
    
    # Handle priority for MX/SRV records
    if (tolower(type) ~ /^(MX|SRV)$/) {
        if (priority == "" || priority == "0") priority = "10"
        printf "%s,%s,%s,%s,%s\n", type, name, value, ttl, priority
    } else {
        printf "%s,%s,%s,%s\n", type, name, value, ttl
    }
}
' "$INPUT_FILE" >> "$OUTPUT_FILE"

echo "✅ Conversion complete!"
echo ""
echo "📋 Output file: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Review $OUTPUT_FILE for accuracy"
echo "2. Go to Cloudflare Dashboard → DNS → Import via TXT"
echo "3. Upload the CSV file: $OUTPUT_FILE"
echo ""
cat "$OUTPUT_FILE"
