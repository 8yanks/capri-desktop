'use strict';
// Mechanical alpha-component extraction: preserve original artwork, isolate neighbouring cels.
const { app, nativeImage } = require('electron');
const fs = require('node:fs'), path = require('node:path');
const {faceLandmark}=require('./sprite-analysis.cjs');
const facefix=process.argv.includes('--facefix');
const rough=process.argv.includes('--v2')||facefix;
const extra=process.argv.includes('--actions');
const costume=process.argv.find(value=>value.startsWith('--costume='))?.slice(10);
const walk=process.argv.find(value=>value.startsWith('--walk='))?.slice(7);
if(costume&&!['netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'].includes(costume))throw Error('Unknown costume');
if(walk&&!['default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'].includes(walk))throw Error('Unknown walking outfit');
const modern=extra||!!costume||facefix;
const folder = path.resolve(__dirname, '../assets/capri/'+(walk?'walk-v2/'+walk:costume?(facefix?'wardrobe-v2/':'wardrobe-v1/')+costume:extra?(facefix?'actions-v2':'actions-v1'):rough?(facefix?'poses-v3':'poses-v2'):'poses-v1'));
let config = walk ? [{name:'walk',rowCount:2,cols:4,count:8}] : costume ? [{name:'poses',rowCount:4,cols:4,count:16}] : extra ? [{name:'extra',rowCount:2,cols:4,count:8}] : facefix ? [
  {name:'transitions',rowCount:4,cols:4,count:16}, {name:'gestures',rowCount:3,cols:4,count:12},
  {name:'activities',rowCount:2,cols:4,count:8}, {name:'seated',rowCount:2,cols:4,count:8},
] : rough ? [
  {name:'transitions',rows:[0,320,540,710,1024],cols:4,count:16},
  {name:'gestures',rowCount:3,cols:4,count:12},
  {name:'activities',rowCount:2,cols:4,count:8},
  {name:'seated',rowCount:2,cols:4,count:8},
] : [
  { name: 'transitions', rows: [0,400,690,930,1254], cols: 4, count: 16, referenceHeight: 365 },
  { name: 'gestures', rows: [0,350,685,1005,1254], cols: 4, count: 12, referenceHeight: 335 },
  { name: 'activities', rows: null, cols: 4, count: 8, referenceHeight: 440 },
  { name: 'seated', rows: null, cols: 4, count: 8, referenceHeight: 610 },
];
const sheet=process.argv.find(value=>value.startsWith('--sheet='))?.slice(8);
if(sheet){config=config.filter(source=>source.name===sheet);if(!config.length)throw Error('Unknown sheet');}
if(!facefix&&costume==='stage'&&fs.existsSync(path.join(folder,'repair.png')))config.push({name:'repair',rowCount:1,cols:1,count:1,targetHeight:454,outputKey:'poses-12'});
function components(pixels,width,height,threshold=96) {
  const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),out=[];
  for(let start=0;start<seen.length;start++) {
    if(seen[start]||pixels[start*4+3]<threshold)continue;
    let head=0,tail=1,minX=width,minY=height,maxX=0,maxY=0;queue[0]=start;seen[start]=1;
    while(head<tail) {
      const p=queue[head++],x=p%width,y=Math.floor(p/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      const neighbours=[x>0?p-1:-1,x+1<width?p+1:-1,y>0?p-width:-1,y+1<height?p+width:-1];
      for(const n of neighbours)if(n>=0&&!seen[n]&&pixels[n*4+3]>=threshold){seen[n]=1;queue[tail++]=n;}
    }
    if(tail>1500)out.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,points:Int32Array.from(queue.subarray(0,tail))});
  }
  return out;
}
function shinLandmarks(pixels,width,height){
  const colors={green:{x:0,y:0,count:0},pink:{x:0,y:0,count:0}};
  for(let y=Math.floor(height*.68);y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,a=pixels[i+3];if(a<160)continue;
    const r=pixels[i+2]*255/a,g=pixels[i+1]*255/a,b=pixels[i]*255/a;
    const color=g>120&&g>r*1.7&&g>b*1.3?'green':r>150&&r>g*2&&b>30?'pink':null;
    if(color){colors[color].x+=x;colors[color].y+=y;colors[color].count++;}
  }
  return Object.fromEntries(Object.entries(colors).map(([color,sum])=>[color,sum.count?{x:sum.x/sum.count,y:sum.y/sum.count,pixels:sum.count}:null]));
}
app.whenReady().then(() => {
  const frames = {}, sheets = {}, report = [];
  fs.mkdirSync(path.join(folder,'frames'),{recursive:true});
  for (const source of config) {
    const image = nativeImage.createFromPath(path.join(folder, source.name + '.png'));
    const { width, height } = image.getSize();
    if (!width || !height) throw Error('Invalid pose sheet: ' + source.name);
    const pixels = image.toBitmap();
    let transparent = 0;
    for (let i=3;i<pixels.length;i+=4) if (pixels[i]<128) transparent++;
    const ratio = transparent / (width*height);
    report.push({ sheet: source.name, width, height, transparentFraction: ratio });
    sheets[source.name] = { file: source.name + '.png', width, height };
    if (ratio < .1) { report.at(-1).rejected = 'opaque background'; continue; }
    const rows = source.rows || Array.from({length:(source.rowCount||2)+1},(_,i)=>Math.round(height*i/(source.rowCount||2)));
    const cellWidth = width/source.cols;
    const pieces=components(pixels,width,height),used=new Set();
    const referenceHeight=source.referenceHeight||Math.max(...pieces.map(piece=>piece.h))*(source.name==='seated'?1.25:1);
    const ordered=modern?pieces.slice().sort((a,b)=>b.points.length-a.points.length).slice(0,source.count).sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)):null;
    if(ordered)for(let row=0;row<source.count/source.cols;row++)ordered.splice(row*source.cols,source.cols,...ordered.slice(row*source.cols,(row+1)*source.cols).sort((a,b)=>a.x+a.w/2-b.x-b.w/2));
    report.at(-1).largeComponents=pieces.length;
    for (let index=0;index<source.count;index++) {
      const col = index%source.cols, row = Math.floor(index/source.cols);
      const x0=Math.floor(col*cellWidth),x1=Math.floor((col+1)*cellWidth),y0=rows[row],y1=rows[row+1];
      const piece=ordered?.[index]||pieces.filter(p=>!used.has(p)&&p.x+p.w/2>=x0&&p.x+p.w/2<x1&&p.y>=y0-20&&p.y<y1-25)
        .sort((a,b)=>b.points.length-a.points.length)[0];
      if(!piece){(report.at(-1).missing||=[]).push(index);continue;}used.add(piece);
      const scale=source.targetHeight?source.targetHeight/piece.h:costume?(index<4?420/Math.max(...ordered.slice(0,4).map(p=>p.h)):index<8?336/Math.max(...ordered.slice(4,8).map(p=>p.h)):index<12?420/Math.max(...ordered.slice(8,12).map(p=>p.h)):index===12?454/piece.h:index===13?290/piece.h:index===14?420/piece.h:462/piece.w):420/referenceHeight;
      const {x,y,w,h}=piece;
      const isolated=Buffer.alloc(w*h*4);
      if(rough||modern){
        // Preserve internal dropout islands and detached marks inside this silhouette's own bounds.
        for(let py=0;py<h;py++)pixels.copy(isolated,py*w*4,((y+py)*width+x)*4,((y+py)*width+x+w)*4);
      }else for(const p of piece.points){const dest=((Math.floor(p/width)-y)*w+(p%width-x))*4;pixels.copy(isolated,dest,p*4,p*4+4);}
      const key=source.outputKey||source.name+'-'+index;
      const file=`frames/${key}.png`;
      fs.writeFileSync(path.join(folder,file),nativeImage.createFromBitmap(isolated,{width:w,height:h}).toPNG());
      let contactSum=0,contactCount=0;
      for(let py=y+h-8;py<y+h;py++)for(let px=x;px<x+w;px++)if(pixels[(py*width+px)*4+3]>160){contactSum+=px-x;contactCount++;}
      const reclining = costume?index===15:source.name==='transitions' && index>=6 && index<=11;
      const seated=source.name==='seated'||(extra&&index>=6)||(costume&&index>=4&&index<=7);
      const measured=facefix?faceLandmark(isolated,w,h,{lying:reclining}):null;
      const head=measured?.center||{x:w*(reclining?.3:.52),y:h*(reclining?.5:.36)};
      // Walking pivots around the torso, not whichever toe is furthest forward.
      const floorX=walk&&measured?measured.center.x:contactCount?contactSum/contactCount:w/2;
      frames[key]={file,sheet:source.name,rect:{x,y,w,h},anchor:seated?{x:w*.52,y:h*.66}:{x:floorX,y:h},
        support:seated?'hip':'floor',head,scale,...(facefix?{face:measured}:{}),...(walk?{gait:shinLandmarks(isolated,w,h)}:{})};
    }
  }
  fs.writeFileSync(path.join(folder,'pixel-report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(folder,'frames.json'),JSON.stringify({version:1,sheets,frames},null,2));
  app.quit();
}).catch(e=>{fs.writeFileSync(path.join(folder,'build-error.txt'),String(e.stack));app.exit(1)});
