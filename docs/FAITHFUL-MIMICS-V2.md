# Faithful facial mimics in A1 context · 27 October 2026

This completes the requested recreation beyond reference analysis: new standalone eyes and mouths are generated directly against the original-video face crops, extracted into 18 separate transparent PNGs, independently anchored and played in the selected A1 face/body.

## Delivered

- Six eye-pair states: normal, closed, wink, curious, happy, focused. Six mouth shapes: thin neutral zigzag, small notched triangle, open notched triangle, laughing wedge, thin smirk and surprised triangle. The rejected double-row-teeth sheet is not used.
- `src/renderer/js/faithful-mimics.js`: independent eye/mouth sampler, graphic held-cel speech with pauses, discrete blink, RP mood aliases, reduced-motion behavior, asset validation and cached loading. No sinusoidal eye squashing or procedural replacement mouth.
- `assets/capri/faithful-mimics-v2/frames.json`: source rectangles and per-feature optical anchors. `a1-placement.json` documents source-pixel A1 facial placement. Source sheets and exact built-in-generation prompts preserved.
- `scripts/faithful-mimics-preview.html`: six animated contexts with full A1, enlarged face, original RP sample lines, pause and anchor display. Idle, talk, curious, smug, laugh and sleep are presented independently.
- `captures/faithful-mimics-v2/mimics-in-context.gif`: 6 seconds / 120 frames, all six contexts. `contexts.png`, `anchors.png`, `blink.png` and `qa-report.json` retained.

## Validation and limits

Native Electron rendered 36 context/time samples, 18 components loaded, 9 distinct facial render states and zero pixel changes outside the facial region. 35 unit/provider/art tests and 10 desktop regression scripts pass. No new software, weights or voice engine installed.

This is an actual animated context preview for the previously agreed single-pose A1 review, not a claim that all moving body poses have been recalibrated or the live desktop process has been switched. The mouth is a silent timed study; real audio alignment remains separate. Full-pose migration must use separate placement/foreground-hair occlusion per pose, never stretch this one calibration across other heads. The active companion is untouched.

Source references: original gallery references/capri, selected portrait at compilation 00:28, notched white smile at 00:42.6, official Netflix wink at 00:07.8. See the source reanalysis for observations and limits. No A2 or rejected facial-components-v1 art is used.

## Alignment correction

User requested smaller symmetric, aligned eyes and a less tilted mouth. Eye optical ring diameters are both 14 A1 pixels, centres (114,118)/(138,118), equal zero rotations. Scaling is normalized by measured ring diameter, not unequal socket bounding boxes. Mouth centre (126,136); individual source-slope compensation levels each original drawing. New preview: mimics-aligned.gif. Native 36 draws still have zero outside-face changes; 36 tests plus 10 desktop scripts pass. Interactive preview module cache version alignment2.
