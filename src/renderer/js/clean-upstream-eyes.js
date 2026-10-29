// Clean native paths traced against the original sockets and crossed closed lids.
// All coordinates are local to the same optical centre; circles never scale independently.
export function drawCleanEye(ctx,x,y,{mirror=1,closed=false,wide=false,gaze=0}={}){
 ctx.save();ctx.translate(x,y);ctx.scale(mirror,1);ctx.fillStyle='#050312';
 if(closed){
   ctx.beginPath();ctx.moveTo(-10,-5);ctx.bezierCurveTo(-8,4,-2,7,10,5);ctx.bezierCurveTo(3,9,-7,6,-10,-5);ctx.fill();
   ctx.beginPath();ctx.moveTo(-8,10);ctx.lineTo(6,-9);ctx.lineTo(-1,6);ctx.closePath();ctx.fill();
 }else{
   ctx.beginPath();ctx.moveTo(-8.5,-7.5);ctx.bezierCurveTo(-3,-10,3,-9.5,8,-8);ctx.lineTo(8.5,5.5);ctx.bezierCurveTo(3,8,-3,7.5,-8.5,7);ctx.lineTo(-7.7,2);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(-9,-12);ctx.lineTo(-.8,-9);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(3,7);ctx.lineTo(9,11);ctx.lineTo(7,4);ctx.closePath();ctx.fill();
   const rx=wide?7:6.5,ry=wide?6.7:6.2;
   ctx.strokeStyle='#13ee5a';ctx.lineWidth=.32;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#075ab7';ctx.beginPath();ctx.ellipse(gaze*mirror,0,3.8,4.1,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#f4f7fa';ctx.beginPath();ctx.ellipse(gaze*mirror,0,1.9,2.05,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
export function drawCleanPair(ctx,state){
 drawCleanEye(ctx,114,117,{closed:state==='closed',wide:state==='laugh',gaze:0});
 drawCleanEye(ctx,138,117,{mirror:-1,closed:state==='closed'||state==='wink',wide:state==='laugh',gaze:0});
}
