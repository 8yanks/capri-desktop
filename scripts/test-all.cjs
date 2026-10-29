'use strict';
const {spawnSync}=require('node:child_process');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const commands=[['--test','tests/v5-a1.test.cjs','tests/poses.test.cjs','tests/providers.test.cjs','tests/wardrobe.test.cjs','tests/walk.test.cjs','tests/scene-poses.test.cjs','tests/motion-reset.test.cjs','tests/a1-face-motion.test.cjs','tests/faithful-mimics.test.cjs','tests/upstream-mimics.test.cjs','tests/clean-eyes.test.cjs','tests/face-rig.test.cjs'],
  ...['idle-activities.mjs','game-mode.mjs','multi-monitor.mjs','desktop-icons.mjs','dialogue.mjs',
    'command-lifecycle.cjs','overlay-layer.cjs','chat-model.cjs','animation-modes.mjs','discord-presence.cjs'].map(name=>['scripts/test-'+name])];
for(const args of commands){const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(result.status!==0){console.error('Check failed: '+args.join(' '));process.exit(result.status||1);}}
console.log('All provider, sprite and desktop regression checks passed.');
