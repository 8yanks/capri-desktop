# Sprite identity revision

The previous generated costume set exaggerated the hair and compressed the body; the face layout drifted away from the first illustrations. The active set is now `poses-v3` (44), `actions-v2` (8), and `wardrobe-v2` (11 × 16).

Reference artwork is preserved under `assets/capri/identity-v1`. The original upstream full-body sprite supplies the slender anatomy. The first approved illustration sheet supplies the rectangular acid-green mask, concentric cyan optic, angular wink and thin zigzag mouth. The new sheets are interpretations of these references, not pixel-exact traces.

All 228 cels were checked in full-body and enlarged-face contact sheets. Closed eyes are intentional expressive variants. Costume headgear stays above or beside the mask. Native previews and pose regression tests cover canvas bounds at all menu scales and both facing directions, alpha hit testing, safe costume changes and reduced motion.

Rebuild with `npm run sprites:build`. This only extracts the included PNG artwork; it does not call an image model. No dependency was added for the revision. Runtime caches and costume eviction are unchanged.

## Walking follow-up

The user correctly identified that the four walking poses still favored the same leg. Face/silhouette review did not establish a valid gait. Dedicated `walk-v1/<outfit>` libraries now supply eight phases each for all twelve appearances, with opposite green/pink contact positions and under-body passing poses. Runtime selects those files directly, so costumes cannot map a walk back onto the old four lunge cels. There are 96 new walking cels; 60 default/base cels are loaded and the active costume holds 16 key poses plus eight walking cels. Existing cache eviction still applies.

Checks include 15 unit/provider tests, ten desktop regressions, native rendering of six complete cycles, and both facing directions at every menu scale. The Badlands first cel initially recolored the rear leg green; that artwork was repaired, then the complete set was rebuilt and checked again. No new user approval of the walking revision is claimed.

## Clothing perspective follow-up

The previous gait revision still left many torsos and garments too frontal. Active walking sources are now `walk-v2`: all 96 cels were redrawn around a right-facing profile/narrow three-quarter body, preserving the alternating legs. The near side/back of each coat is dominant; the front opening shifts toward the forward chest outline, the far front panel is compressed and the sleeves follow their arms in depth. All twelve appearances were reviewed visually, including the long Badlands/King coats. Old walk-v1 sources remain only in the personal project for comparison and rollback. They are excluded from this public export. Numerical gait checks support review but do not certify cloth perspective or physical realism.
