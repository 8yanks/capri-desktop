// One render palette; the approved source cels remain unchanged on disk.
export const ROSE = '#ff084d';
export const STANDING_HEIGHT = 420;

export function rosePixels(pixels) {
  for (let i=0;i<pixels.length;i+=4) {
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    if (pixels[i+3] && r>=80 && r>g*1.5 && r>b*1.05 && g<r*.7)
      pixels[i+2]=Math.round(g+(r-g)*.27);
    else if(pixels[i+3] && g>=90 && g>r*1.7 && g>b*1.5)
      pixels[i+2]=Math.round(r+(g-r)*.36);
  }
  return pixels;
}

export function roseImage(image) {
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  const pixels=g.getImageData(0,0,canvas.width,canvas.height);
  rosePixels(pixels.data);g.putImageData(pixels,0,0);return canvas;
}

export function normalizeActionSizes(frames) {
  const height=f=>f.bounds?f.bounds.bottom-f.bounds.top+1:f.image?.height;
  const standing=/^(?:key-[0-3]|idle-\d+|greet-\d+|guide-\d+|react-[0-3]|rest-0|phase-0|airborne-7)$/;
  for(const [id,f] of Object.entries(frames)) {
    f.sourceScale??=f.scale;
    if(standing.test(id) && height(f)>0)f.scale=STANDING_HEIGHT/height(f);
  }
  // Bent knees and horizontal bodies have a shorter bounding box, not a smaller
  // character. Match the amount of drawn body to the normal idle. Hair/pose overlap
  // can change its apparent outline, so keep phase collapse and the approved gait separate.
  const reference=frames['idle-0']||frames['key-0'];
  const area=reference?.opaquePixels*reference?.scale**2;
  if(area>0)for(const [id,f]of Object.entries(frames)){
    if(/^(?:airborne-[0-6]|rest-[1-5]|react-[4-7]|possession-\d+|key-[4-7])$/.test(id)&&f.opaquePixels>0){
      f.scale=Math.sqrt(area/f.opaquePixels);f.scaleBasis='idle-visual-mass';
    }
  }
  // Folding and disintegrating intentionally lose visible body area. Use their
  // standing reference gain instead of inflating the remaining fragments to a full body.
  const phase=frames['phase-0'];
  if(phase)for(const [id,f]of Object.entries(frames))if(/^phase-[1-7]$/.test(id)){
    f.scale=f.sourceScale*phase.scale/phase.sourceScale;f.scaleBasis='phase-reference';
  }
  // Keep relative frame sizes, bob and stride intact throughout the protected walk.
  const walk=Object.entries(frames).filter(([id])=>/^walk-\d+$/.test(id)).map(([,f])=>f);
  const maximum=Math.max(0,...walk.map(f=>height(f)*f.sourceScale));
  if(maximum)for(const f of walk)f.scale=f.sourceScale*STANDING_HEIGHT/maximum;
  const seat=frames['seat-0'];
  const span=seat&&(seat.anchor.y-seat.head.y)*seat.sourceScale;
  if(span>0)for(const [id,f]of Object.entries(frames))if(/^seat-\d+$/.test(id))f.scale=f.sourceScale*89/span;
  return frames;
}
