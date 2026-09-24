// Lucy API — Forked from Heaven
// Same codebase, Lucy identity overrides applied at runtime

// Lucy is a fork of Heaven. The src/index.js is shared —
// IDENTITY=lucy env variable in docker-compose switches the personality.
// This file documents Lucy-specific overrides.

const base = require('../heaven/src/index.js');

// Lucy-specific extensions can be layered here:
// - Memory persistence with personal context
// - Emotional tone calibration
// - Identity-specific endpoints

module.exports = base;
