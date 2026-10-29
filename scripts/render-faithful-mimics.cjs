const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../captures/faithful-mimics-v2');
app.whenReady().then(async()=>{
 fs.mkdirSync(path.join(root,'frames'),{recursive:true});const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
 await win.loadFile(path.join(__dirname,'faithful-mimics-preview.html'));await win.webContents.executeJavaScript('ready');
 const report=await win.webContents.executeJavaScript('(()=>{try{return mimicChecks();}catch(e){return {error:e.message};}})()');if(report.error)throw Error(report.error);
 for(const [file,time,debug]of [['contexts',0,false],['anchors',0,true],['blink',3670,false]]){const png=await win.webContents.executeJavaScript(`mimicFrame(${time},${debug})`);fs.writeFileSync(path.join(root,file+'.png'),Buffer.from(png,'base64'));}
 for(let i=0;i<120;i++){const png=await win.webContents.executeJavaScript(`mimicFrame(${i*50},false)`);fs.writeFileSync(path.join(root,'frames',String(i).padStart(4,'0')+'.png'),Buffer.from(png,'base64'));}
 fs.writeFileSync(path.join(root,'qa-report.json'),JSON.stringify({...report,frames:120,fps:20},null,2));win.destroy();app.quit();
}).catch(e=>{fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'render-error.txt'),e.stack);app.exit(1)});
