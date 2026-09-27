// See electron/detection/engine.js for why this is a thin re-export.
const { applyContentProtection, isContentProtectionSupported } = require("@besaoct/drm-wrap/core");

module.exports = { applyContentProtection, isContentProtectionSupported };
