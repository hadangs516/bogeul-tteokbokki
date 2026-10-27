const TAU = Math.PI * 2;
const PALETTES = {
  gochujang:{center:'#ee5b26',edge:'#9f2112',light:'#ffbc66',rice:'#ffd3a4'},
  rose:{center:'#edaa7d',edge:'#c46343',light:'#ffe2ad',rice:'#ffe2b8'},
  jjajang:{center:'#764c2c',edge:'#392415',light:'#c99651',rice:'#d5ad72'},
  mala:{center:'#d44820',edge:'#801d10',light:'#ffb44f',rice:'#f6c088'},
  cream:{center:'#f5deb0',edge:'#c6a56e',light:'#fff7d6',rice:'#fff4d7'},
};
const LEGACY_COUNTS={rice:8,fishcake:4,scallion:3,cheese:3,cream:2,ramen:1,sausage:4,cabbage:3,glassnoodle:3,mushroom:3};
const DRAW_ORDER=['cream','ramen','glassnoodle','cabbage','rice','fishcake','sausage','mushroom','cheese','scallion'];
const ATLAS_ORDER=['rice','fishcake','scallion','cheese','cream','ramen','sausage','cabbage','glassnoodle','mushroom'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function ellipse(c,x,y,rx,ry,fill,stroke){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
 if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}
}
function round(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function line(c,points,color,width=2){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [p,color]of stops)g.addColorStop(p,color);return g;}

