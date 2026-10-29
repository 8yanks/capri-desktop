const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const walkOnly=process.argv.includes('--walk');
const out=path.resolve(__dirname,'../captures/'+(walkOnly?'walk-frames':'wardrobe-frames'));
app.whenReady().then(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const win=new BrowserWindow({width:1280,height:960,show:false,frame:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
  await win.loadFile(path.join(__dirname,'wardrobe-gallery.html'),{query:walkOnly?{walk:'1'}:{}});await win.webContents.executeJavaScript('window.previewReady');
  let report;
  const fps=walkOnly?25:12,count=walkOnly?144:120;
  for(let frame=0;frame<count;frame++){
    report=await win.webContents.executeJavaScript(`renderWardrobe(${frame*1000/fps})`);
    await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    fs.writeFileSync(path.join(out,`frame${String(frame).padStart(3,'0')}.png`),(await win.webContents.capturePage()).toPNG());
  }
  fs.writeFileSync(path.join(out,'complete.json'),JSON.stringify({frames:count,fps,report},null,2));win.destroy();app.quit();
}).catch(error=>{console.error(error.stack);app.exit(1)});
