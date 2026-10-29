// Explicit visual adaptation of every upstream acting.js scene. The original Player still owns cues.
export const SCENE_POSES={
 stand:['idle-0'],sit:['seated-0'],peek:['react-6','react-7'],sleep:['phase-3'],
 talk:['idle-0'],curious:['guide-0','guide-1'],look:['guide-0','guide-1'],
 gaze:['guide-0','guide-1','guide-2','guide-3','guide-5'],
 uplink:['guide-0','guide-1','guide-2','guide-3','guide-3','guide-5'],
 victory:['react-0','react-1','react-1','react-0','idle-0'],
 zap:['guide-1','guide-4','guide-4','guide-5'],
 point:['guide-1','guide-4','guide-4'],pointing:['guide-4'],unpoint:['guide-5','guide-0'],
 fold:['phase-0','phase-1','phase-2','phase-3'],dive:['possession-0','possession-1','possession-2','possession-3'],
 split:['phase-0','phase-5','phase-6'],alarm:['react-2','react-3'],
 flinch:['react-4','react-5','idle-0'],turn:['idle-1','idle-0'],
 spin:['phase-2','phase-3','phase-2'],hop:['possession-1','possession-2'],
 land:['airborne-4','airborne-5','airborne-6','airborne-7'],plop:['possession-4','seated-0'],fall:['airborne-1','airborne-2'],
};
export function scenePose(player,stance,now){
 if(['gaze','uplink'].includes(player?.name)&&typeof player.sample==='function'&&stance!=='sit'){
  const sample=player.sample(now);
  if(sample){
   const keys=player.act.keys,home=keys.findIndex(key=>key[2]==='home'),charge=keys.findIndex(key=>key[2]==='charge');
   if(home>=0&&sample.index>=home)return 'guide-5';
   if(charge>=0&&sample.index>=charge)return 'guide-3';
   if((sample.pose.reach||0)>0)return 'guide-2';
   return sample.index>=keys.findIndex(key=>key[2]==='notice')?'guide-1':'guide-0';
  }
 }
 const list=SCENE_POSES[player?.name];if(!list)return null;
 const duration=(player.total||1)*1000/(player.act?.fps||12);
 const elapsed=Math.max(0,now-(player.start||0));
 const t=player.act?.loop?(elapsed%duration)/duration:Math.min(.999,elapsed/duration);
 const id=list[Math.floor(t*list.length)];
 // A seated conversation/action must retain a seated support, never standing feet below the ledge.
 if(stance==='sit'&&!id.startsWith('seated-'))return ['gestures-0','idle-0'].includes(id)?'seated-0':'seated-5';
 return id;
}
