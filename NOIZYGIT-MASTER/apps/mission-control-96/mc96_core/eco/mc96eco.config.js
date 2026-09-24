/**
 * MC96ECO Universe Configuration
 * Master config for all 6 brands
 */

export const MC96ECO = {
  version: '1.0.0',
  founder: {
    id: 'RSP_001',
    name: 'Robert Stephen Plowman',
    email: 'rsp@noizy.ai'
  },
  
  // The 6 Brands
  brands: {
    'NOIZY.AI': {
      domain: 'noizy.ai',
      purpose: 'Intelligence Layer & A.I.V.A.',
      status: 'active'
    },
    'NOIZYVOX': {
      domain: 'noizyvox.com',
      purpose: 'Voice Consent Platform',
      status: 'building'
    },
    'NOIZYLAB': {
      domain: 'noizylab.com',
      purpose: 'Development & Research',
      status: 'active'
    },
    'NOIZYKIDZ': {
      domain: 'noizykidz.com',
      purpose: 'Haptic Music Education',
      status: 'planned'
    },
    'FISHMUSICINC': {
      domain: 'fishmusicinc.com',
      purpose: 'Music Catalog & Licensing',
      status: 'active'
    },
    'DREAMCHAMBER': {
      domain: 'dream.noizy.ai',
      purpose: '500-Year Codex Creative Sanctuary',
      status: 'building'
    }
  },

  // Sacred Invariants
  invariants: {
    royaltySplit: { creator: 0.75, platform: 0.25 },
    consentRequired: true,
    revocationSacred: true,
    compensationAutomatic: true
  },

  // Infrastructure
  infrastructure: {
    cloudflare: {
      accountId: '5f36aa9795348ea681d0b21910dfc82a',
      workers: ['heaven17', 'noizy-core', 'consent-gateway']
    },
    databases: {
      d1: ['noizyai-db', 'gabriel_db', 'agent-memory'],
      postgres: 'localhost:5432',
      redis: 'localhost:6379',
      qdrant: 'localhost:6333',
      neo4j: 'localhost:7687'
    },
    search: {
      meilisearch: 'localhost:7700'
    },
    ai: {
      ollama: 'localhost:11434',
      models: ['codestral', 'llama3.3:70b']
    }
  }
};

export default MC96ECO;
