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


-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ('MEM_001', 'CREED', 'Human Voice Sovereignty', 'Artists own their voice, likeness, and digital master tokens. No corporate capture without consent.', 'creed,rights,sovereignty', 'RSP_001', 1);
INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ('MEM_002', 'ROYALTIES', '75/25 Royalty Standard', '75% of all streaming, licensing, and NFT earnings go directly to creator wallets, 25% to ecosystem infrastructure.', 'royalties,finance,equity', 'RSP_001', 1);
INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ('MEM_003', 'TELEMETRY', 'Zero-Latency Daemon Core', 'GABRIEL daemon operates sub-10ms response loops with local telemetry logging on M2 Ultra APFS.', 'devops,gabriel,telemetry', 'GABRIEL', 1);
INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ('MEM_004', 'ACOUSTICS', '24-bit 48kHz Lossless DSP', 'All audio exports and masters must adhere strictly to 24-bit 48kHz uncompressed lossless format.', 'audio,dsp,mc96', 'MC96', 1);
INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ('MEM_005', 'INFRASTRUCTURE', 'Multi-Drive 19.64TB Fleet', 'Internal 2TB APFS + 12TB HFS+ + 4TB Lacie + 2TB SGW + NOIZYWIN ARM64 VM.', 'storage,fleet,hardware', 'GABRIEL', 1);
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('AudioMemos', 'Application', 'Unknown', 'Unknown', '/Applications/AudioMemos.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App for Google Maps', 'Application', 'com.lapps.mapsplus', '1.1.2', '/Applications/App for Google Maps.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Linearity Curve', 'Application', 'com.linearity.vn', '6.12.0', '/Applications/Linearity Curve.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Google Chrome Beta', 'Application', 'com.google.Chrome.beta', '155.0.8059.12', '/Applications/Google Chrome Beta.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Wappalyzer - Technology profiler', 'Application', 'com.wappalyzer.Wappalyzer', '6.10.67', '/Applications/Wappalyzer - Technology profiler.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Spark', 'Application', 'com.readdle.smartemail-Mac', '2.11.67', '/Applications/Spark.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App Box', 'Application', 'Unknown', 'Unknown', '/Applications/App Box.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LocalizeKit', 'Application', 'com.mnm.localizeKit', '1.1.3', '/Applications/LocalizeKit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('websitepublisher-connect', 'Application', 'ai.websitepublisher.connect', '2.2.0', '/Applications/websitepublisher-connect.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Proton Authenticator', 'Application', 'Unknown', 'Unknown', '/Applications/Proton Authenticator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Sing Karaoke', 'Application', 'Unknown', 'Unknown', '/Applications/Sing Karaoke.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('FreeFileSync', 'Application', 'org.freefilesync.FreeFileSync', '14.10', '/Applications/FreeFileSync.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Motion Creator Studio', 'Application', 'com.apple.motionappApp', '6.3', '/Applications/Motion Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SSH Client', 'Application', 'com.moontechnolabs.ssh2', '5.5', '/Applications/SSH Client.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Swiftify for Xcode', 'Application', 'com.Swiftify.Xcode', '6.2', '/Applications/Swiftify for Xcode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Pixelmator Pro Creator Studio', 'Application', 'com.apple.pixelmator', '4.3', '/Applications/Pixelmator Pro Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Eve', 'Application', 'Unknown', 'Unknown', '/Applications/Eve.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ColorSlurp', 'Application', 'com.IdeaPunch.ColorSlurp', '4.0.3', '/Applications/ColorSlurp.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code Recipes', 'Application', 'ru.obraztsov.codeSamples', '4.07', '/Applications/Code Recipes.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App Icon Set Creator', 'Application', 'com.wegenerlabs.Espresso', '1.6', '/Applications/App Icon Set Creator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code', 'Application', 'com.microsoft.VSCode', '1.138.0', '/Applications/Visual Studio Code.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ShellFish', 'Application', 'com.appliedphasor.secure-shellfish', '2026.30', '/Applications/ShellFish.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Bakery', 'Application', 'com.goodsnooze.bakery', '2.11', '/Applications/Bakery.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Status Saver', 'Application', 'Unknown', 'Unknown', '/Applications/Status Saver.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('NOIZYMOBILE', 'Application', 'swift-playgrounds-app.NOIZYMOBILE', '1.0', '/Applications/NOIZYMOBILE.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('JuCode', 'Application', 'Unknown', 'Unknown', '/Applications/JuCode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('WA Web', 'Application', 'Unknown', 'Unknown', '/Applications/WA Web.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Pippit', 'Application', 'Unknown', 'Unknown', '/Applications/Pippit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('3d Scanner App', 'Application', 'com.laan.labs.3dScannerPro', '1.2', '/Applications/3d Scanner App.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Bridge Control', 'Application', 'io.neonish.bridgecontrol', '1.1.1', '/Applications/Bridge Control.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Amazon Quick', 'Application', 'com.amazon.QuickWork.mac', '0.717.0', '/Applications/Amazon Quick.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Foco+', 'Application', 'br.com.luizsantana.Foco', '2.0.0', '/Applications/Foco.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('IcoMaker', 'Application', 'jp.ogihara.icomaker', '1.3.0', '/Applications/IcoMaker.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Splice INSTRUMENT', 'Application', 'com.splice.Instrument', '1.4.1-d794aac', '/Applications/Splice INSTRUMENT.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code Recipes', 'Application', 'ru.obraztsov.codeSamplesPython', '4.07', '/Applications/Python Recipes.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Steam Link', 'Application', 'com.valvesoftware.SteamLink17', '1.3.32', '/Applications/Steam Link.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ServerCat', 'Application', 'tech.baye.servercat', '26.9.1', '/Applications/ServerCat.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LevelUp: Focus', 'Application', 'com.quantribution.LevelUpFocus', '1.3.1', '/Applications/LevelUp Focus.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Chords Compass', 'Application', 'com.neonway.ChordsCompass', '1.25', '/Applications/Chords Compass.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('JSON Helper', 'Application', 'com.vidblishen.jsonhelper', '1.20', '/Applications/JSON Helper.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Hightail', 'Application', 'Unknown', 'Unknown', '/Applications/Hightail.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Easy SSH', 'Application', 'com.argsment.Easy-SSH', '1.16', '/Applications/Easy SSH.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('MTP', 'Application', 'Unknown', 'Unknown', '/Applications/MTP.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Pages Creator Studio', 'Application', 'com.apple.Pages', '15.3.1', '/Applications/Pages Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Edge Gallery', 'Application', 'Unknown', 'Unknown', '/Applications/Edge Gallery.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Videohub', 'Application', 'Unknown', 'Unknown', '/Applications/Videohub.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('xTerminal', 'Application', 'Unknown', 'Unknown', '/Applications/xTerminal.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('UA Connect', 'Application', 'com.uaudio.ua-connect', '1.9.3', '/Applications/UA Connect.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Templates for Swift', 'Application', 'io.appstudio.UITemplates', '1.0', '/Applications/Templates for Swift.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Remote Desktop', 'Application', 'com.apple.RemoteDesktop', '3.9.8', '/Applications/Remote Desktop.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('BBEdit', 'Application', 'com.barebones.bbedit', '16.0.3', '/Applications/BBEdit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('UlyssesMac', 'Application', 'com.ulyssesapp.mac', '41.1', '/Applications/UlyssesMac.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Home Assistant', 'Application', 'io.robbie.HomeAssistant', '2026.9.2', '/Applications/Home Assistant.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('DockUI', 'Application', 'com.Maicol.Dockui', '2026.9', '/Applications/Dock UI.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Canadian Ride Share', 'Application', 'Unknown', 'Unknown', '/Applications/Canadian Ride Share.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ScriptWidget', 'Application', 'com.everettjf.scriptwidget', '26.6', '/Applications/ScriptWidget.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SwitchIt', 'Application', 'com.vanrisk.SwitchIt', '1.0.1', '/Applications/SwitchIt.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App for Netflix ℠', 'Application', 'com.devsage.flix', '1.3.3', '/Applications/App for Netflix ℠.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('AlignmentForXcode', 'Application', 'com.tid.Alignment-for-Xcode', '1.2.0', '/Applications/AlignmentForXcode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Go2Shell', 'Application', 'com.alice.mac.go2shell', '1.2.2', '/Applications/Go2Shell.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ScalesNChords', 'Application', 'Unknown', 'Unknown', '/Applications/ScalesNChords.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Smash Hit', 'Application', 'Unknown', 'Unknown', '/Applications/Smash Hit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Quick Note', 'Application', 'com.diigo.quicknote', '1.3.11', '/Applications/Quick Note.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('BN-LINK Smart', 'Application', 'Unknown', 'Unknown', '/Applications/BN-LINK Smart.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Copilot', 'Application', 'com.microsoft.m365copilot', '153.0.4234.38', '/Applications/Copilot.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('HubSpot', 'Application', 'Unknown', 'Unknown', '/Applications/HubSpot.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Antigravity', 'Application', 'com.google.antigravity', '2.15.1', '/Applications/Antigravity.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('IPCams', 'Application', 'io.tylerjones.IPCams', '2026.9.1', '/Applications/IPCams.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Icon Maker Pro', 'Application', 'com.clubeestech.IconMakerPro', '2.6', '/Applications/Icon Maker Pro.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('NoxKey', 'Application', 'dev.noboxdev.Noxkey', '1.7.3', '/Applications/NoxKey.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Cloudflare One', 'Application', 'Unknown', 'Unknown', '/Applications/Cloudflare One.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Mela', 'Application', 'recipes.mela.appkit', '2.6.1', '/Applications/Mela.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('CapCut', 'Application', 'com.lemon.lvoverseas', '9.4.0', '/Applications/CapCut.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Cookie Editor', 'Application', 'com.cookie.editor.app', '1.0.3', '/Applications/Cookie Editor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PC Financial', 'Application', 'Unknown', 'Unknown', '/Applications/PC Financial.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PDFgear', 'Application', 'com.pdfeditor.pdfeditormac', '2.27', '/Applications/PDFgear.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Audiofile Calc', 'Application', 'Unknown', 'Unknown', '/Applications/Audiofile Calc.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('No List', 'Application', 'Unknown', 'Unknown', '/Applications/No List.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Wash Post NIE', 'Application', 'Unknown', 'Unknown', '/Applications/Wash Post NIE.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code Recipes', 'Application', 'ru.obraztsov.codeSamplesJavaScript', '4.07', '/Applications/JavaScript Recipes.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('exabox', 'Application', 'app.exabox', '4.0.2', '/Applications/exabox.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Replit', 'Application', 'Unknown', 'Unknown', '/Applications/Replit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Photomator', 'Application', 'com.pixelmatorteam.pixelmator.touch.x.photo', '3.4.15', '/Applications/Photomator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Gemini', 'Application', 'com.google.GeminiMacOS', '1.116.5.889', '/Applications/Gemini.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LM Studio', 'Application', 'ai.elementlabs.lmstudio', '0.4.23+1', '/Applications/LM Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('EasyFind', 'Application', 'org.grunenberg.EasyFind', '4.9.3', '/Applications/EasyFind.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Ringer', 'Application', 'com.pixelresearchlabs.osx.ringer', '2.0.5', '/Applications/Ringer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('WordService', 'Application', 'org.grunenberg.WordService', '2.8.3', '/Applications/WordService.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Claude', 'Application', 'com.anthropic.claudefordesktop', '2.7032.0', '/Applications/Claude.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Termius', 'Application', 'com.termius.mac', '10.1.0', '/Applications/Termius.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('REtroAnimator', 'Application', 'com.claviatura.reanimator', '1.0.1', '/Applications/REtroAnimator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Figma', 'Application', 'com.figma.Desktop', '126.4.11', '/Applications/Figma.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Color Picker Plus', 'Application', 'com.elimisoft.colorpicker', '1.8', '/Applications/Color Picker Plus.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Controller', 'Application', 'com.janandre.HomeKitTimers', '9.0.5', '/Applications/ControllerForHomeKit.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Disk Speed Test', 'Application', 'com.blackmagic-design.DiskSpeedTest', '3.4.3', '/Applications/Blackmagic Disk Speed Test.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('TechTool Monitor', 'Application', 'com.micromat.ttm-agent', '6.0.8', '/Applications/TechTool Monitor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Steam', 'Application', 'com.valvesoftware.steam', '6.1', '/Applications/Steam.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Syncthing', 'Application', 'com.github.xor-gate.syncthing-macosx', '2.0.14-1', '/Applications/Syncthing.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('OneMobile', 'Application', 'Unknown', 'Unknown', '/Applications/OneMobile.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Space Launch Conference', 'Application', 'Unknown', 'Unknown', '/Applications/Space Launch Conference.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('AnyViewer', 'Application', 'Unknown', 'Unknown', '/Applications/AnyViewer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Nano AI', 'Application', 'Unknown', 'Unknown', '/Applications/Nano AI.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('DEVONagent', 'Application', 'com.devon-technologies.agent', '3.11.11', '/Applications/DEVONagent.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('RadioMusicCloud', 'Application', 'Unknown', 'Unknown', '/Applications/RadioMusicCloud.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PortX', 'Application', 'com.netsarang.portx', '2.3.0', '/Applications/PortX.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Cookie-Editor', 'Application', 'ca.cgagnier.cookie-editor', '1.13.0', '/Applications/Cookie-Editor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Remote+', 'Application', 'com.cherpake.macrc', '2026.46', '/Applications/Remote.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('GherkinFormatterExtension', 'Application', 'com.waltin.GherkinFormatterXcodeExtension.GherkinFormatter', '1.0', '/Applications/GherkinFormatterExtension.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('MainStage Creator Studio', 'Application', 'com.apple.MainStageApp', '4.3.1', '/Applications/MainStage Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Manus 2', 'Application', 'Unknown', 'Unknown', '/Applications/Manus 2.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('XML', 'Application', 'Unknown', 'Unknown', '/Applications/XML.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('OneAuth', 'Application', 'com.zoho.iamlogin', '4.4.1', '/Applications/OneAuth.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LottieFiles', 'Application', 'com.lottiefiles.macos', '2.4.0', '/Applications/LottieFilesApp.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Google Chrome', 'Application', 'com.google.Chrome', '154.0.8037.58', '/Applications/Google Chrome.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Desktop Commander', 'Application', 'app.desktopcommander', '1.25.17', '/Applications/Desktop Commander.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Character Commands for Xcode', 'Application', 'com.ifswllc.charcmd', '2021.1', '/Applications/Character Commands for Xcode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App for Facebook Messenger', 'Application', 'com.appfm.softiqeood', '2.0.4', '/Applications/App for Facebook Messenger.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Terminux', 'Application', 'www.app.terminus', '2.2.1', '/Applications/Terminux.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Valentina Studio', 'Application', 'com.paradigmasoft.vstudio', '17.5.3', '/Applications/Valentina Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Apps for Instragram', 'Application', 'com.client.appforinstagram', '2.3', '/Applications/Apps for Instagram.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('The Explorers Club', 'Application', 'Unknown', 'Unknown', '/Applications/The Explorers Club.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Unread', 'Application', 'com.goldenhillsoftware.Unread2', '5.0', '/Applications/Unread.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Craft', 'Application', 'com.lukilabs.lukiapp', '3.6.8', '/Applications/Craft.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('AdBlock Pro', 'Application', 'com.samuellaska.AdBuster', '12.4.1', '/Applications/AdBlock Pro.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Numbers', 'Application', 'com.apple.iWork.Numbers', '14.5', '/Applications/Numbers.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Reins', 'Application', 'dev.ibrahimcetin.reins', '2.2.1', '/Applications/Reins.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Propertizer', 'Application', 'com.josipbernat.PropertyAutocomplete', '1.0.1', '/Applications/PropertyAutocomplete.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Py Editor', 'Application', 'com.python.editor.macOS', '27.0.0', '/Applications/Py Editor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Resizer', 'Application', 'com.bonobolabs.unretina', '1.4', '/Applications/Resizer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Extractor', 'Application', 'com.fiplab.extractor', '1.6', '/Applications/Extractor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Dropbox', 'Application', 'com.getdropbox.dropbox', '272.4.3731', '/Applications/Dropbox.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('MacWhisper', 'Application', 'com.goodsnooze.MacWhisper', '14.7', '/Applications/MacWhisper.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Compressor Creator Studio', 'Application', 'com.apple.CompressorApp', '5.3', '/Applications/Compressor Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Spark Desktop', 'Application', 'com.readdle.SparkDesktop.appstore', '3.30.12', '/Applications/Spark Desktop 2.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code - Insiders', 'Application', 'com.microsoft.VSCodeInsiders', '1.139.0-insider', '/Applications/Visual Studio Code - Insiders.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LocalDevVPN', 'Application', 'Unknown', 'Unknown', '/Applications/LocalDevVPN.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Sequel Ace', 'Application', 'com.sequel-ace.sequel-ace', '5.4.0', '/Applications/Sequel Ace.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ƒ Generator', 'Application', 'Unknown', 'Unknown', '/Applications/ƒ Generator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Klipped', 'Application', 'com.klipped.editor', '3.0.2', '/Applications/Klipped.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Volume Booster', 'Application', 'Unknown', 'Unknown', '/Applications/Volume Booster.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Microsoft Defender', 'Application', 'com.microsoft.wdav', '101.26072.0017', '/Applications/Microsoft Defender.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Demo', 'Application', 'com.demomusic.demo', '3.7.0', '/Applications/Demo.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('GDevelop', 'Application', 'Unknown', 'Unknown', '/Applications/GDevelop.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Signals', 'Application', 'org.mcorey.HomeFlash', '2.9', '/Applications/Signals.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Save to Pinterest', 'Application', 'pinterest.SaveToPinterest', '6.13.1', '/Applications/Save to Pinterest.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Moped', 'Application', 'net.machorro.roberto.Moped', '3.0.1', '/Applications/Moped.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('App Language Chooser', 'Application', 'com.ctmdev.App-Language-Chooser', '1.0', '/Applications/App Language Chooser.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Smart JSON Editor', 'Application', 'com.artproweb.smartjsoneditor.mac', '1.4.5', '/Applications/Smart JSON Editor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Compute', 'Application', 'com.tsopin.CloudComputeFinal', '1.3', '/Applications/Compute.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('TestFlight', 'Application', 'com.apple.TestFlight', '4.3.1', '/Applications/TestFlight.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Ruler', 'Application', 'com.jinzhenyu.ruler', '4.3', '/Applications/Ruler.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Code', 'Application', 'com.codeix.app', '1.5', '/Applications/Code.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Asset Catalog Creator', 'Application', 'com.bridgetech.asset-catalog-free', '3.13', '/Applications/Asset Catalog Creator.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('XP IPTV', 'Application', 'com.player.xpiptv', '1.2', '/Applications/XP IPTV.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PrettyJSON for Safari', 'Application', 'ai.shamur.bin.PrettyJSON', '2.2', '/Applications/PrettyJSON for Safari.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Cleaner for Xcode', 'Application', 'io.hyperapp.XcodeCleaner', '26.7.0', '/Applications/Cleaner for Xcode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Telegram', 'Application', 'ru.keepcoder.Telegram', '12.7', '/Applications/Telegram.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Capo', 'Application', 'com.supermegaultragroovy.capo3.mac', '4.7.1', '/Applications/Capo.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Parsec', 'Application', 'tv.parsec.www', '150.101.0', '/Applications/Parsec.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Parallels Desktop', 'Application', 'com.parallels.desktop.console', '27.0.2', '/Applications/Parallels Desktop.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Headway', 'Application', 'Unknown', 'Unknown', '/Applications/Headway.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Element', 'Application', 'im.riot.app', '1.12.28', '/Applications/Element.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Apps for Google App', 'Application', 'kj.gapps', '1.4.2', '/Applications/Apps for Google App.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Notion', 'Application', 'notion.id', '7.34.0', '/Applications/Notion.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Postman Interceptor', 'Application', 'com.postman.Postman-Interceptor', '1.4.6', '/Applications/Postman Interceptor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('HelloWebLite', 'Application', 'net.langui.HelloWebFree', '1.2.4', '/Applications/HelloWebLite.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Digital Hex Converter', 'Application', 'com.mightyIT.hex-converter', '1.0', '/Applications/HEX Converter.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Home Edition', 'Application', 'Unknown', 'Unknown', '/Applications/Home Edition.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Xcode', 'Application', 'com.apple.dt.Xcode', '27.0', '/Applications/Xcode.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('monday.com', 'Application', 'com.monday.desktop', '1.0.45', '/Applications/monday.com.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('V-Control Pro 1', 'Application', 'Unknown', 'Unknown', '/Applications/V-Control Pro 1.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Nicegram', 'Application', 'Unknown', 'Unknown', '/Applications/Nicegram.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Proton Wallet', 'Application', 'Unknown', 'Unknown', '/Applications/Proton Wallet.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Kepler', 'Application', 'com.kepler.app', '0.10.0', '/Applications/Kepler.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Bluesky', 'Application', 'Unknown', 'Unknown', '/Applications/Bluesky.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Day One', 'Application', 'com.bloombuilt.dayone-mac', '2026.19', '/Applications/Day One.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('VoiceChanger', 'Application', 'Unknown', 'Unknown', '/Applications/VoiceChanger.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('System Designer', 'Application', 'com.ecarriou.systemdesigner', '5.3.1', '/Applications/System Designer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('virtualOS', 'Application', 'com.github.yep.ios.virtualOS', '3.0', '/Applications/virtualOS.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PowerShell', 'Application', 'com.microsoft.powershell', '7.5.4', '/Applications/PowerShell.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('RocketSim', 'Application', 'com.swiftLee.RocketSim', '16.5.0', '/Applications/RocketSim.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Pyxen', 'Application', 'com.pyxen.app', '26.5', '/Applications/Pyxen.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('OneDrive', 'Application', 'com.microsoft.OneDrive', '26.173.0906', '/Applications/OneDrive.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Zangi', 'Application', 'Unknown', 'Unknown', '/Applications/Zangi.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Warp', 'Application', 'dev.warp.Warp-Stable', '0.2026.09.09.08.26.02', '/Applications/Warp.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Pastel', 'Application', 'com.highcaffeinecontent.pastel', '2.6.1', '/Applications/Pastel.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SaveTik', 'Application', 'Unknown', 'Unknown', '/Applications/SaveTik.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Windows App', 'Application', 'com.microsoft.rdc.macos', '11.4.0', '/Applications/Windows App.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Homey', 'Application', 'Unknown', 'Unknown', '/Applications/Homey.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('iHosts', 'Application', 'net.toolinbox.ihosts', '1.4.0', '/Applications/iHosts.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('XHelper', 'Application', 'com.veasoftware.XHelper', '1.4.0', '/Applications/XHelper.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Moonlight', 'Application', 'com.moonlight-stream.Moonlight', '6.1.0', '/Applications/Moonlight.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Supabase Go', 'Application', 'Unknown', 'Unknown', '/Applications/Supabase Go.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('White Noise', 'Application', 'Unknown', 'Unknown', '/Applications/White Noise.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Core Shell', 'Application', 'io.coressh.shell', '5.1.1', '/Applications/Core Shell.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Spotify', 'Application', 'Unknown', 'Unknown', '/Applications/Spotify.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Geox Kids Books', 'Application', 'Unknown', 'Unknown', '/Applications/Geox Kids Books.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('OnSong 2020', 'Application', 'Unknown', 'Unknown', '/Applications/OnSong 2020.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('LiftOff!', 'Application', 'Unknown', 'Unknown', '/Applications/LiftOff!.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PyCharm', 'Application', 'com.jetbrains.pycharm', '2026.2.0.1', '/Applications/PyCharm.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Hex Fiend', 'Application', 'com.ridiculousfish.HexFiend', '2.15', '/Applications/Hex Fiend.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('FamilyTree', 'Application', 'Unknown', 'Unknown', '/Applications/FamilyTree.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Simple Web Server', 'Application', 'org.simplewebserver.simplewebserver', '1.2.17', '/Applications/Simple Web Server.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('RealTimeSync', 'Application', 'org.freefilesync.RealTimeSync', '14.10', '/Applications/RealTimeSync.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('iMovie', 'Application', 'com.apple.iMovieApp', '10.4.4', '/Applications/iMovie.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Mail for Gmail', 'Application', 'com.fokusek.imailprogmail.com', '2.2.2', '/Applications/Mail for Gmail.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Luna', 'Application', 'com.orucar.projedenemesi', '1.2', '/Applications/Luna 2.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SnailGitLite', 'Application', 'net.langui.SnailGitFree', '1.11.8', '/Applications/SnailGitLite.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Happy', 'Application', 'Unknown', 'Unknown', '/Applications/Happy.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('PhotoStickies', 'Application', 'org.grunenberg.PhotoStickies', '6.0.1', '/Applications/PhotoStickies.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SQLPro Studio', 'Application', 'com.hankinsoft.osx.sqlprostudio', '2026.259', '/Applications/SQLPro Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Appily', 'Application', 'com.dragdrop.app', '3.5', '/Applications/Appily.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Vesta', 'Application', 'studio.creative-ai.ArtifactPlayer', '1.1', '/Applications/ArtifactPlayer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('DBeaver Community', 'Application', 'org.jkiss.dbeaver.core.product', '26.1.2', '/Applications/DBeaver.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('RectLabel', 'Application', 'com.waysify.roi', '2026.04.02', '/Applications/RectLabel.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('KeyPad', 'Application', 'com.toolbunch.KeyPad', '2.30', '/Applications/KeyPad.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('iTranslate', 'Application', 'Unknown', 'Unknown', '/Applications/iTranslate.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Inkscape', 'Application', 'org.inkscape.Inkscape', '1.4.4', '/Applications/Inkscape.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Cursor', 'Application', 'com.todesktop.230313mzl4w4u92', '3.9.16', '/Applications/Cursor.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Resolutioner', 'Application', 'com.sunapps.resolutioner', '2.0', '/Applications/Resolutioner.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('ZeroTier', 'Application', 'com.zerotier.ZeroTier-UI', '1.16.1', '/Applications/ZeroTier.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Bluesfest', 'Application', 'Unknown', 'Unknown', '/Applications/Bluesfest.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('WCHSerialPort', 'Application', 'cn.wch.serial.tool', '1.1.6', '/Applications/WCHSerialPort.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Dante Via', 'Application', 'com.audinate.DanteViaApp', '1.4.1', '/Applications/Dante Via.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Music Player', 'Application', 'Unknown', 'Unknown', '/Applications/Music Player.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('SVG Viewer', 'Application', 'com.onedotlab.svgviewer', '1.2.0', '/Applications/SVGViewer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Mockup', 'Application', 'com.hasankassem.mockup', '4.4.2', '/Applications/Mockup.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Whisper Transcription', 'Application', 'com.goodsnooze.MacWhisper', '15.1.1', '/Applications/Whisper Transcription.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Wispr Flow', 'Application', 'com.electron.wispr-flow', '1.5.530', '/Applications/Wispr Flow.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Maps+', 'Application', 'Unknown', 'Unknown', '/Applications/Maps+.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Microsoft Word', 'Application', 'com.microsoft.Word', '16.113.2', '/Applications/Microsoft Word.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('FitFileExplorer', 'Application', 'net.ro-z.FitFileExplorer', '3.5', '/Applications/FitFileExplorer.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('CodeCows', 'Application', 'de.zeezide.cows.CodeCows', '1.0.12', '/Applications/CodeCows.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Anyplace TV', 'Application', 'Unknown', 'Unknown', '/Applications/Anyplace TV.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Memo AI', 'Application', 'Unknown', 'Unknown', '/Applications/Memo AI.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('WidgetWall', 'Application', 'com.amicoapps.widgetwall', '4.1.3', '/Applications/WidgetWall.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Okta Verify', 'Application', 'com.okta.mobile', '9.69.0', '/Applications/Okta Verify.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Off', 'Application', 'com.bridgetech.off-free', '3.39.1', '/Applications/Off Free.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Logo Maker', 'Application', 'com.logo.maker.design.creator.app', '2.4', '/Applications/Logo Maker.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Extract Any File', 'Application', 'com.moonapps.extractanyfile', '1.0', '/Applications/Extract Any File.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Status Saver Scan QR Code WA +', 'Application', 'Unknown', 'Unknown', '/Applications/Status Saver Scan QR Code WA +.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('RoomColors', 'Application', 'com.codexbit.RoomColors', '1.1', '/Applications/RoomColors.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Nitro', 'Application', 'com.gentlemencoders.nitro', '2026.07.03', '/Applications/Nitro.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('OmniFocus', 'Application', 'com.omnigroup.OmniFocus4', '4.9.2', '/Applications/OmniFocus.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Docs for Google Docs and Drive', 'Application', 'com.fokusek.docspro.com', '3.6.5', '/Applications/Docs for Google Docs and Drive.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Mastodon', 'Application', 'Unknown', 'Unknown', '/Applications/Mastodon.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Amazon Kindle', 'Application', 'com.amazon.Lassen', '7.67', '/Applications/Amazon Kindle.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Numbers Creator Studio', 'Application', 'com.apple.Numbers', '15.3.1', '/Applications/Numbers Creator Studio.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Fortinet Support Tool', 'Application', 'com.fortinet.support-tool', '3.0.24', '/Applications/Fortinet Support Tool.app', 'VERIFIED');
INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ('Core Tunnel', 'Application', 'io.coressh.tunnel', '5.1.1', '/Applications/Core Tunnel.app', 'VERIFIED');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Cloudflare', 'DNS & Edge Infrastructure', 30.0, 360.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Google Workspace & Drive', 'Cloud Storage & Identity', 27.0, 324.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('GitHub', 'Source Control & CI/CD', 20.0, 240.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Anthropic Claude', 'AI Ideation & Reasoning', 26.67, 320.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('OpenAI ChatGPT', 'AI Multimodal & Coding', 26.67, 320.0, 'ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Apple Developer Program', 'macOS / iOS Code Signing', 11.58, 139.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Parallels Desktop Pro', 'Virtualization Hypervisor', 13.33, 160.0, 'ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Desktop Commander MCP', 'AI System Control', 10.0, 120.0, 'ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('TagSpaces Pro', 'Offline File Management', 5.0, 60.0, 'ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('DEVONthink Pro', 'Knowledge Architecture', 8.25, 99.0, 'ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Proton (Pass & Mail)', 'Encrypted Vault & Security', 12.5, 150.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ('Tailscale / Headscale', 'Mesh VPN & Zero-Trust', 0.0, 0.0, 'CRITICAL / ACTIVE', 'CORE', 'rspnoizy@gmail.com');
