import { Capri } from '../src/renderer/js/capri.js';
import { FxLayer } from '../src/renderer/js/fx.js';
import { Player } from '../src/renderer/js/acting.js';
import { configureMotion } from '../src/renderer/js/util.js';
import { loadPoseSprites, PoseSprites } from '../src/renderer/js/pose-sprites.js';
import { OUTFITS } from '../src/renderer/js/wardrobe.js';
window.previewReady=(async()=>{
  configureMotion('full');
  const image=new Image();image.src='../assets/capri/capri-full.png';await image.decode();
  const library=await loadPoseSprites(),fx=new FxLayer(document.getElementById('fx'));fx.resize(1280,960);
  const actors=[],raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const labels=['ORIGINAL','NETRUNNER','CREATOR','MUSIC / STAGE','LEAGUE / HEXTECH','DAVID MARTINEZ','LUCY','BADLANDS / D','OMI','ROMAN','TALIA','KING'];
  for(let i=0;i<OUTFITS.length;i++){
    const x=i%4*320,y=Math.floor(i/4)*320;
    const tile=document.createElement('div');tile.className='tile';tile.style.left=x+'px';tile.style.top=y+'px';
    const title=document.createElement('b');title.textContent=labels[i];tile.append(title);document.body.append(tile);
    const root=document.createElement('div');root.className='capri';const canvas=document.createElement('canvas');canvas.className='capri__sprite';root.append(canvas);document.body.append(root);
    const capri=new Capri({root,canvas,image,fx,voice:{play(){}}});capri.setScale(.48);capri.pos={x:x+160,y:y+300};capri.areas=[{x,y,w:320,h:320}];
    capri.poses=new PoseSprites(root,library);await capri.poses.setOutfit(OUTFITS[i]);capri.drawFrame(0);capri.poses.changedAt=-1000;
    actors.push({capri,phase:-1,id:OUTFITS[i]});
  }
  window.requestAnimationFrame=raf;
  const walkOnly=new URLSearchParams(location.search).has('walk');
  window.renderWardrobe=time=>{
    const period=10000,t=time%period,phase=walkOnly?3:t<1400?0:t<2800?1:t<4500?2:3,born=walkOnly?0:Math.floor(time/period)*period+[0,1400,2800,4500][phase];
    for(const actor of actors){const {capri}=actor;
      if(actor.phase!==phase||actor.born!==born){
        capri.endAct(false);capri.setStance(phase===2?'sit':'stand');capri.base=new Player(phase===2?'sit':'stand',{at:0});
        if(phase>0){capri.poses.play(phase===1?'idle-wave':phase===2?'idle-seated-kick':'walk',capri.stance,born);
          if(phase===3)capri.poses.clip.travel={from:capri.pos.x,to:capri.pos.x,duration:walkOnly?6000:5500};
          capri.act={player:{name:'preview',priority:0,poseClip:true,act:{fps:12}},done(){}};}
        actor.phase=phase;actor.born=born;
      }
      capri.drawFrame(time);
    }
    return actors.map(({capri,id})=>({id,active:capri.poses.outfit,visible:capri.poses.visible,clickable:capri.hit(capri.head().x,capri.head().y)}));
  };
})();
