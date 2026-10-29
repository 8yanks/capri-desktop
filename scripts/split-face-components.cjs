// Mechanical grid extraction only; generated pixels and alpha are preserved.
const {app,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {alphaBounds}=require('./sprite-analysis.cjs');
const names={eyes:['neutral','half','closed','excited','suspicious','wink'],mouth:['neutral','speech-small','speech-open','grin','smirk','laugh']};
// Optical centres, not the centre of the protruding black socket silhouette.
const eyeCentres=[[[155,292],[394,292]],[[657,292],[888,292]],[[1154,292],[1385,292]],[[155,754],[394,754]],[[657,754],[888,754]],[[1154,754],[1385,754]]];
app.whenReady().then(()=>{
 const root=path.resolve(__dirname,'../assets/capri/facial-components-v1'),frames={},report={};
 for(const type of ['eyes','mouth']){
   const image=nativeImage.createFromPath(path.join(root,type+'-sheet.png')),{width,height}=image.getSize();
   if(!width||!height)throw Error('Missing '+type+' sheet');
   let transparent=0;const pixels=image.toBitmap();for(let i=3;i<pixels.length;i+=4)if(!pixels[i])transparent++;
   if(transparent<width*height*.3)throw Error('Expected transparent components: '+type);
   report[type]={width,height,transparentPixels:transparent};
   for(let i=0;i<6;i++){
     const cell={x:Math.round(i%3*width/3),y:Math.round(Math.floor(i/3)*height/2),width:Math.round((i%3+1)*width/3)-Math.round(i%3*width/3),height:Math.round((Math.floor(i/3)+1)*height/2)-Math.round(Math.floor(i/3)*height/2)};
     const parts=type==='eyes'?['leftEye','rightEye']:['mouth'];
     for(const [j,part]of parts.entries()){
       const half=type==='eyes'?{x:cell.x+Math.round(j*cell.width/2),y:cell.y,width:Math.round((j+1)*cell.width/2)-Math.round(j*cell.width/2),height:cell.height}:cell;
       const source=image.crop(half),rect=alphaBounds(source.toBitmap(),half.width,half.height);if(!rect)throw Error('Empty '+part+' '+i);
       if(rect.x===0||rect.y===0||rect.x+rect.w===half.width||rect.y+rect.h===half.height)throw Error('Component touches grid boundary '+part+' '+i);
       const pad=3,x=Math.max(0,rect.x-pad),y=Math.max(0,rect.y-pad),w=Math.min(half.width-x,rect.w+rect.x-x+pad),h=Math.min(half.height-y,rect.h+rect.y-y+pad);
       const id=part+'-'+names[type][i],file=id+'.png',sprite=source.crop({x,y,width:w,height:h});fs.writeFileSync(path.join(root,file),sprite.toPNG());
       const anchor=type==='eyes'?{x:eyeCentres[i][j][0]/1536*width-half.x-x,y:eyeCentres[i][j][1]/1024*height-half.y-y}:{x:w/2,y:h/2};
       if(anchor.x<0||anchor.y<0||anchor.x>w||anchor.y>h)throw Error('Invalid optical anchor '+id);
       frames[id]={file,part,state:names[type][i],source:type+'-sheet.png',sourceRect:{x:half.x+x,y:half.y+y,w,h},anchor};
     }
   }
 }
 fs.writeFileSync(path.join(root,'frames.json'),JSON.stringify({version:1,status:'review-only',coordinates:'individual image pixels; viewer-left/right before mirroring',frames},null,2));
 fs.writeFileSync(path.join(root,'extraction-report.json'),JSON.stringify(report,null,2));app.quit();
}).catch(e=>{const out=path.resolve(__dirname,'../../captures/facial-components-v1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)});
