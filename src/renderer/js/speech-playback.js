// The audio source and mouth share one clock; text reveal never opens the mouth.
export function speechLevels(buffer, hz=24){
  const size=Math.max(1,Math.round(buffer.sampleRate/hz)),levels=[];
  const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  for(let start=0;start<buffer.length;start+=size){let sum=0,n=0;
    for(let i=start;i<Math.min(buffer.length,start+size);i++)for(const samples of channels){sum+=samples[i]*samples[i];n++;}
    levels.push(Math.sqrt(sum/Math.max(1,n)));
  }
  const sorted=[...levels].sort((a,b)=>a-b),peak=Math.max(.015,sorted[Math.floor(sorted.length*.95)]||0),floor=Math.max(.0035,peak*.08);
  return levels.map(level=>level<floor?0:level/peak>.38?2:1);
}

export class SpeechPlayback{
  constructor({context,send,clock=()=>performance.now(),muted=()=>false}){
    this.context=context;this.send=send;this.clock=clock;this.muted=muted;this.generation=0;this.id=null;this.levels=[];
  }
  audibleTime(){
    const ctx=this.ctx,stamp=ctx.getOutputTimestamp?.();
    if(stamp&&stamp.performanceTime>0&&Number.isFinite(stamp.contextTime))return Math.min(ctx.currentTime,stamp.contextTime+(this.clock()-stamp.performanceTime)/1000);
    return ctx.currentTime-Math.max(0,ctx.outputLatency??ctx.baseLatency??0);
  }
  mouth(){
    if(!this.source||this.ctx.state!=='running')return 0;
    const elapsed=this.audibleTime()-this.startTime;
    return elapsed<0?0:this.levels[Math.floor(elapsed*24)]||0;
  }
  stop(identifier=null){
    if(identifier&&identifier!==this.id)return;
    this.generation++;clearTimeout(this.startTimer);this.startTimer=null;
    if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();}
    this.source=null;this.levels=[];this.id=null;
  }
  async play(packet){
    this.stop();const generation=this.generation,id=packet.playback_id;
    if(!/^[a-f0-9]{24}$/.test(id))return false;
    this.id=id;this.shutdown=!!packet.shutdown;
    try{
      if(this.muted()||typeof packet.wav!=='string'||packet.wav.length>8*1024*1024||!packet.wav.length)throw Error('Unavailable speech');
      const raw=atob(packet.wav),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
      const ctx=this.ctx=this.context();await ctx.resume();
      const buffer=await ctx.decodeAudioData(bytes.buffer);
      if(generation!==this.generation)return false;
      if(buffer.duration>120||buffer.numberOfChannels>2)throw Error('Oversized speech');
      this.levels=speechLevels(buffer);this.startTime=ctx.currentTime+.02;this.started=false;
      const source=this.source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);
      const started=()=>{if(!this.started){this.started=true;this.send({command:'voice-started',playback_id:id});}};
      const watch=()=>{if(generation!==this.generation)return;if(this.audibleTime()>=this.startTime)started();else this.startTimer=setTimeout(watch,8);};
      const finished=()=>{
        if(generation!==this.generation)return;
        if(this.audibleTime()<this.startTime+buffer.duration){this.startTimer=setTimeout(finished,8);return;}
        started();this.send({command:'voice-ended',playback_id:id});this.stop(id);
      };
      source.onended=finished;
      source.start(this.startTime);watch();return true;
    }catch{
      if(generation===this.generation){this.send({command:'voice-error',playback_id:id});this.stop(id);}
      return false;
    }
  }
}
