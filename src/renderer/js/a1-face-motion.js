// Source rectangles preserve the original A1 artwork instead of redrawing its eyes.
export const A1_FACE={
  leftEye:{x:101,y:108,w:20,h:22,cx:111,cy:119},
  rightEye:{x:129,y:101,w:25,h:25,cx:141.5,cy:113.5},
  mouth:{x:112,y:131,w:30,h:11,cx:127,cy:136.5},
};
const faceColors=new WeakMap();
function faceColor(image,part='face'){
 if(!faceColors.has(image)){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const p=ctx.getImageData(123,124,1,1).data;const jaw=ctx.getImageData(125,144,1,1).data;faceColors.set(image,{face:'rgb('+p[0]+','+p[1]+','+p[2]+')',jaw:'rgb('+jaw[0]+','+jaw[1]+','+jaw[2]+')'});}
 return faceColors.get(image)[part];
}
export function blinkAt(time){
 const phase=((time%4800)+4800)%4800;
 if(phase<2000||phase>2240)return 0;
 return Math.sin((phase-2000)/240*Math.PI);
}
export function speechAt(time){
 const phase=((time%6000)+6000)%6000;
 if(phase<2700||phase>5000)return 0;
 const fade=Math.min(1,(phase-2700)/120,(5000-phase)/140);
 return fade*(.25+.75*Math.abs(Math.sin((phase-2700)/115)));
}
export function drawA1Face(ctx,image,time,{guides=false,animate=true}={}){
 ctx.drawImage(image,0,0);
 const blink=animate?blinkAt(time):0,opening=animate?speechAt(time):0;
 if(blink>0){
   for(const p of [A1_FACE.leftEye,A1_FACE.rightEye]){
     ctx.save();ctx.beginPath();ctx.moveTo(112,108);ctx.lineTo(149,102);ctx.lineTo(152,126);ctx.lineTo(130,132);ctx.lineTo(100,128);ctx.lineTo(107,117);ctx.closePath();ctx.clip();
     ctx.beginPath();ctx.ellipse(p.cx,p.cy,p.w*.48,p.h*.48,0,0,Math.PI*2);ctx.clip();
     ctx.fillStyle=faceColor(image);ctx.fillRect(p.x-2,p.y-2,p.w+4,p.h+4);
     if(blink<.9){const h=p.h*Math.max(.08,1-blink);ctx.drawImage(image,p.x,p.y,p.w,p.h,p.x,p.cy-h/2,p.w,h);}
     else{ctx.strokeStyle='#080a20';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(p.cx-p.w*.36,p.cy);ctx.lineTo(p.cx,p.cy+.8);ctx.lineTo(p.cx+p.w*.36,p.cy-.5);ctx.stroke();}
     ctx.restore();
   }
 }
 if(opening>0){
   const p=A1_FACE.mouth;ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();
   ctx.fillStyle=faceColor(image,'jaw');ctx.fillRect(p.x,p.y,p.w,p.h);
   ctx.strokeStyle='#f0ffff';ctx.lineWidth=.8;ctx.lineJoin='miter';
   ctx.beginPath();ctx.moveTo(113,135);ctx.lineTo(119,138);ctx.lineTo(123,135);ctx.lineTo(128,138);ctx.lineTo(133,134);ctx.lineTo(139,134);
   ctx.lineTo(134,136+opening*4);ctx.lineTo(128,138+opening*3);ctx.lineTo(120,137+opening*2);ctx.closePath();ctx.stroke();ctx.restore();
 }
 if(guides){ctx.save();ctx.strokeStyle='#ffcb39';ctx.lineWidth=.6;for(const p of Object.values(A1_FACE)){ctx.strokeRect(p.x,p.y,p.w,p.h);ctx.beginPath();ctx.moveTo(p.cx-3,p.cy);ctx.lineTo(p.cx+3,p.cy);ctx.moveTo(p.cx,p.cy-3);ctx.lineTo(p.cx,p.cy+3);ctx.stroke();}ctx.restore();}
}
