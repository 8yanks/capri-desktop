// Landmarks are source-image pixels, before the character's facing/scale transform.
export const FACE_EXPRESSIONS=['neutral','curious','smug','happy','talk','sleep'];
export function validateFaceRig(rig,width,height){
  if(!rig||rig.version!==1)throw Error('Unsupported face rig');
  for(const name of ['leftEye','rightEye','mouth']){
    const p=rig[name];
    if(!p||!['x','y','rx','ry','angle'].every(k=>Number.isFinite(p[k])))throw Error('Invalid face landmark: '+name);
    if(p.x-p.rx*1.2<0||p.x+p.rx*1.2>width||p.y-p.ry*1.3<0||p.y+p.ry*1.3>height||p.rx<=0||p.ry<=0)throw Error('Face landmark outside sprite: '+name);
  }
  return rig;
}
function at(ctx,p,draw){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);draw();ctx.restore();}
function eye(ctx,p,expression,time,side){
  at(ctx,p,()=>{
    const closed=expression==='sleep'||expression==='happy'||expression==='smug'&&side===1;
    ctx.lineWidth=Math.max(1,p.rx*.12);ctx.lineJoin='miter';
    if(closed){
      ctx.strokeStyle='#05101c';ctx.beginPath();ctx.moveTo(-p.rx*.85,0);ctx.lineTo(0,expression==='happy'?-p.ry*.38:p.ry*.24);ctx.lineTo(p.rx*.85,0);ctx.stroke();return;
    }
    const curious=expression==='curious'?(side===0?1.12:.83):1;
    ctx.fillStyle='#040a19';ctx.beginPath();ctx.ellipse(0,0,p.rx*1.13,p.ry*1.15*curious,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#00ed61';ctx.beginPath();ctx.ellipse(0,0,p.rx,p.ry*curious,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3420a9';ctx.beginPath();ctx.ellipse(0,0,p.rx*.80,p.ry*.83*curious,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#00dfff';ctx.beginPath();ctx.ellipse(0,0,p.rx*.62,p.ry*.68*curious,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f5ffff';ctx.beginPath();ctx.ellipse(-p.rx*.02,-p.ry*.04,p.rx*.22,p.ry*.25*curious,0,0,Math.PI*2);ctx.fill();
  });
}
function mouth(ctx,p,expression,time){
  at(ctx,p,()=>{
    ctx.strokeStyle='#f2fcff';ctx.lineWidth=Math.max(.8,p.ry*.20);ctx.lineJoin='miter';
    if(expression==='sleep'){ctx.beginPath();ctx.moveTo(-p.rx*.5,0);ctx.lineTo(p.rx*.5,0);ctx.stroke();return;}
    const opening=expression==='talk'?.3+.6*(.5+.5*Math.sin(time/95)):expression==='happy'?.7:.13;
    ctx.beginPath();ctx.moveTo(-p.rx,-p.ry*.12);ctx.lineTo(-p.rx*.52,p.ry*.28);ctx.lineTo(-p.rx*.12,-p.ry*.14);ctx.lineTo(p.rx*.37,p.ry*.26);ctx.lineTo(p.rx,-p.ry*.24);
    if(opening>.25){ctx.lineTo(p.rx*.45,p.ry*opening);ctx.lineTo(-p.rx*.25,p.ry*opening);ctx.closePath();ctx.fillStyle='#f2fcff';ctx.fill();}else ctx.stroke();
  });
}
export function drawFacePart(ctx,rig,part,expression='neutral',time=0){
  if(!FACE_EXPRESSIONS.includes(expression))expression='neutral';
  if(part==='leftEye')eye(ctx,rig.leftEye,expression,time,0);
  else if(part==='rightEye')eye(ctx,rig.rightEye,expression,time,1);
  else if(part==='mouth')mouth(ctx,rig.mouth,expression,time);
  else throw Error('Unknown face part: '+part);
}
export function drawFace(ctx,rig,expression='neutral',time=0,debug=false){
  for(const part of ['leftEye','rightEye','mouth'])drawFacePart(ctx,rig,part,expression,time);
  if(debug){
    ctx.save();ctx.strokeStyle='#ffca36';ctx.fillStyle='#ffca36';ctx.lineWidth=1;
    for(const [name,p]of Object.entries(rig)){if(!p||typeof p!=='object'||!Number.isFinite(p.x))continue;
      ctx.beginPath();ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();
      ctx.font='9px monospace';ctx.fillText(name,p.x+7,p.y-7);
    }ctx.restore();
  }
}
