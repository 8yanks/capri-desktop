const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../captures/idle-demo-frames');
app.whenReady().then(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const win=new BrowserWindow({width:1280,height:1200,frame:false,show:false,webPreferences:{sandbox:true,backgroundThrottling:false}});
  win.setBounds({x:0,y:0,width:1280,height:1200});
  await win.loadFile(path.join(__dirname,'idle-gallery.html'));
  await win.webContents.executeJavaScript('window.previewReady');
  for(let frame=0;frame<90;frame++){
    await win.webContents.executeJavaScript(`renderGallery(${frame*1000/12})`);
    await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    fs.writeFileSync(path.join(out,`frame${String(frame).padStart(3,'0')}.png`),(await win.webContents.capturePage()).toPNG());
  }
  fs.writeFileSync(path.join(out,'complete.json'),JSON.stringify({frames:90,fps:12}));
  win.destroy();app.quit();
}).catch(e=>{console.error(e.stack);app.exit(1)});
