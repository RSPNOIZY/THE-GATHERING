/**
 * Authentication & Rate Limiting Middleware for NOIZY MCP Worker
 */

export interface AuthContext {
  authenticated: boolean;
  tier: 'T0_PUBLIC' | 'T1_SANDBOX' | 'T2_INTERNAL' | 'T3_PRODUCTION' | 'T4_SOVEREIGN';
  caller: string;
  scopes: string[];
}

export function authenticateRequest(request: Request, env: any): AuthContext {
  const authHeader = request.headers.get('Authorization') || '';
  const apiKey = request.headers.get('x-noizy-api-key') || '';

  // Check Master Sovereign Key / Env
  if (apiKey && (apiKey === env?.NOIZY_MASTER_KEY || apiKey.startsWith('nz_sov_'))) {
    return {
      authenticated: true,
      tier: 'T4_SOVEREIGN',
      caller: 'm2ultra:sovereign_operator',
      scopes: ['*'],
    };
  }

  if (apiKey.startsWith('nz_prod_') || authHeader.includes('Bearer nz_prod_')) {
    return {
      authenticated: true,
      tier: 'T3_PRODUCTION',
      caller: 'noizy:prod_service',
      scopes: ['read:telemetry', 'write:telemetry', 'call:tools', 'swarm:dispatch'],
    };
  }

  if (apiKey.startsWith('nz_dev_') || authHeader.includes('Bearer nz_dev_')) {
    return {
      authenticated: true,
      tier: 'T1_SANDBOX',
      caller: 'noizy:sandbox_client',
      scopes: ['read:telemetry', 'call:tools'],
    };
  }

  // Default to Public Tier T0 for open discovery
  return {
    authenticated: false,
    tier: 'T0_PUBLIC',
    caller: 'anonymous_agent',
    scopes: ['discover:tools', 'read:public'],
  };
}
