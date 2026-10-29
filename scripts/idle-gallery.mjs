import { Capri } from '../src/renderer/js/capri.js';
import { FxLayer } from '../src/renderer/js/fx.js';
import { ACTS, Player } from '../src/renderer/js/acting.js';
import { configureMotion } from '../src/renderer/js/util.js';
import { loadPoseSprites, PoseSprites, POSE_CLIPS } from '../src/renderer/js/pose-sprites.js';
window.previewReady = (async () => {
  configureMotion('full');
  const image = new Image(); image.src='../assets/capri/capri-full.png'; await image.decode();
  const fx=new FxLayer(document.getElementById('fx'));fx.resize(1280,1200);
  const definitions=[['stretch','STRETCH'],['exercise','EXERCISE'],['dance','DANCE'],['wave','WAVE'],
    ['shrug','SHRUG'],['lounge','LIE DOWN'],['seated-kick','SWING LEGS'],['finger-guns','FINGER GUNS'],
    ['hacking','HOLOGRAPHIC TERMINAL'],['listening','MUSIC'],['doze','DOZE / SEATED']];
  const actors=[];
  const library=await loadPoseSprites();
  const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  for(let i=0;i<12;i++) {
    const x=(i%4)*320,y=Math.floor(i/4)*400;
    const tile=document.createElement('div');tile.className='tile';tile.style.left=x+'px';tile.style.top=y+'px';
    const label=document.createElement('b');label.textContent=definitions[i]?.[1]||'EMOTICONS';tile.append(label);document.body.append(tile);
    if(i===6||i===10){const ledge=document.createElement('div');ledge.style.cssText='position:absolute;left:35px;right:35px;top:258px;height:90px;border:1px solid #426077;background:#151b28';tile.append(ledge);}
    if(i===11)continue;
    const root=document.createElement('div');root.className='capri';const canvas=document.createElement('canvas');canvas.className='capri__sprite';root.append(canvas);document.body.append(root);
    const capri=new Capri({root,canvas,image,fx,voice:{play(){}}});capri.setScale(i===5?.47:.6);
    capri.poses=new PoseSprites(root,library);
    const cels=POSE_CLIPS['idle-'+definitions[i][0]].map(([id])=>library.frames[id]);
    let left=Math.max(...cels.map(f=>f.anchor.x*f.scale))*capri.scale,right=Math.max(...cels.map(f=>(f.image.width-f.anchor.x)*f.scale))*capri.scale;
    if(left+right>286){const ratio=286/(left+right);capri.setScale(capri.scale*ratio);left*=ratio;right*=ratio;}
    capri.pos={x:x+(320-left-right)/2+left,y:y+370};capri.areas=[{x,y,w:320,h:400}];
    capri.setStance(i===6||i===10?'sit':'stand');capri.base=new Player(i===6||i===10?'sit':'stand',{at:0});
    actors.push({capri,name:definitions[i][0],cycle:-1});
  }
  window.requestAnimationFrame=raf;
  const symbols=document.createElement('div');symbols.className='symbols';symbols.textContent='♡   ♪   ?!\n^_^  >_<  zzz';document.body.append(symbols);
  window.renderGallery=time=>{
    for(const actor of actors) {
      const {capri,name}=actor;
      const length=POSE_CLIPS['idle-'+name].reduce((sum,[,ms])=>sum+ms,0)+450;
      const cycle=Math.floor(time/length);
      if(cycle!==actor.cycle){capri.endAct(false);capri.poses.play('idle-'+name,capri.stance,cycle*length);capri.act={player:{name:'idle-'+name,priority:0,poseClip:true,act:{fps:12}},done(){}};actor.cycle=cycle;}
      capri.drawFrame(time);
    }
    symbols.style.opacity=String(.7+.3*Math.sin(time/450));
  };
})();
