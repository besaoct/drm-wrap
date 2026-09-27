// See electron/detection/engine.js for why this is a thin re-export.
const { applyContentProtection, isContentProtectionSupported } = require("drm-wrap/core");

module.exports = { applyContentProtection, isContentProtectionSupported };
