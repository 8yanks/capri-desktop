# REJECTED FOR LIKENESS — see source-video reanalysis before any new art

# Regenerated standalone facial artwork · 27 October 2026

The user rejected the extracted A1 eyes and procedural mouth. New eye and mouth artwork was generated separately with built-in imagegen, using the original capri-face.png portrait as the design reference. No body, hair, face plate or old feature crop was regenerated or used as the final component.

`assets/capri/facial-components-v1/` contains two source sheets, 12 independent eye PNGs (six states per eye), six mouth PNGs, generation prompts, source rectangles and local anchors. Eye anchors refer to optical centres rather than the centre of the angular black socket silhouette. Viewer-left/right naming is before mirroring. All assets have alpha; extraction validates transparent pixels, complete source cells and anchor bounds. `scripts/split-face-components.cjs` mechanically extracts generated pixels without redrawing them.

Eye states: neutral, half-closed, closed, excited, suspicious, wink. Mouth states: neutral, speech-small, speech-open, grin, smirk, laugh. These are review labels; the new large grin/open shapes still need visual approval for character fidelity. Separate parts can be mixed independently. No runtime drawing or procedural reconstruction of the original features is substituted for these new images.

`facial-components-review.html` and its renderer provide an asset-only review. Native preview is saved in captures/facial-components-v1/components-review.png in the personal project. 18 components loaded successfully. A1 body and active app remain unchanged; do not apply these unreviewed assets to all poses. Full per-pose placement and voice synchronization are separate pending steps.

No dependencies installed. The old A1 facial-motion demo is superseded for facial artwork quality; do not integrate its extracted/procedural features. A2 remains rejected; A1 remains the body reference.
