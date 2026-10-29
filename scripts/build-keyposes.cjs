const {app,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {faceLandmark,bodyComponents}=require('./sprite-analysis.cjs');
app.whenReady().then(()=>{
 const root=path.resolve(__dirname,'../assets/capri/keyposes-v1');
 const master=nativeImage.createFromPath(path.join(root,'default/poses.png')),ms=master.getSize(),mp=bodyComponents(master.toBitmap(),ms.width,ms.height,8,4)[0];
 const mf=faceLandmark(master.crop({x:mp.x,y:mp.y,width:mp.w,height:mp.h}).toBitmap(),mp.w,mp.h);
 const model={version:1,keyWidth:ms.width,keyScale:420/mp.h,faceWidth:mf.w*420/mp.h};
 fs.writeFileSync(path.join(root,'../model-metrics.json'),JSON.stringify(model,null,2));
 for(const id of fs.readdirSync(root)){
  const folder=path.join(root,id);if(!fs.existsSync(path.join(folder,'poses.png')))continue;
  const image=nativeImage.createFromPath(path.join(folder,'poses.png')),size=image.getSize(),frames={};
  const pieces=bodyComponents(image.toBitmap(),size.width,size.height,8,4);if(pieces.length!==8)throw Error('Expected eight separate bodies '+id);
  fs.mkdirSync(path.join(folder,'frames'),{recursive:true});
  for(let i=0;i<8;i++){
   const r=pieces[i],crop=image.crop({x:r.x,y:r.y,width:r.w,height:r.h}),bitmap=crop.toBitmap();
   const face=faceLandmark(bitmap,r.w,r.h,{lying:i===7});if(!face)throw Error('Missing face '+id+'/'+i);
   const file='frames/key-'+i+'.png';fs.writeFileSync(path.join(folder,file),crop.toPNG());
   let sum=0,count=0;for(let y=r.h-8;y<r.h;y++)for(let x=0;x<r.w;x++)if(bitmap[(y*r.w+x)*4+3]>160){sum+=x;count++;}
   frames['key-'+i]={file,sheet:'key',rect:{x:r.x,y:r.y,w:r.w,h:r.h},face,head:face.center,anchor:{x:count?sum/count:r.w/2,y:r.h},support:'floor',scale:420/pieces[0].h,modelFamily:'canonical-key'};
  }
  fs.writeFileSync(path.join(folder,'frames.json'),JSON.stringify({version:1,sheets:{key:{file:'poses.png',...size}},frames},null,2));
 }
 app.quit();
}).catch(e=>{fs.writeFileSync(path.resolve(__dirname,'../logs/build-keyposes-error.txt'),e.stack);app.exit(1)});
