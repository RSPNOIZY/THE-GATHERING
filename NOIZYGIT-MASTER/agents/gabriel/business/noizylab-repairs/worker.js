// NOIZYLAB CPU Repair Service - Cloudflare Worker
// Target: 12 repairs/day @ $89 = $256K+ annual revenue

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Routes
      switch (true) {
        case path === '/' || path === '':
          return new Response(landingPage(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders },
          });

        case path === '/api/intake' && request.method === 'POST':
          return await handleIntake(request, env, corsHeaders);

        case path === '/api/status':
          return await getRepairStatus(url, env, corsHeaders);

        case path === '/api/dashboard':
          return await getDashboard(env, corsHeaders);

        case path === '/health':
          return json({ status: 'ok', service: 'noizylab-repairs', timestamp: new Date().toISOString() }, corsHeaders);

        default:
          return json({ error: 'Not Found' }, corsHeaders, 404);
      }
    } catch (error) {
      return json({ error: error.message }, corsHeaders, 500);
    }
  },
};

// Utility functions
function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function generateTicket() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ticket = 'NZ-';
  for (let i = 0; i < 6; i++) {
    ticket += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ticket;
}

// Handle new repair intake
async function handleIntake(request, env, corsHeaders) {
  const data = await request.json();
  const ticket = generateTicket();
  const now = new Date().toISOString();

  // Validate required fields
  if (!data.name || !data.email || !data.device_type || !data.issue_description) {
    return json({ error: 'Missing required fields: name, email, device_type, issue_description' }, corsHeaders, 400);
  }

  // Insert into D1
  await env.DB.prepare(`
    INSERT INTO repairs (ticket_id, customer_name, customer_email, customer_phone, device_type, device_model, issue_description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'intake', ?, ?)
  `).bind(
    ticket,
    data.name,
    data.email,
    data.phone || null,
    data.device_type,
    data.device_model || null,
    data.issue_description,
    now,
    now
  ).run();

  // Store in KV for quick access
  await env.SUBMISSIONS.put(`repair:${ticket}`, JSON.stringify({
    ticket,
    name: data.name,
    email: data.email,
    status: 'intake',
    created: now,
  }), { expirationTtl: 86400 * 90 }); // 90 days

  return json({
    success: true,
    ticket,
    message: `Repair ticket ${ticket} created. We'll contact you within 24 hours.`,
    status_url: `/api/status?ticket=${ticket}`,
  }, corsHeaders);
}

// Get repair status
async function getRepairStatus(url, env, corsHeaders) {
  const ticket = url.searchParams.get('ticket');
  if (!ticket) {
    return json({ error: 'Missing ticket parameter' }, corsHeaders, 400);
  }

  // Try KV first (faster)
  const cached = await env.SUBMISSIONS.get(`repair:${ticket}`);
  if (cached) {
    return json(JSON.parse(cached), corsHeaders);
  }

  // Fall back to D1
  const result = await env.DB.prepare(
    'SELECT ticket_id, customer_name, device_type, status, created_at, updated_at FROM repairs WHERE ticket_id = ?'
  ).bind(ticket).first();

  if (!result) {
    return json({ error: 'Ticket not found' }, corsHeaders, 404);
  }

  return json(result, corsHeaders);
}

// Dashboard data
async function getDashboard(env, corsHeaders) {
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_repairs,
      SUM(CASE WHEN status = 'intake' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'completed' THEN 89 ELSE 0 END) as revenue
    FROM repairs
    WHERE created_at >= date('now', '-30 days')
  `).first();

  const recent = await env.DB.prepare(`
    SELECT ticket_id, customer_name, device_type, status, created_at
    FROM repairs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  return json({
    stats: stats || { total_repairs: 0, pending: 0, in_progress: 0, completed: 0, revenue: 0 },
    recent: recent.results || [],
    target: { daily: 12, price: 89, annual: 256000 },
  }, corsHeaders);
}

// Landing page HTML
function landingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOIZYLAB - CPU Repair Service</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #00ff88, #00ccff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .tagline { color: #888; font-size: 1.2rem; margin-bottom: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; color: #ccc; }
    input, select, textarea { width: 100%; padding: 1rem; border: 1px solid #333; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 1rem; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #00ff88; }
    textarea { min-height: 120px; resize: vertical; }
    button { width: 100%; padding: 1rem 2rem; background: linear-gradient(135deg, #00ff88, #00ccff); border: none; border-radius: 8px; color: #000; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
    button:hover { transform: scale(1.02); }
    .price { text-align: center; margin: 2rem 0; padding: 1.5rem; background: #1a1a1a; border-radius: 8px; }
    .price-amount { font-size: 2.5rem; font-weight: 700; color: #00ff88; }
    .result { margin-top: 2rem; padding: 1.5rem; background: #1a2a1a; border: 1px solid #00ff88; border-radius: 8px; display: none; }
    .result.show { display: block; }
    .result h3 { color: #00ff88; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>NOIZYLAB</h1>
    <p class="tagline">Professional CPU Repair Service</p>
    
    <div class="price">
      <div class="price-amount">$89</div>
      <div>Flat rate • Most repairs same day</div>
    </div>

    <form id="intake-form">
      <div class="form-group">
        <label for="name">Your Name *</label>
        <input type="text" id="name" name="name" required>
      </div>
      
      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required>
      </div>
      
      <div class="form-group">
        <label for="phone">Phone</label>
        <input type="tel" id="phone" name="phone">
      </div>
      
      <div class="form-group">
        <label for="device_type">Device Type *</label>
        <select id="device_type" name="device_type" required>
          <option value="">Select device...</option>
          <option value="desktop">Desktop PC</option>
          <option value="laptop">Laptop</option>
          <option value="mac">Mac</option>
          <option value="server">Server</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="device_model">Device Model</label>
        <input type="text" id="device_model" name="device_model" placeholder="e.g., Dell XPS 15, MacBook Pro 2021">
      </div>
      
      <div class="form-group">
        <label for="issue_description">Describe the Issue *</label>
        <textarea id="issue_description" name="issue_description" required placeholder="What's happening? When did it start?"></textarea>
      </div>
      
      <button type="submit">Submit Repair Request</button>
    </form>

    <div id="result" class="result">
      <h3>✓ Request Submitted!</h3>
      <p id="result-message"></p>
      <p id="result-ticket"></p>
    </div>
  </div>

  <script>
    document.getElementById('intake-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        device_type: form.device_type.value,
        device_model: form.device_model.value,
        issue_description: form.issue_description.value,
      };
      
      try {
        const res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        
        if (result.success) {
          document.getElementById('result-message').textContent = result.message;
          document.getElementById('result-ticket').textContent = 'Ticket: ' + result.ticket;
          document.getElementById('result').classList.add('show');
          form.reset();
        } else {
          alert(result.error || 'Something went wrong');
        }
      } catch (err) {
        alert('Network error. Please try again.');
      }
    });
  </script>
</body>
</html>`;
}
