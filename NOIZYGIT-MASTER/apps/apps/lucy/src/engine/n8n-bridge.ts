/**
 * LUCY — n8n Bridge v2
 * 
 * Lucy thinks. n8n acts.
 * 
 * This bridge converts Lucy's opportunities into n8n-executable actions.
 * v2: Direct HTTP delivery to n8n webhook endpoints + file queue fallback.
 * v2: Notion dashboard sync for Lucy's nightly status.
 * v2: Linear issue creation for human-required actions.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Opportunity, NightlyReport } from '../schemas/lucy-core';

// ─── CONFIG ──────────────────────────────────────────────

const N8N_QUEUE_DIR = '/Users/m2ultra/NOIZYLAB/lucy/n8n-queue';
const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_USER = process.env.N8N_USER || 'noizylab';
const N8N_PASS = process.env.N8N_PASS || 'noizy-local-2026';
const HEAVEN_URL = process.env.HEAVEN_URL || 'https://heaven.rsp-5f3.workers.dev';
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || '';
const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_EVENTS_DB_ID = process.env.NOTION_EVENTS_DB_ID || '';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || '';
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID || '';

// ─── N8N ACTION ──────────────────────────────────────────

export interface N8nAction {
  id: string;
  opportunity_id: string;
  
  // What to do
  action: string;
  executor: 'n8n' | 'human' | 'claude_code';
  priority: number;
  
  // n8n workflow targeting
  workflow_type: 'webhook' | 'cron' | 'manual';
  webhook_url?: string;
  webhook_path?: string;
  
  // Payload for n8n
  payload: {
    action_type: string;
    actors: string[];
    brands: string[];
    details: Record<string, any>;
    revenue_impact?: { lower: number; upper: number; timeframe: string };
  };
  
  // Status
  status: 'queued' | 'sent' | 'acknowledged' | 'completed' | 'failed';
  delivery_method: 'http' | 'file' | 'pending';
  delivered_at?: string;
  error?: string;
  
  // Governance
  requires_human_approval: boolean;
  compassion_cleared: boolean;
  
  created_at: string;
}

// ─── OPPORTUNITY FEED ────────────────────────────────────

export interface OpportunityFeed {
  feed_id: string;
  generated_at: string;
  report_date: string;
  analysis_run_id: string;
  
  actions: N8nAction[];
  
  // Delivery stats
  total_actions: number;
  n8n_actions: number;
  human_actions: number;
  claude_code_actions: number;
  delivered_http: number;
  delivered_file: number;
  delivery_failures: number;
}

// ─── HTTP DELIVERY ───────────────────────────────────────

interface DeliveryResult {
  success: boolean;
  method: 'http' | 'file';
  status?: number;
  error?: string;
}

/**
 * Deliver an action payload to an n8n webhook endpoint via HTTP.
 * Falls back to file queue on failure.
 */
