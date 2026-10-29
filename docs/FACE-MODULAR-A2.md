# Modular face and asymmetric hair · A2

Preview only. The user selected A, then rejected the first production sheets for a bob-like symmetrical silhouette and inconsistent eyes. Those sheets are not activated. A2 has unequal diagonal hair shards and a blank-face body. Built-in image generation was used for the body; native Canvas geometry supplies separate crisp eyes and zigzag mouth.

- `assets/capri/face-prototype-a2/body.png`: blank-face RGBA source (1024 × 1536).
- `leftEye.png`, `rightEye.png`, `mouth.png`: separate aligned transparent layers on the same canvas.
- `landmarks.json`: source-image pixel centres, ellipse sizes and angles; viewer-left/right before mirroring. One pose calibrated. Each future pose needs explicit independent calibration, not a guessed shared face box.
- `src/renderer/js/face-rig.js`: six expressions, separate drawing functions and validation. Body pixels never regenerated for expressions.
- `scripts/face-review.html`: interactive expressions and landmark editor. Apply previews edited JSON; does not write it to disk.
- `scripts/render-face-review.cjs`: native compositing preview and layer export.
- `frame.faceRig` is opt-in in the body renderer. No currently active sprite has it; do not paint these features over old baked-in eyes. Only blank-face artwork can use this path.

Native preview has no console errors and 1,162,643 fully transparent pixels out of 1,572,864. 29 unit/provider/art tests and 10 desktop regression scripts pass. No dependencies installed. Full migration and all-pose calibration await review of this revised silhouette.

Previous functional motion corrections are retained: paused costumes, distance-based walk phase, slower inactivity lounge, hand/leg motion instead of facing changes, distinct emoticon sounds and full-silhouette seat fitting. Native calibration for the new full pose family remains pending; this preview is not a claim that every animation has been migrated.
