const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../captures/scene-audit');
app.whenReady().then(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const win=new BrowserWindow({width:1280,height:1080,useContentSize:true,show:false,frame:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
 await win.loadFile(path.join(__dirname,'scene-audit.html'));await win.webContents.executeJavaScript('ready');
 const matrix=await win.webContents.executeJavaScript('auditMatrix()');
 for(let i=0;i<4;i++){await win.webContents.executeJavaScript('auditSeats('+i+')');await new Promise(r=>setTimeout(r,120));fs.writeFileSync(path.join(out,'seated-'+i+'.png'),(await win.webContents.capturePage()).toPNG());}
 for(const name of ['gaze','uplink','dive','fold','point','victory','split','spin','fall']){await win.webContents.executeJavaScript('auditScene('+JSON.stringify(name)+')');await new Promise(r=>setTimeout(r,120));fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 await win.webContents.executeJavaScript('auditCompare()');await new Promise(r=>setTimeout(r,120));fs.writeFileSync(path.join(out,'comparison.png'),(await win.webContents.capturePage({x:0,y:0,width:1000,height:360})).toPNG());
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(matrix,null,2));win.destroy();app.quit();
}).catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'error.txt'),e.stack);app.exit(1)});
