'use strict';
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {findExecutable}=require('../src/main/cloud-providers');
const root=path.resolve(__dirname,'..');let failures=0;
function check(name,fn,optional=false){try{console.log('OK   '+name+': '+fn());}catch(error){console.log((optional?'INFO ':'FAIL ')+name+': '+error.message);if(!optional)failures++;}}
check('Node',()=>{if(+process.versions.node.split('.')[0]<20)throw Error('Node 20 or newer required');return process.versions.node;});
for(const file of ['personality/system-prompt.txt','assets/capri/poses-v3/frames.json','src/main/cloud-ai.js'])check(file,()=>{if(!fs.existsSync(path.join(root,file)))throw Error('missing');return 'present';});
check('Electron',()=>{const executable=require('electron');if(!fs.existsSync(executable))throw Error('runtime missing; run node node_modules/electron/install.js');return require('electron/package.json').version;});
for(const name of ['codex','claude'])check(name,()=>{const binary=findExecutable(name);const args=name==='codex'?['login','status']:['auth','status','--json'];
  try{const output=execFileSync(binary.file,[...binary.args,...args],{encoding:'utf8',windowsHide:true,timeout:12000,env:{...process.env,...(binary.node?{ELECTRON_RUN_AS_NODE:'1'}:{})},stdio:['ignore','pipe','pipe']});
    if(name==='claude'){const auth=JSON.parse(output);return auth.loggedIn?'signed in ('+auth.authMethod+')':'not signed in; run claude auth login';}
    return /ChatGPT/i.test(output)?'ChatGPT sign-in found':'CLI installed; run codex login status to check account type';
  }catch{return 'CLI installed; sign in using '+(name==='codex'?'codex login':'claude auth login');}
},true);
console.log('At least one signed-in provider is required. This check never prints or copies credentials.');
process.exitCode=failures?1:0;
