#!/usr/bin/env python3
"""Import all n8n workflows from NOIZYLAB/tools/n8n_workflows/ into running n8n instance."""

import json
import os
import glob
import urllib.request

N8N_URL = "http://localhost:5678/api/v1/workflows"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OWZkN2I4Yy1jMjZhLTQ5MGQtODYyYy1mNTBiMDc4MTk0MTEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzQ0NDYzZjQtNjIxMy00NzQ3LThlZDItZjMwNTlkYTI1ZWUwIiwiaWF0IjoxNzc2MDk2NzY3fQ.q58UxDHu-Jc42T59TWJQTUx8w5ofsOakP_Lyo-Am5dU"
WORKFLOW_DIR = os.path.expanduser("~/NOIZYLAB/tools/n8n_workflows")

READONLY_FIELDS = [
    "tags", "meta", "triggerCount", "id", "updatedAt", "createdAt",
    "versionId", "active", "staticData", "pinData", "sharedWith",
    "homeProject", "usedCredentials",
]

success = 0
fail = 0

files = sorted(glob.glob(os.path.join(WORKFLOW_DIR, "*.json")))
print(f"\nFound {len(files)} workflow files\n")

for filepath in files:
    name = os.path.basename(filepath).replace(".json", "")
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Strip read-only fields
        for key in READONLY_FIELDS:
            data.pop(key, None)

        # Ensure required fields
        if "nodes" not in data:
            data["nodes"] = []
        if "connections" not in data:
            data["connections"] = {}
        if "name" not in data:
            data["name"] = name

        payload = json.dumps(data).encode("utf-8")

        req = urllib.request.Request(
            N8N_URL,
            data=payload,
            headers={
                "X-N8N-API-KEY": N8N_KEY,
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            wf_id = result.get("id", "?")
            print(f"  ✓ {name} → ID: {wf_id}")
            success += 1

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            msg = json.loads(body).get("message", body[:100])
        except:
            msg = body[:100]
        print(f"  ✗ {name} → {msg}")
        fail += 1
    except Exception as e:
        print(f"  ✗ {name} → {e}")
        fail += 1

print(f"\n{'═' * 50}")
print(f"  Imported: {success} | Failed: {fail}")
print(f"{'═' * 50}\n")
