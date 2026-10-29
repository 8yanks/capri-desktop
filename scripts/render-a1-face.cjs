const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../captures/a1-face-motion');
app.whenReady().then(async()=>{
 fs.mkdirSync(path.join(out,'frames'),{recursive:true});const errors=[];
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message);});
 await win.loadFile(path.join(__dirname,'a1-face-preview.html'));await win.webContents.executeJavaScript('ready');
 const report=await win.webContents.executeJavaScript('(()=>{try{return a1Check();}catch(e){return {error:e.message};}})()');if(report.error)throw Error(report.error);
 for(const [name,time,guides]of [['neutral',0,false],['blink',2120,false],['speech',3300,false],['landmarks',0,true]]){
   const data=await win.webContents.executeJavaScript(`a1Frame(${time},${guides})`);fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data,'base64'));
 }
 const layers=await win.webContents.executeJavaScript('a1Layers()');const asset=path.resolve(__dirname,'../assets/capri/a1-face-preview');fs.mkdirSync(asset,{recursive:true});
 for(const [name,p]of Object.entries(layers)){fs.writeFileSync(path.join(asset,name+'.png'),Buffer.from(p.png,'base64'));delete p.png;}
 fs.writeFileSync(path.join(asset,'landmarks.json'),JSON.stringify({version:1,source:'../base-a-v1/frames/key-0.png',status:'single-pose-preview',parts:layers},null,2));
 for(let i=0;i<120;i++){const data=await win.webContents.executeJavaScript(`a1Frame(${i*50},false)`);fs.writeFileSync(path.join(out,'frames',String(i).padStart(4,'0')+'.png'),Buffer.from(data,'base64'));}
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors,frames:120,fps:20},null,2));win.destroy();app.quit();
}).catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)});
