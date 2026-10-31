// @ts-nocheck — small canvas drawing helpers (cartoon bride & groom / party scenes)
/* Cartoon pictures shown in the gallery while no guest has uploaded yet. Drawn in the browser, no image files. */

const TOON_BG=[["#fde9e4","#f6c9c0"],["#fbf1df","#efd5a6"],["#e8f1e4","#c4dbb6"],["#efe6f6","#d4c1e6"],["#e3eef6","#b9d3e6"],["#fff0e6","#f5c7a8"]];
function toon(seed){
  const c=document.createElement("canvas");c.width=c.height=480;const x=c.getContext("2d");
  let s=seed*7919+13;const r=()=>((s=(s*9301+49297)%233280)/233280);
  const bg=TOON_BG[seed%TOON_BG.length];
  const g=x.createLinearGradient(0,0,0,480);g.addColorStop(0,bg[0]);g.addColorStop(1,bg[1]);x.fillStyle=g;x.fillRect(0,0,480,480);
  for(let i=0;i<18;i++){x.globalAlpha=.25+r()*.35;x.fillStyle="#fff";x.beginPath();x.arc(r()*480,r()*300,4+r()*18,0,7);x.fill()}
  x.globalAlpha=1;x.fillStyle="rgba(255,255,255,.55)";x.beginPath();x.ellipse(240,452,230,46,0,0,7);x.fill();
  const scenes=[sceneCouple,sceneArch,sceneDance,sceneCake,sceneToast,sceneBride,sceneBalloons];
  scenes[seed%scenes.length](x,r);
  return c.toDataURL("image/jpeg",.88);
}
const SKIN="#f7d7bf",HAIR="#2d2220",GOLD="#cfa45a";
function face(x,cx,cy,R,{bride=false,kiss=false,closed=false}={}){
  // hair back
  x.fillStyle=HAIR;x.beginPath();x.arc(cx,cy-2,R+4,0,7);x.fill();
  if(bride){x.beginPath();x.arc(cx,cy-R-6,R*.45,0,7);x.fill()}
  x.fillStyle=SKIN;x.beginPath();x.arc(cx,cy+4,R,0,7);x.fill();
  // fringe
  x.fillStyle=HAIR;x.beginPath();
  if(bride){x.moveTo(cx-R-2,cy);x.quadraticCurveTo(cx-R*.6,cy-R*1.2,cx+R*.2,cy-R*.95);x.quadraticCurveTo(cx-R*.2,cy-R*.3,cx-R-2,cy);}
  else{x.moveTo(cx-R-3,cy+2);x.quadraticCurveTo(cx-R,cy-R*1.25,cx+R*.4,cy-R*1.05);x.quadraticCurveTo(cx+R*1.1,cy-R*.9,cx+R+3,cy+2);x.quadraticCurveTo(cx+R*.5,cy-R*.45,cx-R*.1,cy-R*.55);x.quadraticCurveTo(cx-R*.6,cy-R*.4,cx-R-3,cy+2);}
  x.fill();
  // eyes
  x.strokeStyle="#3b2a26";x.fillStyle="#3b2a26";x.lineWidth=3;x.lineCap="round";
  [-1,1].forEach(k=>{const ex=cx+k*R*.38,ey=cy+R*.18;
    if(closed){x.beginPath();x.arc(ex,ey,R*.12,Math.PI*1.1,Math.PI*1.9);x.stroke()}
    else{x.beginPath();x.arc(ex,ey,R*.1,0,7);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(ex+2,ey-2,R*.035,0,7);x.fill();x.fillStyle="#3b2a26"}});
  // blush
  x.fillStyle="rgba(240,130,130,.45)";[-1,1].forEach(k=>{x.beginPath();x.ellipse(cx+k*R*.6,cy+R*.45,R*.16,R*.1,0,0,7);x.fill()});
  // mouth
  x.strokeStyle="#b5534f";x.lineWidth=3;x.beginPath();
  if(kiss){x.arc(cx,cy+R*.55,R*.07,0,7)}else{x.arc(cx,cy+R*.42,R*.2,.15*Math.PI,.85*Math.PI)}x.stroke();
}
function groom(x,cx,by,sc=1,o={}){
  x.save();x.translate(cx,by);x.scale(sc,sc);
  // legs
  x.fillStyle="#2a2a33";x.fillRect(-26,-70,22,70);x.fillRect(4,-70,22,70);
  x.fillStyle="#141418";x.beginPath();x.ellipse(-15,0,17,7,0,0,7);x.ellipse(15,0,17,7,0,0,7);x.fill();
  // jacket
  x.fillStyle="#2b2d38";x.beginPath();x.moveTo(-40,-160);x.quadraticCurveTo(0,-176,40,-160);x.lineTo(44,-62);x.lineTo(-44,-62);x.closePath();x.fill();
  // shirt + tie
  x.fillStyle="#fff";x.beginPath();x.moveTo(-14,-166);x.lineTo(14,-166);x.lineTo(0,-110);x.closePath();x.fill();
  x.fillStyle="#a8324a";x.beginPath();x.moveTo(-12,-160);x.lineTo(0,-154);x.lineTo(12,-160);x.lineTo(12,-148);x.lineTo(0,-154);x.lineTo(-12,-148);x.closePath();x.fill();
  // flower pin
  x.fillStyle="#fff";x.beginPath();x.arc(-24,-140,6,0,7);x.fill();x.fillStyle=GOLD;x.beginPath();x.arc(-24,-140,2.5,0,7);x.fill();
  // arms
  x.strokeStyle="#2b2d38";x.lineWidth=16;x.lineCap="round";
  const arms=o.arms||[[-44,-150,-52,-90],[44,-150,52,-90]];
  arms.forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();x.fillStyle=SKIN;x.beginPath();x.arc(c2,d,8,0,7);x.fill()});
  face(x,0,-206,40,o);
  x.restore();
}
function bride(x,cx,by,sc=1,o={}){
  x.save();x.translate(cx,by);x.scale(sc,sc);
  // veil
  x.fillStyle="rgba(255,255,255,.55)";x.beginPath();x.moveTo(-10,-250);x.quadraticCurveTo(-90,-120,-80,0);x.lineTo(70,0);x.quadraticCurveTo(70,-120,20,-250);x.fill();
  // dress
  const dg=x.createLinearGradient(0,-160,0,0);dg.addColorStop(0,"#ffffff");dg.addColorStop(1,"#f3ece6");x.fillStyle=dg;
  x.beginPath();x.moveTo(-26,-162);x.quadraticCurveTo(0,-170,26,-162);x.lineTo(22,-104);x.quadraticCurveTo(70,-50,78,0);x.lineTo(-78,0);x.quadraticCurveTo(-70,-50,-22,-104);x.closePath();x.fill();
  x.strokeStyle="rgba(200,180,160,.6)";x.lineWidth=2;x.stroke();
  x.strokeStyle="rgba(207,164,90,.7)";x.lineWidth=3;x.beginPath();x.moveTo(-22,-104);x.lineTo(22,-104);x.stroke();
  // arms
  x.strokeStyle=SKIN;x.lineWidth=12;x.lineCap="round";
  const arms=o.arms||[[-26,-155,-40,-100],[26,-155,40,-100]];
  arms.forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke()});
  if(o.bouquet!==false){const [bx,bd]=o.bouquet||[0,-104];bouquet(x,bx,bd)}
  face(x,0,-206,38,{...o,bride:true});
  // tiara
  x.fillStyle=GOLD;x.beginPath();x.moveTo(-14,-246);x.lineTo(-8,-258);x.lineTo(0,-248);x.lineTo(8,-258);x.lineTo(14,-246);x.closePath();x.fill();
  x.restore();
}
function bouquet(x,bx,by){
  x.strokeStyle="#7aa064";x.lineWidth=3;[-6,0,6].forEach(k=>{x.beginPath();x.moveTo(bx+k,by);x.lineTo(bx+k*.4,by+26);x.stroke()});
  [["#fff",-10,-4],["#f3b7c0",8,-6],["#fff",0,-14],["#f7d58f",-4,4],["#f3b7c0",10,6]].forEach(([c,dx,dy])=>{x.fillStyle=c;x.beginPath();x.arc(bx+dx,by+dy,9,0,7);x.fill()});
}
function heart(x,hx,hy,sz,col){x.fillStyle=col;x.beginPath();x.moveTo(hx,hy+sz*.35);x.bezierCurveTo(hx-sz,hy-sz*.3,hx-sz*.4,hy-sz,hx,hy-sz*.45);x.bezierCurveTo(hx+sz*.4,hy-sz,hx+sz,hy-sz*.3,hx,hy+sz*.35);x.fill()}
function confetti(x,r,n=40){const cs=["#f3b7c0",GOLD,"#a9c7e6","#bfe0a8","#fff"];for(let i=0;i<n;i++){x.save();x.translate(r()*480,r()*330);x.rotate(r()*6);x.fillStyle=cs[i%cs.length];x.fillRect(-4,-2,8,4);x.restore()}}
function lights(x){x.strokeStyle="rgba(120,100,80,.5)";x.lineWidth=2;x.beginPath();x.moveTo(0,40);x.quadraticCurveTo(240,120,480,40);x.stroke();
  for(let i=1;i<12;i++){const t=i/12,px=480*t,py=40+(1-(2*t-1)**2)*40;const gl=x.createRadialGradient(px,py+8,1,px,py+8,16);gl.addColorStop(0,"rgba(255,226,150,1)");gl.addColorStop(1,"rgba(255,226,150,0)");x.fillStyle=gl;x.beginPath();x.arc(px,py+8,16,0,7);x.fill();x.fillStyle="#ffe7a8";x.beginPath();x.arc(px,py+8,5,0,7);x.fill()}}
