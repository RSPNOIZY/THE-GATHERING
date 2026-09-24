import * as vscode from 'vscode';

// ── TURBO TREE PROVIDER ────────────────────────────────────
export class NoizyTurboProvider implements vscode.TreeDataProvider<TurboItem> {
  getTreeItem(el: TurboItem) { return el; }
  getChildren() {
    return [
      // ── Core Turbo Commands (T1–T10) ──────────────────────
      new TurboItem('T1 Scaffold',      'New component from intent',        'noizybeast.t1',  '$(add)',        'T1'),
      new TurboItem('T2 Flow Sync',     'Load session context',             'noizybeast.t2',  '$(refresh)',    'T2'),
      new TurboItem('T3 Deploy Cannon', 'Ship to Cloudflare edge',          'noizybeast.t3',  '$(rocket)',     'T3'),
      new TurboItem('T4 Cell Burst',    'Save to GABRIEL memcells',         'noizybeast.t4',  '$(database)',   'T4'),
      new TurboItem('T5 Consent Snap',  'Rights check in 3 seconds',        'noizybeast.t5',  '$(lock)',       'T5'),
      new TurboItem('T6 Mutation Replay','Full transformation chain',       'noizybeast.t6',  '$(history)',    'T6'),
      new TurboItem('T7 Forge',         'XTTS+RVC+C2PA synthesis',          'noizybeast.t7',  '$(mic)',        'T7'),
      new TurboItem('T8 X1000',         'Max quality mode',                 'noizybeast.t8',  '$(star-full)', 'T8'),
      new TurboItem('T9 Fix Canon',     'Diagnose + repair',                'noizybeast.t9',  '$(wrench)',     'T9'),
      new TurboItem('T10 Dream Capture','Close session + Chronicles',       'noizybeast.t10', '$(moon)',       'T10'),
      // ── System Turbo Scripts ──────────────────────────────
      new TurboItem('Pipeline',         'HEAL→DEDUPE→UNIFY→VERIFY',         'noizybeast.turboPipeline',  '$(symbol-event)',   'PIPELINE'),
      new TurboItem('Zap Network',      'DNS flush + DHCP renew + reset',   'noizybeast.turboZap',       '$(zap)',             'ZAP'),
      new TurboItem('Git Sync',         'Push all repos to GitHub',         'noizybeast.turboGitSync',   '$(git-commit)',      'GITSYNC'),
      new TurboItem('Reset',            'Full environment reset',           'noizybeast.turboReset',     '$(debug-restart)',   'RESET'),
      new TurboItem('Mount Omen',       'Mount HP-OMEN external volume',    'noizybeast.turboMountOmen', '$(plug)',            'OMEN'),
    ];
  }
}

class TurboItem extends vscode.TreeItem {
  constructor(label: string, desc: string, cmd: string, icon: string, public readonly id: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = desc;
    this.iconPath = new vscode.ThemeIcon(icon.replace(/\$\(|\)/g,''));
    this.command = { command: cmd, title: label };
    this.contextValue = 'turboItem';
  }
}
