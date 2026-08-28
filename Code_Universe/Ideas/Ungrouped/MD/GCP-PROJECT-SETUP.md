# GCP Project Setup Guide for NOIZY.AI

**Author:** Robert Stephen Plowman  
**Date:** 2026-04-13  
**Purpose:** Creating and configuring Google Cloud Platform projects for NOIZY.AI infrastructure

---

## 1. GCP Organization Setup

### Link Google Workspace Domain to GCP Organization

NOIZY.AI uses the `noizy.ai` Google Workspace domain. To integrate this with GCP:

1. **Create or Verify GCP Organization:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **IAM & Admin** → **Settings**
   - Verify that an Organization resource exists for your domain
   - If not, create one by accessing **Manage Resources** and following the prompts

2. **Verify Domain Ownership:**
   - In Google Cloud Console, go to **IAM & Admin** → **Organization Settings**
   - Click the edit pencil next to your organization name
   - Ensure `noizy.ai` is verified in Google Search Console
   - Add TXT record to your DNS: `google-site-verification=<verification-code>`

3. **Link Google Workspace Billing:**
   - Workspace admins go to [admin.google.com](https://admin.google.com)
   - Navigate to **Billing** → **Manage Billing**
   - Ensure the Workspace account has a billing relationship with GCP organization
   - This requires domain verification to be complete

### Set Up Billing Account

```bash
# List existing billing accounts
gcloud billing accounts list

# Create a new billing account (if needed)
# You'll be prompted for payment method details
gcloud billing accounts create \
  --display-name="NOIZY.AI Production Billing" \
  --country-code=US

# Link billing account to organization
# REPLACE BILLING_ACCOUNT_ID and ORG_ID with actual values
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="NOIZY.AI Monthly Budget" \
  --budget-amount=5000 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Create Organization-Level IAM Policies

```bash
# Set organization ID variable
export ORG_ID="YOUR_ORG_ID"  # e.g., 1234567890

# Grant organization admin role
gcloud organizations add-iam-policy-binding ${ORG_ID} \
  --member=user:robert@noizy.ai \
  --role=roles/resourcemanager.organizationAdmin

# Grant project creator role to engineering team
gcloud organizations add-iam-policy-binding ${ORG_ID} \
  --member=group:engineering@noizy.ai \
  --role=roles/resourcemanager.projectCreator

# Grant billing account user role
gcloud organizations add-iam-policy-binding ${ORG_ID} \
  --member=group:engineering@noizy.ai \
  --role=roles/billing.admin

# Enforce security policies at organization level
# Require 2FA for all users (optional but recommended)
gcloud org-policies delete \
  constraints/iam.disableServiceAccountCreation \
  --organization=${ORG_ID} || true
```

---

## 2. Project Creation Strategy

### Recommended Project Structure

NOIZY.AI uses a three-tier project structure for clear separation of environments:

- **noizy-production** - Production services and data
- **noizy-staging** - Pre-production testing and validation
- **noizy-dev** - Development and experimentation

### Create Projects with gcloud

```bash
# Set variables
export ORG_ID="YOUR_ORG_ID"
export BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID"

# Create production project
gcloud projects create noizy-production \
  --organization=${ORG_ID} \
  --name="NOIZY.AI Production" \
  --labels=environment=production,team=platform

# Create staging project
gcloud projects create noizy-staging \
  --organization=${ORG_ID} \
  --name="NOIZY.AI Staging" \
  --labels=environment=staging,team=platform

# Create development project
gcloud projects create noizy-dev \
  --organization=${ORG_ID} \
  --name="NOIZY.AI Development" \
  --labels=environment=development,team=platform

# Link billing accounts to each project
gcloud billing projects link noizy-production \
  --billing-account=${BILLING_ACCOUNT_ID}

gcloud billing projects link noizy-staging \
  --billing-account=${BILLING_ACCOUNT_ID}

gcloud billing projects link noizy-dev \
  --billing-account=${BILLING_ACCOUNT_ID}

# Set default project (for your terminal session)
gcloud config set project noizy-production
```

### Enable Required APIs

For each project, enable the necessary GCP APIs:

```bash
# Function to enable all required APIs in a project
enable_apis() {
  local PROJECT=$1
  echo "Enabling APIs in project: ${PROJECT}"
  
  gcloud services enable \
    --project=${PROJECT} \
    cloudfunctions.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com \
    pubsub.googleapis.com \
    identitytoolkit.googleapis.com \
    iam.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com
}

# Enable APIs in all three projects
enable_apis noizy-production
enable_apis noizy-staging
enable_apis noizy-dev
```

**API Descriptions:**

| API | Purpose |
|-----|---------|
| Cloud Functions | Serverless event-driven functions |
| Cloud Run | Container-based serverless workloads |
| Cloud Storage | Object storage for files and data |
| BigQuery | Data warehouse and analytics |
| Secret Manager | Secure storage for API keys and secrets |
| Cloud Build | CI/CD pipeline automation |
| Pub/Sub | Event messaging and streaming |
| Identity Platform | User authentication and identity |
| Compute Engine | Virtual machines and networking |
| Service Networking | VPC peering and private service connections |

### Set Up VPC and Networking Basics

```bash
# Create custom VPC network
gcloud compute networks create noizy-network \
  --subnet-mode=custom \
  --project=noizy-production

# Create subnets for different purposes
gcloud compute networks subnets create noizy-primary-subnet \
  --network=noizy-network \
  --region=us-central1 \
  --range=10.0.0.0/20 \
  --project=noizy-production

gcloud compute networks subnets create noizy-secondary-subnet \
  --network=noizy-network \
  --region=us-west1 \
  --range=10.1.0.0/20 \
  --project=noizy-production

# Create Cloud NAT for outbound traffic
gcloud compute routers create noizy-router \
  --network=noizy-network \
  --region=us-central1 \
  --project=noizy-production

gcloud compute routers nats create noizy-nat \
  --router=noizy-router \
  --auto-allocate-nat-external-ips \
  --nat-all-subnet-ip-ranges \
  --region=us-central1 \
  --project=noizy-production

# Create firewall rule to allow internal traffic
gcloud compute firewall-rules create noizy-allow-internal \
  --network=noizy-network \
  --allow=tcp,udp,icmp \
  --source-ranges=10.0.0.0/8 \
  --project=noizy-production
```

---

## 3. Service Accounts

Service accounts enable secure authentication for different components of NOIZY.AI infrastructure.

### Create Service Accounts

```bash
# Variables
export PROJECT_ID=noizy-production

# Service account for n8n integration
gcloud iam service-accounts create n8n-integration \
  --display-name="N8N Integration Service Account" \
  --description="Authenticates n8n workflows with GCP services" \
  --project=${PROJECT_ID}

# Service account for CI/CD pipeline
gcloud iam service-accounts create cicd-pipeline \
  --display-name="CI/CD Pipeline Service Account" \
  --description="Used by Cloud Build for deployment automation" \
  --project=${PROJECT_ID}

# Service account for HEAVEN webhook callbacks
gcloud iam service-accounts create heaven-webhook \
  --display-name="HEAVEN Webhook Callback Service Account" \
  --description="Handles incoming webhook callbacks from external integrations" \
  --project=${PROJECT_ID}
```

### Assign Minimal IAM Roles (Principle of Least Privilege)

```bash
export PROJECT_ID=noizy-production

# N8N Integration - needs Pub/Sub, Secret Manager, Cloud Functions access
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/pubsub.editor

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/cloudfunctions.invoker

# CI/CD Pipeline - needs Cloud Build, Container Registry, Cloud Run
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:cicd-pipeline@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/cloudbuild.builds.editor

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:cicd-pipeline@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/run.developer

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:cicd-pipeline@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/storage.admin

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:cicd-pipeline@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/servicemanagement.admin

# HEAVEN Webhook - needs Pub/Sub and Cloud Functions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/pubsub.publisher

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/cloudfunctions.invoker
```

### Generate and Store Keys Securely

```bash
export PROJECT_ID=noizy-production

# Generate key for n8n integration (store in Secret Manager)
gcloud iam service-accounts keys create /tmp/n8n-key.json \
  --iam-account=n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com

# Create secret in Secret Manager
gcloud secrets create n8n-service-account-key \
  --replication-policy="automatic" \
  --data-file=/tmp/n8n-key.json \
  --project=${PROJECT_ID}

# Generate key for CI/CD pipeline
gcloud iam service-accounts keys create /tmp/cicd-key.json \
  --iam-account=cicd-pipeline@${PROJECT_ID}.iam.gserviceaccount.com

gcloud secrets create cicd-service-account-key \
  --replication-policy="automatic" \
  --data-file=/tmp/cicd-key.json \
  --project=${PROJECT_ID}

# Generate key for HEAVEN webhook
gcloud iam service-accounts keys create /tmp/heaven-key.json \
  --iam-account=heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com

gcloud secrets create heaven-webhook-service-account-key \
  --replication-policy="automatic" \
  --data-file=/tmp/heaven-key.json \
  --project=${PROJECT_ID}

# Securely cleanup temporary files
shred -vfz /tmp/*-key.json 2>/dev/null || rm -f /tmp/*-key.json

# Grant service accounts access to their own secrets
gcloud secrets add-iam-policy-binding n8n-service-account-key \
  --member=serviceAccount:n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor \
  --project=${PROJECT_ID}
```

---

## 4. GCP Permission Fix (Common Issues)

### Common Error: "Permission denied" on Project Creation

**Error Message:**
```
ERROR: (gcloud.projects.create) User does not have permission 
roles/resourcemanager.projectCreator on organization [ORG_ID]
```

**Solution:**

```bash
# Ensure your user account has necessary roles at organization level
export ORG_ID="YOUR_ORG_ID"

gcloud organizations add-iam-policy-binding ${ORG_ID} \
  --member=user:robert@noizy.ai \
  --role=roles/resourcemanager.projectCreator \
  --condition=None

# Also ensure billing account user role
gcloud billing accounts add-iam-policy-binding BILLING_ACCOUNT_ID \
  --member=user:robert@noizy.ai \
  --role=roles/billing.user
```

### Common Error: Organization Policy Constraints

**Error Message:**
```
FAILED_PRECONDITION: Organization policy [policy_name] prevents this action
```

**Solution:**

```bash
# List all organization policies
gcloud resource-manager org-policies list \
  --organization=${ORG_ID}

# If policy is blocking project creation, review or disable it
# (This requires Organization Admin permissions)
gcloud resource-manager org-policies delete \
  constraints/compute.skipDefaultNetworkCreation \
  --organization=${ORG_ID}
```

### Common Error: Billing Account Not Linked

**Error Message:**
```
INVALID_ARGUMENT: Billing account for project [PROJECT_ID] is not set
```

**Solution:**

```bash
# Verify billing account exists and is active
gcloud billing accounts list --format=table

# Link billing account to project
gcloud billing projects link noizy-production \
  --billing-account=BILLING_ACCOUNT_ID

# Verify the link
gcloud billing projects describe noizy-production
```

### Service Account Key Management Best Practices

```bash
# List all keys for a service account
gcloud iam service-accounts keys list \
  --iam-account=n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com

# Rotate keys regularly (delete old ones)
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com

# Set key expiration alerts (monitor key age)
gcloud iam service-accounts keys list \
  --iam-account=n8n-integration@${PROJECT_ID}.iam.gserviceaccount.com \
  --format="table(name,validAfterTime,validBeforeTime)"
```

### Domain Verification Requirements

For services that need to verify ownership (Search Console, Gmail API):

```bash
# Add verification TXT record to your DNS provider
# Example format:
# google-site-verification=abc123xyz...

# Verify in Google Search Console
gcloud dns record-sets create noizy.ai. \
  --rrdatas="google-site-verification=YOUR_VERIFICATION_CODE" \
  --ttl=300 \
  --type=TXT \
  --zone=your-zone-name
```

---

## 5. Integration with NOIZY Connector Hub

### Architecture Overview

NOIZY.AI uses GCP services as a backend to the Integration Plane, with Cloudflare Workers serving as the frontend. Data flows through this architecture:

```
External Service → Cloud Run Webhook Handler → Pub/Sub → Cloud Functions → Data Processing → BigQuery
                                                   ↓
                                            Cloudflare Workers
```

### Pub/Sub as Event Bridge

Pub/Sub acts as the event backbone, connecting GCP services with external systems via Cloudflare Workers.

```bash
# Create Pub/Sub topics for NOIZY components
export PROJECT_ID=noizy-production

# Create topic for integration events
gcloud pubsub topics create noizy-integration-events \
  --project=${PROJECT_ID}

# Create topic for webhook callbacks (HEAVEN)
gcloud pubsub topics create heaven-webhook-events \
  --project=${PROJECT_ID}

# Create topic for n8n workflow triggers
gcloud pubsub topics create n8n-workflow-events \
  --project=${PROJECT_ID}

# Create subscriptions for processing
gcloud pubsub subscriptions create integration-processor \
  --topic=noizy-integration-events \
  --push-endpoint=https://integration-processor-RANDOM.cloudfunctions.net/process \
  --push-auth-service-account=heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com \
  --project=${PROJECT_ID}
```

### Cloud Functions as Webhook Handlers

```bash
# Example Cloud Function to receive webhooks
cat > /tmp/main.py << 'EOF'
import functions_framework
from google.cloud import pubsub_v1
import json

@functions_framework.http
def webhook_handler(request):
    """HTTP Cloud Function to handle incoming webhooks"""
    request_json = request.get_json()
    
    # Publish to Pub/Sub for asynchronous processing
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(
        'noizy-production', 
        'heaven-webhook-events'
    )
    
    # Convert message to JSON and encode
    data = json.dumps(request_json).encode('utf-8')
    future = publisher.publish(topic_path, data=data)
    
    return {
        'status': 'received',
        'message_id': future.result()
    }, 202

EOF

# Deploy the Cloud Function
gcloud functions deploy webhook-handler \
  --runtime=python39 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=webhook_handler \
  --service-account=heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com \
  --source=/tmp \
  --project=${PROJECT_ID}
```

### Secret Manager for API Key Storage

```bash
# Store external API keys securely
gcloud secrets create external-api-keys \
  --replication-policy="automatic" \
  --project=${PROJECT_ID}

# Grant Cloud Functions access to secrets
gcloud secrets add-iam-policy-binding external-api-keys \
  --member=serviceAccount:heaven-webhook@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor \
  --project=${PROJECT_ID}

# Access secrets in Cloud Functions code
cat > /tmp/function.py << 'EOF'
from google.cloud import secretmanager

def get_secret(secret_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()
    project_id = "noizy-production"
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode('UTF-8')

EOF
```

---

## Summary of Commands

Quick reference for setting up a complete NOIZY.AI GCP environment:

```bash
#!/bin/bash
# Complete setup script
export ORG_ID="YOUR_ORG_ID"
export BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID"
export PROJECT_ID="noizy-production"

# Create projects
for project in production staging dev; do
  gcloud projects create noizy-${project} \
    --organization=${ORG_ID} \
    --labels=environment=${project},team=platform
  gcloud billing projects link noizy-${project} \
    --billing-account=${BILLING_ACCOUNT_ID}
done

# Enable APIs
for project in production staging dev; do
  gcloud services enable cloudfunctions.googleapis.com run.googleapis.com \
    storage.googleapis.com bigquery.googleapis.com secretmanager.googleapis.com \
    cloudbuild.googleapis.com pubsub.googleapis.com identitytoolkit.googleapis.com \
    --project=noizy-${project}
done

# Create service accounts
gcloud iam service-accounts create n8n-integration \
  --display-name="N8N Integration" --project=${PROJECT_ID}
gcloud iam service-accounts create cicd-pipeline \
  --display-name="CI/CD Pipeline" --project=${PROJECT_ID}
gcloud iam service-accounts create heaven-webhook \
  --display-name="HEAVEN Webhook" --project=${PROJECT_ID}

echo "GCP infrastructure setup complete!"
```

---

**End of Document**