function balloon(x,bx,by,col){x.strokeStyle="rgba(120,100,80,.5)";x.lineWidth=1.5;x.beginPath();x.moveTo(bx,by+34);x.quadraticCurveTo(bx+10,by+90,bx,by+150);x.stroke();x.fillStyle=col;x.beginPath();x.ellipse(bx,by,27,34,0,0,7);x.fill();x.fillStyle="rgba(255,255,255,.5)";x.beginPath();x.ellipse(bx-9,by-12,6,10,-.4,0,7);x.fill()}

function sceneCouple(x,r){[[90,110,30],[400,90,24],[240,60,20]].forEach(([a,b,s])=>heart(x,a,b,s,"rgba(232,120,140,.75)"));
  groom(x,175,440,1,{arms:[[-44,-150,-52,-90],[44,-150,62,-96]]});bride(x,305,440,1,{arms:[[-26,-155,-44,-96],[26,-155,40,-100]],bouquet:[36,-100]})}
function sceneArch(x,r){x.strokeStyle="#9bbf84";x.lineWidth=16;x.beginPath();x.arc(240,300,190,Math.PI,0);x.stroke();
  for(let a=Math.PI;a<=2*Math.PI+.01;a+=Math.PI/12){const fx=240+190*Math.cos(a),fy=300+190*Math.sin(a);x.fillStyle=["#fff","#f3b7c0","#f7d58f"][Math.round(a*12)%3];x.beginPath();x.arc(fx,fy,13,0,7);x.fill()}
  x.fillStyle="#9bbf84";x.fillRect(42,300,16,150);x.fillRect(422,300,16,150);
  groom(x,190,440,.95,{closed:true});bride(x,295,440,.95,{closed:true})}
