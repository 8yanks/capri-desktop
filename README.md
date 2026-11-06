# Capri cloud desktop

Windows desktop companion with pre-generated illustrated sprites, rose construct effects, a Markdown memory vault and Codex/Claude account connections. This portable cloud edition is independent of the personal workstation installation.

## Setup

1. Install Node.js 20+ and either the Codex CLI or Claude Code CLI.
2. Sign in on this machine: `codex login` or `claude auth login`.
3. Run `npm ci`, `npm run doctor`, then `npm start` in this folder.
4. Double-click Capri and choose your provider in the conversation window.

`Setup-Capri.ps1` performs the documented folder-local npm setup and checks. `Start-Capri.cmd` starts the app. Startup and hooks are optional; setup never signs in for you. See [SETUP.md](SETUP.md).

## Current edition — 30 October 2026

- Current A1/V5 face and rose sprite production, authored resting/airborne/greeting/pointing/action poses, stepped 12 Hz animation and 24 Hz teleport effects.
- Latest satellite hand/beam alignment, materialization, relocation and decorative kana text decoding.
- Original approved walk and seated leg swing retained. Costumes remain disabled by default while the base design is reviewed.
- Codex/Claude streamed conversation, persona instructions, bounded recent history and a clean per-machine vault.
- Multiple displays, desktop/window ledges, manual Game mode, VRAM suspension guards, Discord presence configuration and optional installed Windows Japanese speech.

Ctrl+Alt+Enter opens conversation; Ctrl+Alt+Backspace hides it; Ctrl+Alt+C stows Capri. Drag to move; right-click for settings. Stop cancels the reply.

## Scope and limits

Excluded: personal local LLM, cloned Japanese voice/model/reference, Python voice runtime, account sessions, private vault, chat logs, Cyberpunk saves and installed-mod databases.

The newer workstation Python Mainframe, LoL coaching, microphone transcription, scheduled jobs, API-key providers and accessibility action engine have not been ported into this independent Node cloud runtime. They are not advertised as working features here. Optional system Japanese speech is not the workstation cloned voice and provides no PCM mouth synchronization.

Codex tools are limited to time, system information, bounded vault search and approved folder/HTTPS opening. Claude runs without tools, MCP servers or user hooks. No unrestricted PC-control claim is made. Claude subscription behavior is covered by fixtures; live sign-in remains machine-specific.

When NVIDIA telemetry is available, total dedicated VRAM degrades visuals above 7.2 GiB, suspends at 7.8 GiB and resumes below 7 GiB. Cloud inference loads no local GPU model. This is source code, not a signed installer; automatic updates are not included.

## Personal workstation edition — features not shipped here

A separate Windows workstation build extends Capri with a Python backend. The following descriptions document that build; they are **not capabilities provided by this repository**, bundled downloads, or a commitment to release dates.

| Area | Workstation functionality and current limits |
|---|---|
| Mainframe | Consolidated assistant settings, microphone selection, voice controls, configurable shortcuts and diagnostics. |
| Local AI | Local/offline conversation using an installed Qwen model, subject to available RAM and VRAM. No model weights or local inference runtime are shipped here. |
| Japanese voice | A separate cloned-voice pipeline, reusable prerecorded lines and PCM-driven mouth animation. The cloud edition only offers optional system Japanese speech. |
| Microphone | Speech transcription with review before sending, plus explicit voice-session controls. One-shot transcription and Japanese playback were user-tested; continuous-session acceptance remains pending. |
| Desktop actions | Window-scoped accessibility inspection, supported click/type/scroll actions, plans, execution receipts and cancellation. Coverage depends on each application's accessible controls. |
| Media | Player-session controls and now-playing information. Spotify Play/Pause were user-tested; broader track-selection, volume and YouTube acceptance remains incomplete. |
| Memory | Structured profile and music preferences, relevant vault-note retrieval, local-history retention and explicit export/clear controls. Private notes and conversations stay outside this repository. |
| Cyberpunk 2077 | A sourced local item guide, read-only save progression and installed-mod context. Spoiler filtering uses confirmed progress; not every quest choice or objective can be decoded. No game mod is required. |
| League of Legends | Opt-in local-client observations. Death counters/reactions were user-tested. Gold, kill/multikill/ace, lane level/item comparisons and patch-limited objective schedules are implemented but await live acceptance. Vision/gank analysis uses reviewed screenshots, not automatic continuous detection. |
| Scheduled requests | Explicit once/daily requests with conversation/provider scope, normal approvals and pause/game/resource guards. A complete real scheduled run remains to be validated. |
| Additional providers | Optional NVIDIA, DeepSeek and OpenAI API integrations with locally protected credentials. No live provider-key compatibility tests have been completed. |

The workstation source for these extensions, local models, voice references, credentials, private vault, saved games and personal databases are **not uploaded as part of this documentation**. The shared visual assets and cloud runtime listed above remain the contents of this edition.

## Development

`npm test` runs provider contracts and sprite/desktop regressions. `npm run doctor` checks installation without printing credentials. Runtime and test outputs are ignored by Git. See [UPDATE-2026-10-30.md](UPDATE-2026-10-30.md).

## Attribution

Derived from [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop). MIT source attribution retained in [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md). Capri/Cyberpunk artwork remains subject to its respective rights holders; source licensing does not transfer character ownership.
