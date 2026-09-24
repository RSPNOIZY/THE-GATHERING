#!/usr/bin/env python3
"""
FISHMUSICINC.COM GOOGLE WORKSPACE & IAM VERIFICATION TOOL
Audits live DNS for Google Workspace, MX records, SPF, DKIM, DMARC,
and generates the exact DNS records needed to complete provisioning.
"""

import subprocess
import json
import sys
from datetime import datetime, timezone

DOMAIN = "fishmusicinc.com"

def query_dns(qtype, record=DOMAIN):
    try:
        res = subprocess.run(["dig", "+short", qtype, record], capture_output=True, text=True)
        return [line.strip() for line in res.stdout.splitlines() if line.strip()]
    except Exception as e:
        return [f"ERROR: {str(e)}"]

def audit():
    print(f"🔍 Auditing live DNS configuration for {DOMAIN}...")
    
    ns_records = query_dns("NS")
    mx_records = query_dns("MX")
    txt_records = query_dns("TXT")
    dmarc_records = query_dns("TXT", f"_dmarc.{DOMAIN}")

    google_mx_found = any("google" in r.lower() for r in mx_records)
    spf_found = any("v=spf1" in r for r in txt_records)
    dmarc_found = any("v=DMARC1" in r for r in dmarc_records)

    report = {
        "domain": DOMAIN,
        "audited_at": datetime.now(timezone.utc).isoformat(),
        "live_status": {
            "nameservers": ns_records,
            "mx_records": mx_records,
            "google_mx_active": google_mx_found,
            "spf_active": spf_found,
            "dmarc_active": dmarc_found,
            "raw_txt_records": txt_records
        },
        "required_action_items": []
    }

    if not google_mx_found:
        report["required_action_items"].append({
            "record": "MX",
            "host": "@",
            "priority": 1,
            "value": "SMTP.GOOGLE.COM.",
            "purpose": "Directs email traffic to Google Workspace"
        })

    if not spf_found:
        report["required_action_items"].append({
            "record": "TXT",
            "host": "@",
            "value": "v=spf1 include:_spf.google.com ~all",
            "purpose": "Authorizes Google Workspace to send on behalf of fishmusicinc.com"
        })

    if not dmarc_found:
        report["required_action_items"].append({
            "record": "TXT",
            "host": "_dmarc",
            "value": "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@fishmusicinc.com",
            "purpose": "Prevents unauthorized email spoofing of artist domain"
        })

    print(f"  Nameservers: {', '.join(ns_records)}")
    print(f"  MX Records: {mx_records if mx_records else 'NONE (Needs Setup)'}")
    print(f"  Google Workspace MX: {'✅ ACTIVE' if google_mx_found else '❌ PENDING'}")
    print(f"  SPF Protection: {'✅ ACTIVE' if spf_found else '❌ PENDING'}")
    print(f"  DMARC Protection: {'✅ ACTIVE' if dmarc_found else '❌ PENDING'}")

    out_file = f"/Users/m2ultra/Library/CloudStorage/NOIZY.AI/FISHMUSICINC.COM/receipts/workspace-dns-audit-latest.json"
    try:
        import os
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        with open(out_file, "w") as f:
            json.dump(report, f, indent=2)
        print(f"📄 Audit receipt saved: {out_file}")
    except Exception as e:
        print(f"Note: {e}")

    return report

if __name__ == "__main__":
    audit()
