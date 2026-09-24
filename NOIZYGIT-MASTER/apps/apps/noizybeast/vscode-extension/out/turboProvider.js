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
exports.NoizyTurboProvider = void 0;
const vscode = __importStar(require("vscode"));
// ── TURBO TREE PROVIDER ────────────────────────────────────
class NoizyTurboProvider {
    getTreeItem(el) { return el; }
    getChildren() {
        return [
            // ── Core Turbo Commands (T1–T10) ──────────────────────
            new TurboItem('T1 Scaffold', 'New component from intent', 'noizybeast.t1', '$(add)', 'T1'),
            new TurboItem('T2 Flow Sync', 'Load session context', 'noizybeast.t2', '$(refresh)', 'T2'),
            new TurboItem('T3 Deploy Cannon', 'Ship to Cloudflare edge', 'noizybeast.t3', '$(rocket)', 'T3'),
            new TurboItem('T4 Cell Burst', 'Save to GABRIEL memcells', 'noizybeast.t4', '$(database)', 'T4'),
            new TurboItem('T5 Consent Snap', 'Rights check in 3 seconds', 'noizybeast.t5', '$(lock)', 'T5'),
            new TurboItem('T6 Mutation Replay', 'Full transformation chain', 'noizybeast.t6', '$(history)', 'T6'),
            new TurboItem('T7 Forge', 'XTTS+RVC+C2PA synthesis', 'noizybeast.t7', '$(mic)', 'T7'),
            new TurboItem('T8 X1000', 'Max quality mode', 'noizybeast.t8', '$(star-full)', 'T8'),
            new TurboItem('T9 Fix Canon', 'Diagnose + repair', 'noizybeast.t9', '$(wrench)', 'T9'),
            new TurboItem('T10 Dream Capture', 'Close session + Chronicles', 'noizybeast.t10', '$(moon)', 'T10'),
            // ── System Turbo Scripts ──────────────────────────────
            new TurboItem('Pipeline', 'HEAL→DEDUPE→UNIFY→VERIFY', 'noizybeast.turboPipeline', '$(symbol-event)', 'PIPELINE'),
            new TurboItem('Zap Network', 'DNS flush + DHCP renew + reset', 'noizybeast.turboZap', '$(zap)', 'ZAP'),
            new TurboItem('Git Sync', 'Push all repos to GitHub', 'noizybeast.turboGitSync', '$(git-commit)', 'GITSYNC'),
            new TurboItem('Reset', 'Full environment reset', 'noizybeast.turboReset', '$(debug-restart)', 'RESET'),
            new TurboItem('Mount Omen', 'Mount HP-OMEN external volume', 'noizybeast.turboMountOmen', '$(plug)', 'OMEN'),
        ];
    }
}
exports.NoizyTurboProvider = NoizyTurboProvider;
class TurboItem extends vscode.TreeItem {
    constructor(label, desc, cmd, icon, id) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.id = id;
        this.description = desc;
        this.iconPath = new vscode.ThemeIcon(icon.replace(/\$\(|\)/g, ''));
        this.command = { command: cmd, title: label };
        this.contextValue = 'turboItem';
    }
}
//# sourceMappingURL=turboProvider.js.map