# V3 — original repository facial artwork

User rejected the generic generated feature proportions and requested rereading the original GitHub model. Read the preserved mochiiwuff revision 6e3158f: sprite.js (rigid mask landmark), fx.js (GRAB eye basis), panel.js (original face variants), build-sprite.py, build-intro.py (settled shared-frame cels) and build-cutins.py (original frame-derived portrait assets).

The new V3 preview uses source-video crops corresponding to the supplied normal/wink/smile images, plus exact original repository intro-mouth1/2/3 textures. Upstream source hashes and license are preserved in assets/capri/upstream-mimics-v3/provenance.json and UPSTREAM-LICENSE.txt. No new image generation. The rejected generated eye/mouth sheets are not used.

Original eye and mouth pixels are separately cached/extracted (18 PNG layers with source coordinates), but their placement uses one common transformation defined by the original paired optical centres. Mouth and sockets are not independently resized into unrelated stickers. Closed lids reuse the original supplied wink shape, mirrored as a pair. Rest and curiosity currently share the neutral source; this is not an invented claim of six distinct canonical expressions.

Interactive page: scripts/upstream-mimics-preview.html. It includes original upstream portraits below the animated comparison. Previous preview has a superseded notice linking to V3; distinct URL avoids ambiguity with old tabs. A1 body retained. Preview calibration is one pose; the active app and other pose families were not switched.

Native QA: 36 draws, 7 distinct states, zero changed pixels outside the face, all 6 preview panels fully rendered. 39 unit/provider/art tests plus 10 desktop scripts pass. Six-second GIF: captures/upstream-mimics-v3/original-github-face-v3.gif. Preview tiles reset their Canvas state each drawing to avoid retained clipping between frames. No dependency/model installation or live process restart.
