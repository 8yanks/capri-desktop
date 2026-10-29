// Independent mouth drawings traced in the approved V5 reference coordinates.
// Never deform the eyes or rebuild the face to move the mouth.
export function mouthCels(frame,parts){
  const closed=parts.neutral.mouth,open=parts.talk.mouth;
  const half=document.createElement('canvas');half.width=closed.width;half.height=closed.height;
  const ctx=half.getContext('2d',{willReadFrequently:true});ctx.drawImage(closed,0,0);
  const data=ctx.getImageData(0,0,half.width,half.height);
  for(let k=0;k<data.data.length;k+=4){const p=data.data;
    if(p[k+3]&&p[k]>190&&p[k+1]>190&&p[k+2]>190){p[k]=2;p[k+1]=3;p[k+2]=11;}
  }
  ctx.putImageData(data,0,0);
  const [a,b,c,d,x,y]=frame.v5Transform,p=frame.facePatch;
  ctx.setTransform(a,b,c,d,x-p.x,y-p.y);ctx.fillStyle='#fafbfc';
  ctx.fill(new Path2D('M786 485 L832 449 L853 457 L870 434.5 L892 441.5 L945 404 L912 466 L868 477 L829 484Z'));
  // Keep exactly the original lower-face footprint, including rotated/profile poses.
  ctx.resetTransform();ctx.globalCompositeOperation='destination-in';ctx.drawImage(closed,0,0);
  return [closed,half,open];
}
