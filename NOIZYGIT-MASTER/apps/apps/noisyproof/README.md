# Noisy Proof V1

Audio provenance system with C2PA integration, consent enforcement, watermarking, and immutable audit log.

## Architecture

- **C2PA Extension**: Integrates with Adobe/Google's C2PA standard for content authenticity
- **Consent Enforcement**: Manages voice clone authorization and usage rights
- **Watermark Injector**: Embeds inaudible psychoacoustic watermarks for origin verification
- **Immutable Audit Ledger**: Blockchain-ready event logging with hash chain integrity
- **D1 Database**: Stores fingerprints, manifests, consent records, and audit logs

## API Endpoints

- `POST /audio/register` - Register new audio with full provenance
- `POST /consent/grant` - Grant consent for voice/audio usage
- `POST /consent/check` - Check voice clone authorization
- `GET /provenance/:fingerprintId` - Verify audio provenance chain
- `GET /audit/verify` - Verify audit chain integrity
- `GET /audit/stats` - Get audit statistics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database:
```bash
wrangler d1 create noisy-proof
```

3. Apply schema:
```bash
wrangler d1 execute noisy-proof --file=./schema.sql
```

4. Create KV namespace:
```bash
wrangler kv:namespace create "cache"
```

5. Update `wrangler.toml` with your database and KV IDs

6. Deploy:
```bash
npm run deploy
```

## Development

```bash
npm run dev
```

## Core Features

### Audio Fingerprinting
- Chromaprint algorithm support
- Metadata preservation (sample rate, bit depth, channels)
- Hash-based integrity verification

### C2PA Integration
- Audio-specific assertions
- Voice identity claims
- Consent record embedding
- Provenance chain tracking

### Consent Management
- Voice clone authorization
- Sample usage rights
- Time-bound permissions
- Revocation support

### Watermarking
- Psychoacoustic embedding (18-20 kHz)
- Spread spectrum technique
- Error correction codes
- Non-removable origin proof

### Audit Trail
- Blockchain-ready hash chain
- Merkle tree generation
- Integrity verification
- Export for permanent storage
