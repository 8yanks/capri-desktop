// Local application hints only: no screenshots, window titles, OCR or model calls.
export const COSTUMES_ENABLED=false; // paused pending approval of the base design
export const OUTFITS = ['default','netrunner','creator','stage','league','david','lucy','badlands','omi','roman','talia','king'];
const THEMES = {
  cyberpunk2077: 'netrunner', blender: 'creator', robloxstudio: 'creator', robloxstudiobeta: 'creator',
  spotify: 'stage', musicbee: 'stage', foobar2000: 'stage',
};
export function outfitForContext(data) {
  const active=data?.wins?.find(win=>win.id===data.fg);
  if(!active||active.kind==='capri')return null;
  return ({cyberpunk:'netrunner',creator:'creator',music:'stage',league:'league'})[active.context]||THEMES[active.app]||'default';
}
export class Wardrobe {
  constructor({apply,now=()=>performance.now(),enabled=COSTUMES_ENABLED}){this.enabled=enabled;this.apply=apply;this.now=now;this.mode='auto';this.current='default';this.pending=null;this.lastChange=-Infinity;}
  configure(mode){
    const next=this.enabled&&(mode==='auto'||OUTFITS.includes(mode))?mode:'default';
    if(next===this.mode)return;
    this.mode=next;this.pending=null;
    if(this.mode!=='auto'){if(this.mode===this.current)this.apply(this.mode,true);else this.change(this.mode);}
  }
  change(outfit){if(outfit===this.current)return;this.current=outfit;this.lastChange=this.now();this.apply(outfit,this.mode!=='auto');}
  update(data,blocked=false){
    if(!this.enabled||this.mode!=='auto')return;
    const candidate=outfitForContext(data);if(candidate===null){this.pending=null;return;}
    const now=this.now();
    if(candidate===this.current){this.pending=null;return;}
    if(this.pending?.outfit!==candidate)this.pending={outfit:candidate,since:now};
    // Wait through quick Alt-Tab switches; don't change clothes during interaction or a scene.
    if(!blocked&&now-this.pending.since>=3500&&now-this.lastChange>=12000){this.change(candidate);this.pending=null;}
  }
}
