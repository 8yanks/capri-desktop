// Explicit, bounded companion interactions. No screen capture, model call or cursor movement.
export class CompanionLife{
  constructor({actor,onPat,onCheckin,now=performance.now()}){
    this.actor=actor;this.onPat=onPat;this.onCheckin=onCheckin;this.nextPat=0;this.nextCheckin=now+20*60*1000;
  }
  configure({headPats=true,checkIns=false}={}){this.headPats=headPats===true;this.checkIns=checkIns===true;}
  tick(point,now){
    const a=this.actor,blocked=a.hidden||a.stowed||a.dormant||a.resourceLocked||a.gameProtected||a.busy||a.dragging||a.act||a.dialogueActive||a.sky||a.stance==='fall';
    if(blocked){this.stroke=null;return;}
    if(this.checkIns&&now>=this.nextCheckin&&now-a.lastActivity>2*60*1000){this.nextCheckin=now+20*60*1000;this.onCheckin();}
    if(!this.headPats||!point||now<this.nextPat){this.stroke=null;return;}
    const head=a.head(),scale=a.scale||1;
    if(Math.abs(point.x-head.x)>75*scale||Math.abs(point.y-head.y)>48*scale){this.stroke=null;return;}
    if(!this.stroke||now-this.stroke.started>2200){this.stroke={x:point.x,direction:0,turns:0,started:now};return;}
    const stroke=this.stroke,dx=point.x-stroke.x;if(Math.abs(dx)<14*scale)return;
    const direction=Math.sign(dx);if(stroke.direction&&direction!==stroke.direction)stroke.turns++;
    stroke.x=point.x;stroke.direction=direction;
    if(stroke.turns>=3){this.nextPat=now+30000;this.stroke=null;a.lastActivity=now;this.onPat();}
  }
}
