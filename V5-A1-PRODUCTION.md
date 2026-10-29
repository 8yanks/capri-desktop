# A1 / V5 production — 28 October 2026

Twenty A1 cels now use the approved V5 master: eight standing/action keys, four seats and eight walk phases. Sixty logical animation IDs and all 25 inherited scene mappings resolve this family. Costumes remain paused. Original V5 SVGs and original A1 sheets remain unchanged.

Eight facial patches per cel: neutral, curious, smug, happy, talk, sleep, wink, surprised. One similarity transform maps the V5 eye pair into each cel; no independent eye resizing. The quiet idle relaxes only the pointed black sockets. The original pointed V5 geometry remains available in expressive states. Dialogue mood drives expressions and speech alternates mouth states; this is not phoneme lip-sync.

User feedback applied: double mouth fixed (a shadowed coordinate variable made the lower-face erase mask invalid). Builder now checks numeric calibration and coverage below the green face. User requested warm rose/red instead of magenta: a selective palette pass reduces blue in pink pixels, retaining white grain and green accents. Hair silhouette and pixels outside the facial patch are checked after this intentional recoloring.

Checks: native Chromium rendering of 60 IDs × 8 states × 2 facings = 960 draws; all 25 scene mappings covered; preservation report for 20 cels. Cloud regression suite plus V5 tests. These verify placement/coverage; they do not replace subjective animation review in a live game.

Preview: `desktop-v2/scripts/v5-a1-production.html`. Rebuild with the installed Electron executable and `scripts/build-v5-a1.cjs`; capture with `scripts/render-v5-a1.cjs`. No dependency added. Source mirrored into the cloud-only tree. The running desktop companion has not been restarted in this pass.

Earlier single-pose previews (faithful-mimics, upstream-mimics, clean-eyes) are historical and should not be used to judge this revision.
