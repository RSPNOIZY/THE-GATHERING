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
exports.NoizyOrdersProvider = void 0;
const vscode = __importStar(require("vscode"));
class NoizyOrdersProvider {
    getTreeItem(el) { return el; }
    getChildren() {
        return [
            new OrderItem('TARGET: April 17, 2026', false, 'critical'),
            new OrderItem('Deploy HEAVEN Worker', false, 'high'),
            new OrderItem('voice-v2 STT/Claude dispatch', false, 'high'),
            new OrderItem('DreamChamber v2 architecture', false, 'high'),
            new OrderItem('GABRIEL V4 orchestration', false, 'high'),
            new OrderItem('wrangler login → CF auth', false, 'high'),
            new OrderItem('Cloudflare Tunnel voice.noizy.ai', false, 'med'),
            new OrderItem('Teams iPhone → DreamChamber', false, 'med'),
            new OrderItem('mlx-whisper on GOD.local', false, 'med'),
            new OrderItem('consent-oracle MCP build', false, 'med'),
            new OrderItem('synthesis-oracle MCP build', false, 'med'),
            new OrderItem('provenance-weaver MCP build', false, 'med'),
            new OrderItem('GitHub Enterprise restructure ✓', true, 'done'),
            new OrderItem('CF account locked in ✓', true, 'done'),
            new OrderItem('T1–T10 turbo scripts ✓', true, 'done'),
            new OrderItem('NOIZY IDE Phase 1 ✓', true, 'done'),
            new OrderItem('VSCode extension ✓', true, 'done'),
        ];
    }
}
exports.NoizyOrdersProvider = NoizyOrdersProvider;
class OrderItem extends vscode.TreeItem {
    constructor(label, done, urgency) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(done ? 'check' : urgency === 'critical' ? 'error' : urgency === 'high' ? 'warning' : 'circle-outline');
        this.description = done ? 'DONE' : urgency.toUpperCase();
        if (done)
            this.contextValue = 'orderDone';
    }
}
//# sourceMappingURL=ordersProvider.js.map