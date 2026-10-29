# Review and validation — 2026-10-27

Reviewed areas: animation loading/playback, interaction interruption, window lifetime, provider process lifecycle and structured output, permissions, persisted context, hooks, resource thresholds, packaging boundaries and source attribution. The personal Python backend remains a separate application; its 70 regression tests passed after the streaming change. This is not a certification of every upstream animation frame or of every installed Windows application.

Fixes during review:

- Missing public folder-window helper replaced with a self-contained script; no dependency on the parent private project.
- Codex reconnection ignores exit/error events from a previous child process.
- A denied PC action prevents later tools in the same turn; no hidden fallback to an API account.
- Claude checks cancellation again after authentication before launching inference.
- Partial response is cleared on cancellation, provider change, pause and GPU suspension. Only final structured responses enter history.
- In-memory and persisted recent context are bounded to sixteen entries.
- Configuration accepts only known typed fields and numeric ranges; renderer navigation/new windows are blocked.
- New pose assets preserve genuine transparent backgrounds and are validated against their manifest; unsupported special scenes use original rendering.
- Seated stretching uses seated cels, rather than displaying a standing pose on a window ledge.

Verified: clean npm install/lockfile, dependency audit (zero reported vulnerabilities at check time), provider fixture tests, native Electron overlay/chat launch without renderer errors, native animation renders, and the existing movement/game/multi-monitor/desktop-icon/dialogue/Discord/window lifecycle regression scripts. One live portable Codex request completed in 11.2s with its first text at 8.0s; the earlier personal route measured 8.6s cold / 5.7s warm. These samples are not a guaranteed benchmark.

Remaining limits:

- Claude has no signed-in account on the development machine: live subscription behavior must be verified after login. Protocol fixtures are not equivalent to that test.
- Cloud latency is still seconds; streaming is feedback, not instant inference. No real-time low-latency guarantee is claimed.
- Generated cels are stepped animation. Contact pivots/head anchors are estimates; perceptual continuity needs user assessment, especially with extreme poses and different display scales.
- Topmost overlays cannot override all exclusive fullscreen renderers. No game injection or HUD tracking is added.
- The loopback hook bridge accepts local activity events, rejects browser Origin headers and caps bodies. It is not an authentication boundary against malicious local software and is not exposed to the network.
- Vault notes are bounded reference context, not an unrestricted skill runner or consciousness. Claude in this export is conversation-only; the private PC tools and game databases are not silently portable.
- User-authenticated provider tools can access account capabilities; approve only concrete actions you intend. No accounts, histories or private cloned voice references belong in the repository.

No remote GitHub repository was published by these steps.

## Costume update

The user approved the raw v2 direction. Added52 default/extra cels total and eleven16-cel costume sets. Native gallery verifies all eleven outfits loaded, visible and clickable; unit coverage now includes all228 cels across three scales and both facings, context debounce/cooldown, manual override during ordinary dialogue, interaction guards, bitmap eviction and reduced-motion freeze. The Windows watcher compiles and reports the Cyberpunk app hint without reading window titles or pixels. Lucy's touching cells were regenerated; Stage's clipped stretch was replaced and checked against source bounds. The costume fallback returns to the original set on asset failure. No provider/runtime/model dependency changed. Accessory-specific and large special scenes intentionally retain their original artwork.
