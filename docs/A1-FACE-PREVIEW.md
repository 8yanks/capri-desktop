# A1 facial animation preview · 27 October 2026

User restored A1 and authorized a single-pose blink/speech preview before full migration. A2 remains rejected. Use base-a-v1/frames/key-0.png as the exact body/hair source; no new body generation.

Preview: captures/a1-face-motion/a1-face-motion.gif (6 seconds, 20 fps). Original, animated and face-detail panels. Silent timed mouth study, not voice synchronization. Native interactive page: scripts/a1-face-preview.html. Toggle landmarks and pause.

Three source-feature crops and exact source-pixel anchors are stored in assets/capri/a1-face-preview. The eyes reuse A1 pixels; blink uses a local face-clipped lid mask. Mouth uses a small independent animated zigzag. This is a runtime compositing prototype, not a complete blank-face asset family. No desktop renderer or active character was switched to it.

Native comparison: neutralChanges=0, outsideChanges=0; animation changes are confined to face rectangles. 120 frames exported, renderer errors empty. 32 unit/art/provider tests plus 10 desktop regression scripts pass. No software installed.

Next: wait for visual review of this one-pose animation before full-pose migration. Previous walk, right-hand wave, seated leg swing, slower lounge, emotion sounds and support-boundary tasks remain tracked in tasks/visual-reset-todo.md. Do not mistake passing functional tests for completed new-art animation calibration.
