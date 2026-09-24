// NOIZYVOX Notification Hooks — Event-Triggered Alerts
// Purpose: Fire notifications on consent/payment/session events, send to empire status system
// Events: consent_granted, consent_denied, payment_received, voice_session_recorded, licensee_onboarded
// Integration: Heaven17 (consent kernel) + Stripe (payment layer) + NOIZYSTREAM (voice session)
// Created: March 30, 2026

class NOIZYVOXNotificationHooks {
  constructor(config = {}) {
    this.webhookUrl = config.webhookUrl || "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID";
    this.smtpServer = config.smtpServer || "smtp.gmail.com";
    this.smtpPort = config.smtpPort || 587;
    this.smtpUser = config.smtpUser || "rsp@noisy.ai";
    this.smtpPassword = config.smtpPassword || "YOUR_APP_PASSWORD";
    this.fromEmail = config.fromEmail || "rsp@noisy.ai";
    this.adminEmail = config.adminEmail || "rsplowman@icloud.com";
    this.notificationLog = [];
    this.eventRegistry = {};
  }

  // Register event listener (internal)
  registerEvent(eventType, handler) {
    if (!this.eventRegistry[eventType]) {
      this.eventRegistry[eventType] = [];
    }
    this.eventRegistry[eventType].push(handler);
  }

  // Core hook: consent_granted
  async onConsentGranted(consentData) {
    const event = {
      type: "consent_granted",
      timestamp: new Date().toISOString(),
      actor: consentData.actor || "unknown",
      scope: consentData.scope || "unknown",
      status: "complete"
    };

    const message = `
✅ **Consent Granted**
- Actor: ${consentData.actor}
- Scope: ${consentData.scope}
- Voice DNA: ${consentData.voiceDna || "pending"}
- Timestamp: ${event.timestamp}
    `.trim();

    await this.notify("consent_granted", message, {
      recipient: consentData.actor,
      subject: `Consent Approved: ${consentData.scope}`,
      priority: "normal"
    });

    this.notificationLog.push(event);
  }

  // Core hook: consent_denied
  async onConsentDenied(consentData) {
    const event = {
      type: "consent_denied",
      timestamp: new Date().toISOString(),
      actor: consentData.actor || "unknown",
      scope: consentData.scope || "unknown",
      reason: consentData.reason || "policy violation",
      status: "blocked"
    };

    const message = `
❌ **Consent Denied**
- Actor: ${consentData.actor}
- Scope: ${consentData.scope}
- Reason: ${consentData.reason}
- Timestamp: ${event.timestamp}
    `.trim();

    await this.notify("consent_denied", message, {
      recipient: this.adminEmail,
      subject: `Consent Denied: ${consentData.actor} — ${consentData.scope}`,
      priority: "high"
    });

    this.notificationLog.push(event);
  }

  // Core hook: payment_received
  async onPaymentReceived(paymentData) {
    const event = {
      type: "payment_received",
      timestamp: new Date().toISOString(),
      licensee: paymentData.licensee || "unknown",
      amount: paymentData.amount || 0,
      tier: paymentData.tier || "standard",
      paymentId: paymentData.paymentId || "unknown",
      status: "complete"
    };

    const message = `
💰 **Payment Received**
- Licensee: ${paymentData.licensee}
- Amount: $${paymentData.amount}
- Tier: ${paymentData.tier}
- Payment ID: ${paymentData.paymentId}
- Timestamp: ${event.timestamp}
    `.trim();

    await this.notify("payment_received", message, {
      recipient: paymentData.licensee,
      subject: `Payment Confirmed: ${paymentData.tier} License`,
      priority: "normal"
    });

    this.notificationLog.push(event);
  }

  // Core hook: voice_session_recorded
  async onVoiceSessionRecorded(sessionData) {
    const event = {
      type: "voice_session_recorded",
      timestamp: new Date().toISOString(),
      actor: sessionData.actor || "unknown",
      sessionId: sessionData.sessionId || "unknown",
      duration: sessionData.duration || 0,
      quality: sessionData.quality || "pending",
      status: "recorded"
    };

    const message = `
🎙️ **Voice Session Recorded**
- Actor: ${sessionData.actor}
- Session ID: ${sessionData.sessionId}
- Duration: ${sessionData.duration}s
- Quality: ${sessionData.quality}
- Timestamp: ${event.timestamp}
    `.trim();

    await this.notify("voice_session_recorded", message, {
      recipient: sessionData.actor,
      subject: `Voice Session Complete: ${sessionData.sessionId}`,
      priority: "normal"
    });

    this.notificationLog.push(event);
  }

