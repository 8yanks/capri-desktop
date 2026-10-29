// Derive production cels from approved A1 pixels and the immutable V5 SVG master.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../assets/capri'),out=path.join(root,'v5-a1-v1');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'base-a-v1/frames.json'),'utf8'));
const eyePairs={
 'key-0':[[112,120],[141,115.5]],'key-1':[[130.4,121.6],[158,117.1]],
 'key-2':[[159.5,118.2],[188.3,120.1]],'key-3':[[153.9,117.6],[183.6,118]],
 'key-4':[[115.2,156.6],[140.8,157]],'key-5':[[139.6,195],[173,190.3]],
 'key-6':[[173.1,112.8],[199.5,115]],'key-7':[[119.9,132.7],[146,130]],
 'seat-0':[[213.5,199.5],[263.4,180.1]],'seat-1':[[249.5,199],[299.4,179.5]],
 'seat-2':[[213.5,195.5],[263.7,175.9]],'seat-3':[[216,196],[266,176]],
 'walk-0':[[191.2,129.5],[223.8,131.9]],'walk-1':[[243.2,134.1],[270,135]],
 'walk-2':[[169,129.3],[200.2,130.5]],'walk-3':[[189.5,123.9],[221,125]],
 'walk-4':[[202.3,136.7],[230,138]],'walk-5':[[188,138.3],[217.5,140]],
 'walk-6':[[175,137.1],[204,138]],'walk-7':[[191,131.3],[221.4,133.1]],
};
const expressions=['neutral','curious','smug','happy','talk','sleep','wink','surprised'];
const masters=Object.fromEntries(['mask','eyes','mouth'].map(n=>[n,fs.readFileSync(path.join(root,'face-trace-v5',n+'.svg'),'utf8')]));
const hashes=Object.fromEntries(Object.entries(masters).map(([n,s])=>[n,crypto.createHash('sha256').update(s).digest('hex')]));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true}});await win.loadFile(path.join(__dirname,'face-trace-review.html'));
 const result=await win.webContents.executeJavaScript(`(${build.toString()})(${JSON.stringify({root:root.replaceAll('\\','/'),manifest,eyePairs,expressions,masters})})`);
 fs.mkdirSync(path.join(out,'frames'),{recursive:true});fs.mkdirSync(path.join(out,'faces'),{recursive:true});
 for(const [file,data]of Object.entries(result.files))fs.writeFileSync(path.join(out,file),Buffer.from(data,'base64'));
 fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify({version:1,design:'A1 + approved V5',palette:'warm rose-red; magenta blue channel × .62; white grain preserved',masterHashes:hashes,expressions,frames:result.frames},null,2));
 fs.writeFileSync(path.join(out,'preservation.json'),JSON.stringify(result.preservation,null,2));
 fs.writeFileSync(path.join(out,'README.md'),'# A1 / V5 production\n\nDerived from the approved A1 body/hair and V5 trace. No generated replacement face.\nEyes and mouth share one calibrated similarity transform per cel. Facial patches exclude the original pink hair pixels.\nRebuild: Electron scripts/build-v5-a1.cjs. Costumes stay paused. Original masters remain untouched.\n');
 win.destroy();console.log('Built '+Object.keys(result.frames).length+' A1 cels / '+expressions.length+' facial states.');app.quit();
}).catch(e=>{console.error(e);app.exit(1)});
async function build({root,manifest,eyePairs,expressions,masters}){
 const files={},frames={},preservation={};
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(src));i.src=src;});
 const inner=s=>s.replace(/<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 const lids={left:'M664 389 Q719 348 773 365 M682 379 L665 351 M753 368 L774 391',right:'M882 308 Q934 266 986 282 M900 297 L881 269 M966 283 L987 307'};
 const closed=side=>'<path fill="none" stroke="#02030b" stroke-width="14" stroke-linecap="square" d="'+lids[side]+'"/>';
 const eyeStates={};
 for(const state of expressions){
  let eyes=inner(masters.eyes),mouth=inner(masters.mouth);
  // Quiet idle: retain V5 iris/ring geometry, relax only the angular black sockets.
  if(state==='neutral'){
   eyes=eyes.replace(/<path id="left-socket"[^>]*\/>/,'<ellipse id="left-socket-rest" cx="718.5" cy="383.5" rx="67" ry="70" transform="rotate(-15 718.5 383.5)" fill="#02030b"/>');
   eyes=eyes.replace(/<path id="right-socket"[^>]*\/>/,'<ellipse id="right-socket-rest" cx="935.5" cy="298" rx="66" ry="70" transform="rotate(-17 935.5 298)" fill="#02030b"/>');
  }
  if(['sleep','happy','smug','wink'].includes(state)){
   for(const side of state==='wink'?['left']:state==='smug'?['right']:['left','right'])eyes=eyes.replace(new RegExp('<g id="'+side+'-eye">[\\s\\S]*?</g>'),closed(side));
  }
  if(state==='curious')eyes=eyes.replace('cx="720"','cx="726"').replace('cx="936"','cx="942"'); // gaze only; sockets and eye spacing stay locked
  if(state==='surprised')eyes=eyes.replace('rx="14.8" ry="16"','rx="19" ry="20"').replace('rx="15.4" ry="16.3"','rx="19.6" ry="20.3"');
  if(['neutral','curious','smug','sleep','wink'].includes(state))mouth='<path fill="none" stroke="#fafbfc" stroke-width="3.8" stroke-linejoin="miter" d="M782 486 L822 463 L842 470 L862 447 L882 454 L929 423"/>';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="510" height="480" viewBox="560 130 510 480">'+inner(masters.mask)+eyes+mouth+'</svg>';
  eyeStates[state]=await load('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
 }
 for(const [id,old]of Object.entries(manifest.frames)){
  const image=await load('file:///'+root+'/base-a-v1/'+old.file),w=image.width,h=image.height;
  const [l,rightEye]=eyePairs[id],dx=rightEye[0]-l[0],dy=rightEye[1]-l[1],den=217*217+85.5*85.5;
  const a=(dx*217-dy*85.5)/den,b=(dy*217+dx*85.5)/den;
  const tx=l[0]-a*718.5+b*383.5,ty=l[1]-b*718.5-a*383.5;
  if(![a,b,tx,ty,...l,...rightEye].every(Number.isFinite))throw Error('Invalid face calibration '+id);
  let f=structuredClone(old.face);
  if(id==='key-0')f={x:100,y:102,w:53,h:31};
  if(id==='key-3')f={x:142,y:103,w:54,h:31};
  const rect={x:Math.max(0,Math.floor(f.x-7)),y:Math.max(0,Math.floor(f.y-8)),w:Math.ceil(f.w+14),h:Math.ceil(f.h+f.w*.48+8)};
  const src=canvas(w,h),sc=src.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);
  const palette=sc.getImageData(0,0,w,h);
  for(let k=0;k<palette.data.length;k+=4){const red=palette.data[k],green=palette.data[k+1],blue=palette.data[k+2];
   if(red>130&&red>green*1.55&&blue<red*.9){palette.data[k+1]=Math.min(255,Math.round(green*.95+5));palette.data[k+2]=Math.round(blue*.62);}
  }sc.putImageData(palette,0,0);
  const before=sc.getImageData(0,0,w,h),original=sc.getImageData(rect.x,rect.y,rect.w,rect.h);
  const variants={};
  for(const state of expressions){
   const patch=canvas(rect.w,rect.h),p=patch.getContext('2d',{willReadFrequently:true});p.fillStyle='#02030b';p.fillRect(0,0,rect.w,rect.h);
   p.setTransform(a,b,-b,a,tx-rect.x,ty-rect.y);p.drawImage(eyeStates[state],560,130,510,480);p.resetTransform();
   const pixels=p.getImageData(0,0,rect.w,rect.h);
   for(let k=0;k<pixels.data.length;k+=4){const r=original.data[k],g=original.data[k+1],blue=original.data[k+2],alpha=original.data[k+3];
    // A1 hair and its violet/cyan edging occlude the new face. Do not redraw hair.
    const hair=r>115&&r>g*1.45||blue>115&&r>65&&g<110;
    const px=k/4%rect.w+rect.x,py=Math.floor(k/4/rect.w)+rect.y;
    const bottom=f.y+f.h,tip=bottom+f.w*.32,cx=(l[0]+rightEye[0])/2;
    const insideJaw=py<=bottom||py<=tip&&Math.abs(px-cx)<(f.w*.6)*(tip-py)/(tip-bottom);
    pixels.data[k+3]=hair||!insideJaw?0:alpha>96?255:alpha;
    if(state==='neutral'&&py>bottom&&py<(bottom+tip)/2&&Math.abs(px-cx)<f.w*.20&&alpha>200&&!hair&&pixels.data[k+3]!==255)throw Error('Old mouth not erased '+id);
   }p.putImageData(pixels,0,0);
   const file='faces/'+id+'-'+state+'.png';files[file]=patch.toDataURL('image/png').split(',')[1];variants[state]=file;
   if(state==='neutral')sc.drawImage(patch,rect.x,rect.y);
  }
  const file='frames/'+id+'.png';files[file]=src.toDataURL('image/png').split(',')[1];
  const after=sc.getImageData(0,0,w,h);let outsideChanges=0,hairChanges=0;
  for(let k=0;k<before.data.length;k+=4){const x=k/4%w,y=Math.floor(k/4/w),r=before.data[k],g=before.data[k+1],blue=before.data[k+2];if(![0,1,2,3].some(j=>Math.abs(before.data[k+j]-after.data[k+j])>1))continue;
   if(x<rect.x||x>=rect.x+rect.w||y<rect.y||y>=rect.y+rect.h)outsideChanges++;
   if(r>115&&r>g*1.45||blue>115&&r>65&&g<110)hairChanges++;
  }
  if(outsideChanges||hairChanges)throw Error('A1 preservation failed '+id);
  preservation[id]={outsideChanges,hairChanges};
  const head={x:(l[0]+rightEye[0])/2,y:(l[1]+rightEye[1])/2};
  const scale=id.startsWith('seat-')?29/Math.hypot(dx,dy)*.803059:old.scale;
  const anchor=id.startsWith('seat-')?{x:head.x+f.w*.15,y:head.y+f.w*2.32}:{...old.anchor,x:id==='key-7'?old.anchor.x:head.x+f.w*.25};
  frames[id]={...old,file,scale,anchor,head,face:{...f,center:head},modelFamily:'design-a-v5-'+old.sheet,facePatch:{...rect,variants},v5Transform:[a,b,-b,a,tx,ty],eyeAnchors:{left:l,right:rightEye},defaultExpression:id==='seat-3'?'sleep':'neutral'};
 }
 return {files,frames,preservation};
}

