#!/bin/bash
# NOIZY DNS Scanner — runs inside admin container
echo "═══ NOIZY DNS SCAN — $(date '+%Y-%m-%d %H:%M:%S') ═══"
echo ""

DOMAINS="noizy.ai noizyfish.com fishmusicinc.com noizykidz.com noizyvox.com"

for domain in $DOMAINS; do
  echo "── $domain ──"
  ns=$(dig "$domain" NS +short 2>/dev/null | tr '\n' ' ')
  mx=$(dig "$domain" MX +short 2>/dev/null | tr '\n' ' ')
  spf=$(dig "$domain" TXT +short 2>/dev/null | grep spf)
  dmarc=$(dig "_dmarc.$domain" TXT +short 2>/dev/null)

  if echo "$ns" | grep -q "cloudflare"; then
    echo "  NS:    ✅ Cloudflare — $ns"
  elif [ -z "$ns" ]; then
    echo "  NS:    ❌ NXDOMAIN or no NS"
  else
    echo "  NS:    ⚠️  $ns"
  fi

  if echo "$mx" | grep -q "cloudflare"; then
    echo "  MX:    ✅ CF Email Routing — $mx"
  elif echo "$mx" | grep -q "google"; then
    echo "  MX:    ✅ Google Workspace — $mx"
  elif [ -z "$mx" ]; then
    echo "  MX:    ❌ No MX records"
  else
    echo "  MX:    ⚠️  $mx"
  fi

  [ -n "$spf" ] && echo "  SPF:   ✅ $spf" || echo "  SPF:   ❌ MISSING"
  [ -n "$dmarc" ] && echo "  DMARC: ✅ $dmarc" || echo "  DMARC: ❌ MISSING"
  echo ""
done

echo "── Health Checks ──"
heaven=$(curl -s --max-time 5 https://heaven.rsp-5f3.workers.dev/health 2>/dev/null)
if echo "$heaven" | grep -q '"success"'; then
  echo "  Heaven: ✅ LIVE"
else
  echo "  Heaven: ⚠️  $(echo "$heaven" | head -c 80)"
fi

landing=$(curl -sI --max-time 5 https://noizy.ai/ 2>/dev/null | head -1)
echo "  noizy.ai: $landing"

echo ""
echo "═══ SCAN COMPLETE ═══"
