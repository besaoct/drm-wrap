// See electron/detection/engine.js for why this is a thin re-export.
const { getRunningProcesses, matchProcessesAgainstSignatures } = require("@besaoct/drm-wrap/core");

module.exports = { getRunningProcesses, matchProcessesAgainstSignatures };
