// Optional OS voice only. No local AI weights, cloned references or API keys are shipped.
export function bindSystemSpeech(host){
  let enabled=false,muted=false;
  const stop=()=>window.speechSynthesis?.cancel();
  const receive=event=>{
    if(event.event==='voice-options'){enabled=event.enabled===true;if(!enabled)stop();}
    if(event.event==='status'&&/Thinking|cancelled|selected|failed/i.test(event.text||''))stop();
    if(event.event==='memory'&&(event.sleeping||event.paused))stop();
    if(event.event!=='reply'||!enabled||muted||typeof event.speech_ja!=='string'||event.speech_ja.length>4000)return;
    const speech=window.speechSynthesis;if(!speech)return;
    const voice=speech.getVoices().find(v=>/^ja(?:-|_)/i.test(v.lang));
    if(!voice){host.localCommand({command:'voice-state',speaking:false});return;}
    stop();const line=new SpeechSynthesisUtterance(event.speech_ja);line.voice=voice;line.lang='ja-JP';line.rate=1;
    line.onstart=()=>host.localCommand({command:'voice-state',speaking:true,duration:Math.min(120,event.speech_ja.length/5)});
    line.onend=line.onerror=()=>host.localCommand({command:'voice-state',speaking:false});speech.speak(line);
  };
  host.onLocalEvent(receive);
  host.localHistory().then(events=>events.filter(event=>event.event==='voice-options').forEach(receive));
  host.onConfig(config=>{muted=!!config.muted;if(muted)stop();});
  host.getConfig().then(config=>{muted=!!config.muted;});
  window.addEventListener('beforeunload',stop);
}
