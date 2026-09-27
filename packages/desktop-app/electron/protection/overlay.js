// See electron/detection/engine.js for why this is a thin re-export.
const { sendBlankSignal, sendUnblankSignal, blankSignalForDetection } = require("@besaoct/drm-wrap/core");

module.exports = { sendBlankSignal, sendUnblankSignal, blankSignalForDetection };
