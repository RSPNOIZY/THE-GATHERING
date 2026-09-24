"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToGabriel = sendToGabriel;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const cp = __importStar(require("child_process"));
const turboProvider_1 = require("./turboProvider");
const ordersProvider_1 = require("./ordersProvider");
const empirePanel_1 = require("./empirePanel");
const statusBar_1 = require("./statusBar");
// ── CONFIG ─────────────────────────────────────────────────
function cfg(key) {
    return vscode.workspace.getConfiguration('noizybeast').get(key);
}
let statusBar;
let outputChannel;
// ── Gabriel Edge WebSocket — persistent connection to Heaven ───────────────
const HEAVEN_WSS = 'wss://heaven.rsp-5f3.workers.dev/ws';
let gabrielWs = null;
function connectGabrielEdge(ctx) {
    if (gabrielWs && gabrielWs.readyState === WebSocket.OPEN)
        return;
    try {
        gabrielWs = new WebSocket(HEAVEN_WSS);
        gabrielWs.onopen = () => {
            log('Gabriel Edge CONNECTED — wss://heaven.rsp-5f3.workers.dev/ws');
            statusBar?.setEdgeStatus('LIVE');
        };
        gabrielWs.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'connected') {
                    log(`Gabriel Edge: v${msg.version} — ${msg.days_to_deadline} days to deadline`);
                }
                if (msg.type === 'empire.status') {
                    log(`Empire: actors=${msg.actors} tokens=${msg.active_tokens} ledger=${msg.ledger_events}`);
                }
                outputChannel?.appendLine(`[Gabriel Edge] ${JSON.stringify(msg)}`);
            }
            catch { /* malformed frame */ }
        };
        gabrielWs.onerror = () => {
            log('Gabriel Edge connection error — will retry');
            statusBar?.setEdgeStatus('ERROR');
        };
        gabrielWs.onclose = () => {
            log('Gabriel Edge disconnected');
            statusBar?.setEdgeStatus('OFF');
            gabrielWs = null;
            // Reconnect after 30s
            setTimeout(() => connectGabrielEdge(ctx), 30000);
        };
    }
    catch (e) {
        log(`Gabriel Edge failed: ${e}`);
    }
}
function sendToGabriel(type, payload) {
    if (gabrielWs?.readyState === WebSocket.OPEN) {
        gabrielWs.send(JSON.stringify({ type, payload }));
    }
}
// ── ACTIVATE ───────────────────────────────────────────────
function activate(ctx) {
    outputChannel = vscode.window.createOutputChannel('NOIZYBEAST');
    log('NOIZYBEAST activating — GABRIEL V4 · DAZEFLOW · RSP_001');
    // Status bar
    statusBar = new statusBar_1.NoizyStatusBar(ctx, getCfg());
    statusBar.start();
    // Tree views
    const turboProvider = new turboProvider_1.NoizyTurboProvider();
    const ordersProvider = new ordersProvider_1.NoizyOrdersProvider();
    vscode.window.registerTreeDataProvider('noizybeast.turbosView', turboProvider);
    vscode.window.registerTreeDataProvider('noizybeast.ordersView', ordersProvider);
    // Register all commands
    reg(ctx, 'noizybeast.t1', () => cmdT1());
    reg(ctx, 'noizybeast.t2', () => cmdTurbo('T2'));
    reg(ctx, 'noizybeast.t3', () => cmdT3());
    reg(ctx, 'noizybeast.t4', () => cmdTurbo('T4'));
    reg(ctx, 'noizybeast.t5', () => cmdT5());
    reg(ctx, 'noizybeast.t6', () => cmdT6());
    reg(ctx, 'noizybeast.t7', () => cmdT7());
    reg(ctx, 'noizybeast.t8', () => cmdT8());
    reg(ctx, 'noizybeast.t9', () => cmdT9());
    reg(ctx, 'noizybeast.t10', () => cmdTurbo('T10'));
    reg(ctx, 'noizybeast.status', () => cmdStatus());
    reg(ctx, 'noizybeast.openPanel', () => empirePanel_1.NoizyEmpirePanel.show(ctx));
    reg(ctx, 'noizybeast.consent', () => cmdConsentSnap());
    reg(ctx, 'noizybeast.gabrielPing', () => gabrielPing());
    reg(ctx, 'noizybeast.dreamCapture', () => cmdTurbo('T10'));
    reg(ctx, 'noizybeast.scaffold', () => cmdT1());
    // ── System Turbo Scripts ──────────────────────────────────
    reg(ctx, 'noizybeast.turboPipeline', () => runTurboScript('turbo_pipeline.sh', 'Pipeline: HEAL→DEDUPE→UNIFY→VERIFY'));
    reg(ctx, 'noizybeast.turboZap', () => runTurboScript('turbo_zap.sh', 'Zap: DNS flush + network reset'));
    reg(ctx, 'noizybeast.turboGitSync', () => runTurboScript('turbo_git_sync.sh', 'Git Sync: pushing all repos'));
    reg(ctx, 'noizybeast.turboReset', () => runTurboScript('turbo_reset.sh', 'Reset: full environment reset'));
    reg(ctx, 'noizybeast.turboMountOmen', () => runTurboScript('turbo_mount_omen.sh', 'Mount: HP-OMEN volume'));
    // ── New v4.0 Commands ──────────────────────────────────────
    reg(ctx, 'noizybeast.activateVoice', () => cmdActivateVoice());
    reg(ctx, 'noizybeast.sendToGabriel', () => cmdSendToGabriel());
    reg(ctx, 'noizybeast.deployWorker', () => cmdDeployWorker());
    reg(ctx, 'noizybeast.runTurbo', () => cmdRunTurbo());
    reg(ctx, 'noizybeast.openCommandCenter', () => cmdCommandCenter(ctx));
    reg(ctx, 'noizybeast.lucyAsk', () => cmdLucyAsk());
    // Auto Flow Sync on startup
    if (cfg('autoFlowSync')) {
        setTimeout(() => cmdTurbo('T2', false), 3000);
    }
    // Config change listener
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('noizybeast')) {
            statusBar.updateConfig(getCfg());
        }
    }));
    // Connect to Gabriel Edge (Heaven WebSocket)
    connectGabrielEdge(ctx);
    // Empire status pulse every 60s
    setInterval(() => sendToGabriel('empire.status'), 60000);
    log('NOIZYBEAST active — T1–T10 ready · Gabriel Edge connected · Cmd+Shift+Alt+N to open panel');
    vscode.window.showInformationMessage('⚡ NOIZYBEAST activated — GABRIEL V4 online', 'Open Empire Panel', 'T2 Flow Sync')
        .then(choice => {
        if (choice === 'Open Empire Panel')
            vscode.commands.executeCommand('noizybeast.openPanel');
        if (choice === 'T2 Flow Sync')
            cmdTurbo('T2');
    });
}
// ── COMMAND IMPLEMENTATIONS ────────────────────────────────
async function cmdT1() {
    const intent = await vscode.window.showInputBox({
        prompt: 'T1 SCAFFOLD — Describe the component/project',
        placeHolder: 'e.g. consent-oracle MCP server',
    });
    if (!intent)
        return;
    cmdTurbo('T1', true, intent);
}
async function cmdT3() {
    const workers = ['heaven', 'consent-gateway', 'claude-proxy-worker', 'voice-consent-worker'];
    const worker = await vscode.window.showQuickPick(workers, {
        title: 'T3 DEPLOY CANNON — Select target worker',
        canPickMany: false,
    }) || await vscode.window.showInputBox({ prompt: 'Or enter worker name manually' });
    if (!worker)
        return;
    cmdTurbo('T3', true, worker);
}
async function cmdT5() {
    const id = await vscode.window.showInputBox({
        prompt: 'T5 CONSENT SNAP — Voice or Asset ID',
        placeHolder: 'e.g. rsp001-primary-voice',
    });
    if (!id)
        return;
    cmdTurbo('T5', true, id);
}
async function cmdT6() {
    const id = await vscode.window.showInputBox({
        prompt: 'T6 MUTATION REPLAY — Asset ID',
        placeHolder: 'e.g. voice-session-2026-03-27',
    });
    if (!id)
        return;
    cmdTurbo('T6', true, id);
}
async function cmdT7() {
    const voiceId = await vscode.window.showInputBox({ prompt: 'T7 FORGE — Voice ID', placeHolder: 'rsp001-primary' });
    if (!voiceId)
        return;
    const text = await vscode.window.showInputBox({ prompt: 'Text to synthesize', placeHolder: 'Enter the text to speak…' });
    if (!text)
        return;
    cmdTurbo('T7', true, `${voiceId} "${text}"`);
}
async function cmdT8() {
    const turbos = ['T2 Flow Sync', 'T3 Deploy Cannon', 'T5 Consent Snap', 'T7 Forge', 'T9 Fix Canon'];
    const pick = await vscode.window.showQuickPick(turbos, { title: 'T8 X1000 — Run which turbo at max quality?' });
    if (!pick)
        return;
    const t = pick.split(' ')[0];
    cmdTurbo('T8', true, t);
}
async function cmdT9() {
    const issue = await vscode.window.showInputBox({
        prompt: 'T9 FIX CANON — Describe the issue',
        placeHolder: 'e.g. CryptoTokenKit error -3 wrangler auth',
    });
    if (!issue)
        return;
    cmdTurbo('T9', true, issue);
}
async function cmdConsentSnap() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.document.getText(editor.selection);
    const id = selection || await vscode.window.showInputBox({ prompt: 'Asset or Voice ID for consent snap' });
    if (!id)
        return;
    cmdTurbo('T5', true, id.trim());
}
async function cmdStatus() {
    const panel = vscode.window.createWebviewPanel('noizyStatus', 'NOIZYBEAST — Empire Status', vscode.ViewColumn.Two, { enableScripts: true });
    panel.webview.html = getStatusHtml(getCfg());
    // Ping GABRIEL
    try {
        const res = await fetch(`${getCfg().gabrielUrl}/status`);
        if (res.ok) {
            const data = await res.json();
            panel.webview.postMessage({ type: 'status', data });
        }
    }
    catch { /* GABRIEL offline */ }
}
async function gabrielPing() {
    // Ping Gabriel Edge (Heaven) via WebSocket first
    if (gabrielWs?.readyState === WebSocket.OPEN) {
        sendToGabriel('ping');
        sendToGabriel('empire.status');
        vscode.window.showInformationMessage('Gabriel Edge LIVE — wss://heaven.rsp-5f3.workers.dev/ws');
        log('Gabriel Edge ping sent');
        return;
    }
    // Fallback: HTTP health check on local DreamChamber
    const url = cfg('gabrielUrl') + '/health';
    try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
            vscode.window.showInformationMessage('GABRIEL V4 local @ :7777 — Edge reconnecting…');
            log('GABRIEL local health check: ONLINE');
        }
        else {
            vscode.window.showWarningMessage(`GABRIEL returned ${r.status}`);
        }
    }
    catch {
        vscode.window.showWarningMessage('GABRIEL local offline — check DreamChamber :7777');
        log('GABRIEL health check: OFFLINE');
    }
}
// ── TURBO RUNNER ───────────────────────────────────────────
async function cmdTurbo(turbo, showOutput = true, arg) {
    const noizyLab = cfg('noizyLabPath').replace('~', process.env.HOME || '');
    const script = path.join(noizyLab, 'noizybeast', 'turbo-scripts', 'noizybeast-turbo.js');
    const argStr = arg ? ` "${arg}"` : '';
    const cmd = `node "${script}" ${turbo}${argStr}`;
    log(`▶ ${cmd}`);
    outputChannel.show(true);
    outputChannel.appendLine(`\n⚡ ${new Date().toISOString()} — Running ${turbo}${arg ? ' ' + arg : ''}`);
    outputChannel.appendLine('─'.repeat(60));
    // Try GABRIEL API first, fallback to local CLI
    try {
        const res = await fetch(`${cfg('gabrielUrl')}/turbo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turbo, arg, operator: cfg('operator'), source: 'vscode-extension' }),
            signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
            const data = await res.json();
            const out = data.output || data.result || JSON.stringify(data, null, 2);
            outputChannel.appendLine(out);
            if (showOutput)
                vscode.window.showInformationMessage(`✅ ${turbo} complete`);
            statusBar.flash(turbo);
            return;
        }
    }
    catch { /* fallback to CLI */ }
    // CLI fallback
    const proc = cp.exec(cmd, { cwd: noizyLab, env: { ...process.env, NOIZY_SOURCE: 'vscode' } });
    proc.stdout?.on('data', d => outputChannel.append(d));
    proc.stderr?.on('data', d => outputChannel.append(d));
    proc.on('close', code => {
        outputChannel.appendLine(`\n${code === 0 ? '✅' : '❌'} ${turbo} exited ${code}`);
        if (showOutput && code === 0)
            vscode.window.showInformationMessage(`✅ ${turbo} complete`);
        if (code !== 0)
            vscode.window.showErrorMessage(`❌ ${turbo} failed — see NOIZYBEAST output`);
        statusBar.flash(turbo);
    });
}
// ── SYSTEM TURBO SCRIPT RUNNER ─────────────────────────────
function runTurboScript(scriptName, label) {
    const noizyLab = cfg('noizyLabPath').replace('~', process.env.HOME || '');
    const scriptPath = path.join(noizyLab, 'turbo-scripts', scriptName);
    outputChannel.show(true);
    outputChannel.appendLine(`\n⚡ ${new Date().toISOString()} — ${label}`);
    outputChannel.appendLine('─'.repeat(60));
    const proc = cp.spawn('bash', [scriptPath], {
        cwd: noizyLab,
        env: { ...process.env, NOIZY_SOURCE: 'vscode-turbo' },
    });
    proc.stdout.on('data', (d) => outputChannel.append(d.toString()));
    proc.stderr.on('data', (d) => outputChannel.append(d.toString()));
    proc.on('close', (code) => {
        const status = code === 0 ? '✅' : '❌';
        outputChannel.appendLine(`\n${status} ${label} exited ${code}`);
        if (code === 0)
            vscode.window.showInformationMessage(`${status} ${label}`);
        else
            vscode.window.showErrorMessage(`❌ ${scriptName} failed — see NOIZYBEAST output`);
    });
}
// ── V4.0 COMMAND IMPLEMENTATIONS ──────────────────────────
// Voice: record via system mic → Whisper on GABRIEL → Claude → response
async function cmdActivateVoice() {
    const gabrielUrl = cfg('gabrielUrl');
    const statusMsg = vscode.window.setStatusBarMessage('$(mic) GABRIEL listening…');
    // Use SoX to record a 10-second clip, or let user stop
    const noizyLab = cfg('noizyLabPath').replace('~', process.env.HOME || '');
    const recPath = path.join(noizyLab, 'voice-pipeline', 'uploads', `vscode_${Date.now()}.wav`);
    cp.execSync(`mkdir -p "${path.dirname(recPath)}"`);
    const terminal = vscode.window.createTerminal({ name: 'GABRIEL Voice', hideFromUser: false });
    terminal.show();
    terminal.sendText(`rec "${recPath}" rate 16k channels 1 silence 1 0.1 1% 1 2.0 3% trim 0 15 2>/dev/null && echo "VOICE_DONE"`);
    vscode.window.showInformationMessage('Speak now — recording will auto-stop on silence (max 15s)', 'Stop Now')
        .then(async (choice) => {
        if (choice === 'Stop Now') {
            terminal.sendText('\x03'); // Ctrl+C to stop rec
        }
        // Wait briefly for file to be written
        await new Promise(r => setTimeout(r, 1500));
        statusMsg.dispose();
        try {
            const res = await fetch(`${gabrielUrl}/voice/pipeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: recPath, tower: 'auto' }),
                signal: AbortSignal.timeout(60000),
            });
            const data = await res.json();
            log(`Voice pipeline started: runId=${data.runId}`);
            vscode.window.showInformationMessage(`Voice sent to GABRIEL — runId: ${data.runId}`);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Voice pipeline failed: ${e}`);
        }
        terminal.dispose();
    });
}
// Send current editor selection or file to GABRIEL for analysis
async function cmdSendToGabriel() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor — open a file first');
        return;
    }
    const selection = editor.document.getText(editor.selection);
    const text = selection || editor.document.getText();
    const fileName = path.basename(editor.document.fileName);
    const prompt = `Analyze this code from ${fileName}:\n\n\`\`\`\n${text.slice(0, 4000)}\n\`\`\``;
    outputChannel.show(true);
    outputChannel.appendLine(`\n⚡ GABRIEL — Analyzing ${fileName}`);
    outputChannel.appendLine('─'.repeat(60));
    try {
        const res = await fetch(`${cfg('gabrielUrl')}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: prompt, tts: false }),
            signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (data.reply) {
            outputChannel.appendLine(data.reply);
            vscode.window.showInformationMessage('GABRIEL analysis complete — see output');
        }
        else {
            outputChannel.appendLine(`Error: ${data.error}`);
        }
    }
    catch (e) {
        outputChannel.appendLine(`Error: ${e}`);
        vscode.window.showErrorMessage('GABRIEL offline — check daemon at :7777');
    }
}
// Deploy a Cloudflare Worker via wrangler
async function cmdDeployWorker() {
    const workers = ['noisyvox', 'noisyproof', 'noizy-coming-soon', 'heaven'];
    const pick = await vscode.window.showQuickPick(workers, {
        title: 'Deploy to Cloudflare Edge',
        canPickMany: false,
    });
    if (!pick)
        return;
    const noizyLab = cfg('noizyLabPath').replace('~', process.env.HOME || '');
    const workerPath = path.join(noizyLab, pick);
    outputChannel.show(true);
    outputChannel.appendLine(`\n⚡ Deploying ${pick} to Cloudflare Edge`);
    outputChannel.appendLine('─'.repeat(60));
    const proc = cp.exec(`cd "${workerPath}" && npx wrangler deploy`, {
        env: { ...process.env, NOIZY_SOURCE: 'noizybeast' },
    });
    proc.stdout?.on('data', d => outputChannel.append(d));
    proc.stderr?.on('data', d => outputChannel.append(d));
    proc.on('close', code => {
        const status = code === 0 ? '✅' : '❌';
        outputChannel.appendLine(`\n${status} ${pick} deploy ${code === 0 ? 'complete' : 'failed'}`);
        if (code === 0)
            vscode.window.showInformationMessage(`${pick} deployed to edge`);
        else
            vscode.window.showErrorMessage(`${pick} deploy failed`);
        statusBar.flash('DEPLOY');
    });
}
// Quick turbo picker
async function cmdRunTurbo() {
    const turbos = [
        { label: 'T1 Scaffold', description: 'New project', turbo: 'T1' },
        { label: 'T2 Flow Sync', description: 'Load session', turbo: 'T2' },
        { label: 'T3 Deploy Cannon', description: 'Ship it', turbo: 'T3' },
        { label: 'T4 Cell Burst', description: 'Save to GABRIEL', turbo: 'T4' },
        { label: 'T5 Consent Snap', description: 'Rights check', turbo: 'T5' },
        { label: 'T6 Mutation Replay', description: 'Show lineage', turbo: 'T6' },
        { label: 'T7 Forge', description: 'Voice synthesis', turbo: 'T7' },
        { label: 'T8 X1000', description: 'Max quality mode', turbo: 'T8' },
        { label: 'T9 Fix Canon', description: 'Diagnose & repair', turbo: 'T9' },
        { label: 'T10 Dream Capture', description: 'Close session', turbo: 'T10' },
    ];
    const pick = await vscode.window.showQuickPick(turbos, { title: 'NOIZY Turbo — Pick a script' });
    if (!pick)
        return;
    vscode.commands.executeCommand(`noizybeast.${pick.turbo.toLowerCase()}`);
}
// LUCY: ask from VS Code
async function cmdLucyAsk() {
    const input = await vscode.window.showInputBox({
        prompt: 'Ask LUCY (archives, indexing, heritage)',
        placeHolder: 'e.g. What\'s the status of THE AQUARIUM indexing?',
    });
    if (!input)
        return;
    outputChannel.show(true);
    outputChannel.appendLine(`\n🔮 LUCY — ${input}`);
    outputChannel.appendLine('─'.repeat(60));
    try {
        const res = await fetch(`${cfg('gabrielUrl')}/agent/lucy/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input, agent: 'LUCY_001' }),
            signal: AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (data.response) {
            outputChannel.appendLine(`LUCY: ${data.response}`);
            vscode.window.showInformationMessage(`LUCY: ${data.response.slice(0, 100)}${data.response.length > 100 ? '...' : ''}`);
        }
        else {
            outputChannel.appendLine(`Error: ${data.error}`);
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`LUCY offline — check GABRIEL daemon at :7777`);
    }
}
// Command Center — unified quick-pick for everything
async function cmdCommandCenter(ctx) {
    const commands = [
        { label: '$(mic) Voice Command', description: 'Record + transcribe + Claude', cmd: 'noizybeast.activateVoice' },
        { label: '$(cloud-upload) Deploy Worker', description: 'Ship to Cloudflare Edge', cmd: 'noizybeast.deployWorker' },
        { label: '$(send) Send to GABRIEL', description: 'Analyze current code', cmd: 'noizybeast.sendToGabriel' },
        { label: '$(comment) Ask LUCY', description: 'Archives, indexing, heritage', cmd: 'noizybeast.lucyAsk' },
        { label: '$(zap) Run Turbo', description: 'T1-T10 turbo scripts', cmd: 'noizybeast.runTurbo' },
        { label: '$(server) Empire Status', description: 'Full system report', cmd: 'noizybeast.status' },
        { label: '$(dashboard) Empire Panel', description: 'Open webview dashboard', cmd: 'noizybeast.openPanel' },
        { label: '$(heart) GABRIEL Ping', description: 'Health check', cmd: 'noizybeast.gabrielPing' },
        { label: '$(shield) Consent Snap', description: 'Rights check on selection', cmd: 'noizybeast.consent' },
        { label: '$(terminal) Turbo Pipeline', description: 'HEAL>DEDUPE>UNIFY>VERIFY', cmd: 'noizybeast.turboPipeline' },
        { label: '$(sync) Git Sync', description: 'Push all repos', cmd: 'noizybeast.turboGitSync' },
    ];
    const pick = await vscode.window.showQuickPick(commands, {
        title: 'NOIZYBEAST Command Center',
        matchOnDescription: true,
    });
    if (pick)
        vscode.commands.executeCommand(pick.cmd);
}
// ── HELPERS ────────────────────────────────────────────────
function reg(ctx, cmd, fn) {
    ctx.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
}
function log(msg) {
    outputChannel?.appendLine(`[${new Date().toISOString()}] ${msg}`);
}
function getCfg() {
    const c = vscode.workspace.getConfiguration('noizybeast');
    return {
        gabrielUrl: c.get('gabrielUrl', 'http://localhost:7777'),
        voiceBridgeUrl: c.get('voiceBridgeUrl', 'http://localhost:8080'),
        ollamaUrl: c.get('ollamaUrl', 'http://localhost:11434'),
        cfAccount: c.get('cfAccount', '5f36aa9795348ea681d0b21910dfc82a'),
        operator: c.get('operator', 'RSP_001'),
        noizyLabPath: c.get('noizyLabPath', '~/NOIZYLAB'),
        targetDate: c.get('targetDate', '2026-04-17'),
    };
}
function getStatusHtml(cfg) {
    const target = new Date(cfg.targetDate + 'T00:00:00-04:00');
    const diff = target.getTime() - Date.now();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return `<!DOCTYPE html><html>
<head><meta charset="UTF-8"><style>
body{font-family:'Segoe UI',sans-serif;background:#05070c;color:#e8eaf0;padding:24px;margin:0}
h1{color:#f59e0b;font-size:18px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px}
.label{font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;margin-bottom:6px}
.val{font-family:monospace;font-size:12px;color:#e8eaf0}
.chip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}
.amber{background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.25)}
.red{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.25)}
.countdown{text-align:center;padding:20px;font-size:32px;font-weight:900;color:#ef4444;border:1px solid rgba(239,68,68,.25);border-radius:12px;background:rgba(239,68,68,.06)}
</style></head><body>
<h1>⚡ NOIZYBEAST — Empire Status</h1>
<div class="countdown">${d}d ${h}h<br><span style="font-size:14px;color:#94a3b8">to April 17, 2026</span></div>
<div class="grid">
  <div class="card"><div class="label">Heaven Edge</div><div class="val">heaven.rsp-5f3.workers.dev v17.4.0</div></div>
  <div class="card"><div class="label">Gabriel WSS</div><div class="val">wss://heaven.rsp-5f3.workers.dev/ws</div></div>
  <div class="card"><div class="label">Gabriel Local</div><div class="val">${cfg.gabrielUrl}</div></div>
  <div class="card"><div class="label">Voice Bridge</div><div class="val">${cfg.voiceBridgeUrl}</div></div>
  <div class="card"><div class="label">Operator</div><div class="val">${cfg.operator}</div></div>
  <div class="card"><div class="label">gabriel_db D1</div><div class="val">fc0edd97-5a4c-49ff-a5fb-b3d7d8fda1aa</div></div>
</div>
<div style="margin-top:16px;font-size:10px;color:#64748b">ID: checking via GABRIEL…</div>
</body></html>`;
}
function deactivate() {
    statusBar?.dispose();
}
//# sourceMappingURL=extension.js.map