function sceneDance(x,r){lights(x);x.fillStyle="#b08a4f";x.font="bold 34px serif";[["♪",70,190],["♫",410,170],["♪",380,260]].forEach(([t,a,b])=>x.fillText(t,a,b));
  groom(x,200,440,1,{arms:[[-44,-150,-30,-210],[44,-150,70,-130]]});bride(x,285,440,1,{arms:[[-26,-155,-40,-130],[26,-155,48,-210]],bouquet:[48,-214]})}
function sceneCake(x,r){confetti(x,r,30);
  x.fillStyle="#d9c3a5";x.fillRect(150,438,180,8);
  [[160,340,160,98],[185,262,110,80],[208,200,64,64]].forEach(([a,b,w,h])=>{x.fillStyle="#fff";x.fillRect(a,b,w,h);x.fillStyle="#f3c9cf";x.fillRect(a,b,w,12);x.fillStyle=GOLD;for(let i=a+10;i<a+w;i+=18){x.beginPath();x.arc(i,b+h-10,3,0,7);x.fill()}});
  groom(x,226,200,.32);bride(x,256,200,.32,{bouquet:false});
  heart(x,240,120,22,"rgba(232,120,140,.8)");}
function sceneToast(x,r){confetti(x,r,50);
  [[190,-.25],[290,.25]].forEach(([cx,a])=>{x.save();x.translate(cx,330);x.rotate(a);x.fillStyle="rgba(255,255,255,.85)";x.beginPath();x.moveTo(-38,-150);x.lineTo(38,-150);x.lineTo(26,-40);x.quadraticCurveTo(0,-20,-26,-40);x.fill();
    x.fillStyle="#f2d98f";x.beginPath();x.moveTo(-33,-118);x.lineTo(33,-118);x.lineTo(26,-44);x.quadraticCurveTo(0,-26,-26,-44);x.fill();
    x.fillStyle="#fff";for(let i=0;i<5;i++){x.beginPath();x.arc(-14+i*7,-100+i*12,3,0,7);x.fill()}
    x.fillStyle="rgba(255,255,255,.9)";x.fillRect(-4,-34,8,96);x.fillRect(-30,60,60,7);x.restore()});
  x.fillStyle="#cfa45a";x.font="bold 40px serif";x.fillText("✦",224,150);}
function sceneBride(x,r){[[80,120,26],[400,140,20]].forEach(([a,b,s])=>heart(x,a,b,s,"rgba(232,120,140,.7)"));
  for(let i=0;i<14;i++){x.fillStyle=i%2?"#f3b7c0":"#fff";x.beginPath();x.ellipse(r()*480,r()*300,6,4,r()*3,0,7);x.fill()}
  bride(x,240,440,1.12,{arms:[[-26,-155,-46,-108],[26,-155,58,-236]],bouquet:[58,-246]})}
function sceneBalloons(x,r){[[80,110,"#f3b7c0"],[140,80,"#fff"],[350,90,"#f7d58f"],[410,120,"#a9c7e6"],[110,170,"#f7d58f"],[380,180,"#f3b7c0"]].forEach(([a,b,c2])=>balloon(x,a,b,c2));
  groom(x,200,440,.95,{kiss:true,closed:true,arms:[[-44,-150,-52,-90],[44,-150,70,-170]]});bride(x,280,440,.95,{kiss:true,closed:true,arms:[[-26,-155,-50,-170],[26,-155,40,-100]],bouquet:[40,-104]});
  heart(x,240,150,30,"rgba(232,120,140,.85)")}

export { toon };
export const TOON_COUNT = 7;
