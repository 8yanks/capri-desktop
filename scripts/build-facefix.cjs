// Rebuild all corrected artwork before activating it in the runtime.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),binary=require('electron');
const ids=['netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'];
const groups=[{folder:'poses-v3',count:44,args:[]},{folder:'actions-v2',count:8,args:['--actions']},...ids.map(id=>({folder:'wardrobe-v2/'+id,count:16,args:['--costume='+id]})),...['default',...ids].map(id=>({folder:'walk-v2/'+id,count:8,args:['--walk='+id]}))];
for(const group of groups){
  const result=spawnSync(binary,[path.join(__dirname,'build-pose-manifest.cjs'),'--facefix',...group.args],{cwd:root,windowsHide:true,stdio:'inherit'});
  if(result.status!==0)throw Error('Sprite extraction failed: '+group.folder);
  const folder=path.join(root,'assets/capri',group.folder),manifest=JSON.parse(fs.readFileSync(path.join(folder,'frames.json'),'utf8'));
  if(Object.keys(manifest.frames).length!==group.count)throw Error('Missing cels: '+group.folder);
  for(const [id,frame] of Object.entries(manifest.frames)){
    const sheet=manifest.sheets[frame.sheet],r=frame.rect;
    if(r.x<=0||r.y<=0||r.x+r.w>=sheet.width||r.y+r.h>=sheet.height)throw Error('Source edge clipping: '+group.folder+'/'+id);
    if(!frame.face||frame.face.w<8||frame.face.h<6)throw Error('Review mask landmark: '+group.folder+'/'+id);
  }
  if(group.folder.startsWith('walk-v2/')){
    const separation=index=>{const gait=manifest.frames['walk-'+index].gait;if(!gait?.green||!gait?.pink)throw Error('Both colored legs required: '+group.folder+'/'+index);return gait.green.x-gait.pink.x;};
    const first=separation(0),opposite=separation(4),stride=Math.max(Math.abs(first),Math.abs(opposite));
    if(first<=0||opposite>=0)throw Error('Leg contacts do not alternate: '+group.folder);
    for(const index of [2,6])if(Math.abs(separation(index))>=stride*.65)throw Error('Missing passing pose: '+group.folder+'/'+index);
  }
}
for(const script of ['build-keyposes.cjs','build-seated.cjs']){const result=spawnSync(binary,[path.join(__dirname,script)],{cwd:root,windowsHide:true,stdio:'inherit'});if(result.status!==0)throw Error('Sprite extraction failed: '+script);}
console.log('Built core/reference sheets, walks and shared-model seated/action cels. Visual review is still required.');
