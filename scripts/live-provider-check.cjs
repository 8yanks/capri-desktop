// Explicit live test: uses one account request. Not part of npm test.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {CodexProvider}=require('../src/main/cloud-providers');
const root=path.resolve(__dirname,'..'),workspace=fs.mkdtempSync(path.join(os.tmpdir(),'capri-provider-check-'));
const provider=new CodexProvider({workspace,instructions:()=>fs.readFileSync(path.join(root,'personality/system-prompt.txt'),'utf8'),
  approve:async()=>false,tool:async()=>({ok:false,denied:true})});
(async()=>{try{let updates=0;const result=await provider.reply('Briefly introduce yourself in one sentence. Do not use tools.',[],new AbortController(),()=>updates++);
  fs.mkdirSync(path.join(root,'logs'),{recursive:true});fs.writeFileSync(path.join(root,'logs/live-codex.json'),JSON.stringify({ok:true,timing:result.timing,updates,display_en:result.reply.display_en},null,2));
  console.log(JSON.stringify({ok:true,timing:result.timing,updates}));
}catch(error){console.error(error.message);process.exitCode=1;}finally{provider.close();}})();
