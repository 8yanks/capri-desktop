import {loadPoseSprites,PoseSprites,POSE_CLIPS} from '../src/renderer/js/pose-sprites.js';
import {SCENE_POSES} from '../src/renderer/js/scene-poses.js';
import {Player,NEUTRAL} from '../src/renderer/js/acting.js';
const ids=['default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'];
function motion(capri,time){const sample=capri.act.player.sample(time),pose=capri.act.player.resolve({...NEUTRAL,...sample.pose},capri.facing);Object.assign(capri,{tilt:pose.tilt,bob:pose.bob,sx:pose.sx,sy:pose.sy});capri.p.echo=pose.echo;}
window.ready=(async()=>{
 const library=await loadPoseSprites(),actors=[];
 for(let i=0;i<ids.length;i++){
  const tile=document.createElement('div');tile.className='tile';tile.style.left=(i%4*320)+'px';tile.style.top=(Math.floor(i/4)*360)+'px';
  tile.innerHTML='<div class="line"></div><b class="label">'+ids[i]+'</b>';document.body.append(tile);
  const root=document.createElement('div');root.className='actor';tile.append(root);
  const poses=new PoseSprites(root,library),capri={scale:.48,facing:1,stance:'sit',pos:{x:160,y:235+186*.48},p:{alpha:1},endAct(){},};
  await poses.setOutfit(ids[i],{manual:true});poses.draw(capri,0);if(poses.outfit!==ids[i])throw Error('Outfit failed to load: '+ids[i]);poses.changedAt=-1000;
  root.style.transform='translate('+ (capri.pos.x-184*.48)+'px,'+(capri.pos.y-474*.48)+'px)';actors.push({id:ids[i],poses,capri,root});
 }
 window.auditSeats=async index=>{
  for(const {poses,capri}of actors){capri.stance='sit';capri.act=null;capri.sx=capri.sy=1;capri.tilt=capri.bob=0;capri.p.echo=[0,0];capri.pos.y=235+186*.48;poses.clip={sequence:[['seated-'+[0,1,5,7][index],1000]],born:0};poses.draw(capri,0);}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 };
 window.auditScene=async(name,phase=.5)=>{
  for(const {poses,capri,root}of actors){capri.stance=['sit','plop','dive'].includes(name)?'sit':'stand';capri.pos.y=capri.stance==='sit'?235+186*.48:340;root.style.transform='translate('+(capri.pos.x-184*.48)+'px,'+(capri.pos.y-474*.48)+'px)';capri.act={player:new Player(name,{at:0})};poses.clip=null;const time=capri.act.player.total*1000/(capri.act.player.act.fps||12)*phase;motion(capri,time);root.style.transform='translate('+(capri.pos.x-184*.48)+'px,'+(capri.pos.y-474*.48+capri.bob)+'px)';poses.draw(capri,time);}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 };
 window.auditCompare=async()=>{
  const selected=['default','omi','roman','david','lucy'];
  for(const actor of actors){const index=selected.indexOf(actor.id),tile=actor.root.parentElement;tile.style.display=index<0?'none':'block';if(index<0)continue;
   tile.style.left=(index*200)+'px';tile.style.top='0';tile.style.width='200px';tile.style.height='360px';tile.querySelector('.line').style.top='225px';
   const {capri,poses,root}=actor;capri.scale=.75;capri.facing=1;capri.stance='sit';capri.act=null;capri.sx=capri.sy=1;capri.tilt=capri.bob=0;capri.p.echo=[0,0];capri.pos={x:100,y:225+186*.75};
   root.style.transform='translate('+(capri.pos.x-184*.75)+'px,'+(capri.pos.y-474*.75)+'px)';poses.clip={sequence:[['seated-0',1000]],born:0};poses.draw(capri,0);
  }
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 };
 window.auditMatrix=()=>{
  let draws=0;
  for(const {poses,capri,id}of actors)for(const name of Object.keys(SCENE_POSES))for(const facing of [-1,1])for(const t of [0,.2,.5,.8,.99]){
   capri.facing=facing;capri.stance=['sit','plop','dive'].includes(name)?'sit':'stand';capri.act={player:new Player(name,{at:0})};poses.clip=null;
   const time=t*capri.act.player.total*1000/(capri.act.player.act.fps||12);motion(capri,time);
   if(!poses.draw(capri,time))throw Error('Invisible '+id+'/'+name);
   const head=poses.head();if(!poses.hit(head.x,head.y))throw Error('Lost hit target '+id+'/'+name);draws++;
  }
  for(const {poses,capri,id}of actors)for(const [name,sequence]of Object.entries(POSE_CLIPS))for(const [key]of sequence){if(!poses.frame(key))throw Error('Missing '+id+'/'+name+'/'+key);}
  return {draws,outfits:actors.length,scenes:Object.keys(SCENE_POSES).length};
 };
})();