  // Core hook: licensee_onboarded
  async onLicenseeOnboarded(licenseeData) {
    const event = {
      type: "licensee_onboarded",
      timestamp: new Date().toISOString(),
      licensee: licenseeData.name || "unknown",
      email: licenseeData.email || "unknown",
      tier: licenseeData.tier || "starter",
      voiceLicense: licenseeData.voiceLicense || "pending",
      status: "active"
    };

    const message = `
🎯 **New Licensee Onboarded**
- Licensee: ${licenseeData.name}
- Email: ${licenseeData.email}
- Tier: ${licenseeData.tier}
- Voice License: ${licenseeData.voiceLicense}
- Timestamp: ${event.timestamp}
    `.trim();

    await this.notify("licensee_onboarded", message, {
      recipient: this.adminEmail,
      subject: `New Licensee: ${licenseeData.name} — ${licenseeData.tier}`,
      priority: "normal"
    });

    this.notificationLog.push(event);
  }

  // Generic notify handler
  async notify(eventType, message, options = {}) {
    const { recipient, subject, priority } = options;

    // Send to Discord (if webhook configured)
    try {
      await this.sendDiscordNotification(message, priority);
    } catch (error) {
      console.error(`Discord notification failed for ${eventType}:`, error);
    }

    // Send email if recipient specified
    if (recipient) {
      try {
        await this.sendEmailNotification(recipient, subject, message);
      } catch (error) {
        console.error(`Email notification failed for ${eventType}:`, error);
      }
    }

    // Log to notification system
    this.notificationLog.push({
      eventType,
      message,
      recipient,
      timestamp: new Date().toISOString(),
      status: "sent"
    });
  }

  // Discord notification (async stub — connect to Discord webhook)
  async sendDiscordNotification(message, priority = "normal") {
    const colorMap = {
      high: 16711680,    // Red
      normal: 16776960,  // Gold
      low: 0             // Gray
    };

    const payload = {
      embeds: [
        {
          description: message,
          color: colorMap[priority] || colorMap.normal,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Replace YOUR_WEBHOOK_ID with actual Discord webhook
    if (this.webhookUrl.includes("YOUR_WEBHOOK_ID")) {
      console.log("[Discord] Webhook not configured. Skipping.");
      return;
    }

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
  }

  // Email notification (async stub — connect to SMTP)
  async sendEmailNotification(recipient, subject, message) {
    // Stub: In production, use nodemailer or similar SMTP client
    // Example (requires nodemailer):
    // const transporter = nodemailer.createTransport({
    //   host: this.smtpServer,
    //   port: this.smtpPort,
    //   secure: this.smtpPort === 465,
    //   auth: { user: this.smtpUser, pass: this.smtpPassword }
    // });
    // await transporter.sendMail({
    //   from: this.fromEmail,
    //   to: recipient,
    //   subject: subject,
    //   text: message
    // });

    console.log(`[Email] To: ${recipient} | Subject: ${subject}`);
    console.log(`[Email] Body:\n${message}\n`);
  }

  // Get notification history
  getNotificationLog(filters = {}) {
    let log = this.notificationLog;

    if (filters.eventType) {
      log = log.filter(entry => entry.eventType === filters.eventType);
    }

    if (filters.since) {
      const since = new Date(filters.since).getTime();
      log = log.filter(entry => new Date(entry.timestamp).getTime() >= since);
    }

    return log;
  }

  // Export notification summary for empire status email
  getNotificationSummary(hoursBack = 24) {
    const now = new Date().getTime();
    const cutoff = now - (hoursBack * 60 * 60 * 1000);

    const recentEvents = this.notificationLog.filter(
      event => new Date(event.timestamp).getTime() >= cutoff
    );

    const summary = {
      totalEvents: recentEvents.length,
      byType: {},
      timeRange: {
        from: new Date(cutoff).toISOString(),
        to: new Date(now).toISOString()
      }
    };

    recentEvents.forEach(event => {
      const type = event.type || event.eventType;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    return summary;
  }
}

// Export for Node.js usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NOIZYVOXNotificationHooks };
}

// Example usage (for testing)
const hooks = new NOIZYVOXNotificationHooks({
  webhookUrl: process.env.DISCORD_AUDIT_WEBHOOK || "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID",
  smtpUser: "rsp@noisy.ai",
  adminEmail: "rsplowman@icloud.com"
});

// Test: Consent granted
// hooks.onConsentGranted({
//   actor: "test_actor_001",
//   scope: "speech_to_text",
//   voiceDna: "RSP_001"
// });

// Test: Payment received
// hooks.onPaymentReceived({
//   licensee: "test_licensee@example.com",
//   amount: 99,
//   tier: "pro",
//   paymentId: "pi_test_12345"
// });

console.log("NOIZYVOX Notification Hooks ready.");
