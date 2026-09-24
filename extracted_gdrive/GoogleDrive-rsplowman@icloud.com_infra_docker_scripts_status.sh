#!/bin/bash
# NOIZY Empire Status — runs inside admin container
echo "═══ NOIZY EMPIRE STATUS — $(date '+%Y-%m-%d %H:%M:%S') ═══"
echo ""

echo "── Wrangler ──"
npx wrangler whoami 2>/dev/null || echo "  ⚠️  Not authenticated"
echo ""

echo "── Terraform ──"
if [ -f /workspace/infra/terraform/terraform.tfstate ]; then
  echo "  State: exists"
  terraform -chdir=/workspace/infra/terraform output 2>/dev/null
else
  echo "  State: not initialized"
fi
echo ""

echo "── Heaven ──"
curl -s --max-time 5 https://heaven.rsp-5f3.workers.dev/health 2>/dev/null | jq . 2>/dev/null || echo "  Unreachable"
echo ""

echo "── Domain Registrars ──"
for domain in noizy.ai noizyfish.com fishmusicinc.com; do
  registrar=$(whois "$domain" 2>/dev/null | grep -i "registrar:" | head -1)
  echo "  $domain: $registrar"
done
echo ""

echo "═══ STATUS COMPLETE ═══"
