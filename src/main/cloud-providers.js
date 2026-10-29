'use strict';
// Provider processes own authentication. Capri never reads token files or opens a network API itself.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync}=require('node:child_process');
const readline=require('node:readline');
const SCHEMA={type:'object',additionalProperties:false,properties:{display_en:{type:'string'},speech_ja:{type:'string'},emotion:{type:'string',enum:['idle','talking','happy','curious']}},required:['display_en','speech_ja','emotion']};
function validateReply(value){
  if(typeof value==='string')value=JSON.parse(value);
  if(!value||Object.keys(value).sort().join(',')!=='display_en,emotion,speech_ja'
    ||!['idle','talking','happy','curious'].includes(value.emotion)
    ||!['display_en','speech_ja'].every(k=>typeof value[k]==='string'&&value[k].trim().length>0&&value[k].length<=4000))throw Error('Provider returned an invalid reply');
  return value;
}
function displayPrefix(raw){
  if(typeof raw!=='string'||raw.length>65536)return '';
  const match=/"display_en"\s*:\s*"/.exec(raw);if(!match)return '';
  const start=match.index+match[0].length;let escaped=false,end=raw.length;
  for(let i=start;i<raw.length;i++){if(raw[i]==='"'&&!escaped){end=i;break;}escaped=raw[i]==='\\'&&!escaped;}
  const text=raw.slice(start,end);
  for(let trim=0;trim<Math.min(7,text.length+1);trim++)try{
    let result=JSON.parse('"'+text.slice(0,text.length-trim)+'"');
    if(/[\uD800-\uDBFF]$/.test(result))result=result.slice(0,-1);
    return result.slice(0,4000);
  }catch{}
  return '';
}
function findExecutable(name){
  const direct=name==='codex'?[path.join(os.homedir(),'AppData/Local/Programs/OpenAI/Codex/bin/codex.exe')]:
    [path.join(os.homedir(),'.local/bin/claude.exe'),path.join(os.homedir(),'AppData/Local/Programs/Claude/claude.exe')];
  for(const file of direct)if(fs.existsSync(file))return {file,args:[]};
  try{
    const candidates=execFileSync(process.platform==='win32'?'where.exe':'which',[name],{encoding:'utf8',windowsHide:true,timeout:3000}).trim().split(/\r?\n/);
    const native=candidates.find(file=>! /\.(cmd|bat|ps1)$/i.test(file)&&fs.existsSync(file));
    if(native)return {file:native,args:[]};
  }catch{}
  if(name==='claude'){
    const file=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData/Roaming'),'npm/node_modules/@anthropic-ai/claude-code/cli.js');
    if(fs.existsSync(file))return {file:process.execPath,args:[file],node:true};
  }
  throw Error(`Install and sign in to ${name} CLI on this machine first. Run npm run doctor.`);
}
function launch(name,args,workspace){
  const binary=findExecutable(name);
  return spawn(binary.file,[...binary.args,...args],{cwd:workspace,windowsHide:true,stdio:['pipe','pipe','pipe'],
    env:{...process.env,...(binary.node?{ELECTRON_RUN_AS_NODE:'1'}:{})}});
}
class CodexProvider{
  constructor({workspace,instructions,approve,tool,launchProcess=launch}){
    Object.assign(this,{workspace,instructions,approve,tool,launchProcess});this.pending=new Map();this.counter=0;this.thread=null;
  }
  write(value){if(!this.child?.stdin.writable)throw Error('Codex connection is closed');this.child.stdin.write(JSON.stringify(value)+'\n');}
  rpc(method,params={},timeout=30000){return new Promise((resolve,reject)=>{
    const id=++this.counter,timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`Codex ${method} timed out`));},timeout);
    this.pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});
    try{this.write({id,method,params});}catch(error){this.pending.get(id).reject(error);this.pending.delete(id);}
  });}
  async connect(){
    if(this.connecting)return this.connecting;
    this.connecting=(async()=>{
      const child=this.launchProcess('codex',['--disable','hooks','app-server'],this.workspace);this.child=child;
      child.on('error',error=>{if(this.child===child)this.fail(error);});child.on('exit',()=>{if(this.child===child)this.fail(Error('Codex process stopped'));});
      child.stderr.on('data',()=>{});
      readline.createInterface({input:child.stdout}).on('line',line=>{
        if(line.length>1024*1024){this.close();return;}
        try{Promise.resolve(this.onMessage(JSON.parse(line))).catch(error=>this.fail(error));}catch(error){this.fail(error);}
      });
      await this.rpc('initialize',{clientInfo:{name:'capri-cloud-desktop',title:'Capri',version:'0.1.0'},capabilities:{experimentalApi:true}});
      this.write({method:'initialized',params:{}});
      const {account}=await this.rpc('account/read',{refreshToken:false});
      if(account?.type!=='chatgpt')throw Error('Sign in with a ChatGPT account using codex login; API-key billing is not enabled by Capri.');
      const list=await this.rpc('model/list');const chosen=list.data?.find(m=>m.isDefault)||list.data?.[0];
      if(!chosen)throw Error('No Codex model available');this.model=chosen.model;
      const result=await this.rpc('thread/start',{cwd:this.workspace,model:this.model,sandbox:'read-only',approvalPolicy:'on-request',
        developerInstructions:this.instructions(),ephemeral:true,config:{web_search:'live'},dynamicTools:[{
          type:'function',name:'capri_pc',description:'Read the time or system information, search local reference notes, or request opening a folder/URL.',
          inputSchema:{type:'object',properties:{action:{type:'string',enum:['time','system_info','vault_search','open_folder','open_url']},query:{type:'string'},path:{type:'string'},url:{type:'string'}},required:['action'],additionalProperties:false},
        }]});this.thread=result.thread.id;
    })().catch(error=>{this.close();throw error;});
    return this.connecting;
  }
  async onMessage(message){
    if(message.id!=null&&!message.method){const pending=this.pending.get(message.id);if(pending){this.pending.delete(message.id);message.error?pending.reject(Error(message.error.message)):pending.resolve(message.result);}return;}
    if(message.id!=null&&message.method){
      const params=message.params||{};let result={};
      try{
        if(message.method==='item/tool/call'){
          if(!this.turn||this.turn.controller.signal.aborted||++this.turn.tools>12||this.turn.denied)throw Error('Tool request is no longer active');
          const plan=typeof params.arguments==='string'?JSON.parse(params.arguments):params.arguments;
          const value=params.tool==='capri_pc'?await this.tool(plan,this.turn.controller.signal):{ok:false,error:'Unknown tool'};
            if(value.denied&&this.turn)this.turn.denied=true;
          result={success:value.ok!==false,contentItems:[{type:'inputText',text:JSON.stringify(value).slice(0,12000)}]};
        }else if(['item/commandExecution/requestApproval','item/fileChange/requestApproval'].includes(message.method)){
          const allowed=this.turn&&!this.turn.denied&&!this.turn.controller.signal.aborted&&await this.approve({kind:message.method,...params},this.turn.controller.signal);
          if(!allowed&&this.turn)this.turn.denied=true;
          result={decision:allowed?'accept':'decline'};
        }else if(message.method==='item/permissions/requestApproval')result={permissions:{},scope:'turn'};
        else if(message.method==='item/tool/requestUserInput')result={answers:{}};
        else if(message.method==='mcpServer/elicitation/request')result={action:'decline',content:null};
        else{this.write({id:message.id,error:{code:-32601,message:'Unsupported request'}});return;}
        this.write({id:message.id,result});
      }catch(error){try{this.write({id:message.id,result:{success:false,contentItems:[{type:'inputText',text:error.message}]}});}catch{}}
      return;
    }
    const turn=this.turn;if(!turn)return;const params=message.params||{};
    if(message.method==='item/started'&&params.item)turn.items.set(params.item.id,params.item);
    if(message.method==='item/agentMessage/delta'&&!turn.controller.signal.aborted){
      const id=params.itemId||'final';if(turn.items.get(id)?.phase==='commentary')return;
      const raw=(turn.streams.get(id)||'')+String(params.delta||'');turn.streams.set(id,raw.slice(0,65536));
      const text=displayPrefix(raw);if(text&&text!==turn.last){turn.last=text;turn.firstText??=Date.now();turn.partial(text);}
    }
    if(message.method==='item/completed'&&params.item?.type==='agentMessage'&&params.item.phase!=='commentary')turn.final=params.item.text;
    if(message.method==='turn/completed'){
      this.turn=null;clearTimeout(turn.timer);
      try{
        if(params.turn?.status!=='completed')throw Error('Codex turn failed or was interrupted');
        const reply=validateReply(turn.final);turn.resolve({reply,timing:{total_ms:Date.now()-turn.started,first_text_ms:turn.firstText?turn.firstText-turn.started:null}});
      }catch(error){turn.reject(error);}
    }
  }
  async reply(text,history,controller,partial){
    const started=Date.now();await this.connect();if(controller.signal.aborted)throw Error('Cancelled');
    if(this.turn)throw Error('Codex already has an active turn');
    return new Promise((resolve,reject)=>{
      const turn={resolve,reject,controller,partial,started,streams:new Map(),items:new Map(),tools:0,denied:false,last:''};this.turn=turn;
      turn.timer=setTimeout(()=>{this.close();reject(Error('Codex response timed out'));},180000);
      controller.signal.addEventListener('abort',()=>this.close(),{once:true});
      this.rpc('turn/start',{threadId:this.thread,input:[{type:'text',text:JSON.stringify({request:text,live_time:new Date().toISOString(),reference_history_untrusted:history.slice(-6)})}],outputSchema:SCHEMA,effort:'low'})
        .catch(error=>{if(this.turn===turn){clearTimeout(turn.timer);this.turn=null;reject(error);}});
    });
  }
  fail(error){for(const pending of this.pending.values())pending.reject(error);this.pending.clear();
    if(this.turn){clearTimeout(this.turn.timer);this.turn.reject(error);this.turn=null;}this.connecting=null;this.thread=null;}
  close(){const child=this.child;this.child=null;this.fail(Error('Codex connection closed'));if(child){child.stdin.end();setTimeout(()=>child.kill(),500).unref();}}
}
class ClaudeProvider{
  constructor({workspace,instructions,launchProcess=launch}){Object.assign(this,{workspace,instructions,launchProcess});}
  async reply(text,history,controller,partial){
    const started=Date.now();
    if(controller.signal.aborted)throw Error('Cancelled');
    if(!this.authChecked||Date.now()-this.authChecked>120000){
      const auth=await new Promise((resolve,reject)=>{
        const check=this.launchProcess('claude',['auth','status'],this.workspace);let output='';
        const timeout=setTimeout(()=>{check.kill();reject(Error('Claude sign-in check timed out'));},10000);
        check.stdout.on('data',chunk=>{output+=chunk;if(output.length>65536){check.kill();reject(Error('Invalid Claude sign-in response'));}});
        check.stderr.on('data',()=>{});check.on('error',error=>{clearTimeout(timeout);reject(error);});
        check.on('exit',()=>{clearTimeout(timeout);try{resolve(JSON.parse(output));}catch{reject(Error('Run claude auth login in a terminal first.'));}});
      });
      if(auth.loggedIn!==true||!['claude.ai','oauth_token'].includes(auth.authMethod))throw Error('Run claude auth login with your Claude account; Capri does not silently enable API-key billing.');
      this.authChecked=Date.now();
    }
    if(controller.signal.aborted)throw Error('Cancelled');
    // --bare in several CLI versions disables subscription OAuth. Keep sign-in, but isolate hooks, settings and tools explicitly.
    const args=['-p','--output-format','stream-json','--verbose','--include-partial-messages','--json-schema',JSON.stringify(SCHEMA),
      '--system-prompt',this.instructions(),'--permission-mode','dontAsk','--tools','','--strict-mcp-config','--mcp-config','{"mcpServers":{}}',
      '--setting-sources','','--settings','{"disableAllHooks":true}','--no-session-persistence','--effort','low'];
    const child=this.launchProcess('claude',args,this.workspace);this.child=child;
    return new Promise((resolve,reject)=>{
      let done=false,raw='',final,firstText;const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);this.child=null;error?reject(error):resolve(value);};
      const timer=setTimeout(()=>{child.kill();finish(Error('Claude response timed out'));},180000);
      controller.signal.addEventListener('abort',()=>{child.kill();finish(Error('Cancelled'));},{once:true});
      child.on('error',error=>finish(error));child.stderr.on('data',()=>{});
      readline.createInterface({input:child.stdout}).on('line',line=>{
        if(line.length>1024*1024){child.kill();finish(Error('Claude output exceeded limit'));return;}
        let item;try{item=JSON.parse(line);}catch{return;}
        if(item.type==='stream_event'&&item.event?.delta?.type==='text_delta'){
          raw=(raw+item.event.delta.text).slice(0,65536);const prefix=displayPrefix(raw);if(prefix){firstText??=Date.now();partial(prefix);}
        }
        if(item.type==='assistant')for(const block of item.message?.content||[])if(block.type==='text'&&typeof block.text==='string'){
          const prefix=displayPrefix(block.text);if(prefix){firstText??=Date.now();partial(prefix);}
        }
        if(item.type==='result'){
          if(item.is_error){finish(Error('Claude could not complete the request; check its sign-in and usage limit.'));return;}
          final=item.structured_output||item.result;
          try{finish(null,{reply:validateReply(final),timing:{total_ms:Date.now()-started,first_text_ms:firstText?firstText-started:null}});}catch(error){finish(error);}
        }
      });
      child.on('exit',code=>{if(!done)finish(Error(`Claude stopped without a valid response (${code})`));});
      child.stdin.end(JSON.stringify({request:text,reference_history_untrusted:history.slice(-8),live_time:new Date().toISOString()}));
    });
  }
  close(){this.child?.kill();this.child=null;}
}
module.exports={SCHEMA,validateReply,displayPrefix,findExecutable,launch,CodexProvider,ClaudeProvider};
