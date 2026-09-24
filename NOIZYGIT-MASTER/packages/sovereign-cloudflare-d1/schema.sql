-- ═══════════════════════════════════════════════════════════════════════
-- ☁️ CLOUDFLARE D1 SOVEREIGN BRAIN & MEMCELLS DATABASE SCHEMA v2.0
-- NOIZY Ecosystem · Fish Music Inc. · RSP_001
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Sovereign MemCells (447+ Canonical Memory Tokens)
CREATE TABLE IF NOT EXISTS sovereign_memcells (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    semantic_tags TEXT,
    author TEXT DEFAULT 'RSP_001',
    importance_tier INTEGER DEFAULT 1,
    vector_embedding TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sovereign Contacts Directory (1,517 Verified Entities)
CREATE TABLE IF NOT EXISTS sovereign_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    organization TEXT,
    role TEXT,
    category TEXT,
    source_file TEXT,
    verified BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Global Software, DAWs & Audio Plugins (3,117 Assets)
CREATE TABLE IF NOT EXISTS sovereign_software_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    vendor TEXT,
    version TEXT,
    install_path TEXT,
    architecture TEXT DEFAULT 'arm64',
    license_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cloud Fleet & Storage Assets Matrix
CREATE TABLE IF NOT EXISTS sovereign_cloud_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cloud_hub TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    item_type TEXT NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    canonical_target_zone TEXT NOT NULL,
    migration_status TEXT DEFAULT 'MAPPED',
    last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Council Deliberation History (RSP_001, GABRIEL, LUCY, MC96)
CREATE TABLE IF NOT EXISTS sovereign_council_sessions (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    speaking_persona TEXT NOT NULL,
    creed_grounding TEXT NOT NULL,
    rag_retrieval_ms REAL,
    directives TEXT NOT NULL,
    convergence_status TEXT DEFAULT 'CONVERGED',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sovereign Domains & Cloudflare Routing
CREATE TABLE IF NOT EXISTS sovereign_domains_registry (
    domain_name TEXT PRIMARY KEY,
    registrar TEXT NOT NULL,
    dns_provider TEXT DEFAULT 'Cloudflare',
    ssl_status TEXT DEFAULT 'Active',
    apex_target TEXT,
    associated_brand TEXT,
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Social & SaaS Admin Subscriptions (~$2,072 CAD/yr)
CREATE TABLE IF NOT EXISTS sovereign_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    billing_cad_monthly REAL,
    billing_cad_annual REAL,
    status TEXT DEFAULT 'ACTIVE',
    criticality TEXT DEFAULT 'CORE',
    login_identity TEXT
);

-- 8. Audio Master Releases & Stems (24-bit 48kHz Lossless)
CREATE TABLE IF NOT EXISTS sovereign_audio_masters (
    id TEXT PRIMARY KEY,
    track_title TEXT NOT NULL,
    artist TEXT DEFAULT 'MC96',
    format TEXT DEFAULT 'WAV 24-bit 48kHz',
    sample_rate INTEGER DEFAULT 48000,
    bit_depth INTEGER DEFAULT 24,
    duration_seconds REAL,
    file_path TEXT,
    isrc_code TEXT,
    royalty_split TEXT DEFAULT '75/25 Creator Sovereign'
);

-- Indexes for Sub-10ms Query Speeds
CREATE INDEX IF NOT EXISTS idx_memcells_category ON sovereign_memcells(category);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON sovereign_contacts(email);
CREATE INDEX IF NOT EXISTS idx_software_type ON sovereign_software_inventory(asset_type);
CREATE INDEX IF NOT EXISTS idx_cloud_hub ON sovereign_cloud_assets(cloud_hub);
CREATE INDEX IF NOT EXISTS idx_council_persona ON sovereign_council_sessions(speaking_persona);
