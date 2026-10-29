const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),path=require('node:path');
const {CodexProvider,ClaudeProvider,displayPrefix,validateReply}=require('../src/main/cloud-providers');
const fixture=path.join(__dirname,'fixtures/provider.cjs');
const launch=scenario=>(provider,args)=>spawn(process.execPath,[fixture,provider,args.includes('auth')?'auth':'reply',scenario],{stdio:['pipe','pipe','pipe']});
test('partial JSON reveals English only, including incomplete escapes',()=>{
  const reply={display_en:'"Capri"\n♡ 😀',speech_ja:'日本語',emotion:'happy'},raw=JSON.stringify(reply);
  for(let i=0;i<=raw.length;i++)assert.ok(reply.display_en.startsWith(displayPrefix(raw.slice(0,i))));
  assert.equal(displayPrefix(raw),reply.display_en);assert.throws(()=>validateReply({...reply,extra:1}));
});
for(const Type of [CodexProvider,ClaudeProvider])test(Type.name+' streams and validates a reply',async()=>{
  const chunks=[],provider=new Type({workspace:__dirname,instructions:()=>'',approve:async()=>false,tool:async()=>({ok:true}),launchProcess:launch('normal')});
  try{const result=await provider.reply('Hello',[],new AbortController(),text=>chunks.push(text));
    assert.equal(result.reply.display_en,'Oh! A new face.');assert.ok(chunks.length);assert.ok(result.timing.first_text_ms>=0);
  }finally{provider.close();}
});
test('Codex forwards approval and can reconnect after cancellation',async()=>{
  let requests=0;const provider=new CodexProvider({workspace:__dirname,instructions:()=>'',approve:async()=>{requests++;return false;},tool:async()=>({ok:true}),launchProcess:launch('approval')});
  try{await provider.reply('Do it',[],new AbortController(),()=>{});assert.equal(requests,1);}finally{provider.close();}
  provider.launchProcess=launch('wait');const controller=new AbortController();
  const result=provider.reply('Wait',[],controller,()=>{});setTimeout(()=>controller.abort(),150);
  await assert.rejects(result);provider.close();
  provider.launchProcess=launch('normal');
  try{assert.equal((await provider.reply('Again',[],new AbortController(),()=>{})).reply.emotion,'curious');}finally{provider.close();}
});
for(const Type of [CodexProvider,ClaudeProvider])test(Type.name+' refuses silent API-key billing',async()=>{
  const provider=new Type({workspace:__dirname,instructions:()=>'',approve:async()=>false,tool:async()=>({ok:true}),launchProcess:launch('api-key')});
  try{await assert.rejects(provider.reply('Hello',[],new AbortController(),()=>{}),/account|billing|sign in/i);}finally{provider.close();}
});
test('Claude invalid output fails without fabricating a reply',async()=>{
  const provider=new ClaudeProvider({workspace:__dirname,instructions:()=>'',launchProcess:launch('invalid')});
  try{await assert.rejects(provider.reply('Hello',[],new AbortController(),()=>{}));}finally{provider.close();}
});
