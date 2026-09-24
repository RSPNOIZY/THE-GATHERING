/**
 * MOCK NOTION SYNC INTEGRATION — Milestone #1
 * 
 * Simulates synchronization of commands, plans, and receipts to the
 * Notion Human Command Centre.
 */

const fs = require('fs');
const path = require('path');

function syncCommand(cmd, plan_id) {
  const syncLogPath = path.join(__dirname, '..', 'logs', 'notion_sync.log');
  const timestamp = new Date().toISOString();
  
  const payload = {
    event: "notion:sync:command",
    timestamp,
    notion_database: "Human Command Centre",
    properties: {
      "Command ID": cmd.command_id,
      "Actor": cmd.actor,
      "Source": cmd.source,
      "Intent": cmd.intent,
      "Risk Class": cmd.risk_class,
      "Plan ID": plan_id,
      "Idempotency Key": cmd.idempotency_key,
      "Status": "Synchronized"
    }
  };

  const line = `[${timestamp}] NOTION SYNC: ${JSON.stringify(payload)}`;
  console.log(`[Notion Sync] Syncing command ${cmd.command_id} to Notion database`);
  
  try {
    fs.mkdirSync(path.dirname(syncLogPath), { recursive: true });
    fs.appendFileSync(syncLogPath, line + "\n");
  } catch (e) {
    console.error(`[Notion Sync] Failed to write to log: ${e.message}`);
  }
}

module.exports = {
  syncCommand
};
