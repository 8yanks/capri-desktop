# Contextual costumes and extra actions

Right-click Capri → **Costumes**. Choose Automatic, Original Capri, Netrunner, Creator, Music/Stage, League/Hextech, David Martinez, Lucy, Badlands/D, Omi, Roman, Talia or King. Manual choices persist and disable automatic changes. Manual changes can happen during ordinary dialogue but wait through dragging, resource suspension or a special scene.

Automatic mode reads a small local application hint from the existing Windows watcher:

| Active app | Costume |
|---|---|
| Cyberpunk 2077 | Netrunner |
| Blender / Roblox Studio | Creator |
| Spotify / MusicBee / foobar2000 | Music / Stage |
| League of Legends / launcher | League / Hextech |
| Other recognized foreground window | Original Capri |
| Capri's own conversation | Keep the current costume |

This is app-context detection, not screenshot/film-character recognition. No OCR, camera, screen upload or vision model is used. The named character costumes are manually selectable in any application. Auto waits for roughly3.5s of stable context and at least12s between changes, then waits for a safe moment. It never enables game mode or changes game boundaries.

Four additional actions are available under **Idle animations & emotes**: Finger guns, Holographic terminal, Listen to music, Doze (seated). They are also in the idle pool when safe. Doze needs a seated pose. Large/prop actions are disabled during protected game mode. The holographic terminal is an illustration, not a claim that Capri is executing a PC command. Prop scenes and existing large special scenes retain their original artwork.

The default library is60 cels (44 core poses +8 extra actions +8 dedicated walking phases). A selected costume loads16 key poses and8 dedicated walking phases; only the active costume remains cached. All twelve appearances use real alternating-leg cycles rather than the old four lunge cels. Reduced-motion freezes idle sprites and suppresses the outfit-change flash. Memory/GPU thresholds, manual game mode, pointer dragging, multimonitor placement, personality and voice preferences are unchanged.

No npm/Python/model dependency was installed for this feature. Art was generated with the built-in tool, with provenance saved in assets/capri/wardrobe-v1 and actions-v1. The costumes are fan adaptations; full in-between animation fidelity and every application/game scenario are not guaranteed.
