import * as vscode from 'vscode';

export class NoizyStatusBar {
  private items: vscode.StatusBarItem[] = [];
  private timer?: NodeJS.Timer;
  private cfg: any;

  constructor(private ctx: vscode.ExtensionContext, cfg: any) {
    this.cfg = cfg;
  }

  start() {
    // ── Left: GABRIEL status
    const gabriel = vscode.window.createStatusBarItem('noizybeast.gabriel', vscode.StatusBarAlignment.Left, 200);
    gabriel.text = '$(loading~spin) GABRIEL';
    gabriel.tooltip = 'GABRIEL V4 — click to ping';
    gabriel.command = 'noizybeast.gabrielPing';
    gabriel.show();
    this.items.push(gabriel);

    // ── Left: Countdown
    const countdown = vscode.window.createStatusBarItem('noizybeast.countdown', vscode.StatusBarAlignment.Left, 199);
    countdown.tooltip = 'Time to April 17, 2026 target';
    countdown.command = 'noizybeast.openPanel';
    countdown.show();
    this.items.push(countdown);

    // ── Right: T4 quick cell burst
    const cellBurst = vscode.window.createStatusBarItem('noizybeast.cellburst', vscode.StatusBarAlignment.Right, 102);
    cellBurst.text = '$(database) T4';
    cellBurst.tooltip = 'T4 Cell Burst — Save session to GABRIEL memcells';
    cellBurst.command = 'noizybeast.t4';
    cellBurst.show();
    this.items.push(cellBurst);

    // ── Right: T10 Dream Capture
    const dream = vscode.window.createStatusBarItem('noizybeast.dream', vscode.StatusBarAlignment.Right, 101);
    dream.text = '$(moon) T10';
    dream.tooltip = 'T10 Dream Capture — Close session + Plowman Chronicles';
    dream.command = 'noizybeast.t10';
    dream.show();
    this.items.push(dream);

    // ── Right: Open Panel
    const panel = vscode.window.createStatusBarItem('noizybeast.panel', vscode.StatusBarAlignment.Right, 100);
    panel.text = '$(server) NOIZY';
    panel.tooltip = 'Open NOIZYBEAST Empire Panel';
    panel.command = 'noizybeast.openPanel';
    panel.show();
    this.items.push(panel);

    this.ctx.subscriptions.push(...this.items);

    // Tick every minute
    this.tick(gabriel, countdown);
    this.timer = setInterval(() => this.tick(gabriel, countdown), 60000);

    // Check GABRIEL every 30s
    this.checkGabriel(gabriel);
    setInterval(() => this.checkGabriel(gabriel), 30000);
  }

  private tick(gabriel: vscode.StatusBarItem, countdown: vscode.StatusBarItem) {
    const target = new Date(this.cfg.targetDate + 'T00:00:00-04:00');
    const diff = target.getTime() - Date.now();
    if (diff > 0) {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      countdown.text = `$(clock) ${d}d ${h}h → Apr 17`;
    }
  }

  private async checkGabriel(item: vscode.StatusBarItem) {
    try {
      const r = await fetch(`${this.cfg.gabrielUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        item.text = '$(check) GABRIEL V4';
        item.color = '#10b981';
        item.backgroundColor = undefined;
      } else {
        item.text = '$(warning) GABRIEL';
        item.color = '#f59e0b';
      }
    } catch {
      item.text = '$(error) GABRIEL';
      item.color = '#ef4444';
    }
  }

  setEdgeStatus(status: 'LIVE' | 'ERROR' | 'OFF') {
    const gabriel = this.items.find(i => i.id === 'noizybeast.gabriel');
    if (!gabriel) return;
    const icons: Record<string, string> = { LIVE: '$(radio-tower)', ERROR: '$(warning)', OFF: '$(error)' };
    const colors: Record<string, string> = { LIVE: '#10b981', ERROR: '#f59e0b', OFF: '#ef4444' };
    gabriel.text = `${icons[status]} GABRIEL`;
    gabriel.color = colors[status];
    gabriel.tooltip = status === 'LIVE'
      ? 'Gabriel Edge LIVE — wss://heaven.rsp-5f3.workers.dev/ws'
      : `Gabriel Edge ${status}`;
  }

  flash(turbo: string) {
    const panel = this.items.find(i => i.id === 'noizybeast.panel');
    if (!panel) return;
    const orig = panel.text;
    panel.text = `$(check) ${turbo} done`;
    panel.color = '#10b981';
    setTimeout(() => { panel.text = orig; panel.color = undefined; }, 3000);
  }

  updateConfig(cfg: any) { this.cfg = cfg; }

  dispose() {
    this.items.forEach(i => i.dispose());
    if (this.timer) clearInterval(this.timer as any);
  }
}
