const {app,BrowserWindow,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../captures/face-review-a2');
app.whenReady().then(async()=>{
 fs.mkdirSync(out,{recursive:true});const errors=[];
 const win=new BrowserWindow({width:1200,height:1000,useContentSize:true,show:false,frame:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
 win.webContents.on('console-message',(_e,_level,message)=>{if(message.includes('Error'))errors.push(message);});
 await win.loadFile(path.join(__dirname,'face-review.html'));await win.webContents.executeJavaScript('ready');
 const report=await win.webContents.executeJavaScript('faceReviewAt(400,true)');await new Promise(r=>setTimeout(r,150));
 fs.writeFileSync(path.join(out,'landmarks-and-expressions.png'),Buffer.from(await win.webContents.executeJavaScript('faceSheet(true)'),'base64'));
 await win.webContents.executeJavaScript('faceReviewAt(400,false)');await new Promise(r=>setTimeout(r,150));
 fs.writeFileSync(path.join(out,'expressions.png'),Buffer.from(await win.webContents.executeJavaScript('faceSheet(false)'),'base64'));
 for(const part of ['leftEye','rightEye','mouth']){const data=await win.webContents.executeJavaScript('faceLayer('+JSON.stringify(part)+')');fs.writeFileSync(path.resolve(__dirname,'../assets/capri/face-prototype-a2/'+part+'.png'),Buffer.from(data,'base64'));}
 const image=nativeImage.createFromPath(path.resolve(__dirname,'../assets/capri/face-prototype-a2/body.png')),pixels=image.toBitmap();
 let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;
 report.transparentPixels=transparent;report.totalPixels=pixels.length/4;report.errors=errors;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 if(errors.length)throw Error(errors.join('\n'));win.destroy();app.quit();
}).catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)});
