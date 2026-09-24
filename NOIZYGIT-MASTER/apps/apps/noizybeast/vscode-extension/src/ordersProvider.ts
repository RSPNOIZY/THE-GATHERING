import * as vscode from 'vscode';

export class NoizyOrdersProvider implements vscode.TreeDataProvider<OrderItem> {
  getTreeItem(el: OrderItem) { return el; }
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

class OrderItem extends vscode.TreeItem {
  constructor(label: string, done: boolean, urgency: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(done ? 'check' : urgency === 'critical' ? 'error' : urgency === 'high' ? 'warning' : 'circle-outline');
    this.description = done ? 'DONE' : urgency.toUpperCase();
    if (done) this.contextValue = 'orderDone';
  }
}
