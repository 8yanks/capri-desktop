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

## Development

`npm test` runs provider contracts and sprite/desktop regressions. `npm run doctor` checks installation without printing credentials. Runtime and test outputs are ignored by Git. See [UPDATE-2026-10-30.md](UPDATE-2026-10-30.md).

## Attribution

Derived from [mochiiwuff/capri-desktop](https://github.com/mochiiwuff/capri-desktop). MIT source attribution retained in [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md). Capri/Cyberpunk artwork remains subject to its respective rights holders; source licensing does not transfer character ownership.
