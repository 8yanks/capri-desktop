# Drawn sprite production v2

Correction pass: `starry` is a ninth distinct expression (477 patches); diagnostic crosses are off by default. The elongated green arm is archived and excluded from active pointing/satellite sequences. `guide-4` supplies the normal black pointing arm and a fingertip landmark for the guide beam. Rest cels 3/4/5 have corrected iris calibration: blue hair highlights without white pupils are no longer accepted as eyes. Reviewed iris centres are guarded in reviewed-eye-landmarks.json.

55 complete newly drawn cels, derived from the frozen A1 references by built-in image generation. These are candidates, not blanket user-approved final animation. No 3D model or cutout limb puppet is used for these cels.

Families: greeting (6), recline (6, three corrected sources), airborne/recovery (8), guide (6), extended construct arm (1), quiet idle (6), fold/breakup (8), possession (6), reactions/peek (8).

The existing eight-phase walk and approved seated swing are retained separately. Phase 6/7 intentionally keep fragmented art instead of painting a complete face across the holes. All other new cels receive calibrated V5 eye/mouth patches; the immutable reference SVGs are unchanged. The derived right socket removes its outward chevron. Sleep uses straight lids; eyes and speech mouth remain separate at runtime.

Rebuild, from desktop-v2:

1. `electron scripts/extract-sprite-production-v2.cjs`
2. `electron scripts/build-sprite-production-v2.cjs`
3. `electron scripts/render-v5-a1.cjs`

Review: `/scripts/sprite-production-v2.html?production` on the existing local server. Select an action, inspect both directions, pause/scrub, and compare original drawings via the source link. The gallery shows candidates at a stable optical scale per sequence, with a floor support line.

Limits: these are cel animations with deliberate pose changes, not continuous anatomical interpolation. Technical coverage does not prove seamless transitions or likeness approval. The opening portrait, bolt/reticle, satellite, trails, silhouettes and collapse clocks remain the existing effect layers. No Claude testing, GitHub packaging, costume production or 3D development is included.
