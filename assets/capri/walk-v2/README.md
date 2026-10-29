# Profile walking and clothing volume

Eight phases for default Capri and eleven costumes (96 cels). This revision corrects the frontal torso/clothing mismatch in walk-v1 while preserving its alternating green/pink legs and approved face identity.

The upper body now faces right in a narrow three-quarter/profile view: shoulders overlap in depth, the front closure shifts toward the right outline of the chest, the near side/back of the garment becomes the main visible surface and the far front panel is foreshortened. Sleeves attach to arms in those depth planes. Hems and long coat panels follow the hips rather than forming a symmetric frontal overlay. Clothing references supply design only, not frontal posture.

This is hand-directed generated 2D art, not a cloth simulation or a skeletal rig. Numerical gait/alpha checks do not prove correct clothing perspective; every source sheet and rendered cycle must also be visually reviewed. Standing poses can remain frontal when their bodies face the viewer.

Playback: walk-0..7, 120ms each, 960ms per cycle. Green leads at0, pink at4, narrower passing poses at2/6. Existing renderer mirrors the completed cycle for leftward travel. Torso anchor, alpha hit testing, costume eviction, manual game guards and reduced-motion behavior remain unchanged.

Rebuild with npm run sprites:build. Preview six cycles with npm run preview:wardrobe -- --walk. No new dependency, runtime model or permission is needed. Previous walk-v1 sources remain in the personal project for comparison; they are excluded from the updated public export.
