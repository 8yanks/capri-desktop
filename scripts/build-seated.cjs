// Mechanical extraction of the reviewed, anatomically corrected four-cel seat sheets.
const {app,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {faceLandmark,bodyComponents}=require('./sprite-analysis.cjs');
app.whenReady().then(()=>{
 const root=path.resolve(__dirname,'../assets/capri/seated-v1');
 const model=JSON.parse(fs.readFileSync(path.join(root,'../model-metrics.json')));
 const master=nativeImage.createFromPath(path.join(root,'default/poses.png')),ms=master.getSize(),mp=bodyComponents(master.toBitmap(),ms.width,ms.height,4,2)[0];
 const mf=faceLandmark(master.crop({x:mp.x,y:mp.y,width:mp.w,height:mp.h}).toBitmap(),mp.w,mp.h);
 const seatScale=model.faceWidth/mf.w;
 for(const id of fs.readdirSync(root)){
  const folder=path.join(root,id);if(!fs.existsSync(path.join(folder,'poses.png')))continue;
  const image=nativeImage.createFromPath(path.join(folder,'poses.png')),size=image.getSize(),frames={};
  fs.mkdirSync(path.join(folder,'frames'),{recursive:true});
  const pieces=bodyComponents(image.toBitmap(),size.width,size.height,4,2);if(pieces.length!==4)throw Error('Expected four separate bodies '+id);
  for(let index=0;index<4;index++){
   const bounds=pieces[index];
   const crop=image.crop({x:bounds.x,y:bounds.y,width:bounds.w,height:bounds.h}),bitmap=crop.toBitmap();
   const face=faceLandmark(bitmap,bounds.w,bounds.h);if(!face)throw Error('Missing face '+id+'/'+index);
   const feet={green:{min:bounds.w,max:0,n:0,xs:[]},pink:{min:bounds.w,max:0,n:0,xs:[]}};
   for(let y=Math.floor(bounds.h*.82);y<bounds.h;y++)for(let x=0;x<bounds.w;x++){
    const i=(y*bounds.w+x)*4,a=bitmap[i+3];if(a<160)continue;
    const r=bitmap[i+2]*255/a,g=bitmap[i+1]*255/a,b=bitmap[i]*255/a;
    const color=g>120&&g>r*1.8&&g>b*1.3?'green':r>150&&r>g*2&&b>30?'pink':null;
    if(color){feet[color].min=Math.min(feet[color].min,x);feet[color].max=Math.max(feet[color].max,x);feet[color].n++;feet[color].xs.push(x);}
   }
   for(const color of Object.values(feet)){color.xs.sort((a,b)=>a-b);color.coreMin=color.xs[Math.floor(color.n*.1)];color.coreMax=color.xs[Math.floor(color.n*.9)];delete color.xs;}
   if(feet.green.n<20||feet.pink.n<20||feet.green.coreMax>=feet.pink.coreMin)throw Error('Mixed or missing foot colors '+id+'/'+index+' '+JSON.stringify(feet));
   const unit=mf.w*size.width/ms.width;
   const anchor={x:face.center.x+unit*.3,y:face.center.y+unit*2.7};
   if(anchor.x>bounds.w||anchor.y>bounds.h)throw Error('Seat contact outside body '+id+'/'+index);
   const file='frames/seat-'+index+'.png';fs.writeFileSync(path.join(folder,file),crop.toPNG());
   frames['seat-'+index]={file,sheet:'seat',rect:{x:bounds.x,y:bounds.y,w:bounds.w,h:bounds.h},face,head:face.center,anchor,support:'hip',scale:seatScale*ms.width/size.width,modelFamily:'canonical-seat',feet};
  }
  fs.writeFileSync(path.join(folder,'frames.json'),JSON.stringify({version:1,sheets:{seat:{file:'poses.png',...size}},frames},null,2));
 }
 app.quit();
}).catch(e=>{fs.writeFileSync(path.resolve(__dirname,'../logs/build-seated-error.txt'),e.stack);console.error(e);app.exit(1)});
