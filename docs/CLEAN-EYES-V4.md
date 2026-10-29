# Clean eyes only — approved mouth preserved · 28 October 2026

User rejected V3 eyes as dirty, explicitly approved its mouth, and requested fixing eyes only. The threshold-derived source eye fragments caused parasitic edges, residual mask colours and inconsistent socket boundaries. Eye rendering now uses separate clean native paths traced against the original lens/socket/closed-lid design. It does not use the threshold-extracted eye textures.

Approved mouth source textures, state timing, shared placement and original rendering remain. Mouth is replayed in its original region AFTER eye drawing, at original source resolution; it is not redrawn, filtered into dots or replaced with generated art. Native comparison checks 560 approved mouth pixels across seven states: zero changes above one-channel quantization tolerance (one channel unit permitted for Canvas rounding). Whole body/hair remains unchanged outside the face.

Preview: scripts/clean-eyes-preview.html; capture: captures/clean-eyes-v4/clean-eyes-approved-mouth.gif. Distinct V4 filename and versioned imports avoid old-tab ambiguity. Source reference portraits remain beneath the preview. This is the single-pose A1 preview; no live app switch, no all-pose migration and no claim of user art approval.

41 unit/art/provider tests plus 10 desktop scripts pass. Native QA: 36 renders, seven distinct states, six complete panels and zero outside-face pixel changes. No dependencies, models or voice settings changed. Original V3 mouth baseline is kept as scripts/fixtures/upstream-v3-approved.js for repeatable visual comparison.
