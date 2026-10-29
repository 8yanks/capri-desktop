'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src/renderer/js');
globalThis.document??={createElement:()=>({style:{},getContext:()=>new Proxy({},{get:(_,name)=>name==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):()=>{}})})};
globalThis.window??={devicePixelRatio:1};
const cache=new Map();
function source(name){
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep))throw Error('Unexpected renderer import');
  return fs.readFileSync(file,'utf8').replace(/(from\s*)['"]\.\/([^'"]+)['"]/g,(_,prefix,dependency)=>prefix+JSON.stringify(url(dependency)));
}
function url(name){if(!cache.has(name))cache.set(name,'data:text/javascript;base64,'+Buffer.from(source(name)).toString('base64'));return cache.get(name);}
module.exports={source,url};
