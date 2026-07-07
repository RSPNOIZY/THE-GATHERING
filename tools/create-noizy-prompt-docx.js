const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableCell, TableRow, BorderStyle, WidthType, AlignmentType, UnderlineType, TabStopType } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({
        text: 'NOIZY PROMPT SYSTEM',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        thematicBreak: false,
      }),
      new Paragraph({
        text: 'Master Architecture v1.0',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),

      // Metadata
      new Paragraph({
        text: 'Author: Robert Stephen Plowman (RSP_001)',
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Date: March 25, 2026',
        spacing: { after: 400 },
      }),

      // PURPOSE section
      new Paragraph({
        text: 'PURPOSE',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'A persistent knowledge system that generates deployable prompts specifically calibrated to NOIZY infrastructure. Each prompt is immediately executable in Claude Code or Cowork without requiring interpretation or modification.',
        spacing: { after: 400 },
      }),

      // LIVE INFRASTRUCTURE section
      new Paragraph({
        text: 'LIVE INFRASTRUCTURE (VERIFIED 2026-03-25)',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),

      new Paragraph({
        text: 'Cloudflare Account: Fishmusicinc',
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'ID: 5f36aa9795348ea681d0b21910dfc82a',
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Workers Deployed: 1 (deploy — tag: 6598f09e90bb43e9a521bf7206a695c1)',
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'R2 Storage: NOT ENABLED (requires manual Cloudflare Dashboard action)',
        spacing: { after: 300 },
      }),

      // D1 Databases
      new Paragraph({
        text: 'D1 Databases (10 total):',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'gabriel_db: f75939d5-5747-4a9c-8ac2-7710201fda09 (565KB) — Consent kernel',
        spacing: { after: 50, before: 0 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'agent-memory: 7b813205-fd12-4a23-84a6-ce83bc49ec70 (2.5MB) — Gabriel memcells',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizyanthropic: 932e36f7-b5a9-4063-a8d2-4e88cfc874c5 (80KB) — Claude integration',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'rsp-master-budget: 74e6b824-5c10-4b02-8060-3c20217a8ba9 (840KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'aquarium-archive: e6f98279-656b-4f7a-979d-9197821193f5 (233KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'tencc-pipeline: d1a5c748-6e27-43a6-b5f1-394e748da0dc (250KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'mc96-command-central: ef4eda10-7dda-4c31-839d-5d79d76da43f (250KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'godaddy-escape-tracker: dfe9343e-c84c-49fd-8a02-052f37a7155b (94KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizylab-repairs: 2bd4aa06-f9b2-4761-b235-e92e8a21fe45 (459KB)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'subscription-killer: 145b3abb-8647-4514-b39e-79f3a9f03c6a (66KB)',
        spacing: { after: 300 },
        indent: { left: 720 },
      }),

      // KV Namespaces
      new Paragraph({
        text: 'KV Namespaces (20+):',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'GABRIEL_KV: 68710a32a1814ce7994a5be532f871cc',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'GABRIEL_VOICE: 28f2fdce465243759e7f5df6468c8228',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'agent-state: 150a3c324a204ff0b9a7959b1804c1d0',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizyvox-signups: 392c1bf429114148999824a9f9e15169',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizyvox-royalties: 4cf36e4bd1fd44fe802096925413f694',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizylab-customers: 1fb0ba03140b4f069df133444bc3f740',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'session-cache: 36120a47f04d409a89817d071f56b51d',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'model-performance: 341737a98a5448329c101c4b076f96f3',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'emergency-alerts: 5fb15b70a3224864bdfbf9b3606c084b',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'command-queue: 41d546e3361a40e4a54913aa1ccd060e',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'discord-queue: 1f41fb3c',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'CRAWLER_KV: 355f0d9b',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '+ 8 more (20+ total)',
        spacing: { after: 300 },
        indent: { left: 720 },
      }),

      // LOCAL SYSTEMS
      new Paragraph({
        text: 'LOCAL SYSTEMS:',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Heaven Worker: heaven.rsp-5f3.workers.dev (55 endpoints, 25 tables + 9 views)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'DreamChamber: localhost:7777 (11 providers, all streaming)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'Voice Bridge: localhost:8080',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'noizy.ai Landing: BUILT, awaiting deploy',
        spacing: { after: 300 },
        indent: { left: 720 },
      }),

      // MCP SERVERS
      new Paragraph({
        text: 'MCP SERVERS (9 servers, 74 total tools):',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'gabriel-mcp (4 tools), lucy-mcp (11 tools), heaven-mcp (12 tools)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'engr-keith-mcp (6 tools), dream-mcp (5 tools), cb01-mcp (6 tools)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'shirley-mcp (6 tools), family-mcp (6 tools), dreamchamber-audio-mcp (13 tools)',
        spacing: { after: 300 },
        indent: { left: 720 },
      }),

      // AGENT SUBAGENT ARCHITECTURE
      new Paragraph({
        text: 'AGENT SUBAGENT ARCHITECTURE (10 definitions in .claude/agents/):',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'gabriel-orchestrator, engr-keith, consent-auditor, voice-specialist, dream, cb01, shirley, pops, shirl, test-runner',
        spacing: { after: 100 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'DISPATCH: scripts/gabriel-dispatch.sh + scripts/gabriel-merge.sh (worktree + tmux)',
        spacing: { after: 400 },
        indent: { left: 720 },
      }),

      // TIER 1
      new Paragraph({
        text: 'TIER 1: FOUNDATION INFRASTRUCTURE PROMPTS',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),

      new Paragraph({
        text: 'PROMPT 1.1: Deploy Heaven Consent Kernel (Replace Hello World Stub)',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Context:',
        heading: HeadingLevel.HEADING_4,
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: 'Heaven has 55 endpoints defined in src/index.js but is currently deployed as a stub. The full consent kernel with all routes needs to be deployed.',
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'Prompt to Copy:',
        heading: HeadingLevel.HEADING_4,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Include the full prompt text with CORRECTED database IDs:',
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: 'gabriel_db: f75939d5-5747-4a9c-8ac2-7710201fda09 (NOT dfe9343e)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'GABRIEL_KV: 68710a32a1814ce7994a5be532f871cc',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'GABRIEL_VOICE: 28f2fdce465243759e7f5df6468c8228',
        spacing: { after: 100 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'The rest of the prompt follows Rob\'s original structure but corrected for accuracy.',
        spacing: { after: 300 },
      }),

      new Paragraph({
        text: 'PROMPT 1.2: Deploy noizy.ai Landing Page Worker',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Context:',
        heading: HeadingLevel.HEADING_4,
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: 'The landing page HTML is built and saved at noizy-landing/index.html. It needs a Cloudflare Worker wrapper to serve it with the /api/waitlist endpoint.',
        spacing: { after: 300 },
      }),

      new Paragraph({
        text: 'PROMPT 1.3: Build Voice Command Parser Worker',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Include Rob\'s voice worker prompt with corrected IDs.',
        spacing: { after: 300 },
      }),

      // TIER 2
      new Paragraph({
        text: 'TIER 2: CREATOR INFRASTRUCTURE PROMPTS',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),

      new Paragraph({
        text: 'PROMPT 2.1: HVS Registry Schema and Registration API',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Include Rob\'s HVS prompt with corrected D1 IDs.',
        spacing: { after: 300 },
      }),

      new Paragraph({
        text: 'PROMPT 2.2: Creator Onboarding API Worker',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Include Rob\'s onboarding prompt.',
        spacing: { after: 300 },
      }),

      // TIER 3
      new Paragraph({
        text: 'TIER 3: OPERATIONAL AUTOMATION PROMPTS',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),

      new Paragraph({
        text: 'PROMPT 3.1: Weekly Trust Receipt Auto-Publisher',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Include Rob\'s trust receipt prompt.',
        spacing: { after: 400 },
      }),

      // HOW TO USE
      new Paragraph({
        text: 'HOW TO USE ON iPHONE',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: '1. Copy the entire prompt block into Claude Code or Cowork',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '2. Claude reads context and generates production-ready code',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '3. From GOD.local, run the deployment command',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '4. Use success criteria to verify',
        spacing: { after: 300 },
        indent: { left: 720 },
      }),

      // META-PROMPT
      new Paragraph({
        text: 'META-PROMPT FOR CREATING NEW PROMPTS',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'You are generating a new NOIZY infrastructure prompt. The NOIZY Empire has:',
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: 'Cloudflare Account 2446d788',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'D1 database gabriel_db (f75939d5)',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '20+ KV namespaces',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '9 MCP servers with 74 tools',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: '10 agent subagent definitions',
        spacing: { after: 50 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'The landing page at noizy-landing/index.html',
        spacing: { after: 100 },
        indent: { left: 720 },
      }),
      new Paragraph({
        text: 'Describe the specific capability to build and I will generate a complete deployable prompt.',
        spacing: { after: 400 },
      }),

      // Footer
      new Paragraph({
        text: '"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        italics: true,
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const filePath = path.join('/sessions/elegant-sharp-allen/mnt/NOIZYLAB/docs', 'NOIZY_PROMPT_SYSTEM_v1.docx');
  fs.writeFileSync(filePath, buffer);
  console.log(`Document created successfully at ${filePath}`);
});
