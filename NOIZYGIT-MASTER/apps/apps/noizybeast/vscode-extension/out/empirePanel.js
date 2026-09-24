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
exports.NoizyEmpirePanel = void 0;
const vscode = __importStar(require("vscode"));
class NoizyEmpirePanel {
    static show(ctx) {
        if (NoizyEmpirePanel.current) {
            NoizyEmpirePanel.current.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('noizyEmpire', '⚡ NOIZYBEAST Empire', vscode.ViewColumn.Two, { enableScripts: true, retainContextWhenHidden: true });
        NoizyEmpirePanel.current = panel;
        panel.webview.html = NoizyEmpirePanel.html();
        panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.cmd) {
                case 'turbo':
                    await vscode.commands.executeCommand('noizybeast.' + msg.t.toLowerCase());
                    break;
                case 'navigate':
                    await vscode.commands.executeCommand('noizybeast.' + msg.screen);
                    break;
                case 'copy':
                    await vscode.env.clipboard.writeText(msg.text);
                    break;
            }
        }, undefined, ctx.subscriptions);
        panel.onDidDispose(() => { NoizyEmpirePanel.current = undefined; });
    }
    static html() {
        const target = new Date('2026-04-17T00:00:00-04:00');
        const diff = target.getTime() - Date.now();
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#05070c;color:#e8eaf0;font-family:'Segoe UI',sans-serif;padding:20px;height:100vh;overflow-y:auto}
h2{color:#f59e0b;font-size:16px;margin-bottom:4px}
.sub{font-size:10px;color:#64748b;letter-spacing:1px;margin-bottom:16px}
.countdown{text-align:center;padding:16px;border-radius:10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);margin-bottom:16px}
.cd-num{font-size:28px;font-weight:900;color:#ef4444}
.cd-label{font-size:10px;color:#94a3b8;margin-top:4px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px}
.card-title{font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;margin-bottom:8px}
.turbo-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.tbtn{padding:7px 4px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#94a3b8;font-size:10px;font-weight:700;cursor:pointer;transition:.15s}
.tbtn:hover{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.08)}
.sys-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px}
.dot{width:7px;height:7px;border-radius:50%;background:#64748b;flex-shrink:0}
.dot.live{background:#10b981;box-shadow:0 0 6px #10b981}
.dot.down{background:#ef4444}
.sname{flex:1}
.saddr{font-size:9px;font-family:monospace;color:#64748b}
.sbadge{font-size:8px;padding:1px 6px;border-radius:3px;letter-spacing:1px;font-weight:700;background:rgba(100,116,139,.15);color:#64748b}
.sbadge.live{background:rgba(16,185,129,.15);color:#10b981}
.sbadge.down{background:rgba(239,68,68,.15);color:#ef4444}
.orders{display:flex;flex-direction:column;gap:5px}
.order{font-size:10px;padding:5px 8px;border-radius:5px;background:rgba(0,0,0,.2);display:flex;align-items:center;gap:8px}
.order.done{color:#64748b;text-decoration:line-through}
.order.high{color:#fca5a5}
.order.med{color:#fdba74}
.env-list{display:flex;flex-direction:column;gap:5px}
.env-row{display:flex;gap:8px;font-size:9px;font-family:monospace;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.env-key{color:#f59e0b;width:100px;flex-shrink:0}
.env-val{color:#64748b;word-break:break-all}
</style>
</head><body>
<h2>⚡ NOIZYBEAST — Empire Panel</h2>
<div class="sub">GABRIEL V4 · RSP_001 · DAZEFLOW · GOD.local</div>

<div class="countdown">
  <div class="cd-num">${d}d ${h}h</div>
  <div class="cd-label">TO APRIL 17, 2026</div>
</div>

<div class="card" style="margin-bottom:14px">
  <div class="card-title">⚡ Turbo Scripts — click to run</div>
  <div class="turbo-grid">
    <button class="tbtn" onclick="turbo('t1')">T1</button>
    <button class="tbtn" onclick="turbo('t2')">T2</button>
    <button class="tbtn" onclick="turbo('t3')">T3</button>
    <button class="tbtn" onclick="turbo('t4')">T4</button>
    <button class="tbtn" onclick="turbo('t5')">T5</button>
    <button class="tbtn" onclick="turbo('t6')">T6</button>
    <button class="tbtn" onclick="turbo('t7')">T7</button>
    <button class="tbtn" onclick="turbo('t8')">T8</button>
    <button class="tbtn" onclick="turbo('t9')">T9</button>
    <button class="tbtn" style="grid-column:span 1" onclick="turbo('t10')">T10</button>
  </div>
</div>

<div class="grid">
  <div class="card">
    <div class="card-title">📡 Live Systems</div>
    <div class="sys-row"><div class="dot" id="d7777"></div><span class="sname">GABRIEL V4</span><span class="saddr">:7777</span><span class="sbadge" id="b7777">…</span></div>
    <div class="sys-row"><div class="dot" id="d8080"></div><span class="sname">Voice Bridge</span><span class="saddr">:8080</span><span class="sbadge" id="b8080">…</span></div>
    <div class="sys-row"><div class="dot" id="d11434"></div><span class="sname">Ollama</span><span class="saddr">:11434</span><span class="sbadge" id="b11434">…</span></div>
    <div class="sys-row"><div class="dot" id="d7778"></div><span class="sname">Consent Oracle</span><span class="saddr">:7778</span><span class="sbadge" id="b7778">…</span></div>
  </div>
  <div class="card">
    <div class="card-title">📋 Standing Orders</div>
    <div class="orders">
      <div class="order high">Deploy HEAVEN — keystone</div>
      <div class="order high">voice-v2 pipeline deploy</div>
      <div class="order high">GABRIEL V4 orchestration</div>
      <div class="order high">consent-oracle MCP</div>
      <div class="order med">wrangler login</div>
      <div class="order med">CF Tunnel voice.noizy.ai</div>
      <div class="order done">T1–T10 turbo scripts ✓</div>
      <div class="order done">NOIZY IDE ✓</div>
      <div class="order done">VSCode extension ✓</div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-title">⚙ Environment</div>
  <div class="env-list">
    <div class="env-row"><span class="env-key">CF_ACCOUNT</span><span class="env-val">5f36aa9795348ea681d0b21910dfc82a</span></div>
    <div class="env-row"><span class="env-key">HEAVEN</span><span class="env-val">heaven.rsp-5f3.workers.dev (v17.2.0)</span></div>
    <div class="env-row"><span class="env-key">GABRIEL_LOCAL</span><span class="env-val">localhost:7777</span></div>
    <div class="env-row"><span class="env-key">D1_DB</span><span class="env-val">gabriel_db / fc0edd97-5a4c-49ff-a5fb-b3d7d8fda1aa</span></div>
    <div class="env-row"><span class="env-key">OPERATOR</span><span class="env-val">RSP_001 — Robert Stephen Plowman</span></div>
    <div class="env-row"><span class="env-key">DEADLINE</span><span class="env-val">April 17, 2026</span></div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
function turbo(t) { vscode.postMessage({ cmd:'turbo', t }); }

// Status checks — local + edge
async function check(id, url, badge) {
  const dot = document.getElementById('d'+id);
  const b = document.getElementById('b'+id);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    dot.className = r.ok ? 'dot live' : 'dot down';
    b.textContent = r.ok ? 'LIVE' : 'DOWN';
    b.className = r.ok ? 'sbadge live' : 'sbadge down';
  } catch {
    dot.className = 'dot down';
    b.textContent = 'DOWN';
    b.className = 'sbadge down';
  }
}
// Local services
check('7777',  'http://localhost:7777/health','');
check('8080',  'http://localhost:8080/health','');
check('11434', 'http://localhost:11434/api/tags','');
check('7778',  'http://localhost:7778/health','');
// Edge — Heaven on Cloudflare
check('heaven','https://heaven.rsp-5f3.workers.dev/health','');
setInterval(()=>{
  check('7777',   'http://localhost:7777/health','');
  check('8080',   'http://localhost:8080/health','');
  check('heaven', 'https://heaven.rsp-5f3.workers.dev/health','');
}, 30000);
</script>
</body></html>`;
    }
}
exports.NoizyEmpirePanel = NoizyEmpirePanel;
//# sourceMappingURL=empirePanel.js.map