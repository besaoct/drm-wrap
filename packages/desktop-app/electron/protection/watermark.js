// See electron/detection/engine.js for why this is a thin re-export.
const {
  buildWatermarkText,
  getWatermarkPayload,
  sendWatermarkUpdate,
  startWatermarkRefresh,
} = require("@besaoct/drm-wrap/core");

module.exports = { buildWatermarkText, getWatermarkPayload, sendWatermarkUpdate, startWatermarkRefresh };
