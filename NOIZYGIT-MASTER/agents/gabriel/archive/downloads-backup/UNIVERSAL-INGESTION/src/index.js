// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║  🌌 NOIZYLAB UNIVERSAL INGESTION                                              ║
// ║  Multi-Source • Multi-Format • AI Classification • Knowledge Lake            ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (request.method === "OPTIONS") return cors();
    
    const requestId = crypto.randomUUID().slice(0, 8);
    
    try {
      // Dashboard & Health
      if (path === "/" || path === "/dashboard") return dashboard();
      if (path === "/health") return health(env);
      if (path === "/status") return getStatus(env);
      
      // Ingestion endpoints
      if (path === "/ingest" && request.method === "POST") return ingestContent(request, env, requestId);
      if (path === "/ingest/batch" && request.method === "POST") return batchIngest(request, env, requestId);
      if (path === "/ingest/url" && request.method === "POST") return ingestFromUrl(request, env, requestId);
      if (path === "/ingest/webhook" && request.method === "POST") return ingestWebhook(request, env, requestId);
      
      // Knowledge Lake queries
      if (path === "/knowledge/search") return searchKnowledge(request, env);
      if (path === "/knowledge/query") return queryKnowledge(request, env);
      if (path === "/knowledge/similar") return findSimilar(request, env);
      if (path.match(/^\/knowledge\/[\w-]+$/)) return getKnowledgeItem(path, env);
      if (path.match(/^\/knowledge\/[\w-]+$/) && request.method === "DELETE") return deleteKnowledgeItem(path, env);
      
      // Schema & Classification
      if (path === "/schemas") return listSchemas();
      if (path === "/classifiers") return listClassifiers();
      if (path === "/classify" && request.method === "POST") return classifyContent(request, env);
      
      // Analytics
      if (path === "/analytics") return getAnalytics(env);
      if (path === "/analytics/sources") return getSourceStats(env);
      if (path === "/analytics/types") return getTypeStats(env);
      
      // Streams
      if (path === "/streams") return listStreams(env);
      if (path === "/streams/create" && request.method === "POST") return createStream(request, env);
      
      return json({ error: "Not found", request_id: requestId }, 404);
    } catch (e) {
      return json({ error: e.message, request_id: requestId }, 500);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📥 CONTENT INGESTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const CONTENT_TYPES = {
  // Text types
  text: { parser: "text", searchable: true, icon: "📄" },
  markdown: { parser: "markdown", searchable: true, icon: "📝" },
  html: { parser: "html", searchable: true, icon: "🌐" },
  
  // Code types
  code: { parser: "code", searchable: true, icon: "💻" },
  javascript: { parser: "code", language: "javascript", searchable: true, icon: "🟨" },
  python: { parser: "code", language: "python", searchable: true, icon: "🐍" },
  json: { parser: "json", searchable: true, icon: "📋" },
  yaml: { parser: "yaml", searchable: true, icon: "⚙️" },
  
  // Document types
  document: { parser: "document", searchable: true, icon: "📑" },
  email: { parser: "email", searchable: true, icon: "📧" },
  
  // Data types
  csv: { parser: "csv", searchable: false, icon: "📊" },
  log: { parser: "log", searchable: true, icon: "📜" },
  
  // AI types
  conversation: { parser: "conversation", searchable: true, icon: "💬" },
  prompt: { parser: "prompt", searchable: true, icon: "🎯" },
  completion: { parser: "completion", searchable: true, icon: "✨" },
  
  // Media references
  image: { parser: "media", searchable: false, icon: "🖼️" },
  audio: { parser: "media", searchable: false, icon: "🎵" },
  video: { parser: "media", searchable: false, icon: "🎬" },
  
  // Events
  event: { parser: "event", searchable: true, icon: "📡" },
  webhook: { parser: "webhook", searchable: true, icon: "🔗" },
  metric: { parser: "metric", searchable: false, icon: "📈" }
};

const SOURCES = {
  api: { name: "API", icon: "🔌" },
  webhook: { name: "Webhook", icon: "🔗" },
  url: { name: "URL Fetch", icon: "🌐" },
  upload: { name: "Upload", icon: "📤" },
  stream: { name: "Stream", icon: "🌊" },
  pipeline: { name: "Pipeline", icon: "⚡" },
  agent: { name: "AI Agent", icon: "🤖" },
  scraper: { name: "Scraper", icon: "🕷️" },
  integration: { name: "Integration", icon: "🔄" }
};

async function ingestContent(request, env, requestId) {
  const body = await safeJson(request);
  
  // Validate required fields
  if (!body.content && !body.data && !body.url) {
    return json({ error: "No content provided" }, 400);
  }
  
  const content = body.content || body.data || "";
  const source = body.source || "api";
  
  // Create knowledge item
  const item = {
    id: `k-${Date.now()}-${requestId}`,
    created_at: Date.now(),
    updated_at: Date.now(),
    
    // Source info
    source,
    source_id: body.source_id || null,
    source_url: body.source_url || body.url || null,
    
    // Content
    content_type: body.content_type || detectContentType(content),
    content: content.slice(0, 100000), // 100KB limit
    content_hash: await hashContent(content),
    content_length: content.length,
    
    // Metadata
    title: body.title || extractTitle(content),
    description: body.description || null,
    
    // Classification (will be enriched)
    tags: body.tags || [],
    categories: body.categories || [],
    entities: [],
    keywords: [],
    
    // AI analysis
    ai_classified: false,
    ai_summary: null,
    ai_sentiment: null,
    ai_intent: null,
    ai_confidence: null,
    
    // Embeddings for semantic search
    embedding: null,
    
    // Relationships
    parent_id: body.parent_id || null,
    related_ids: body.related_ids || [],
    
    // Access control
    visibility: body.visibility || "private",
    owner: body.owner || "system",
    
    // Retention
    expires_at: body.ttl ? Date.now() + (body.ttl * 1000) : null,
    
    // Processing state
    status: "pending",
    processed_at: null
  };
  
  // Parse content based on type
  const parsed = await parseContent(item.content, item.content_type);
  Object.assign(item, parsed);
  
  // Extract entities and keywords
  item.keywords = extractKeywords(item.content);
  item.entities = extractEntities(item.content);
  
  // Auto-tag based on content
  item.tags = [...new Set([...item.tags, ...generateAutoTags(item)])];
  
  // AI classification if enabled
  if (body.classify !== false && env.AI) {
    try {
      const classification = await aiClassify(env, item);
      Object.assign(item, classification);
      item.ai_classified = true;
    } catch {}
  }
  
  // Generate embedding for semantic search
  if (body.embed !== false && env.AI) {
    try {
      item.embedding = await generateEmbedding(env, item.content.slice(0, 8000));
    } catch {}
  }
  
  item.status = "processed";
  item.processed_at = Date.now();
  
  // Store in KV
  const ttl = item.expires_at ? Math.floor((item.expires_at - Date.now()) / 1000) : 2592000; // 30 days default
  await env.CONFIG.put(`knowledge:${item.id}`, JSON.stringify(item), { expirationTtl: ttl });
  
  // Update indexes
  await updateIndexes(env, item);
  
  // Update stats
  await updateIngestionStats(env, item);
  
  return json({
    ingested: true,
    id: item.id,
    content_type: item.content_type,
    tags: item.tags,
    keywords: item.keywords.slice(0, 10),
    ai_classified: item.ai_classified,
    ai_summary: item.ai_summary?.slice(0, 200)
  });
}

async function batchIngest(request, env, requestId) {
  const body = await safeJson(request);
  
  if (!Array.isArray(body.items)) {
    return json({ error: "items array required" }, 400);
  }
  
  const results = [];
  const limit = Math.min(body.items.length, 50); // Max 50 items per batch
  
  for (let i = 0; i < limit; i++) {
    const itemRequest = new Request(request.url.replace("/batch", ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body.items[i], classify: body.classify, embed: body.embed })
    });
    
    try {
      const result = await ingestContent(itemRequest, env, `${requestId}-${i}`);
      const data = await result.json();
      results.push({ index: i, success: true, ...data });
    } catch (e) {
      results.push({ index: i, success: false, error: e.message });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  
  return json({
    batch_id: requestId,
    total: body.items.length,
    processed: limit,
    successful,
    failed: limit - successful,
    results
  });
}

async function ingestFromUrl(request, env, requestId) {
  const body = await safeJson(request);
  
  if (!body.url) {
    return json({ error: "url required" }, 400);
  }
  
  try {
    const response = await fetch(body.url, {
      headers: { "User-Agent": "NOIZYLAB-Ingestion/1.0" }
    });
    
    if (!response.ok) {
      return json({ error: `Fetch failed: ${response.status}` }, 502);
    }
    
    const contentType = response.headers.get("content-type") || "";
    let content;
    
    if (contentType.includes("json")) {
      content = JSON.stringify(await response.json());
    } else {
      content = await response.text();
    }
    
    // Create ingest request
    const ingestRequest = new Request(request.url.replace("/url", ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        source: "url",
        source_url: body.url,
        content_type: body.content_type || detectContentTypeFromMime(contentType),
        title: body.title || body.url,
        ...body
      })
    });
    
    return ingestContent(ingestRequest, env, requestId);
  } catch (e) {
    return json({ error: `Fetch error: ${e.message}` }, 502);
  }
}

