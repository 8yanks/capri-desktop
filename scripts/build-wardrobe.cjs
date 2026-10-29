const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const binary=require('electron'),root=path.resolve(__dirname,'..'),builder=path.join(__dirname,'build-pose-manifest.cjs');
const commands=[['--actions'],...fs.readdirSync(path.join(root,'assets/capri/wardrobe-v2'),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>['--costume='+e.name])];
for(const args of commands){const result=spawnSync(binary,[builder,"--facefix",...args],{cwd:root,windowsHide:true,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
