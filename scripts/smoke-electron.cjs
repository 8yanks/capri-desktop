// Run with: node_modules/.bin/electron scripts/smoke-electron.cjs
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.resolve(__dirname,'../logs');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'capri-cloud-smoke-')));
process.env.CAPRI_PORT='47829';process.argv.push('--dev','--chat');
const errors=[],warnings=[];process.on('uncaughtException',error=>{errors.push(error.stack);finish(1);});
process.on('unhandledRejection',error=>{errors.push(String(error?.stack||error));finish(1);});
app.on('browser-window-created',(_,win)=>{
  win.on('show',()=>win.hide());
  win.webContents.on('console-message',(event,level,message)=>{if(event.level==='error'||level>=3)errors.push(event.message||message);else if(event.level==='warning'||level===2)warnings.push(event.message||message);});
  win.webContents.on('render-process-gone',(_,details)=>errors.push('Renderer stopped: '+details.reason));
});
let finished=false;
function finish(code){if(finished)return;finished=true;fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify({errors,warnings},null,2));app.exit(code);}
require('../src/main/main');
app.whenReady().then(()=>setTimeout(async()=>{
  try{const windows=BrowserWindow.getAllWindows();if(windows.length<2)throw Error('Overlay and conversation were not created: '+windows.map(win=>win.getTitle()).join(','));
    for(const win of windows){const check=await win.webContents.executeJavaScript('({title:document.title,body:document.body.innerText.slice(0,160),canvases:document.querySelectorAll("canvas").length})');
      if(check.title==='Capri'){
        const debug=await win.webContents.executeJavaScript('window.__capriDebug?.()');
        if(!debug?.illustrated?.loaded||debug.illustrated.frames!==(60+Object.keys(JSON.parse(fs.readFileSync(path.join(root,'assets/capri/sprite-production-v2/frames.json'),'utf8')).frames).length))throw Error('Illustrated library was not initialized: '+JSON.stringify(debug?.illustrated));
        check.illustrated=debug.illustrated;
      }
      fs.writeFileSync(path.join(out,'window-'+win.id+'.json'),JSON.stringify(check));
      if(check.body.includes('PROJECT CAPRICORN')&&win.isVisible())fs.writeFileSync(path.join(out,'conversation.png'),(await win.webContents.capturePage()).toPNG());}
    finish(errors.length?1:0);
  }catch(error){errors.push(error.stack);finish(1);}
},15000));
