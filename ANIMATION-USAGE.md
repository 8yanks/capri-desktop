# Animation roles and quiet timing

| Usage | Artwork / trigger | Policy |
|---|---|---|
| Standing rest | Canonical standing model, neutral holds | Long calm holds; no recurring wide-eyed reaction |
| Seated rest | Canonical seated model, neutral holds | Leg-kicking sequence is not the resting loop |
| Walking | walk-v2, eight phases, right-facing source mirrored for left | Movement only; automatic travel at most every3–5min on a floor, outside game mode |
| Ambient gesture | Stretch or small shrug; seated stretch or leg swing | Shared90–180s quiet period; next period begins again after an action or conversation |
| Dialogue | Mood accent at start, occasional talk/mood beat | At least 3.5s between body gestures; dialogue blocks ambient actions |
| Manual actions | Dance, exercise, lounge, finger guns, holographic typing, music listening, emotes | Explicit menu request; not chosen randomly as ambient filler |
| Sleep rest | Illustrated closed-eye hold / seated doze, selected costume retained | Alpha fade stays in the illustrated DA; no legacy stand/sit idle substitution |
| System/context scenes | Arrival, stow, mask dormancy, VRAM suspension, pointing, earned uplink | Dedicated original scene artwork remains; not a random idle flourish |
| Retired ambient | Procedural spin/hop/look/curious/split roulette, random peek/teleport/possession | No ambient selection; old idle-* procedural fallback disabled |

Cursor proximity is limited to one small illustrated reaction per60s and does not interrupt drag, conversation or protected gameplay. Tiny shard effects are spaced45–90s and disabled in game mode. Automatic ambient gestures and travel are disabled in protected gameplay; manual controls keep their existing safety guards.

The previous four lunge cels in the pose/costume reference sheets are not walking frames. Walk-v2 never supplies idle, seated, dialogue or exercise poses. Frontal rest remains frontal; profile clothing belongs to directional movement.

Verification: simulation of six minutes at the minimum interval produces four small ambient gestures; explicit actions remain immediate; actual walk target selection and canvas bounds are checked in both directions; sleep fade retains the illustrated renderer. No new dependency or model is installed.

Inherited scenes retain their event timelines and effects, but always use the current illustrated body. Hidden/sleep-mask states do not expose the old body; missing cels stay hidden.

Current costume artwork: keyposes-v1 (eight primary poses), seated-v1 (four seat poses), walk-v2 (eight phases). These families use fixed model scales; expression or limb bounds never resize the figure. Costume random rest no longer toggles a hand-on-hip pose as a fake blink.