async function deliverToN8n(
  path: string,
  payload: Record<string, any>
): Promise<DeliveryResult> {
  const url = `${N8N_BASE_URL}/webhook/${path}`;
  const auth = Buffer.from(`${N8N_USER}:${N8N_PASS}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'X-Lucy-Source': 'nightly-bridge',
        'X-Lucy-Feed-Id': payload.feed_id || 'unknown',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      return { success: true, method: 'http', status: response.status };
    } else {
      return {
        success: false,
        method: 'http',
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      method: 'http',
      error: err.message || 'Network error',
    };
  }
}

/**
 * Create a Linear issue for actions requiring human attention.
 */
async function createLinearIssue(action: N8nAction): Promise<boolean> {
  if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) return false;

  const priorityMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 4 };
  const linearPriority = priorityMap[action.priority] || 3;

  const mutation = `mutation {
    issueCreate(input: {
      teamId: "${LINEAR_TEAM_ID}",
      title: "[Lucy] ${action.action.replace(/"/g, '\\"')}",
      description: "**Lucy Nightly Discovery**\\n\\n${action.payload.details.description?.replace(/"/g, '\\"') || 'No description'}\\n\\n**Actors:** ${action.payload.actors.join(', ')}\\n**Brands:** ${action.payload.brands.join(', ')}\\n**Confidence:** ${action.payload.details.confidence || 'N/A'}\\n\\n---\\n*Auto-created by Lucy nightly analysis*",
      priority: ${linearPriority}
    }) { success issue { id url } }
  }`;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': LINEAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json() as any;
    return data?.data?.issueCreate?.success || false;
  } catch {
    return false;
  }
}

/**
 * Log a Lucy event to the Notion events database.
 */
async function logToNotion(event: {
  title: string;
  source: string;
  summary: string;
  severity: string;
}): Promise<boolean> {
  if (!NOTION_API_KEY || !NOTION_EVENTS_DB_ID) return false;

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_EVENTS_DB_ID },
        properties: {
          'Event': { title: [{ text: { content: event.title } }] },
          'Source': { select: { name: event.source } },
          'Summary': { rich_text: [{ text: { content: event.summary.substring(0, 2000) } }] },
          'Severity': { select: { name: event.severity } },
          'Timestamp': { date: { start: new Date().toISOString() } },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Notify Heaven17/GABRIEL about Lucy's nightly results.
 */
async function notifyGabriel(report: {
  type: string;
  summary: string;
  data: Record<string, any>;
}): Promise<boolean> {
  if (!NOIZY_API_KEY || !HEAVEN_URL) return false;

  try {
    const response = await fetch(`${HEAVEN_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Noizy-Key': NOIZY_API_KEY,
      },
      body: JSON.stringify({
        event_type: report.type,
        actor_id: 'LUCY_001',
        payload: report,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── CONVERTER ───────────────────────────────────────────

/**
 * Convert Lucy's nightly report into an n8n opportunity feed.
 * v2: Delivers actions via HTTP to running n8n instance.
 *     Falls back to file queue if n8n unreachable.
 *     Creates Linear issues for human-required actions.
 *     Logs summary to Notion.
 *     Notifies GABRIEL via Heaven17.
 */
export async function convertToN8nFeed(report: NightlyReport): Promise<OpportunityFeed> {
  const actions: N8nAction[] = [];
  const now = new Date().toISOString();
  const feedId = uuidv4();

  // ── Build actions from opportunities ───────────────────
  for (const opportunity of report.opportunities) {
    if (!opportunity.compassion_cleared) continue;

    for (const suggestion of opportunity.suggested_actions) {
      const webhookPath = suggestion.executor === 'n8n'
        ? mapActionToWebhook(opportunity.insight_type)
        : undefined;

      const action: N8nAction = {
        id: uuidv4(),
        opportunity_id: opportunity.id,
        action: suggestion.action,
        executor: suggestion.executor,
        priority: suggestion.priority,
        
        workflow_type: suggestion.executor === 'n8n' ? 'webhook' : 'manual',
        webhook_path: webhookPath,
        
        payload: {
          action_type: opportunity.insight_type,
          actors: opportunity.actors_involved,
          brands: opportunity.brands_involved,
          details: {
            title: opportunity.title,
            description: opportunity.description,
            confidence: opportunity.confidence,
            urgency: opportunity.urgency,
            reasoning: opportunity.reasoning_chain.map(r => r.thought).join(' → '),
          },
          revenue_impact: opportunity.estimated_revenue_impact
            ? {
                lower: opportunity.estimated_revenue_impact.lower,
                upper: opportunity.estimated_revenue_impact.upper,
                timeframe: opportunity.estimated_revenue_impact.timeframe,
              }
            : undefined,
        },
        
        status: 'queued',
        delivery_method: 'pending',
        requires_human_approval: opportunity.requires_decision || suggestion.executor === 'human',
        compassion_cleared: opportunity.compassion_cleared,
        created_at: now,
      };

      actions.push(action);
    }
  }

  // Sort by priority
  actions.sort((a, b) => a.priority - b.priority);

  // ── Deliver n8n actions via HTTP ───────────────────────
  let deliveredHttp = 0;
  let deliveredFile = 0;
  let failures = 0;

  for (const action of actions) {
    if (action.executor === 'n8n' && action.webhook_path) {
      const result = await deliverToN8n(action.webhook_path, {
        feed_id: feedId,
        action_id: action.id,
        source: 'lucy-nightly',
        ...action.payload,
        priority: action.priority,
        opportunity_id: action.opportunity_id,
      });

      if (result.success) {
        action.status = 'sent';
        action.delivery_method = 'http';
        action.delivered_at = new Date().toISOString();
        deliveredHttp++;
      } else {
        action.status = 'queued';
        action.delivery_method = 'file';
        action.error = result.error;
        deliveredFile++;
      }
    }

    // Create Linear issues for human-required actions
    if (action.requires_human_approval && action.executor === 'human') {
      const created = await createLinearIssue(action);
      if (created) {
        action.status = 'sent';
        console.log(`    📋 Linear issue created: ${action.action}`);
      }
    }
  }

  // ── Build feed ─────────────────────────────────────────
  const feed: OpportunityFeed = {
    feed_id: feedId,
    generated_at: now,
    report_date: report.date,
    analysis_run_id: report.analysis_run_id,
    actions,
    total_actions: actions.length,
    n8n_actions: actions.filter(a => a.executor === 'n8n').length,
    human_actions: actions.filter(a => a.executor === 'human').length,
    claude_code_actions: actions.filter(a => a.executor === 'claude_code').length,
    delivered_http: deliveredHttp,
    delivered_file: deliveredFile,
    delivery_failures: failures,
  };

  // ── Always write file queue (backup) ───────────────────
  mkdirSync(N8N_QUEUE_DIR, { recursive: true });
  writeFileSync(
    join(N8N_QUEUE_DIR, `${report.date}-feed.json`),
    JSON.stringify(feed, null, 2),
  );

  // ── Log to Notion ──────────────────────────────────────
  await logToNotion({
    title: `[Lucy] Nightly Analysis — ${report.date}`,
    source: 'Lucy',
    summary: `${feed.total_actions} actions (${feed.n8n_actions} auto, ${feed.human_actions} human). ${report.opportunities.length} opportunities, ${report.risks.length} risks. HTTP delivered: ${deliveredHttp}, File queued: ${deliveredFile}.`,
    severity: report.risks.length > 3 ? 'High' : report.risks.length > 0 ? 'Medium' : 'Low',
  });

  // ── Notify GABRIEL ─────────────────────────────────────
  await notifyGabriel({
    type: 'lucy_nightly_complete',
    summary: `Lucy nightly complete: ${feed.total_actions} actions, ${report.opportunities.length} opportunities`,
    data: {
      report_date: report.date,
      total_actions: feed.total_actions,
      opportunities: report.opportunities.length,
      risks: report.risks.length,
      delivered_http: deliveredHttp,
      delivered_file: deliveredFile,
    },
  });

  // ── Deliver entire feed to master orchestrator ─────────
  await deliverToN8n('lucy-nightly-feed', {
    feed_id: feedId,
    report_date: report.date,
    total_actions: feed.total_actions,
    actions_summary: {
      n8n: feed.n8n_actions,
      human: feed.human_actions,
      claude_code: feed.claude_code_actions,
    },
    top_opportunities: report.opportunities.slice(0, 5).map(o => ({
      title: o.title,
      confidence: o.confidence,
      urgency: o.urgency,
    })),
    risks: report.risks.slice(0, 3),
    delivery_stats: {
      http: deliveredHttp,
      file: deliveredFile,
      failures,
    },
  });

  return feed;
}

/**
 * Map an insight type to the appropriate n8n webhook path.
 */
function mapActionToWebhook(insightType: string): string {
  const webhookMap: Record<string, string> = {
    'creative_resonance': 'lucy-creative',
    'teaching_effectiveness': 'lucy-teaching',
    'collaboration_chemistry': 'lucy-collab',
    'audience_pattern': 'lucy-audience',
    'revenue_trajectory': 'lucy-revenue',
    'consent_health': 'consent-revoke',
    'community_sentiment': 'lucy-community',
    'cultural_context': 'lucy-creative',
    'risk_signal': 'lucy-risk',
    'opportunity_emergence': 'lucy-opportunity',
  };
  return webhookMap[insightType] || 'lucy-nightly-feed';
}

/**
 * Generate notification payloads for creators affected by opportunities.
 */
export function generateCreatorNotifications(report: NightlyReport): Array<{
  actor_id: string;
  notification_type: string;
  message: string;
  opportunity_id: string;
  requires_action: boolean;
}> {
  const notifications: Array<{
    actor_id: string;
    notification_type: string;
    message: string;
    opportunity_id: string;
    requires_action: boolean;
  }> = [];

  for (const opportunity of report.opportunities) {
    if (!opportunity.compassion_cleared) continue;

    for (const actorId of opportunity.actors_involved) {
      notifications.push({
        actor_id: actorId,
        notification_type: opportunity.insight_type,
        message: `Lucy discovered: ${opportunity.title}`,
        opportunity_id: opportunity.id,
        requires_action: opportunity.requires_decision,
      });
    }
  }

  return notifications;
}
