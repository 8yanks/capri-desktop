import {drawFace,drawFacePart,validateFaceRig,FACE_EXPRESSIONS} from '../src/renderer/js/face-rig.js';
const base=new URL('../assets/capri/face-prototype-a2/',import.meta.url);
const json=async url=>{
 if(location.protocol!=='file:')return (await fetch(url)).json();
 return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('GET',url);xhr.onload=()=>{try{resolve(JSON.parse(xhr.responseText));}catch(e){reject(e);}};xhr.onerror=reject;xhr.send();});
};
let rig,debug=true,paused=false,freeze=0,image=new Image(),cards=[];
function draw(t){
 const time=paused?freeze:t;freeze=time;
 const ctx=document.querySelector('#body').getContext('2d');ctx.clearRect(0,0,318,640);
 const scale=Math.min(300/image.width,610/image.height),x=(318-image.width*scale)/2,y=(640-image.height*scale)/2;
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.drawImage(image,0,0);drawFace(ctx,rig,'neutral',time);ctx.restore();
 for(const {ctx,expression}of cards){
   ctx.clearRect(0,0,220,245);ctx.save();ctx.translate(110,130);ctx.scale(.88,.88);ctx.translate(-rig.crop.x,-rig.crop.y);ctx.drawImage(image,0,0);drawFace(ctx,rig,expression,time,debug);ctx.restore();
 }
}
window.ready=(async()=>{
 const manifest=await json(new URL('landmarks.json',base));rig=manifest.rig;
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=new URL('body.png',base).href;});validateFaceRig(rig,image.width,image.height);
 for(const expression of FACE_EXPRESSIONS){const card=document.createElement('div');card.className='card';card.innerHTML='<b>'+expression.toUpperCase()+'</b><canvas width="220" height="245"></canvas>';document.querySelector('#faces').append(card);cards.push({expression,ctx:card.querySelector('canvas').getContext('2d')});}
 const input=document.querySelector('#rig');input.value=JSON.stringify(rig,null,2);
 document.querySelector('#guides').onclick=()=>{debug=!debug;};document.querySelector('#pause').onclick=()=>{paused=!paused;};
 document.querySelector('#apply').onclick=()=>{try{const next=JSON.parse(input.value);validateFaceRig(next,image.width,image.height);rig=next;document.querySelector('#error').textContent=' Applied';}catch(e){document.querySelector('#error').textContent=e.message;}};
 window.faceReviewAt=(t,guides=true)=>{debug=guides;draw(t);return {width:image.width,height:image.height,rig,expressions:FACE_EXPRESSIONS};};
 window.faceLayer=part=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;drawFacePart(canvas.getContext('2d'),rig,part);return canvas.toDataURL('image/png').split(',')[1];};
 window.faceSheet=(guides=false)=>{
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=710;const c=canvas.getContext('2d');
   c.fillStyle='#0c101b';c.fillRect(0,0,1200,710);c.fillStyle='#00e4ef';c.font='18px monospace';c.fillText('CAPRI // A2 · asymmetric hair + modular face',20,30);
   c.save();c.translate(18,50);c.scale(.39,.39);c.drawImage(image,0,0);drawFace(c,rig,'neutral',400);c.restore();
   for(const [i,name]of FACE_EXPRESSIONS.entries()){
     const x=435+i%3*250,y=70+Math.floor(i/3)*310;c.fillStyle='#121b27';c.fillRect(x,y,240,290);c.fillStyle='#00e4ef';c.font='14px monospace';c.fillText(name.toUpperCase(),x+10,y+20);
     c.save();c.beginPath();c.rect(x,y+30,240,260);c.clip();c.translate(x+120,y+155);c.scale(.92,.92);c.translate(-rig.crop.x,-rig.crop.y);c.drawImage(image,0,0);drawFace(c,rig,name,400,guides);c.restore();
   }
   c.fillStyle='#9baabe';c.font='12px monospace';c.fillText('Same body · independent eyes and mouth · preview only',20,690);
   return canvas.toDataURL('image/png').split(',')[1];
 };
 function loop(t){draw(t);requestAnimationFrame(loop);}requestAnimationFrame(loop);
 return {width:image.width,height:image.height};
})();
