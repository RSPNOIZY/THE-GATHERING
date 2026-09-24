// Empire Status Email — Daily Report Generator
// Purpose: Generate daily NOIZY operational status email
// Output: HTML-formatted email ready for SMTP
// Created: March 30, 2026

function generateEmpireStatusEmail(date = new Date()) {
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    header {
      border-bottom: 2px solid #ffd700;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #ffd700;
      font-size: 24px;
      margin: 0 0 5px 0;
      letter-spacing: 1px;
    }
    .timestamp {
      color: #999;
      font-size: 13px;
      margin: 0;
    }
    h2 {
      color: #333;
      font-size: 16px;
      font-weight: 600;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .section {
      margin-bottom: 25px;
    }
    .status-item {
      padding: 12px;
      margin-bottom: 10px;
      background: #f9f9f9;
      border-left: 4px solid #ffd700;
      border-radius: 4px;
    }
    .status-item.complete {
      border-left-color: #4caf50;
      background: #f1f8f4;
    }
    .status-item.pending {
      border-left-color: #ff9800;
      background: #fff3f1;
    }
    .status-item.blocked {
      border-left-color: #f44336;
      background: #fde5e3;
    }
    .status-label {
      font-weight: 600;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    .status-label .badge {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
    }
    .badge.live {
      background: #4caf50;
      color: white;
    }
    .badge.ready {
      background: #2196f3;
      color: white;
    }
    .badge.pending {
      background: #ff9800;
      color: white;
    }
    .status-desc {
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    table th {
      background: #f5f5f5;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }
    table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .action-required {
      background: #fff3e0;
      border: 1px solid #ffb74d;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .action-required h3 {
      color: #e65100;
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    .action-required ul {
      margin: 0;
      padding-left: 20px;
    }
    .action-required li {
      margin-bottom: 6px;
      color: #333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚡ NOIZY Empire Status</h1>
      <p class="timestamp">${dateStr} at ${timeStr} PT</p>
    </header>

    <div class="section">
      <h2>🔴 Critical Path (April 5 Milestone)</h2>

      <div class="status-item blocked">
        <div class="status-label">
          <span>Domain Migration (GoDaddy → Cloudflare)</span>
          <span class="badge pending">In Progress</span>
        </div>
        <div class="status-desc">Email routing live on noisy.ai. SMTP outbound pending.</div>
      </div>

      <div class="status-item pending">
        <div class="status-label">
          <span>Consent Gateway Deployment</span>
          <span class="badge ready">Deploy Ready</span>
        </div>
        <div class="status-desc">Heaven17 Worker tested. D1 schema live. C2PA integration complete.</div>
      </div>

      <div class="status-item pending">
        <div class="status-label">
          <span>R2 Voice Archive Activation</span>
          <span class="badge pending">Pending</span>
        </div>
        <div class="status-desc">R2 bucket requires manual enable in Cloudflare Dashboard.</div>
      </div>

      <div class="status-item pending">
        <div class="status-label">
          <span>noisy.ai Landing Page + Demo</span>
          <span class="badge pending">Due April 5</span>
        </div>
        <div class="status-desc">Temp home page design complete. Working demo path in development.</div>
      </div>
    </div>

    <div class="section">
      <h2>✅ Operational Stack (Live)</h2>
      <table>
        <tr>
          <th>Component</th>
          <th>Status</th>
        </tr>
        <tr>
          <td><strong>Heaven17 Gateway</strong></td>
          <td>Live (Cloudflare Workers + D1)</td>
        </tr>
        <tr>
          <td><strong>NCP v1.0 Protocol</strong></td>
          <td>Complete (ready for C2PA submission)</td>
        </tr>
        <tr>
          <td><strong>Stripe Royalties</strong></td>
          <td>Live (4 tiers, 75/25 splits, payment links active)</td>
        </tr>
        <tr>
          <td><strong>Email Routing</strong></td>
          <td>Live (rsp@noisy.ai inbound, SMTP outbound pending)</td>
        </tr>
        <tr>
          <td><strong>Linear Critical Path</strong></td>
          <td>Tracked (11 issues, April 17 milestone)</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>📋 Today-Tier Actions</h2>
      <table>
        <tr>
          <th>Action</th>
          <th>Owner</th>
          <th>Due</th>
        </tr>
        <tr>
          <td>Fill Investor FAQ "ask"</td>
          <td>Rob</td>
          <td>Today</td>
        </tr>
        <tr>
          <td>Send Castle email (NO FAKES Act)</td>
          <td>Rob</td>
          <td>Today</td>
        </tr>
        <tr>
          <td>Send Rosenthol email (C2PA)</td>
          <td>Rob</td>
          <td>Today</td>
        </tr>
        <tr>
          <td>Configure SMTP (rsp@noisy.ai)</td>
          <td>Rob</td>
          <td>Today</td>
        </tr>
      </table>
    </div>

    <div class="action-required">
      <h3>⚠️ Actions Required This Week</h3>
      <ul>
        <li><strong>SSH into GOD:</strong> Activate /voice in Claude Code</li>
        <li><strong>Run MC96ECO_SETUP.sh:</strong> Environment config on GOD machine</li>
        <li><strong>Deploy consent-gateway:</strong> wrangler deploy on main branch</li>
        <li><strong>Enable R2 Storage:</strong> Cloudflare Dashboard → activate bucket</li>
        <li><strong>noizy.ai landing live:</strong> Temp page + working demo (April 5)</li>
      </ul>
    </div>

    <div class="section">
      <h2>🚀 Infrastructure State</h2>
      <table>
        <tr>
          <th>Asset</th>
          <th>Count</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>D1 Databases</td>
          <td>1</td>
          <td>gabriel_db (f75939d5...) live</td>
        </tr>
        <tr>
          <td>KV Namespaces</td>
          <td>20</td>
          <td>All operational</td>
        </tr>
        <tr>
          <td>Cloudflare Workers</td>
          <td>1</td>
          <td>consent-gateway deploy ready</td>
        </tr>
        <tr>
          <td>R2 Buckets</td>
          <td>0 / 1</td>
          <td>Pending activation</td>
        </tr>
        <tr>
          <td>Stripe Products</td>
          <td>4</td>
          <td>Live mode, all active</td>
        </tr>
        <tr>
          <td>Linear Issues</td>
          <td>11</td>
          <td>Critical path tracked</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>📞 Contact & Resources</h2>
      <ul style="list-style: none; padding: 0; color: #666; font-size: 13px;">
        <li><strong>Email:</strong> rsp@noizyfish.com</li>
        <li><strong>Domain:</strong> noisy.ai</li>
        <li><strong>Linear:</strong> https://linear.app/noizylab/project/noizy-critical-path-april-17-2026-5897795326db</li>
        <li><strong>Heaven17 Worker:</strong> heaven.rsp-5f3.workers.dev (post-deploy)</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>NOIZY Empire Status Report</strong></p>
      <p>Generated by MC96 Diagnostic Engine</p>
      <p>NOIZYFISH INC. | rsp@noizyfish.com | noizy.ai</p>
      <p style="margin-top: 15px; font-style: italic;">75% to the creator. Always.</p>
    </div>
  </div>
</body>
</html>
`;
}

// Export for Node.js usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateEmpireStatusEmail };
}

// Console output (for direct execution)
console.log(generateEmpireStatusEmail());