async function ingestWebhook(request, env, requestId) {
  const body = await safeJson(request);
  const source = request.headers.get("x-webhook-source") || "webhook";
  
  // Transform webhook payload
  const transformed = transformWebhook(body, source);
  
  const ingestRequest = new Request(request.url.replace("/webhook", ""), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: JSON.stringify(transformed.data),
      content_type: "webhook",
      source: "webhook",
      source_id: transformed.id,
      title: transformed.title,
      tags: transformed.tags,
      metadata: { original_source: source, webhook_type: transformed.type }
    })
  });
  
  return ingestContent(ingestRequest, env, requestId);
}

function transformWebhook(payload, source) {
  const result = { id: null, title: "Webhook Event", type: "generic", data: payload, tags: [source] };
  
  // GitHub
  if (source === "github" || payload.repository) {
    result.type = "github";
    result.id = payload.delivery || payload.hook_id;
    result.title = `GitHub: ${payload.action || "event"} on ${payload.repository?.full_name || "repo"}`;
    result.tags.push("github", payload.action || "event");
  }
  
  // Stripe
  else if (source === "stripe" || payload.type?.startsWith("customer.") || payload.type?.startsWith("payment_intent.")) {
    result.type = "stripe";
    result.id = payload.id;
    result.title = `Stripe: ${payload.type}`;
    result.tags.push("stripe", "payment", payload.type?.split(".")[0] || "event");
  }
  
  // Slack
  else if (source === "slack" || payload.team_id) {
    result.type = "slack";
    result.id = payload.event_id;
    result.title = `Slack: ${payload.type || payload.event?.type || "event"}`;
    result.tags.push("slack", "chat");
  }
  
  // Generic
  else {
    result.id = payload.id || payload.event_id || Date.now().toString();
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 CONTENT PARSING & ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

function detectContentType(content) {
  if (!content) return "text";
  
  const trimmed = content.trim();
  
  // JSON
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || 
      (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try { JSON.parse(trimmed); return "json"; } catch {}
  }
  
  // YAML
  if (trimmed.includes(":\n") || trimmed.match(/^[\w-]+:\s/m)) return "yaml";
  
  // HTML
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || /<\w+[^>]*>/.test(trimmed)) return "html";
  
  // Markdown
  if (/^#{1,6}\s/.test(trimmed) || /\[.+\]\(.+\)/.test(trimmed) || /\*\*.+\*\*/.test(trimmed)) return "markdown";
  
  // Code detection
  if (/^(import |from |const |let |var |function |def |class |async |export )/.test(trimmed)) {
    if (/def |import \w+ |from \w+ import/.test(trimmed)) return "python";
    if (/const |let |var |function |=>|async |export /.test(trimmed)) return "javascript";
    return "code";
  }
  
  // Log format
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(trimmed) || /^\[[\w\-:]+\]/.test(trimmed)) return "log";
  
  // Email
  if (/^(From|To|Subject|Date):\s/m.test(trimmed)) return "email";
  
  // Conversation
  if (/^(Human|User|Assistant|Claude|AI|Bot):/m.test(trimmed)) return "conversation";
  
  // CSV
  if (trimmed.includes(",") && trimmed.split("\n").every(line => line.split(",").length > 1)) return "csv";
  
  return "text";
}

function detectContentTypeFromMime(mime) {
  if (mime.includes("json")) return "json";
  if (mime.includes("html")) return "html";
  if (mime.includes("javascript")) return "javascript";
  if (mime.includes("python")) return "python";
  if (mime.includes("yaml") || mime.includes("yml")) return "yaml";
  if (mime.includes("csv")) return "csv";
  if (mime.includes("markdown")) return "markdown";
  return "text";
}

async function parseContent(content, type) {
  const result = { parsed_data: null, structure: null };
  
  try {
    switch (type) {
      case "json":
        result.parsed_data = JSON.parse(content);
        result.structure = analyzeJsonStructure(result.parsed_data);
        break;
        
      case "yaml":
        // Basic YAML parsing (key: value)
        result.parsed_data = {};
        content.split("\n").forEach(line => {
          const match = line.match(/^([\w-]+):\s*(.+)$/);
          if (match) result.parsed_data[match[1]] = match[2];
        });
        break;
        
      case "markdown":
      case "html":
        result.structure = {
          headings: (content.match(/^#{1,6}\s.+$/gm) || []).length,
          links: (content.match(/\[.+?\]\(.+?\)/g) || []).length,
          code_blocks: (content.match(/```[\s\S]*?```/g) || []).length
        };
        break;
        
      case "code":
      case "javascript":
      case "python":
        result.structure = analyzeCode(content, type);
        break;
        
      case "log":
        result.parsed_data = parseLogEntries(content);
        break;
        
      case "csv":
        result.parsed_data = parseCSV(content);
        break;
        
      case "conversation":
        result.parsed_data = parseConversation(content);
        break;
    }
  } catch {}
  
  return result;
}

function analyzeJsonStructure(obj, depth = 0) {
  if (depth > 3) return "...";
  if (obj === null) return "null";
  if (Array.isArray(obj)) return `array[${obj.length}]`;
  if (typeof obj === "object") {
    const keys = Object.keys(obj).slice(0, 10);
    return keys.reduce((acc, k) => {
      acc[k] = analyzeJsonStructure(obj[k], depth + 1);
      return acc;
    }, {});
  }
  return typeof obj;
}

function analyzeCode(content, type) {
  return {
    lines: content.split("\n").length,
    functions: (content.match(/function\s+\w+|def\s+\w+|const\s+\w+\s*=/g) || []).length,
    classes: (content.match(/class\s+\w+/g) || []).length,
    imports: (content.match(/^import |^from |require\(/gm) || []).length,
    comments: (content.match(/\/\/|#\s|\/\*|\"\"\"/g) || []).length
  };
}

function parseLogEntries(content) {
  const lines = content.split("\n").slice(0, 100);
  return lines.map(line => {
    const match = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s*(\[?\w+\]?)?\s*(.*)$/);
    if (match) return { timestamp: match[1], level: match[2]?.replace(/[\[\]]/g, ""), message: match[3] };
    return { raw: line };
  }).filter(e => e.timestamp || e.raw);
}

function parseCSV(content) {
  const lines = content.split("\n").slice(0, 100);
  if (lines.length === 0) return { rows: 0, columns: 0 };
  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return { rows: lines.length - 1, columns: header.length, headers: header };
}

function parseConversation(content) {
  const turns = [];
  const regex = /^(Human|User|Assistant|Claude|AI|Bot|System):\s*([\s\S]*?)(?=^(?:Human|User|Assistant|Claude|AI|Bot|System):|$)/gm;
  let match;
  while ((match = regex.exec(content + "\n")) !== null) {
    turns.push({ role: match[1].toLowerCase(), content: match[2].trim() });
  }
  return { turns: turns.length, roles: [...new Set(turns.map(t => t.role))] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ TAGGING & CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

function extractKeywords(content, limit = 20) {
  const text = content.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  // Stop words
  const stopWords = new Set(["this", "that", "with", "from", "have", "been", "were", "they", "their", "what", "when", "where", "which", "while", "would", "could", "should", "about", "after", "before", "being", "between", "both", "each", "into", "other", "some", "such", "than", "then", "there", "these", "through", "under", "very", "your", "also", "just", "only", "over", "same", "more", "most", "much", "will", "here", "well"]);
  
  const filtered = words.filter(w => !stopWords.has(w));
  
  // Count frequency
  const freq = {};
  filtered.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  // Sort by frequency
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function extractEntities(content) {
  const entities = [];
  
  // URLs
  const urls = content.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) || [];
  urls.forEach(u => entities.push({ type: "url", value: u }));
  
  // Emails
  const emails = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  emails.forEach(e => entities.push({ type: "email", value: e }));
  
  // IPs
  const ips = content.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
  ips.forEach(ip => entities.push({ type: "ip", value: ip }));
  
  // Dates
  const dates = content.match(/\d{4}-\d{2}-\d{2}/g) || [];
  dates.forEach(d => entities.push({ type: "date", value: d }));
  
  // File paths
  const paths = content.match(/(?:\/[\w.-]+)+\.\w+/g) || [];
  paths.forEach(p => entities.push({ type: "path", value: p }));
  
  // Code identifiers (camelCase, snake_case)
  const identifiers = content.match(/\b[a-z]+(?:[A-Z][a-z]+)+\b|\b[a-z]+(?:_[a-z]+)+\b/g) || [];
  [...new Set(identifiers)].slice(0, 10).forEach(i => entities.push({ type: "identifier", value: i }));
  
  return entities.slice(0, 50);
}

function generateAutoTags(item) {
  const tags = [];
  
  // Content type tag
  tags.push(item.content_type);
  
  // Size-based tags
  if (item.content_length > 10000) tags.push("large");
  if (item.content_length < 100) tags.push("snippet");
  
  // Source tag
  tags.push(item.source);
  
  // Structure-based tags
  if (item.structure?.functions > 5) tags.push("multi-function");
  if (item.structure?.classes > 0) tags.push("oop");
  if (item.parsed_data?.turns > 5) tags.push("long-conversation");
  
  // Entity-based tags
  const entityTypes = [...new Set(item.entities?.map(e => e.type) || [])];
  entityTypes.forEach(t => tags.push(`has-${t}`));
  
  // Keyword-based tags
  const techTerms = ["api", "database", "server", "client", "cloud", "docker", "kubernetes", "aws", "azure", "react", "node", "python", "javascript"];
  item.keywords?.forEach(kw => {
    if (techTerms.includes(kw)) tags.push(kw);
  });
  
  return tags;
}

function extractTitle(content) {
  // Try to find a title
  const lines = content.split("\n").slice(0, 10);
  
  // Markdown heading
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) return match[1].slice(0, 100);
  }
  
  // First non-empty line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length > 5 && trimmed.length < 200) {
      return trimmed.slice(0, 100);
    }
  }
  
  return null;
}

async function aiClassify(env, item) {
  if (!env.AI) return {};
  
  const prompt = `Analyze this content and provide classification:

Content type: ${item.content_type}
Content (first 2000 chars): ${item.content.slice(0, 2000)}

Respond with JSON only:
{
  "ai_summary": "2-3 sentence summary",
  "ai_sentiment": "positive|negative|neutral|mixed",
  "ai_intent": "informational|instructional|conversational|transactional|creative",
  "categories": ["category1", "category2"],
  "ai_confidence": 0.0-1.0
}`;

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });
    
    const text = result.response || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}
  
  return {};
}