/** Stateful illustration only; the game owns timing, input and lifecycle. */
export class PanRenderer{
 constructor(){
  this.canvas=null;this.context=null;this.dish={sauce:null,ingredients:[],quantities:{}};
  this.stage='prep';this.cook=null;this.heat=0;this.effects=[];this.lastTime=null;
  this.stirStarted=-Infinity;this.lastStirs=0;this.width=0;this.height=0;
  this.motionReduced=typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  this.atlas=null;
  if(typeof Image!=='undefined'){
   const asset=new Image();asset.onload=()=>{this.atlas=asset;};
   asset.onerror=()=>{};asset.src=new URL('../assets/ingredient-atlas.png',import.meta.url).href;
  }
 }
 mount(canvas){this.canvas=canvas||null;this.context=canvas?.getContext('2d')||null;this.lastTime=null;this.resize();}
 resize(){
  if(!this.canvas)return;const r=this.canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2);
  this.width=Math.max(1,r.width||720);this.height=Math.max(1,r.height||500);
  const w=Math.round(this.width*dpr),h=Math.round(this.height*dpr);
  if(this.canvas.width!==w)this.canvas.width=w;if(this.canvas.height!==h)this.canvas.height=h;
 }
 update(dish,stage,cook=null){
  if(dish&&typeof dish==='object')this.dish=dish;
  this.stage=stage;this.cook=cook;
  if(cook&&cook.stirs>this.lastStirs)this.stir();
  this.lastStirs=cook?.stirs||0;
 }
 splash(id){
  if(!LEGACY_COUNTS[id])return;
  this.effects.push({id,start:performance.now(),offset:Math.sin(this.effects.length*2.1)*88});
  this.effects=this.effects.slice(-8);
 }
 stir(){this.stirStarted=performance.now();}
 draw(nowMs){
  const c=this.context,canvas=this.canvas;if(!c||!canvas||!canvas.isConnected)return;
  const now=Number.isFinite(nowMs)?nowMs:performance.now();
  const dt=this.lastTime===null?0:clamp((now-this.lastTime)/1000,0,.1);this.lastTime=now;
  const target=this.stage==='cooking'?clamp((this.cook?.heat??2)/3,0,1):this.stage==='ready'?.12:0;
  this.heat+=(target-this.heat)*Math.min(1,dt*7);
  if(this.motionReduced)this.heat=target;
  const t=this.motionReduced?0:now/1000;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);
  const scale=Math.min(canvas.width/720,canvas.height/500);
  c.setTransform(scale,0,0,scale,(canvas.width-720*scale)/2,(canvas.height-500*scale)/2);
  c.lineCap='round';c.lineJoin='round';
  if(this.stage==='ready')this.drawBowl(c,t);
  else {this.drawStove(c,t);this.drawPan(c,t,now);this.drawSteam(c,t);this.drawDrops(c,now);this.drawSpoon(c,now);}
  c.setTransform(1,0,0,1,0,0);
 }
 drawBowl(c,t){
  const palette=PALETTES[this.dish.sauce]||PALETTES.gochujang;
  const ceramic={ivory:{rim:'#fff8e9',side:'#e2c9a3',edge:'#b69a72'},blue:{rim:'#80a8b7',side:'#a9c3cb',edge:'#497585'},red:{rim:'#b9462e',side:'#f0d9b2',edge:'#8f3224'}}[this.dish.bowl]||{rim:'#fff8e9',side:'#e2c9a3',edge:'#b69a72'};
  const shadow=c.createRadialGradient(360,385,35,360,385,290);shadow.addColorStop(0,'#54301945');shadow.addColorStop(1,'#54301900');
  ellipse(c,360,385,295,53,shadow);
  ellipse(c,360,355,288,52,'#f6e5c7','#d3b990');
  ellipse(c,360,355,267,41,'#e8cfaa');
  c.beginPath();c.moveTo(98,221);c.bezierCurveTo(109,357,206,396,360,397);c.bezierCurveTo(514,396,611,357,622,221);c.closePath();
  c.fillStyle=gradient(c,0,225,0,398,[[0,ceramic.rim],[.42,ceramic.side],[1,ceramic.edge]]);c.fill();
  ellipse(c,360,218,264,143,ceramic.rim,ceramic.edge);
  ellipse(c,360,220,244,125,'#f9e7c7');
  const sauce=c.createRadialGradient(335,187,30,360,218,240);sauce.addColorStop(0,palette.center);sauce.addColorStop(1,palette.edge);
  ellipse(c,360,223,234,113,sauce);
  c.save();c.beginPath();c.ellipse(360,223,233,112,0,0,TAU);c.clip();
  for(const [layer,id] of DRAW_ORDER.entries()){
   const amount=clamp(Math.floor(this.dish.quantities?.[id]||0),0,12),count=amount*(id==='scallion'?3:id==='cheese'?4:1);
   for(let i=0;i<count;i++){
    const a=i*2.399+layer*1.17,r=28+((i*61+layer*37)%170);
    c.save();c.translate(360+Math.cos(a)*r,222+Math.sin(a)*r*.45);c.rotate(Math.sin(i*7+layer)*1.5);c.scale(1.35,1.35);this.drawIngredient(c,id,palette,i,true);c.restore();
   }
  }
  c.restore();
  c.strokeStyle='#fff9e399';c.lineWidth=4;c.beginPath();c.ellipse(360,216,254,135,0,3.5,5.7);c.stroke();
  if(this.dish.bowl==='blue')for(let i=0;i<5;i++){const x=230+i*65,y=352+Math.sin(i/4*Math.PI)*18;for(let j=0;j<5;j++){const a=j*TAU/5;ellipse(c,x+Math.cos(a)*7,y+Math.sin(a)*7,4,4,'#537a92');}ellipse(c,x,y,3,3,'#dbe8e3');}
  if(!this.motionReduced){c.save();c.strokeStyle='#fff8e7';c.lineWidth=10;for(let i=0;i<3;i++){const phase=(t*.3+i*.3)%1,x=280+i*80,y=180-phase*85;c.globalAlpha=Math.sin(phase*Math.PI)*.22;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-18,y-25,x+16,y-43,x,y-65);c.stroke();}c.restore();}
 }
 drawStove(c,t){
  const shadow=c.createRadialGradient(360,445,30,360,445,300);
  shadow.addColorStop(0,'#45231565');shadow.addColorStop(1,'#45231500');
  ellipse(c,360,449,315,38,shadow);
  round(c,139,423,35,57,10,'#272424');round(c,546,423,35,57,10,'#272424');
  round(c,114,334,492,133,23,gradient(c,0,334,0,467,[[0,'#574b45'],[.18,'#292c2d'],[.7,'#171b20'],[1,'#343538']]));
  round(c,124,327,472,88,23,gradient(c,0,327,0,415,[[0,'#25292c'],[.55,'#5a5550'],[1,'#202326']]));
  ellipse(c,360,365,199,76,'#121922','#66615d');
  ellipse(c,360,367,166,56,'#1b2633','#62717d');
  for(let i=0;i<8;i++){
   const a=i*TAU/8;c.save();c.translate(360,366);c.scale(1,.43);c.rotate(a);
   round(c,117,-10,107,20,6,gradient(c,0,-10,0,10,[[0,'#78746b'],[.35,'#242b2b'],[1,'#101719']]));c.restore();
  }
  if(this.heat>.02&&this.stage==='cooking'){
   c.save();c.globalAlpha=this.heat;
   for(let i=0;i<24;i++){
    const a=i*TAU/24,x=360+Math.cos(a)*166,y=366+Math.sin(a)*58;
    const h=15+this.heat*9+Math.sin(t*15+i*2.3)*4;
    const g=gradient(c,0,y-h,0,y+7,[[0,'#a1faff'],[.35,'#37bbff'],[1,'#305bff']]);
    c.fillStyle=g;c.beginPath();c.moveTo(x-8,y+5);c.bezierCurveTo(x-13,y-8,x+4,y-h,x+2,y-h-7);
    c.bezierCurveTo(x+6,y-h+8,x+13,y-1,x+7,y+6);c.fill();
    ellipse(c,x,y+1,3.5,8,'#aaf8ff');
   }c.restore();
  }
  round(c,128,418,464,4,2,'#a49b8338');
  for(let side=0;side<2;side++)for(let i=0;i<7;i++)round(c,145+side*305+i*11,435,4,12,2,'#0e1419');
  ellipse(c,360,442,28,18,'#0d1318','#7a7970');
  ellipse(c,360,438,23,14,gradient(c,340,423,380,455,[[0,'#7b7771'],[.4,'#3a3d3d'],[1,'#121b22']]));
  c.save();c.translate(360,438);c.rotate((this.cook?.heat??0)*.42-.7);
  round(c,-3,-10,6,20,3,'#e7d5b1');c.restore();
  ellipse(c,405,440,3.5,3.5,this.stage==='cooking'&&this.heat>.02?'#ffd47e':'#726b5c');
 }
 drawPan(c,t,now){
  for(const side of [-1,1]){
   c.save();c.translate(360+side*294,213);c.rotate(side*.18);
   round(c,-42,-28,84,48,13,gradient(c,0,-28,0,20,[[0,'#54433c'],[.45,'#24262a'],[1,'#101820']]));
   round(c,-23,-16,46,24,6,'#ab855b');round(c,-20,-12,40,18,5,'#76573e');
   line(c,[[-32,-22],[30,-22]],'#b7a09288',3);c.restore();
  }
  const body=gradient(c,76,0,644,0,[[0,'#69190e'],[.08,'#b72513'],[.28,'#ef4a21'],[.55,'#cc3015'],[.84,'#a31b0e'],[1,'#5d160e']]);
  ellipse(c,360,249,286,158,body,'#74200f');
  c.save();c.beginPath();c.ellipse(360,249,285,157,0,0,TAU);c.clip();
  for(const [x,w,a]of [[154,15,.16],[179,35,.07],[232,8,.16],[455,70,.05],[536,12,.1]]){
   c.fillStyle='rgba(255,205,130,'+a+')';c.beginPath();c.moveTo(x,260);c.lineTo(x+w,260);c.lineTo(x+w-10,410);c.lineTo(x-16,410);c.fill();
  }
  c.lineWidth=9;c.strokeStyle='#61130c55';c.beginPath();c.ellipse(360,252,281,150,0,.13,3.01);c.stroke();
  c.restore();
  // A rounded polished steel lip encloses the dark, deep inner wall.
  ellipse(c,360,205,291,149,'#54251b');
  ellipse(c,360,202,289,147,gradient(c,100,70,570,340,[[0,'#fff3dc'],[.18,'#8f827a'],[.42,'#eee1cb'],[.7,'#fff4df'],[1,'#8a7a70']]));
  ellipse(c,360,202,280,139,'#302d2c');
  const inner=gradient(c,0,66,0,330,[[0,'#262627'],[.5,'#48403b'],[1,'#66564b']]);
  ellipse(c,360,203,275,135,inner);
  const palette=PALETTES[this.dish.sauce]||PALETTES.gochujang;
  const hasSauce=!!PALETTES[this.dish.sauce];
  const liquid=c.createRadialGradient(303,171,15,360,231,260);
  liquid.addColorStop(0,hasSauce?palette.center:'#9e8d7970');liquid.addColorStop(1,hasSauce?palette.edge:'#4b433d');
  ellipse(c,360,222,260,109,liquid);
  c.save();c.beginPath();c.ellipse(360,222,258,108,0,0,TAU);c.clip();
  for(let i=0;i<110;i++){
   const a=i*2.399,r=Math.sqrt((i+1)/111)*254,x=360+Math.cos(a)*r,y=222+Math.sin(a)*r*.41;
   c.globalAlpha=.08+(i%4)*.025;
   ellipse(c,x,y,.8+i%3,.5+i%2,i%3===0?'#571a0b':hasSauce?palette.light:'#ffeac9');
  }
  c.globalAlpha=hasSauce?.16:.08;
  for(let i=0;i<11;i++){const a=i*2.39,r=40+(i*51)%185;ellipse(c,360+Math.cos(a)*r,220+Math.sin(a)*r*.4,14+i%3*7,3.5,hasSauce?palette.light:'#fff6dd');}
  c.globalAlpha=1;
  const age=(now-this.stirStarted)/1000,stirring=age>=0&&age<1.35&&!this.motionReduced;
  const swirl=stirring?Math.sin(age/1.35*Math.PI)*.22:0;
  for(const [layer,id]of DRAW_ORDER.entries()){
   const raw=this.dish.quantities&&typeof this.dish.quantities==='object'?this.dish.quantities[id]||0:(this.dish.ingredients||[]).includes(id)?LEGACY_COUNTS[id]:0;
   const amount=clamp(Math.floor(raw),0,12);
   const count=amount*(id==='scallion'?3:id==='cheese'?4:1);
   for(let i=0;i<count;i++){
    const a=i*2.399+layer*1.17+swirl,r=33+((i*61+layer*37)%185);
    const x=360+Math.cos(a)*r,y=221+Math.sin(a)*r*.39+(this.motionReduced?0:Math.sin(t*2+i+layer)*this.heat*1.3);
    c.save();c.translate(x,y);c.rotate(Math.sin(i*7+layer)*1.5+swirl);
    c.scale(1.24,1.24);this.drawIngredient(c,id,palette,i,hasSauce);c.restore();
   }
  }
  if(this.heat>.02)this.drawBubbles(c,t,palette,hasSauce);
  for(const effect of this.effects){
   const age=(now-effect.start)/1000-.3;
   if(age>0&&age<.65&&!this.motionReduced){c.globalAlpha=(1-age/.65)*.55;c.lineWidth=2;ellipse(c,360+effect.offset,219,8+age*94,4+age*38,null,hasSauce?palette.light:'#fff5df');}
  }
  if(stirring){
   c.globalAlpha=Math.sin(age/1.35*Math.PI)*.4;c.strokeStyle=palette.light;c.lineWidth=3;
   for(let i=0;i<3;i++){c.beginPath();c.ellipse(360,219,80+i*42,32+i*16,0,age*5+i,age*5+i+2.7);c.stroke();}
  }
  c.globalAlpha=1;c.restore();
  c.lineWidth=2.5;c.strokeStyle='#fff7e7d0';c.beginPath();c.ellipse(360,201,286,144,0,3.5,5.85);c.stroke();
  c.lineWidth=2;c.strokeStyle='#fff0dc99';c.beginPath();c.ellipse(360,202,280,139,0,.28,2.8);c.stroke();
  c.lineWidth=3;c.strokeStyle='#77251670';c.beginPath();c.ellipse(360,207,290,147,0,.18,2.95);c.stroke();
 }
 drawBubbles(c,t,palette,hasSauce){
  for(let i=0;i<32;i++){
   const phase=this.motionReduced?.3:(t*(.6+i%4*.11)+i*.43)%1;
   const a=i*2.399,r=40+(i*53)%210,x=360+Math.cos(a)*r,y=223+Math.sin(a)*r*.4;
   c.globalAlpha=Math.sin(phase*Math.PI)*this.heat*.36;
   const color=hasSauce?palette.light:'#e9dac3';
   ellipse(c,x,y,2+phase*8,1+phase*3.8,color,color);c.lineWidth=.8;
   c.globalAlpha*=.75;ellipse(c,x-2,y-1,2.3,.8,'#fff4cf');
  }c.globalAlpha=1;
 }
 drawIngredient(c,id,palette,seed,hasSauce=true){
  c.shadowColor='#411b1466';c.shadowBlur=5;c.shadowOffsetY=3;c.lineWidth=1.2;
  if(id==='rice'){
   const rice=gradient(c,-13,0,13,0,[[0,hasSauce?'#cf702e':'#cbb48b'],[.22,hasSauce?palette.rice:'#fcebc5'],[.48,hasSauce?palette.rice:'#fff7df'],[.76,hasSauce?'#f4b472':'#ecd7af'],[1,hasSauce?'#be5f24':'#ba9d74']]);
   round(c,-12,-29,24,58,11,rice);c.shadowBlur=0;
   ellipse(c,0,-21,9.4,6.3,hasSauce?'#ffe2b6c0':'#fffbe9','#cfac7766');
   round(c,-7,-14,4.2,29,2.1,'#fff4db90');
   if(hasSauce){c.globalAlpha=.32;ellipse(c,4,15,5,9,'#dc7135');c.globalAlpha=1;}
  }else if(id==='fishcake'){
   c.fillStyle=gradient(c,-20,-24,20,20,[[0,'#f9d38b'],[.5,'#e2a04c'],[1,'#b7732f']]);c.strokeStyle='#ad682f';
   c.beginPath();c.moveTo(-27,16);c.quadraticCurveTo(-26,11,-19,-21);c.quadraticCurveTo(-17,-26,-12,-22);c.lineTo(30,11);c.quadraticCurveTo(33,16,26,17);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
   line(c,[[-22,12],[-16,-18],[24,12]],'#ffe5a58c',2.1);
   for(let j=0;j<12;j++){const x=Math.sin(j*4.1+seed)*14,y=Math.cos(j*2.8)*9;ellipse(c,x,y,.7+j%2,.7,'#ab6d2b66');}
  }else if(id==='scallion'){
   c.save();c.rotate(.4);
   round(c,-8,-11,16,24,6,gradient(c,-8,0,8,0,[[0,'#195e27'],[.5,'#5d9a36'],[1,'#255f25']]));
   c.shadowBlur=0;ellipse(c,0,-8,7.5,4.5,'#a7c76d','#326b2e');ellipse(c,0,-8,3.8,2.2,'#346e2c');c.restore();
  }else if(id==='cheese'){
   round(c,-3,-21,6,42,2.5,gradient(c,-3,0,3,0,[[0,'#e8a936'],[.5,'#ffe797'],[1,'#ffd367']]));
   c.shadowBlur=0;round(c,-1.5,-18,2,34,1,'#fff3c1');
  }else if(id==='cream'){
   c.shadowBlur=0;c.strokeStyle='#fff4d8cc';c.lineWidth=7;
   c.beginPath();c.ellipse(0,0,33,15,0,seed*.7,Math.PI*1.6+seed*.7);c.stroke();
   c.lineWidth=2;c.strokeStyle='#fff9e3';c.stroke();
  }else if(id==='ramen'||id==='glassnoodle'){
   const ramen=id==='ramen';c.shadowBlur=1;
   for(let j=0;j<(ramen?8:3);j++){
    c.beginPath();c.moveTo(-37,-24+j*7);c.bezierCurveTo(-25,-42+j*7,-12,-7+j*7,0,-25+j*7);c.bezierCurveTo(14,-43+j*7,25,-7+j*7,39,-24+j*7);
    c.strokeStyle=ramen?'#b7782b':'#ba8952';c.lineWidth=ramen?6:12;c.stroke();
    c.strokeStyle=ramen?'#f8d07d':'#e6bf8c';c.lineWidth=ramen?3.8:9;c.stroke();
    c.strokeStyle=ramen?'#ffdf9b':'#ffdbacb0';c.lineWidth=ramen?1.3:3;c.stroke();
   }
  }else if(id==='sausage'){
   round(c,-13,-24,26,48,12,gradient(c,-13,0,13,0,[[0,'#9f3d24'],[.3,'#e29263'],[.6,'#df8151'],[1,'#a5472c']]));
   c.shadowBlur=0;line(c,[[-9,-11],[9,-4]],'#944027',2.5);line(c,[[-9,1],[9,8]],'#a44d2d',2.5);
   line(c,[[-8,-9],[8,-3]],'#ffbc8190',1.2);ellipse(c,-5,-16,2.5,4,'#ffd3a4a0');
  }else if(id==='cabbage'){
   c.fillStyle=gradient(c,-20,-20,20,20,[[0,'#d6e798'],[.5,'#b8d174'],[1,'#709846']]);c.strokeStyle='#7b9e4b';
   c.beginPath();c.moveTo(-25,-7);c.quadraticCurveTo(-29,-27,-9,-22);c.quadraticCurveTo(0,-35,12,-21);c.quadraticCurveTo(30,-25,27,-4);c.quadraticCurveTo(35,16,12,18);c.quadraticCurveTo(-17,33,-25,-7);c.fill();c.stroke();
   c.shadowBlur=0;line(c,[[-15,-16],[15,20]],'#f6eec3',4);line(c,[[-4,-3],[16,-10]],'#e8e6ae',2);line(c,[[5,7],[-15,12]],'#e8e6ae',2);
  }else if(id==='mushroom'){
   round(c,-7,-4,14,28,4,'#efdbad');c.fillStyle=gradient(c,0,-23,0,0,[[0,'#ae7952'],[.5,'#8a5232'],[1,'#634127']]);c.strokeStyle='#684126';
   c.beginPath();c.ellipse(0,-4,24,16,0,Math.PI,TAU);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
   ellipse(c,0,-3,22,5,'#dbba82');line(c,[[-7,-16],[6,-7]],'#ddbb8990',2);line(c,[[-5,-7],[5,-16]],'#ddbb8990',2);
  }
  c.shadowBlur=0;c.shadowOffsetY=0;
 }
 drawSteam(c,t){
  if(this.heat<.02)return;c.save();c.lineCap='round';
  for(let i=0;i<6;i++){
   const phase=this.motionReduced?.4:(t*.3+i*.17)%1;
   const x=233+i*51+Math.sin(t+i)*10,y=171-phase*65;
   c.globalAlpha=Math.sin(phase*Math.PI)*this.heat*.24;c.strokeStyle='#fff8e7';c.lineWidth=13+phase*9;
   c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-24,y-20,x+24,y-43,x+3,y-71);c.stroke();
  }c.restore();
 }
 drawDrops(c,now){
  this.effects=this.effects.filter(effect=>now-effect.start<1000);if(this.motionReduced)return;
  const palette=PALETTES[this.dish.sauce]||PALETTES.gochujang;
  for(const e of this.effects){
   const phase=(now-e.start)/340;if(phase<0||phase>1)continue;
   c.save();c.translate(360+e.offset+Math.sin(phase*Math.PI)*27,40+phase*phase*178);c.rotate(phase*2.2);
   c.globalAlpha=1-Math.max(0,phase-.75)*2;const size=1.3-phase*.3;c.scale(size,size);
   this.drawIngredient(c,e.id,palette,0,!!PALETTES[this.dish.sauce]);c.restore();
  }
 }
 drawSpoon(c,now){
  const age=(now-this.stirStarted)/1000;if(age<0||age>1.35||this.motionReduced)return;
  const phase=age/1.35,angle=phase*TAU,x=360+Math.sin(angle)*128,y=221+Math.cos(angle)*48;
  c.save();c.globalAlpha=Math.min(1,phase*7,(1-phase)*7);c.translate(x,y);c.rotate(-.62+Math.sin(angle)*.2);
  c.shadowColor='#29140e66';c.shadowBlur=8;c.shadowOffsetY=6;
  round(c,-9,-167,18,170,8,gradient(c,-9,0,9,0,[[0,'#805029'],[.3,'#dfb66c'],[.65,'#f2ce8a'],[1,'#9f6b38']]));
  ellipse(c,0,0,27,39,gradient(c,-27,-20,27,20,[[0,'#a16831'],[.3,'#e7bd73'],[.7,'#c58c43'],[1,'#885329']]),'#8a552b');
  c.shadowBlur=0;c.shadowOffsetY=0;ellipse(c,0,-2,19,28,'#b87938');
  line(c,[[-3,-143],[-3,-47]],'#fff0b870',2);c.restore();
 }
}


