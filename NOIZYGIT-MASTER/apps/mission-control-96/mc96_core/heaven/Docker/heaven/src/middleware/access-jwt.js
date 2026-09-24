// Heaven API — Access JWT Validation Middleware
// Validates Cf-Access-Jwt-Assertion header at the origin
// Docs: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
//
// Install: npm install jose --save

const jose = require('jose');

// Your Cloudflare Access team domain and Application AUD
// Set these via environment variables
const CF_TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN || 'noizylab';
const CF_ACCESS_AUD = process.env.CF_ACCESS_AUD; // From Access app config
const CF_CERTS_URL = `https://${CF_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`;

let _jwks = null;

async function getJWKS() {
  if (!_jwks) {
    _jwks = jose.createRemoteJWKSet(new URL(CF_CERTS_URL));
  }
  return _jwks;
}

/**
 * Express middleware: validates Cloudflare Access JWT.
 * Blocks requests that don't have a valid JWT from Access.
 *
 * Usage:
 *   const { requireAccessJWT } = require('./middleware/access-jwt');
 *   app.use('/api', requireAccessJWT);
 */
async function requireAccessJWT(req, res, next) {
  // In development mode (no AUD configured), skip validation
  if (!CF_ACCESS_AUD) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ACCESS] JWT validation SKIPPED — CF_ACCESS_AUD not set (dev mode)');
      return next();
    }
    return res.status(500).json({
      error: 'Server misconfiguration: CF_ACCESS_AUD not set',
      code: 'ACCESS_CONFIG_ERROR'
    });
  }

  // Get the JWT from the header (preferred) or cookie
  const token =
    req.headers['cf-access-jwt-assertion'] ||
    req.cookies?.['CF_Authorization'];

  if (!token) {
    console.warn(`[ACCESS] BLOCKED — No JWT present: ${req.method} ${req.path} from ${req.ip}`);
    return res.status(403).json({
      error: 'Access denied — no Cloudflare Access token',
      code: 'ACCESS_NO_TOKEN'
    });
  }

  try {
    const jwks = await getJWKS();
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `https://${CF_TEAM_DOMAIN}.cloudflareaccess.com`,
      audience: CF_ACCESS_AUD,
    });

    // Attach identity to request
    req.accessIdentity = {
      email: payload.email,
      sub: payload.sub,
      iat: payload.iat,
      exp: payload.exp,
      country: payload.country,
    };

    console.log(`[ACCESS] ✓ ${payload.email} → ${req.method} ${req.path}`);
    return next();
  } catch (err) {
    console.error(`[ACCESS] BLOCKED — Invalid JWT: ${err.message} | ${req.method} ${req.path}`);
    return res.status(403).json({
      error: 'Access denied — invalid or expired token',
      code: 'ACCESS_INVALID_TOKEN'
    });
  }
}

/**
 * Optional: softer check that just attaches identity if present
 * but doesn't block unauthenticated requests (for public + private routes).
 */
async function attachAccessIdentity(req, res, next) {
  const token =
    req.headers['cf-access-jwt-assertion'] ||
    req.cookies?.['CF_Authorization'];

  if (token && CF_ACCESS_AUD) {
    try {
      const jwks = await getJWKS();
      const { payload } = await jose.jwtVerify(token, jwks, {
        issuer: `https://${CF_TEAM_DOMAIN}.cloudflareaccess.com`,
        audience: CF_ACCESS_AUD,
      });
      req.accessIdentity = {
        email: payload.email,
        sub: payload.sub,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch {
      // Silent — identity not attached
    }
  }
  return next();
}

module.exports = { requireAccessJWT, attachAccessIdentity };
