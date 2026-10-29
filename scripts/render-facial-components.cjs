const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../captures/facial-components-v1');
app.whenReady().then(async()=>{
 fs.mkdirSync(out,{recursive:true});const win=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
 await win.loadFile(path.join(__dirname,'facial-components-review.html'));const report=await win.webContents.executeJavaScript('ready');if(report.components!==18)throw Error('Incomplete facial set');
 fs.writeFileSync(path.join(out,'components-review.png'),Buffer.from(await win.webContents.executeJavaScript('componentSheet()'),'base64'));fs.writeFileSync(path.join(out,'review-report.json'),JSON.stringify(report));win.destroy();app.quit();
}).catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'review-error.txt'),e.stack);app.exit(1)});