async function generateEmbedding(env, text) {
  if (!env.AI) return null;
  
  try {
    const result = await env.AI.run("@cf/baai/bge-small-en-v1.5", {
      text: [text.slice(0, 8000)]
    });
    return result.data?.[0];
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔎 KNOWLEDGE LAKE QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

async function searchKnowledge(request, env) {
  if (!env.CONFIG) return json({ results: [] });
  
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const type = url.searchParams.get("type");
  const tag = url.searchParams.get("tag");
  const source = url.searchParams.get("source");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  
  const list = await env.CONFIG.list({ prefix: "knowledge:k-" });
  const results = [];
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  for (const key of list.keys) {
    if (results.length >= limit) break;
    
    const item = await env.CONFIG.get(key.name, "json");
    if (!item) continue;
    
    // Filter by type
    if (type && item.content_type !== type) continue;
    
    // Filter by source
    if (source && item.source !== source) continue;
    
    // Filter by tag
    if (tag && !item.tags?.includes(tag)) continue;
    
    // Text search
    if (query) {
      const searchText = `${item.title || ""} ${item.content} ${item.tags?.join(" ")} ${item.keywords?.join(" ")}`.toLowerCase();
      const matchScore = queryWords.filter(w => searchText.includes(w)).length / queryWords.length;
      if (matchScore < 0.5) continue;
      item._score = matchScore;
    }
    
    results.push({
      id: item.id,
      title: item.title,
      content_type: item.content_type,
      source: item.source,
      tags: item.tags?.slice(0, 5),
      ai_summary: item.ai_summary,
      created_at: item.created_at,
      score: item._score
    });
  }
  
  // Sort by score or date
  results.sort((a, b) => (b.score || 0) - (a.score || 0) || b.created_at - a.created_at);
  
  return json({ query, count: results.length, results });
}

async function queryKnowledge(request, env) {
  if (!env.CONFIG) return json({ results: [] });
  
  const body = request.method === "POST" ? await safeJson(request) : {};
  const url = new URL(request.url);
  
  const filters = {
    content_type: body.content_type || url.searchParams.get("content_type"),
    source: body.source || url.searchParams.get("source"),
    tags: body.tags || url.searchParams.getAll("tag"),
    categories: body.categories || url.searchParams.getAll("category"),
    since: body.since || url.searchParams.get("since"),
    until: body.until || url.searchParams.get("until"),
    ai_sentiment: body.ai_sentiment || url.searchParams.get("sentiment"),
    has_embedding: body.has_embedding,
    limit: body.limit || parseInt(url.searchParams.get("limit") || "50")
  };
  
  const list = await env.CONFIG.list({ prefix: "knowledge:k-" });
  const results = [];
  
  for (const key of list.keys) {
    if (results.length >= filters.limit) break;
    
    const item = await env.CONFIG.get(key.name, "json");
    if (!item) continue;
    
    // Apply filters
    if (filters.content_type && item.content_type !== filters.content_type) continue;
    if (filters.source && item.source !== filters.source) continue;
    if (filters.since && item.created_at < parseInt(filters.since)) continue;
    if (filters.until && item.created_at > parseInt(filters.until)) continue;
    if (filters.ai_sentiment && item.ai_sentiment !== filters.ai_sentiment) continue;
    if (filters.has_embedding === true && !item.embedding) continue;
    if (filters.tags?.length && !filters.tags.some(t => item.tags?.includes(t))) continue;
    if (filters.categories?.length && !filters.categories.some(c => item.categories?.includes(c))) continue;
    
    results.push(item);
  }
  
  return json({ filters, count: results.length, results });
}

async function findSimilar(request, env) {
  if (!env.CONFIG || !env.AI) return json({ error: "Semantic search not available" }, 400);
  
  const body = await safeJson(request);
  const text = body.text || body.query;
  const itemId = body.id;
  const limit = body.limit || 10;
  
  let queryEmbedding;
  
  if (itemId) {
    const item = await env.CONFIG.get(`knowledge:${itemId}`, "json");
    if (!item?.embedding) return json({ error: "Item has no embedding" }, 400);
    queryEmbedding = item.embedding;
  } else if (text) {
    queryEmbedding = await generateEmbedding(env, text);
    if (!queryEmbedding) return json({ error: "Failed to generate embedding" }, 500);
  } else {
    return json({ error: "Provide text or id" }, 400);
  }
  
  // Find similar items
  const list = await env.CONFIG.list({ prefix: "knowledge:k-" });
  const candidates = [];
  
  for (const key of list.keys) {
    const item = await env.CONFIG.get(key.name, "json");
    if (!item?.embedding || item.id === itemId) continue;
    
    const similarity = cosineSimilarity(queryEmbedding, item.embedding);
    candidates.push({ ...item, similarity });
  }
  
  candidates.sort((a, b) => b.similarity - a.similarity);
  
  return json({
    results: candidates.slice(0, limit).map(c => ({
      id: c.id,
      title: c.title,
      content_type: c.content_type,
      similarity: Math.round(c.similarity * 1000) / 1000,
      ai_summary: c.ai_summary
    }))
  });
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getKnowledgeItem(path, env) {
  const id = path.split("/").pop();
  const item = await env.CONFIG.get(`knowledge:${id}`, "json");
  if (!item) return json({ error: "Not found" }, 404);
  
  // Don't return full embedding in response
  const { embedding, ...rest } = item;
  return json({ ...rest, has_embedding: !!embedding });
}

async function deleteKnowledgeItem(path, env) {
  const id = path.split("/").pop();
  await env.CONFIG.delete(`knowledge:${id}`);
  return json({ deleted: true, id });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ANALYTICS & INDEXING
// ═══════════════════════════════════════════════════════════════════════════════

async function updateIndexes(env, item) {
  const today = new Date().toISOString().split("T")[0];
  
  // Type index
  const typeKey = `index:type:${item.content_type}`;
  const typeIndex = await env.CONFIG.get(typeKey, "json") || [];
  typeIndex.push({ id: item.id, created: item.created_at });
  await env.CONFIG.put(typeKey, JSON.stringify(typeIndex.slice(-1000)), { expirationTtl: 2592000 });
  
  // Source index
  const sourceKey = `index:source:${item.source}`;
  const sourceIndex = await env.CONFIG.get(sourceKey, "json") || [];
  sourceIndex.push({ id: item.id, created: item.created_at });
  await env.CONFIG.put(sourceKey, JSON.stringify(sourceIndex.slice(-1000)), { expirationTtl: 2592000 });
  
  // Tag indexes
  for (const tag of (item.tags || []).slice(0, 10)) {
    const tagKey = `index:tag:${tag}`;
    const tagIndex = await env.CONFIG.get(tagKey, "json") || [];
    tagIndex.push({ id: item.id, created: item.created_at });
    await env.CONFIG.put(tagKey, JSON.stringify(tagIndex.slice(-500)), { expirationTtl: 2592000 });
  }
}

async function updateIngestionStats(env, item) {
  const today = new Date().toISOString().split("T")[0];
  const key = `ingest-stats:${today}`;
  
  const stats = await env.CONFIG.get(key, "json") || {
    total: 0,
    by_type: {},
    by_source: {},
    total_bytes: 0,
    ai_classified: 0,
    with_embedding: 0
  };
  
  stats.total++;
  stats.by_type[item.content_type] = (stats.by_type[item.content_type] || 0) + 1;
  stats.by_source[item.source] = (stats.by_source[item.source] || 0) + 1;
  stats.total_bytes += item.content_length;
  if (item.ai_classified) stats.ai_classified++;
  if (item.embedding) stats.with_embedding++;
  
  await env.CONFIG.put(key, JSON.stringify(stats), { expirationTtl: 604800 });
}

async function getAnalytics(env) {
  if (!env.CONFIG) return json({ analytics: {} });
  
  const today = new Date().toISOString().split("T")[0];
  const stats = await env.CONFIG.get(`ingest-stats:${today}`, "json") || {};
  
  // Get 7-day trend
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const dayStats = await env.CONFIG.get(`ingest-stats:${date}`, "json");
    trend.push({ date, total: dayStats?.total || 0, bytes: dayStats?.total_bytes || 0 });
  }
  
  return json({ date: today, today: stats, trend });
}

async function getSourceStats(env) {
  if (!env.CONFIG) return json({ sources: {} });
  const today = new Date().toISOString().split("T")[0];
  const stats = await env.CONFIG.get(`ingest-stats:${today}`, "json");
  return json({ sources: stats?.by_source || {} });
}

async function getTypeStats(env) {
  if (!env.CONFIG) return json({ types: {} });
  const today = new Date().toISOString().split("T")[0];
  const stats = await env.CONFIG.get(`ingest-stats:${today}`, "json");
  return json({ types: stats?.by_type || {} });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 STREAMS
// ═══════════════════════════════════════════════════════════════════════════════

async function listStreams(env) {
  if (!env.CONFIG) return json({ streams: [] });
  const list = await env.CONFIG.list({ prefix: "stream:" });
  const streams = [];
  for (const key of list.keys) {
    const stream = await env.CONFIG.get(key.name, "json");
    if (stream) streams.push(stream);
  }
  return json({ streams });
}

async function createStream(request, env) {
  const body = await safeJson(request);
  
  const stream = {
    id: `stream-${Date.now()}`,
    name: body.name || "Unnamed Stream",
    source_type: body.source_type || "webhook",
    filter: body.filter || {},
    transform: body.transform || null,
    destination: body.destination || "knowledge",
    created_at: Date.now(),
    active: true,
    processed: 0
  };
  
  await env.CONFIG.put(`stream:${stream.id}`, JSON.stringify(stream));
  return json({ created: true, stream });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 SCHEMAS & CLASSIFIERS
// ═══════════════════════════════════════════════════════════════════════════════

function listSchemas() {
  return json({
    schemas: Object.entries(CONTENT_TYPES).map(([id, cfg]) => ({
      id,
      ...cfg
    }))
  });
}

function listClassifiers() {
  return json({
    classifiers: [
      { id: "content_type", description: "Auto-detect content type" },
      { id: "sentiment", description: "Analyze sentiment (AI)" },
      { id: "intent", description: "Detect intent (AI)" },
      { id: "entities", description: "Extract entities" },
      { id: "keywords", description: "Extract keywords" },
      { id: "categories", description: "Categorize content (AI)" }
    ]
  });
}

async function classifyContent(request, env) {
  const body = await safeJson(request);
  const content = body.content || "";
  
  const result = {
    content_type: detectContentType(content),
    keywords: extractKeywords(content),
    entities: extractEntities(content),
    auto_tags: []
  };
  
  // Create temp item for auto-tagging
  const tempItem = { content, content_type: result.content_type, keywords: result.keywords, entities: result.entities, source: "classify" };
  result.auto_tags = generateAutoTags(tempItem);
  
  // AI classification if available
  if (env.AI && body.ai !== false) {
    const aiResult = await aiClassify(env, tempItem);
    Object.assign(result, aiResult);
  }
  
  return json(result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠️ UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

async function hashContent(content) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function getStatus(env) {
  return json({
    service: "NOIZYLAB-INGESTION",
    version: "2.0",
    content_types: Object.keys(CONTENT_TYPES).length,
    sources: Object.keys(SOURCES).length,
    features: ["ai_classification", "semantic_search", "batch_ingest", "webhook_transform", "auto_tagging"]
  });
}

function health(env) {
  return json({ ok: true, service: "NOIZYLAB-INGESTION", version: "2.0", ai: !!env.AI });
}

async function safeJson(r) { try { return await r.json(); } catch { return {}; } }
function cors() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
function json(d, s = 200) { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }

function dashboard() {
  return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Universal Ingestion</title><style>:root{--bg:#0a0908;--card:#0d0c0a;--border:#1a1815;--gold:#d4a574;--text:#e8ddd0;--muted:#6b5a45;--green:#6a9c59;--blue:#5a8ac4;--purple:#9c6ad4}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:-apple-system,sans-serif;padding:15px}.h{text-align:center;padding:15px;border-bottom:2px solid var(--gold);margin-bottom:15px}.logo{font-size:1.5rem;font-weight:900;color:var(--gold)}.sub{color:var(--muted);font-size:.65rem;margin-top:5px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;max-width:1400px;margin:0 auto}.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px}.card h3{color:var(--gold);margin-bottom:10px;font-size:.7rem;text-transform:uppercase}.stat{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.75rem}.stat:last-child{border:none}.tag{display:inline-block;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 6px;margin:2px;font-size:.6rem}textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);font-size:.75rem;resize:vertical}button{background:var(--gold);color:#000;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:.7rem;font-weight:700;margin:2px}.out{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;margin-top:8px;font-size:.65rem;max-height:200px;overflow-y:auto;white-space:pre-wrap}input{background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:6px;color:var(--text);font-size:.75rem;width:100%;margin-bottom:8px}</style></head><body><div class="h"><div class="logo">🌌 UNIVERSAL INGESTION</div><div class="sub">Multi-Source • Multi-Format • AI Classification • Knowledge Lake</div></div><div class="grid"><div class="card"><h3>📊 Today's Stats</h3><div id="stats"><div class="stat"><span>Ingested</span><b id="total">--</b></div><div class="stat"><span>AI Classified</span><b id="ai">--</b></div><div class="stat"><span>With Embeddings</span><b id="embed">--</b></div><div class="stat"><span>Total Bytes</span><b id="bytes">--</b></div></div></div><div class="card"><h3>📁 By Type</h3><div id="types"></div></div><div class="card"><h3>📥 By Source</h3><div id="sources"></div></div><div class="card" style="grid-column:1/-1"><h3>🔍 Search Knowledge</h3><input id="search" placeholder="Search query..."><button onclick="search()">Search</button><div id="results" class="out" style="display:none"></div></div><div class="card" style="grid-column:1/-1"><h3>📤 Ingest Content</h3><textarea id="content" rows="4" placeholder="Paste content to ingest..."></textarea><button onclick="ingest()">Ingest</button><button onclick="classify()">Classify Only</button><div id="ingest-out" class="out" style="display:none"></div></div></div><script>async function load(){try{const r=await(await fetch("/analytics")).json();document.getElementById("total").textContent=r.today?.total||0;document.getElementById("ai").textContent=r.today?.ai_classified||0;document.getElementById("embed").textContent=r.today?.with_embedding||0;document.getElementById("bytes").textContent=formatBytes(r.today?.total_bytes||0);const types=r.today?.by_type||{};document.getElementById("types").innerHTML=Object.entries(types).map(([k,v])=>'<span class="tag">'+k+': '+v+'</span>').join("")||'<span class="tag">No data</span>';const sources=r.today?.by_source||{};document.getElementById("sources").innerHTML=Object.entries(sources).map(([k,v])=>'<span class="tag">'+k+': '+v+'</span>').join("")||'<span class="tag">No data</span>'}catch(e){console.error(e)}}function formatBytes(b){if(b<1024)return b+"B";if(b<1048576)return(b/1024).toFixed(1)+"KB";return(b/1048576).toFixed(1)+"MB"}async function search(){const q=document.getElementById("search").value;const o=document.getElementById("results");o.style.display="block";o.textContent="Searching...";const r=await(await fetch("/knowledge/search?q="+encodeURIComponent(q))).json();o.innerHTML=r.results?.length?r.results.map(x=>'<b>'+x.title+'</b> ['+x.content_type+']\\n'+(x.ai_summary||"No summary")+'\\n---\\n').join(""):"No results"}async function ingest(){const c=document.getElementById("content").value;const o=document.getElementById("ingest-out");o.style.display="block";o.textContent="Ingesting...";const r=await(await fetch("/ingest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:c})})).json();o.textContent=JSON.stringify(r,null,2)}async function classify(){const c=document.getElementById("content").value;const o=document.getElementById("ingest-out");o.style.display="block";o.textContent="Classifying...";const r=await(await fetch("/classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:c})})).json();o.textContent=JSON.stringify(r,null,2)}load()</script></body></html>`, { headers: { "Content-Type": "text/html" } });
}
