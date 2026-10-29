# Setup on a second Windows computer

## What gets installed

`npm ci` installs only the lockfile's npm dependency tree in this folder: Electron 44.9.3, @fontsource/chakra-petch 5.3.0, @fontsource/jetbrains-mono 5.3.0 and their declared transitive dependencies. Electron downloads its desktop runtime. No Python, Ollama, local LLM, voice weights, background service or system startup task is installed by this command. CLI providers are separate prerequisites that you install and authenticate yourself.

Official provider instructions: [Codex CLI](https://developers.openai.com/codex/cli/), [Claude Code setup](https://code.claude.com/docs/en/setup). An account with access to the chosen CLI is required. Existing API-only credentials are rejected by this build. Account usage limits still apply.

Extract the ZIP into a normal writable folder, then run:

```powershell
npm ci
npm run doctor
npm test
npm start
```

Keep the console open for a first launch. If a shortcut is needed later, target `npm start` with this folder as its working directory. Nothing is enabled at Windows login automatically.

If npm scripts are disabled by your system policy, Electron's package can be present without its executable. Doctor detects this. Run `node node_modules/electron/install.js` to download the pinned Electron runtime explicitly, then repeat doctor.

## Connect Codex or Claude

Run `codex login` or `claude auth login` in a terminal. Never paste account tokens into Capri. Select the signed-in provider in the chat window. Codex uses its persistent app-server connection and an ephemeral read-only thread. Claude uses a fresh nonpersistent CLI process with bounded conversation context. The CLI handles authentication; Capri does not copy its token files.

Claude authentication was unavailable on the development machine, so its protocol was tested with a child-process fixture, not a live Claude subscription. Verify one actual Claude reply after login. Codex was measured against the installed account; timing is not guaranteed elsewhere.

## Memory / Obsidian

Capri creates a clean `vault/Home.md` under Electron's per-user application data directory, alongside conversation settings. Use the Vault button to open it and add that folder as an existing vault in Obsidian. Obsidian itself is optional and is not installed. Short top-level Markdown notes can be searched by the Codex tool; notes are reference data, never authorization to run actions. This is persistent context, not consciousness.

Deleting this application's user-data folder removes its history/settings; it does not remove or modify provider authentication. Do not upload that folder to GitHub. The source tree's `.gitignore` excludes common data and secret files, but review your staged changes before publishing.

## Optional activity hooks

Conversation works without hooks. `npm run hooks:codex` and `npm run hooks:claude` modify the respective CLI's hook configuration to send local activity events to Capri on loopback port 47824. Inspect the installer before running. They target CLI activity, not every conversation inside the Codex/Work desktop UI. Hooks do not give Capri the provider's permissions or import conversations. Existing personal Capri uses a separate port.

## Voice and graphics

Voice is off by default. Voice settings can enable an installed Japanese speech-synthesis voice; install a Japanese voice through Windows language/speech settings if needed. This is not the private cloned Capri voice. That runtime and its audio reference are deliberately excluded.

Use borderless windowed mode if exclusive fullscreen hides desktop overlays. Topmost is a Windows window-order request, not an exclusive-game rendering hook. Game mode keeps roaming away from the center and is disabled at startup. Reduced-motion and suspension retain original-renderer fallbacks.

## Animation development

The active set is `assets/capri/poses-v2`. It contains four source sheets, 44 isolated transparent cels, exact prompt records and provenance. Run `npm run sprites:build` to regenerate the manifest/crops mechanically from those sheets. Run `npm run preview` to render 90 native Electron gallery frames into `captures/idle-demo-frames`; FFmpeg is optional for converting those frames to a video. It is not installed by setup. Renderer clip timing and contact alignment live in `src/renderer/js/pose-sprites.js`. Special scene fallbacks still use the original artwork.

`actions-v1` adds eight cels for four extra actions. `wardrobe-v1` contains eleven costumes with sixteen selected key cels each. Run `npm run wardrobe:build` to rebuild their transparent crops and `npm run preview:wardrobe` for the costume animation gallery. Only the selected costume is decoded at runtime. Original accessory/special scenes keep their own artwork. See the costume provenance for the corrected Lucy sheet and Stage stretch override.

## Before uploading

Upload source, package-lock.json and asset provenance. Exclude node_modules, captures, logs, personal vault/data, accounts, models and voice references. Run doctor/tests on the destination machine. No GitHub repository or remote is created by this export.
