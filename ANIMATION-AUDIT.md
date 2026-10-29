# Animation and costume audit — 27 October 2026

Scope: animation behavior and renderer parity with mochiiwuff/capri-desktop, commit `6e3158f6b7cfcc61fdc18a8c2df82604598d8dce`. This is not a claim that every upstream application feature has been ported.

## Findings and fixes

- The previous fix prevented the retired shader body in many scenes, but cleared bob/tilt/squash/stretch and supplied only a generic resting cel for most legacy actions. That was insufficient to claim full animation fidelity.
- The illustrated renderer is now authoritative even on hidden, peek, resource and missing-asset paths. No fallback draws the retired body.
- Scene Player timing, completion, priority, flip and cue execution remain active; an explicit scene-pose registry covers every upstream acting sequence. Sprite transforms and clickable coordinates follow squash, flip, tilt and bob; echoes, collapse, fade, dissolve and silhouette flashes apply to the selected artwork.
- Costume floor transitions incorrectly selected hip-supported window poses: removed that mapping. Extra actions no longer silently substitute the uncostumed illustration. Seated sleep selects the sleeping seated costume.
- Entire figure height is a poor size reference when a pose has raised arms, large hair or a long coat. Scale is now fixed per canonical model family, with a 420-unit neutral standing height and shared anatomical seat reference. It is not recalculated per frame, expression, hair bounds, coat length or raised arm.
- Twelve replacement four-cel seated sheets (base plus eleven outfits), and eight primary action poses per costume, share common anatomy templates. Omi/Roman fused/crossed legs and mixed-color base foot are replaced; green and pink legs remain separate. Standardized hip contact is tied to the canonical mask-to-pelvis distance.

## Every upstream acting sequence

All 25 entries below have an explicit illustrated adaptation; original timing/cues remain. Adaptation means authored cels plus scene effects, not the old per-joint shader deformation reproduced pixel for pixel.

| Upstream sequence | Current role |
|---|---|
| `stand` | Calm standing rest |
| `sit` | Calm perched rest |
| `peek` | Edge peek; top orientation retained |
| `sleep` | Quiet rest before mask sleep |
| `talk` | Conversation |
| `curious` | Curious reaction |
| `look` | Small look/reaction |
| `gaze` | Quiet satellite reach |
| `uplink` | Satellite constellation / beam sequence |
| `victory` | Success / celebration |
| `zap` | Pointer lightning |
| `point` | Guide pointing onset |
| `pointing` | Guide held pointing |
| `unpoint` | Guide pointing release |
| `fold` | Biochip stow anticipation |
| `dive` | Window possession anticipation |
| `split` | Copies / echoes |
| `alarm` | Warning / many-eyes cut-in |
| `flinch` | Failure reaction |
| `turn` | Squashed directional turnaround |
| `spin` | Full flip / squash spin with echoes |
| `hop` | Small jump / squash and bob |
| `land` | Floor landing |
| `plop` | Window landing |
| `fall` | Airborne fall |

## Composed scenes and effects checked in code

All 18 upstream async compositions remain: flash, hurt, celebrate, vanish, arrive, teleport, settle, stow, doze, rouse, unstow, possess, peek, unpeek, materialize, intro, pointAt and summon. Intro close-up art, sleep mask, possession eyes, satellite and dialogue portrait cut-ins are intentionally separate scene art; they are not the retired full-body canvas.

Window/icon seating, support tracking, fall physics, dragging, multi-monitor limits and game isolation retain their existing policies. Random old roam/peek/possess roulette remains disabled to honor quiet ambient timing; these scenes are contextual or manual.

## Explicit differences from upstream

- The new cel system does not continuously deform every limb, hair strand or eye the way the upstream shader did. In particular a held pointing/reaching pose substitutes cels; the long construct arm is not a new fully rigged anatomical sprite. Its guide/bolt effects still run. No claim of exact visual parity.
- Latest upstream taskbar-rest helpers `ledge`, `perchWin`, `goHome` and the matching taskbar rest preference are not present verbatim in this fork. Existing multi-monitor/window/icon support uses the local support system. This is a feature difference, not a hidden complete upstream integration.
- Portrait and introduction drawings remain separate from the wardrobe.

## Validation

See captures/scene-audit/report.json for the native renderer matrix, and tests/scene-poses.test.cjs for upstream registry coverage, floor/window support, fixed model scale and seat contacts. Native canvas capture covers all twelve outfits, both facings and five phase samples for every registered upstream sequence. Pixel checks of new seat feet distinguish the dominant green and pink regions; sparse intentional glitch speckle is not treated as a limb color. Human visual inspection remains necessary for anatomy; numerical bounds alone do not prove it.

The retired body WebGL renderer is no longer instantiated. Only its shared geometry constants/layout remain; special scenes cannot accidentally reveal its canvas. No software dependency or model was installed for this audit. Upstream source was downloaded for comparison only.

The new artwork contains 48 shared-model seated cels and 96 primary key cels (including the base model/reference). The dedicated walk-v2 cycles remain active. Runtime costumes load twelve action/seat cels plus eight walk cels; old wardrobe-v2 sheets are no longer loaded. Native validation completed 3,000 samples (12 outfits × 25 sequences × 2 directions × 5 phases). All 20 unit/provider/art tests and 10 desktop regression scripts pass. See the rendered comparison in docs/costume-support-comparison.png in the cloud source.

Additional fidelity limit: prop actions such as finger guns/hacking/listening use simplified costume gestures, rather than separate fully authored prop cels for every outfit. This is recorded explicitly instead of treating generic body replacement as exact upstream animation parity.
