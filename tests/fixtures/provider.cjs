const readline=require('node:readline');
const [provider,mode,scenario]=process.argv.slice(2);
const emit=value=>process.stdout.write(JSON.stringify(value)+'\n');
const reply={display_en:'Oh! A new face.',speech_ja:'あ、新しい顔だね。',emotion:'curious'};
if(provider==='claude'){
  if(mode==='auth'){emit({loggedIn:scenario!=='no-auth',authMethod:scenario==='api-key'?'api_key':'claude.ai'});process.exit(0);}
  let text='';process.stdin.on('data',chunk=>text+=chunk);process.stdin.on('end',()=>{
    if(scenario==='invalid'){emit({type:'result',result:'not JSON'});return;}
    const raw=JSON.stringify(reply);for(let i=0;i<raw.length;i+=8)emit({type:'stream_event',event:{delta:{type:'text_delta',text:raw.slice(i,i+8)}}});
    emit({type:'result',structured_output:reply,is_error:false});
  });
}else{
  readline.createInterface({input:process.stdin}).on('line',line=>{
    const message=JSON.parse(line);let result={};
    if(message.method==='account/read')result={account:{type:scenario==='api-key'?'apiKey':'chatgpt'}};
    if(message.method==='model/list')result={data:[{model:'fixture',isDefault:true}]};
    if(message.method==='thread/start')result={thread:{id:'fixture-thread'}};
    if(message.method==='turn/start'){
      emit({id:message.id,result:{turn:{id:'fixture-turn'}}});
      if(scenario==='wait')return;
      if(scenario==='approval'){emit({id:'review-1',method:'item/commandExecution/requestApproval',params:{command:'fixture'}});return;}
      finish();return;
    }
    if(message.id==='review-1'&&!message.method){finish();return;}
    if(message.id!=null)emit({id:message.id,result});
  });
  function finish(){
    emit({method:'item/started',params:{item:{type:'agentMessage',id:'answer',phase:'final_answer'}}});
    const raw=JSON.stringify(reply);for(let i=0;i<raw.length;i+=7)emit({method:'item/agentMessage/delta',params:{itemId:'answer',delta:raw.slice(i,i+7)}});
    emit({method:'item/completed',params:{item:{type:'agentMessage',id:'answer',phase:'final_answer',text:raw}}});
    emit({method:'turn/completed',params:{turn:{id:'fixture-turn',status:'completed'}}});
  }
}
