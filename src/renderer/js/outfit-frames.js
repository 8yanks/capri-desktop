// Costume key poses preserve the selected outfit across standing, sitting, walking and larger motions.
export function costumePose(id) {
  const [sheet,number]=id.split('-'),index=Number(number);
  if(sheet==='gestures')return index<3?0:index===3?1:index<8?2:3;
  if(sheet==='seated')return index<4?4+index%2:index<6?6:7;
  if(sheet==='activities')return index===0?12:index===1?13:index===2?14:index===3?1:null;
  // Getting down to the floor is not perching on a window. Never inject a hip-supported cel here.
  if(sheet==='transitions')return [0,13,13,13,13,13,15,15,15,15,15,13,13,13,0,0][index]??null;
  if(sheet==='extra'&&index>=6)return 7; // seated sleep keeps the selected outfit
  if(sheet==='extra')return index<2?(index?1:2):index<4?(index%2?2:3):index%2?0:1;
  return null;
}

