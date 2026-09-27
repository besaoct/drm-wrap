// Thin re-export so this generated project's file layout matches the
// documented structure (DRMwrap.md §13); the real implementation lives in
// the "@besaoct/drm-wrap" package (packages/lib/src/core/detection/engine.ts),
// installed as a normal dependency of this project.
const { DetectionEngine } = require("@besaoct/drm-wrap/core");

module.exports = { DetectionEngine };
