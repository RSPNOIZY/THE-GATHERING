# 🚀 NoizyLab Slack & Network Agent - Quick Start Guide

Complete guide to get Slack integration and DGS1210 network monitoring running in minutes.

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```bash
# Slack Integration
cd /Users/m2ultra/NOIZYLAB/integrations/slack
pip3 install -r requirements.txt

# Network Agent
cd /Users/m2ultra/NOIZYLAB/network
pip3 install -r requirements.txt
```

### Step 2: Configure Slack (2 minutes)

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app called "NoizyLab Portal"
3. Add Bot Token Scopes: `chat:write`, `channels:read`, `users:read`
4. Install to workspace
5. Copy Bot Token and Signing Secret

```bash
# Add to ~/.zshrc or ~/.bashrc
export SLACK_BOT_TOKEN="xoxb-your-token-here"
export SLACK_SIGNING_SECRET="your-signing-secret-here"

# Reload
source ~/.zshrc
```

### Step 3: Start Services (2 minutes)

```bash
# Terminal 1: Start Slack Integration
cd /Users/m2ultra/NOIZYLAB/integrations/slack
./start_slack_services.sh

# Terminal 2: Start Network Agent
cd /Users/m2ultra/NOIZYLAB/network
./start_network_agent.sh

# Terminal 3: Start Master Dashboard
cd /Users/m2ultra/NOIZYLAB/master-dashboard
streamlit run master-dashboard.py
```

### Step 4: Test It! (1 minute)

```bash
# Send test Slack message
curl -X POST http://localhost:8003/notify/system-alert \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "message": "NoizyLab is online!", "level": "success"}'

# Check network agent
curl http://localhost:8005/health | jq

# Now plug something into your DGS1210 switch and watch Slack! 🎉
```

## 🎯 What You Get

### Automatic Device Detection
- Plug device into DGS1210 switch
- Agent detects within 1 second
- Slack notification sent instantly
- Auto-handshake executed
- Device registered and ready

### Slack Notifications For:
- ✅ System status updates
- 🔌 Device connections/disconnections
- 🤝 Handshake results
- 📧 Email events
- ⚠️ System alerts
- 📊 Service status changes

### MC96 Auto-Handshake
- Detects MC96 devices on configured ports
- Executes custom MC96 handshake protocol
- Sends initialization commands
- Registers device for management
- Notifies via Slack

## 📊 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Master Dashboard** | http://localhost:8501 | Main control panel |
| **Slack Dashboard** | http://localhost:8506 | Slack management UI |
| **Slack API** | http://localhost:8003 | Slack integration API |
| **Network Agent API** | http://localhost:8005 | Network monitoring API |

## 💡 Common Use Cases

### 1. Monitor MC96 Devices

Configure MC96 ports:
```bash
export MC96_PORTS="1,2,3"
```

Now when you plug MC96 into ports 1, 2, or 3:
- Instant detection
- Custom MC96 handshake
- Slack notification
- Device ready to use

### 2. Send Custom Alerts

```python
from integrations.slack.slack_notifier import alert

alert("Deployment complete!", "success")
alert("High CPU usage detected", "warning")
alert("Service crashed!", "error")
```

### 3. Monitor All Network Events

```python
from integrations.slack.slack_notifier import network_event

network_event("connected", "MacBook Pro", {
    "Port": "5",
    "IP": "192.168.1.50",
    "Status": "Online"
})
```

### 4. System Status Updates

```python
from integrations.slack.slack_notifier import system_status

system_status({
    "Email API": "running",
    "Database": "healthy",
    "Disk Space": "85% used",
    "Memory": "62% used"
})
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for Slack
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_SIGNING_SECRET="..."

# Optional Slack Channels
export SLACK_ALERTS_CHANNEL="#noizylab-alerts"
export SLACK_MONITORING_CHANNEL="#noizylab-monitor"
export SLACK_EMAIL_CHANNEL="#noizylab-email"
export SLACK_NETWORK_CHANNEL="#noizylab-network"

# Optional Network Configuration
export DGS1210_IP="192.168.1.1"
export SNMP_COMMUNITY="public"
export MC96_PORTS="1,2,3"
```

### Add to Startup

Add to `~/.zshrc`:
```bash
# NoizyLab Configuration
export SLACK_BOT_TOKEN="xoxb-your-token"
export SLACK_SIGNING_SECRET="your-secret"
export DGS1210_IP="192.168.1.1"
export MC96_PORTS="1,2,3"
```

## 🎬 Real-World Example

Let's say you turn on an MC96 device and plug it into port 1:

**Second 0**: You plug in the cable

**Second 1**: 
- Agent detects link up
- Slack: "🔌 Device connected to port 1"

**Second 2-3**:
- Agent scans for device
- Finds MAC address
- Resolves IP address

**Second 4**:
- Slack: "🔍 Discovering device on port 1..."

**Second 5-7**:
- Executes MC96 handshake
  - Ping check ✅
  - HTTP check ✅  
  - API check ✅
  - Send init command ✅

**Second 8**:
- Slack: "🤝 Handshake successful!"
- Full device details displayed
- Device ready to use

**Total time: 8 seconds from plug-in to ready!**

## 📱 Slack Commands (Optional)

After configuring slash commands in Slack:

```
/noizylab-status          → View system status
/noizylab-services        → Manage services
/noizylab-notify message  → Send alert
/noizylab-logs service    → View logs
/noizylab-deploy component → Deploy
```

## 🐛 Troubleshooting

### Slack Not Working?

```bash
# Check token
echo $SLACK_BOT_TOKEN

# Test connection
curl http://localhost:8003/health

# Check logs
tail -f integrations/slack/*.log
```

### Network Agent Not Detecting?

```bash
# Check agent status
curl http://localhost:8005/health

# Verify switch IP
ping $DGS1210_IP

# Test SNMP
snmpwalk -v2c -c public $DGS1210_IP
```

### No Notifications?

```bash
# Verify Slack service
curl http://localhost:8003/health

# Check bot is in channel
# Invite bot: /invite @NoizyLab Portal

# Send test
curl -X POST http://localhost:8003/notify/system-alert \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello"}'
```

## 🎓 Next Steps

1. **Customize Channels**: Set up dedicated Slack channels
2. **Configure MC96 Ports**: Specify which ports are for MC96
3. **Add More Services**: Integrate with email, monitoring, etc.
4. **Set Up Webhooks**: For external notifications
5. **Create Custom Alerts**: Build your own notification logic

## 📚 Full Documentation

- [Slack Integration README](/Users/m2ultra/NOIZYLAB/integrations/slack/README.md)
- [Network Agent README](/Users/m2ultra/NOIZYLAB/network/README.md)
- Master Dashboard: http://localhost:8501

## 🎉 You're Ready!

Your NoizyLab portal now has:
- ✅ Slack integration with rich notifications
- ✅ Automatic device detection on DGS1210
- ✅ MC96 auto-handshake system
- ✅ Real-time network monitoring
- ✅ Unified dashboard
- ✅ Complete API access

Just plug in a device and watch the magic happen! 🚀

---

**Questions? Check the full READMEs or the Master Dashboard at http://localhost:8501**

