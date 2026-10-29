const {app,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {alphaBounds}=require('./sprite-analysis.cjs');
const states={eyes:['normal','closed','wink','curious','happy','focused'],mouth:['neutral','small','open','laugh','smirk','surprised']};
function optical(image){
 const {width:w,height:h}=image.getSize(),p=image.toBitmap();let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(p[i+3]>160&&p[i+1]>100&&p[i+1]>p[i+2]*1.8&&p[i+1]>p[i]*1.15){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
 return x1>=0?{x:(x0+x1)/2,y:y1-(x1-x0)/2,diameter:x1-x0+1}:{x:w/2,y:h*.6};
}
app.whenReady().then(()=>{
 const root=path.resolve(__dirname,'../assets/capri/faithful-mimics-v2'),frames={},report={};
 for(const type of ['eyes','mouth']){
   const sheet=nativeImage.createFromPath(path.join(root,type+'-sheet.png')),{width,height}=sheet.getSize();let clear=0;const raw=sheet.toBitmap();for(let i=3;i<raw.length;i+=4)if(!raw[i])clear++;if(clear<width*height*.3)throw Error('Missing transparency: '+type);
   report[type]={width,height,transparentPixels:clear};
   for(let i=0;i<6;i++)for(let part=0;part<(type==='eyes'?2:1);part++){
     const col=i%3,row=Math.floor(i/3),cols=type==='eyes'?6:3,k=type==='eyes'?col*2+part:col;
     const rect={x:Math.round(k*width/cols),y:Math.round(row*height/2),width:Math.round((k+1)*width/cols)-Math.round(k*width/cols),height:Math.round((row+1)*height/2)-Math.round(row*height/2)};
     const cell=sheet.crop(rect),b=alphaBounds(cell.toBitmap(),rect.width,rect.height);if(!b)throw Error('Empty component '+type+'/'+i+'/'+part);
     if(!b.x||!b.y||b.x+b.w>=rect.width||b.y+b.h>=rect.height)throw Error('Component crosses cell '+type+'/'+i+'/'+part);
     const pad=3,x=Math.max(0,b.x-pad),y=Math.max(0,b.y-pad),w=Math.min(rect.width-x,b.w+b.x-x+pad),h=Math.min(rect.height-y,b.h+b.y-y+pad),sprite=cell.crop({x,y,width:w,height:h});
     const name=type==='eyes'?(part?'rightEye':'leftEye'):'mouth',state=states[type][i],id=name+'-'+state,file=id+'.png';
     const anchor=type==='eyes'?optical(sprite):{x:w/2,y:['neutral','smirk'].includes(state)?h/2:h*.12};
     fs.writeFileSync(path.join(root,file),sprite.toPNG());frames[id]={file,part:name,state,anchor,source:type+'-sheet.png',sourceRect:{x:rect.x+x,y:rect.y+y,w,h}};
   }
 }
 if(Object.keys(frames).length!==18)throw Error('Incomplete set');fs.writeFileSync(path.join(root,'frames.json'),JSON.stringify({version:1,status:'context-preview',frames},null,2));fs.writeFileSync(path.join(root,'build-report.json'),JSON.stringify(report,null,2));app.quit();
}).catch(e=>{const root=path.resolve(__dirname,'../../captures/faithful-mimics-v2');fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'build-error.txt'),e.stack);app.exit(1)});
