const base=new URL('../assets/capri/facial-components-v1/',import.meta.url),images=new Map();
const eyeStates=['neutral','half','closed','excited','suspicious','wink'],mouthStates=['neutral','speech-small','speech-open','grin','smirk','laugh'];
function read(url){return new Promise((resolve,reject)=>{const r=new XMLHttpRequest();r.open('GET',url);r.onload=()=>{try{resolve(JSON.parse(r.responseText));}catch(e){reject(e);}};r.onerror=reject;r.send();});}
function sprite(ctx,id,x,y,width,maxHeight=Infinity){const image=images.get(id),scale=Math.min(width/image.width,maxHeight/image.height);ctx.drawImage(image,x-image.width*scale/2,y-image.height*scale/2,image.width*scale,image.height*scale);}
window.ready=(async()=>{
 const manifest=await read(new URL('frames.json',base));
 await Promise.all(Object.entries(manifest.frames).map(([id,frame])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images.set(id,image);resolve();};image.onerror=reject;image.src=new URL(frame.file,base).href;})));
 const c=document.querySelector('#sheet'),ctx=c.getContext('2d');
 ctx.fillStyle='#0c101b';ctx.fillRect(0,0,c.width,c.height);ctx.font='19px monospace';ctx.fillStyle='#00e5ed';ctx.fillText('CAPRI // NEW FACIAL COMPONENTS · separate transparent assets',22,30);
 ctx.font='12px monospace';ctx.fillStyle='#a5b9cc';ctx.fillText('Original portraits as reference · no body regeneration · eyes and mouth remain independent',22,53);
 for(let i=0;i<6;i++){
   const x=14+i%3*396,y=75+Math.floor(i/3)*338;ctx.fillStyle='#182231';ctx.fillRect(x,y,382,322);ctx.strokeStyle='#304052';ctx.strokeRect(x,y,382,322);
   ctx.font='12px monospace';ctx.fillStyle='#00e5ed';ctx.fillText('EYES / '+eyeStates[i].toUpperCase(),x+12,y+24);
   sprite(ctx,'leftEye-'+eyeStates[i],x+120,y+104,88);sprite(ctx,'rightEye-'+eyeStates[i],x+265,y+104,88);
   ctx.strokeStyle='#314051';ctx.beginPath();ctx.moveTo(x+12,y+177);ctx.lineTo(x+370,y+177);ctx.stroke();
   ctx.fillStyle='#fa4ba3';ctx.fillText('MOUTH / '+mouthStates[i].toUpperCase(),x+12,y+199);sprite(ctx,'mouth-'+mouthStates[i],x+191,y+260,245,104);
 }
 ctx.fillStyle='#9bb0c3';ctx.fillText('12 independent eye sprites + 6 mouth sprites · review only, not applied to the desktop character',22,768);
 window.componentSheet=()=>c.toDataURL('image/png').split(',')[1];return {components:images.size};
})();
