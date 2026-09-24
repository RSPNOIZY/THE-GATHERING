# KV Namespace Configurations

Cloudflare KV namespaces for fast key-value storage.

## Namespaces

| Namespace | ID | Purpose |
|-----------|-----|---------|
| noizylab-submissions | 6e888a017ebe4ba78ed7497c4929439b | Repair submissions cache |
| noizylab-edge-config | 58c254f29cc34ea3b8c0d7f932793f65 | Edge configuration |
| agent-state | 150a3c324a204ff0b9a7959b1804c1d0 | AI agent state |
| session-cache | 36120a47f04d409a89817d071f56b51d | User sessions |
| command-queue | 41d546e3361a40e4a54913aa1ccd060e | Command buffer |
| voice-command-buffer | 9041960ebdd04ae3a0da77858de0be0b | Voice input queue |
| ai-response-cache | 997243c430bd4fa1ab2bf196efa81eda | AI response cache |
| rate-limiter | 83fdd2e927104c59947bd3dbf31c401f | Rate limiting |
| feature-flags | 7d688ad29c29433c89c59c56f51edf34 | Feature toggles |
| emergency-alerts | 5fb15b70a3224864bdfbf9b3606c084b | Alert system |
| master-command-log | 99d2dd87f4b54a97bb57afa1d8f55965 | Audit log |
| mc96-hotrod-cache | 4d592d48655c47c28f2ca08ecf9bd78a | Hot data cache |
| gorunfree-execution-state | 5cffc7c3e0b64c1d998942ef7da1ab3f | Execution state |
| dafixer-repair-queue | c56ed2c6404b4a0187ead4ea611a6787 | Repair queue |
| aeon-god-kernel-state | c875b025b2994097a2381132f9256a83 | Core state |
| noizymem-sessions | d50297600be7447faa314fe4f6f2b9bb | Memory sessions |
| model-performance | 341737a98a5448329c101c4b076f96f3 | Model metrics |
| godaddy-escape-state | 1e53c3a43ad9471d937997df9f22a8b1 | Migration state |
| tencc-locks | 00283ea0a53d43ec93e31e2478fe1ddf | Pipeline locks |
| cf-proxy-cache | a89b22a616474de5a26732f744c02104 | Proxy cache |

## Usage Patterns

### Session Storage
```javascript
// Store session
await KV.put(`session:${userId}`, JSON.stringify(data), { expirationTtl: 3600 });

// Retrieve session
const session = await KV.get(`session:${userId}`, 'json');
```

### Feature Flags
```javascript
// Check feature
const enabled = await FEATURE_FLAGS.get('voice-commands') === 'true';
```

### Rate Limiting
```javascript
// Increment counter
const key = `rate:${clientIp}:${Date.now() / 60000 | 0}`;
const count = parseInt(await RATE_LIMITER.get(key) || '0') + 1;
await RATE_LIMITER.put(key, count.toString(), { expirationTtl: 120 });
```

## Binding in wrangler.toml

```toml
[[kv_namespaces]]
binding = "SUBMISSIONS"
id = "6e888a017ebe4ba78ed7497c4929439b"

[[kv_namespaces]]
binding = "SESSIONS"
id = "36120a47f04d409a89817d071f56b51d"
```
