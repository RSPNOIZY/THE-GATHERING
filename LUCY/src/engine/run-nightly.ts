#!/usr/bin/env npx tsx
/**
 * LUCY — Full Nightly Run
 * 
 * Chains: Analysis → n8n Feed → Notifications → Report
 * 
 * This is the single entry point for Lucy's nightly cycle.
 * Run via: npx tsx src/engine/run-nightly.ts
 * Or via cron/n8n scheduler.
 * 
 * Lucy thinks. n8n acts. Humans decide.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { runNightlyAnalysis } from './nightly-analysis';
import { convertToN8nFeed, generateCreatorNotifications } from './n8n-bridge';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LUCY_DIR = '/Users/m2ultra/NOIZYLAB/lucy';

async function runFullNightly(): Promise<void> {
  const fullStart = Date.now();
  
  console.log('═══════════════════════════════════════════════');
  console.log('  LUCY — Full Nightly Cycle');
  console.log('═══════════════════════════════════════════════\n');

  // ─── PHASE 1: ANALYSIS ─────────────────────────────────
  console.log('  Phase 1: Deep Analysis...');
  const report = runNightlyAnalysis();
  console.log(`    ✅ Report generated: ${report.date}`);
  console.log(`    📊 ${report.opportunities.length} opportunities, ${report.risks.length} risks`);
  console.log(`    🎭 ${report.creator_readiness.length} creator readiness assessments`);
  console.log(`    ⏱  ${report.analysis_duration_ms}ms\n`);

  // ─── PHASE 2: N8N FEED ─────────────────────────────────
  console.log('  Phase 2: n8n Feed Generation...');
  const feed = await convertToN8nFeed(report);
  console.log(`    ✅ Feed generated: ${feed.total_actions} actions`);
  console.log(`    🤖 n8n: ${feed.n8n_actions} | 👤 human: ${feed.human_actions} | 💻 claude_code: ${feed.claude_code_actions}\n`);

  // ─── PHASE 3: NOTIFICATIONS ────────────────────────────
  console.log('  Phase 3: Creator Notifications...');
  const notifications = generateCreatorNotifications(report);
  console.log(`    ✅ ${notifications.length} notifications generated`);
  
  // Write notifications to file for n8n pickup
  const notifDir = join(LUCY_DIR, 'n8n-queue');
  mkdirSync(notifDir, { recursive: true });
  writeFileSync(
    join(notifDir, `${report.date}-notifications.json`),
    JSON.stringify(notifications, null, 2),
  );
  console.log(`    📤 Written to n8n-queue/${report.date}-notifications.json\n`);

  // ─── PHASE 4: SUMMARY ─────────────────────────────────
  const totalDuration = Date.now() - fullStart;

  // Write run summary
  const summary = {
    date: report.date,
    report_id: report.report_id,
    feed_id: feed.feed_id,
    total_duration_ms: totalDuration,
    phases: {
      analysis_ms: report.analysis_duration_ms,
      feed_actions: feed.total_actions,
      notifications: notifications.length,
    },
    executive_summary: report.executive_summary,
    top_three: report.top_three,
    risks_count: report.risks.length,
    decisions_needed: report.decisions_needed,
    compassion_gates: {
      cleared: report.opportunities.filter(o => o.compassion_cleared).length,
      blocked: report.opportunities.filter(o => !o.compassion_cleared).length,
    },
  };

  const summaryDir = join(LUCY_DIR, 'nightly-reports');
  mkdirSync(summaryDir, { recursive: true });
  writeFileSync(
    join(summaryDir, `${report.date}-summary.json`),
    JSON.stringify(summary, null, 2),
  );

  console.log('  ─── Executive Summary ─────────────────────');
  console.log(`  ${report.executive_summary}`);
  console.log('\n  ─── Top 3 Actions ─────────────────────────');
  report.top_three.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('\n  ─── Compassion Gates ──────────────────────');
  console.log(`  Cleared: ${summary.compassion_gates.cleared} | Blocked: ${summary.compassion_gates.blocked}`);
  console.log(`\n  ─── Total Duration: ${totalDuration}ms ──────`);
  console.log('\n  Reports:');
  console.log(`    lucy/nightly-reports/${report.date}.json`);
  console.log(`    lucy/nightly-reports/${report.date}-summary.json`);
  console.log(`    lucy/n8n-queue/${report.date}-feed.json`);
  console.log(`    lucy/n8n-queue/${report.date}-notifications.json`);
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Lucy thinks. n8n acts. Humans decide.');
  console.log('═══════════════════════════════════════════════\n');
}

// Run
runFullNightly().catch(err => {
  console.error('  ❌ Lucy nightly cycle failed:', err.message);
  process.exit(1);
});
