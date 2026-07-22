(() => {
'use strict';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
const loading = document.getElementById('loading');
const loadBar = document.getElementById('loadBar');
const loadText = document.getElementById('loadText');
const muteButton = document.getElementById('muteButton');
const pauseButton = document.getElementById('pauseButton');
const touchControls = document.getElementById('touchControls');
const W = 960, H = 540, HUD_H = 54;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rand = (a,b)=>a+Math.random()*(b-a);
const choose = a=>a[(Math.random()*a.length)|0];
const overlap = (a,b)=>a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const center = o=>({x:o.x+o.w/2,y:o.y+o.h/2});
const rectDistance = (a,b)=>Math.hypot((a.x+a.w/2)-(b.x+b.w/2),(a.y+a.h/2)-(b.y+b.h/2));

function resizeCanvas(){
  const r=canvas.getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.floor(r.width*dpr); canvas.height=Math.floor(r.height*dpr);
}
window.addEventListener('resize',resizeCanvas,{passive:true}); resizeCanvas();

const assetPaths={
  petroman:'assets/sprites/petroman-spritesheet.png', enemies:'assets/sprites/enemy-spritesheet.png', objects:'assets/sprites/bubble-object-atlas.png',
  tiles:'assets/tiles/platform-tiles.png', ui:'assets/ui/ui-atlas.png', vfx:'assets/vfx/vfx-spritesheet.png', logo:'assets/ui/logo.png',
  title:'assets/ui/title-screen.png', victory:'assets/ui/victory-screen.png', defeat:'assets/ui/defeat-screen.png'
};
for(let i=1;i<=12;i++) assetPaths['bg'+i]=`assets/backgrounds/background-${i}.png`;
const assets={};
const audio={
  muted:false, unlocked:false, current:null, currentName:'', pending:'title',
  tracks:{title:new Audio('assets/audio/music-title.wav'),gameplay:new Audio('assets/audio/music-gameplay.wav'),boss:new Audio('assets/audio/music-boss.wav'),victory:new Audio('assets/audio/music-victory.wav'),defeat:new Audio('assets/audio/music-defeat.wav')},
  sfxPaths:{jump:'assets/audio/jump.wav',shoot:'assets/audio/bubble-shoot.wav',bounce:'assets/audio/bubble-bounce.wav',trap:'assets/audio/trap.wav',pop:'assets/audio/pop.wav',combo:'assets/audio/combo.wav',collect:'assets/audio/collect.wav',powerup:'assets/audio/powerup.wav',hit:'assets/audio/hit.wav',clear:'assets/audio/clear.wav',start:'assets/audio/start.wav',bossHit:'assets/audio/boss-hit.wav',defeat:'assets/audio/defeat.wav',victory:'assets/audio/victory.wav',menu:'assets/audio/menu.wav'},
  unlock(){ if(this.unlocked)return; this.unlocked=true; this.playMusic(this.pending); },
  playMusic(name){ this.pending=name; if(!this.unlocked)return; if(this.currentName===name&&this.current&&!this.current.paused)return; if(this.current){this.current.pause();this.current.currentTime=0;} const t=this.tracks[name]; if(!t)return; this.current=t;this.currentName=name;t.loop=['title','gameplay','boss'].includes(name);t.volume=name==='gameplay'?0.24:0.30;t.muted=this.muted;t.currentTime=0;t.play().catch(()=>{}); },
  sfx(name,vol=.55){ if(this.muted||!this.unlocked||!this.sfxPaths[name])return; const a=new Audio(this.sfxPaths[name]);a.volume=vol;a.play().catch(()=>{}); },
  toggle(){this.muted=!this.muted;Object.values(this.tracks).forEach(t=>t.muted=this.muted);muteButton.textContent=this.muted?'SOUND OFF':'SOUND ON';muteButton.setAttribute('aria-pressed',String(this.muted));}
};

function loadAssets(){
 const entries=Object.entries(assetPaths); let count=0;
 return Promise.all(entries.map(([k,src])=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{assets[k]=im;count++;loadBar.style.width=`${Math.round(count/entries.length*100)}%`;loadText.textContent=count===entries.length?'Bubble systems ready!':`Loading production assets ${count}/${entries.length}`;res();};im.onerror=()=>rej(new Error('Could not load '+src));im.src=src;})));
}

const keys={left:false,right:false,jump:false,fire:false,down:false};
const pressed={jump:false,fire:false,pause:false};
const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyX:'fire',KeyK:'fire',KeyJ:'fire',ArrowDown:'down',KeyS:'down'};
window.addEventListener('keydown',e=>{
  if(map[e.code]){const k=map[e.code];if(k==='jump'&&!keys[k])pressed.jump=true;if(k==='fire'&&!keys[k])pressed.fire=true;keys[k]=true;e.preventDefault();}
  if(e.code==='KeyP'||e.code==='Escape'){pressed.pause=true;e.preventDefault();}
  if((e.code==='Enter'||e.code==='Space')&&['title','gameOver','victory'].includes(game.state)){audio.unlock();game.startRun();e.preventDefault();}
  else if((e.code==='Enter'||e.code==='Space')&&game.state==='levelClear'){audio.unlock();game.nextLevel();e.preventDefault();}
});
window.addEventListener('keyup',e=>{if(map[e.code]){keys[map[e.code]]=false;e.preventDefault();}});
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(game.state==='playing')game.togglePause();});
touchControls.querySelectorAll('button[data-key]').forEach(btn=>{
 const k=btn.dataset.key; const down=e=>{e.preventDefault();audio.unlock();if(k==='jump'&&!keys[k])pressed.jump=true;if(k==='fire'&&!keys[k])pressed.fire=true;keys[k]=true;btn.classList.add('active');};
 const up=e=>{e.preventDefault();keys[k]=false;btn.classList.remove('active');};
 btn.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up));
});
muteButton.addEventListener('click',e=>{e.stopPropagation();audio.unlock();audio.sfx('menu',.25);audio.toggle();});
pauseButton.addEventListener('click',e=>{e.stopPropagation();audio.unlock();audio.sfx('menu',.25);game.togglePause();});
canvas.addEventListener('pointerdown',e=>{audio.unlock();if(['title','gameOver','victory'].includes(game.state))game.startRun();else if(game.state==='levelClear')game.nextLevel();else if(game.state==='paused')game.togglePause();e.preventDefault();});

class Particle{
 constructor(x,y,opt={}){this.x=x;this.y=y;this.vx=opt.vx??rand(-150,150);this.vy=opt.vy??rand(-220,-40);this.life=this.maxLife=opt.life??rand(.4,.9);this.size=opt.size??rand(3,9);this.color=opt.color??choose(['#35eee0','#ffe85e','#ff5faf','#ff6d45','#8a68f0']);this.gravity=opt.gravity??430;this.shape=opt.shape??'circle';}
 update(dt){this.life-=dt;this.vy+=this.gravity*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=Math.pow(.12,dt);}
 draw(c){let a=clamp(this.life/this.maxLife,0,1);c.save();c.globalAlpha=a;c.fillStyle=this.color;c.translate(this.x,this.y);c.rotate(this.life*7);if(this.shape==='star'){c.beginPath();for(let i=0;i<10;i++){let an=-Math.PI/2+i*Math.PI/5,r=i%2?this.size*.42:this.size;c.lineTo(Math.cos(an)*r,Math.sin(an)*r);}c.fill();}else{c.beginPath();c.arc(0,0,this.size*a,0,Math.PI*2);c.fill();}c.restore();}
}
class FloatingText{
 constructor(x,y,text,color='#fff',size=22){this.x=x;this.y=y;this.text=text;this.color=color;this.size=size;this.life=this.maxLife=1;}
 update(dt){this.life-=dt;this.y-=50*dt;}
 draw(c){c.save();c.globalAlpha=clamp(this.life/this.maxLife,0,1);c.textAlign='center';c.font=`900 ${this.size}px Lato,system-ui`;c.lineWidth=5;c.strokeStyle='rgba(5,9,28,.8)';c.strokeText(this.text,this.x,this.y);c.fillStyle=this.color;c.fillText(this.text,this.x,this.y);c.restore();}
}
class SpriteVfx{
 constructor(x,y,row=0,scale=1,duration=.45){this.x=x;this.y=y;this.row=row;this.scale=scale;this.t=0;this.duration=duration;}
 update(dt){this.t+=dt;} get dead(){return this.t>=this.duration;}
 draw(c){const f=Math.min(7,Math.floor(this.t/this.duration*8));const s=64*this.scale;c.save();if(this.row===3)c.globalCompositeOperation='screen';c.drawImage(assets.vfx,f*64,this.row*64,64,64,this.x-s/2,this.y-s/2,s,s);c.restore();}
}

const levels=[
{name:'Mango Metro Bubbleworks',time:84,theme:0,platforms:[[0,500,960,40],[58,407,220,24],[360,424,230,24],[675,397,225,24],[180,306,230,24],[515,300,225,24],[80,205,180,24],[370,194,220,24],[710,205,165,24]],enemies:[['slime',115,355],['slime',750,345],['goblin',430,370],['bat',480,120]]},
{name:'Fizzpipe Foundry',time:82,theme:0,platforms:[[0,500,960,40],[75,430,180,24],[315,430,165,24],[545,430,170,24],[780,430,125,24],[165,330,190,24],[455,330,175,24],[710,330,170,24],[35,230,170,24],[315,225,330,24],[760,230,165,24]],enemies:[['slime',105,380],['goblin',365,380],['goblin',740,280],['bat',390,145],['bat',800,150]]},
{name:'Skyglass Station',time:80,theme:0,platforms:[[0,500,960,40],[40,405,255,24],[385,405,190,24],[670,405,250,24],[145,300,190,24],[390,285,180,24],[635,300,190,24],[40,190,215,24],[350,185,260,24],[700,190,210,24]],enemies:[['slime',80,355],['slime',815,355],['goblin',460,350],['bat',195,120],['bat',745,120],['bot',460,130]]},
{name:'Petro Plaza Panic',time:78,theme:1,platforms:[[0,500,960,40],[55,423,170,24],[285,423,170,24],[515,423,170,24],[745,423,160,24],[125,320,215,24],[375,320,210,24],[620,320,215,24],[50,215,170,24],[260,205,180,24],[520,205,180,24],[750,215,160,24]],enemies:[['goblin',95,372],['bot',325,372],['slime',560,372],['bot',775,372],['bat',300,130],['bat',650,130]]},
{name:'Neon Tank District',time:76,theme:1,platforms:[[0,500,960,40],[20,414,170,24],[235,445,210,24],[500,414,185,24],[735,445,205,24],[90,315,220,24],[380,330,200,24],[655,315,220,24],[210,210,205,24],[535,210,205,24],[395,115,170,24]],enemies:[['bot',65,362],['slime',300,395],['goblin',550,362],['bot',790,395],['bat',270,135],['bat',640,135],['slime',450,65]]},
{name:'Pressure Tower',time:74,theme:1,platforms:[[0,500,960,40],[80,430,230,24],[650,430,230,24],[350,400,260,24],[20,310,190,24],[280,300,170,24],[510,300,170,24],[750,310,190,24],[135,200,230,24],[595,200,230,24],[390,145,180,24]],enemies:[['goblin',120,380],['goblin',720,380],['bot',430,350],['bat',95,235],['bat',800,235],['slime',190,150],['slime',680,150]]},
{name:'Cloud Canal',time:72,theme:2,platforms:[[0,500,960,40],[45,420,220,24],[350,420,260,24],[695,420,220,24],[135,315,220,24],[605,315,220,24],[390,275,180,24],[30,205,185,24],[280,185,185,24],[535,185,185,24],[790,205,140,24]],enemies:[['slime',100,370],['bot',440,370],['slime',770,370],['bat',190,245],['bat',680,245],['goblin',335,135],['goblin',585,135]]},
{name:'Aqua Airlock',time:70,theme:2,platforms:[[0,500,960,40],[65,430,150,24],[275,430,150,24],[535,430,150,24],[745,430,150,24],[145,330,180,24],[390,345,180,24],[635,330,180,24],[60,225,210,24],[375,220,210,24],[690,225,210,24],[405,115,150,24]],enemies:[['bot',100,380],['bot',310,380],['goblin',570,380],['goblin',780,380],['bat',190,155],['bat',760,155],['slime',440,65],['slime',450,295]]},
{name:'Bubble Reactor Core',time:68,theme:2,platforms:[[0,500,960,40],[20,420,250,24],[355,420,250,24],[690,420,250,24],[120,315,180,24],[390,315,180,24],[660,315,180,24],[35,205,160,24],[255,205,180,24],[525,205,180,24],[765,205,160,24],[385,105,190,24]],enemies:[['slime',65,370],['goblin',410,370],['bot',735,370],['bat',160,245],['bat',720,245],['goblin',295,155],['bot',570,155],['slime',450,55]]},
{name:'Greenbelt Gardens',time:66,theme:3,platforms:[[0,500,960,40],[55,425,190,24],[305,425,150,24],[510,425,150,24],[715,425,190,24],[130,325,190,24],[385,325,190,24],[640,325,190,24],[45,220,175,24],[285,220,175,24],[525,220,175,24],[765,220,150,24],[385,120,190,24]],enemies:[['goblin',100,375],['slime',340,375],['slime',550,375],['goblin',760,375],['bat',170,150],['bat',790,150],['bot',325,170],['bot',590,170],['slime',445,70]]},
{name:'Mango Moonworks',time:64,theme:3,platforms:[[0,500,960,40],[30,435,220,24],[370,435,220,24],[710,435,220,24],[110,330,230,24],[620,330,230,24],[390,300,180,24],[35,215,190,24],[285,205,180,24],[515,205,180,24],[745,215,180,24],[390,110,180,24]],enemies:[['bot',80,385],['goblin',430,385],['bot',760,385],['bat',160,260],['bat',730,260],['slime',340,155],['slime',570,155],['goblin',445,60],['bat',465,230]]},
{name:'Smog King Citadel',time:99,theme:3,boss:true,platforms:[[0,500,960,40],[40,405,200,24],[300,430,160,24],[500,430,160,24],[720,405,200,24],[140,300,200,24],[620,300,200,24],[390,280,180,24],[70,190,175,24],[290,175,170,24],[500,175,170,24],[715,190,175,24]],enemies:[['boss',430,340],['bat',140,120],['bat',770,120],['goblin',170,250],['bot',700,250]]}
];

function tileFrame(theme,index=0){return {sx:(index%8)*64,sy:theme*64};}
function drawPlatform(c,p,theme){
 const fr=tileFrame(theme,Math.floor(p.x/64)%8); c.save(); c.beginPath();c.rect(p.x,p.y,p.w,p.h);c.clip();
 for(let x=p.x-((p.x)%64);x<p.x+p.w;x+=64)c.drawImage(assets.tiles,fr.sx,fr.sy,64,64,x,p.y,64,64); c.restore();
 c.fillStyle='rgba(255,255,255,.14)';c.fillRect(p.x,p.y,p.w,3);
}

class Bubble{
 constructor(x,y,dir,owner='player'){
   this.x=x;this.y=y;this.w=44;this.h=44;this.vx=dir*355;this.vy=-15;this.dir=dir;this.age=0;this.life=5.8;this.mode='shot';this.enemy=null;this.frameOffset=(Math.random()*8)|0;this.owner=owner;this.popQueued=false;
 }
 trap(enemy){this.mode='trapped';this.enemy={kind:enemy.kind,row:enemy.row,points:enemy.points};enemy.dead=true;this.vx*=.12;this.vy=-65;this.life=7.2;this.age=0;this.w=this.h=58;audio.sfx('trap',.58);game.vfx.push(new SpriteVfx(this.x+this.w/2,this.y+this.h/2,1,1.3,.55));game.floaters.push(new FloatingText(this.x+this.w/2,this.y,'TRAPPED!','#dcb5ff',18));}
 update(dt){
   this.age+=dt;this.life-=dt;
   if(this.mode==='shot'){
     this.vx*=Math.pow(.45,dt);this.vy-=8*dt;if(this.age>.65){this.mode='free';this.vy=-38;this.life=Math.min(this.life,4.1);}
   }else{this.vy=this.mode==='trapped'?-58:-35;this.vx=Math.sin((this.age+this.frameOffset)*2.2)*18;}
   this.x+=this.vx*dt;this.y+=this.vy*dt;
   if(this.x+this.w<0)this.x=W;if(this.x>W)this.x=-this.w;
   if(this.y<HUD_H+4){this.y=HUD_H+4;this.vy=Math.abs(this.vy)*.35;if(this.mode==='trapped'&&this.life<1.2)this.releaseEnemy();}
   if(this.life<=0){if(this.mode==='trapped')this.releaseEnemy();else this.pop(false);}
 }
 releaseEnemy(){if(!this.enemy||this.popQueued)return;const e=new Enemy(this.enemy.kind,this.x,this.y+25,true);game.enemies.push(e);game.floaters.push(new FloatingText(this.x+this.w/2,this.y,'ESCAPED!','#ff6c6c',18));this.enemy=null;this.pop(false);}
 pop(reward=true){if(this.popQueued)return;this.popQueued=true;game.vfx.push(new SpriteVfx(this.x+this.w/2,this.y+this.h/2,2,1.25,.38));for(let i=0;i<10;i++)game.particles.push(new Particle(this.x+this.w/2,this.y+this.h/2,{color:i%2?'#38f1df':'#ffffff',gravity:80,life:.45,size:rand(3,8)}));audio.sfx('pop',.48);if(this.enemy&&reward)game.enemyPopped(this);}
 draw(c){
   const frame=(Math.floor(this.age*12)+this.frameOffset)%8;const row=this.mode==='trapped'?1:0;c.save();c.globalAlpha=clamp(this.life<.7?this.life/.7:1,.15,1);c.drawImage(assets.objects,frame*64,row*64,64,64,this.x-8,this.y-8,this.w+16,this.h+16);
   if(this.mode==='trapped'&&this.enemy){const f=Math.floor(this.age*8)%4;c.globalAlpha=.85;c.drawImage(assets.enemies,f*96,this.enemy.row*96,96,96,this.x+7,this.y+7,this.w-14,this.h-14);}c.restore();
 }
}

const enemyRows={slime:0,goblin:1,bat:2,bot:3,boss:4};
class Enemy{
 constructor(kind,x,y,angry=false){this.kind=kind;this.row=enemyRows[kind];this.x=x;this.y=y;this.w=kind==='boss'?88:50;this.h=kind==='boss'?78:50;this.vx=(Math.random()<.5?-1:1)*(kind==='bat'?95:kind==='boss'?80:72);this.vy=0;this.onGround=false;this.dead=false;this.angry=angry;this.t=rand(0,4);this.jumpTimer=rand(.7,2.2);this.shootTimer=rand(1.3,2.6);this.hp=kind==='boss'?18:1;this.points={slime:300,goblin:450,bat:550,bot:700,boss:6000}[kind];}
 update(dt){
   if(this.dead)return;this.t+=dt;this.jumpTimer-=dt;this.shootTimer-=dt;
   const p=game.player;if(this.kind==='bat'){
     this.vx+=(Math.sign((p.x-p.w/2)-this.x)*35)*dt;this.vx=clamp(this.vx,-145,145);this.vy=Math.sin(this.t*2.3)*75+clamp((p.y-this.y)*.17,-55,55);this.x+=this.vx*dt;this.y+=this.vy*dt;this.y=clamp(this.y,HUD_H+30,455);
   }else if(this.kind==='boss'){
     this.vx+=(Math.sign(p.x-this.x)*28)*dt;this.vx=clamp(this.vx,-105,105);this.vy+=900*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;resolvePlatforms(this,true);
     if(this.jumpTimer<=0&&this.onGround){this.vy=-rand(400,520);this.jumpTimer=rand(1.0,1.7);}
     if(this.shootTimer<=0){this.shootTimer=rand(1.2,2);game.hazards.push(new SmogOrb(this.x+this.w/2,this.y+25,Math.sign(p.x-this.x)||1));}
   }else{
     let speed=this.angry?145:(this.kind==='bot'?110:80);if(this.kind==='bot'&&Math.abs(p.y-this.y)<70)this.vx=Math.sign(p.x-this.x)*speed;else if(Math.abs(this.vx)<speed*.65)this.vx=Math.sign(this.vx||1)*speed;
     this.vy+=900*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;resolvePlatforms(this,true);
     if((this.kind==='goblin'||this.kind==='slime')&&this.jumpTimer<=0&&this.onGround){this.vy=-(this.angry?500:410);this.jumpTimer=rand(1.1,2.6);}
   }
   if(this.x+this.w<0)this.x=W;if(this.x>W)this.x=-this.w;
   if(this.y>H+80){this.y=80;this.vy=0;}
   if(overlap(this,p)&&p.invuln<=0)game.hurtPlayer();
 }
 hitByBubble(b){
   if(this.kind==='boss'){
     this.hp--;b.pop(false);audio.sfx('bossHit',.55);game.vfx.push(new SpriteVfx(this.x+this.w/2,this.y+this.h/2,2,1.6,.44));game.floaters.push(new FloatingText(this.x+this.w/2,this.y,`BOSS ${this.hp}/18`,'#ffd853',20));this.vx*=-1;this.vy=-160;
     if(this.hp<=0){this.dead=true;game.score+=this.points;game.items.push(new Item(this.x+this.w/2-18,this.y+this.h/2-18,7));game.vfx.push(new SpriteVfx(this.x+this.w/2,this.y+this.h/2,3,3,.9));for(let i=0;i<55;i++)game.particles.push(new Particle(this.x+this.w/2,this.y+this.h/2,{shape:'star',gravity:180,life:rand(.6,1.3),size:rand(5,14)}));audio.sfx('combo',.75);}
   }else b.trap(this);
 }
 draw(c){if(this.dead)return;const f=(Math.floor(this.t*8)%4);c.save();if(this.angry){c.shadowColor='#ff3c5f';c.shadowBlur=12;}c.drawImage(assets.enemies,f*96,this.row*96,96,96,this.x-18,this.y-20,this.w+36,this.h+32);c.restore();if(this.kind==='boss'){c.fillStyle='rgba(8,12,30,.85)';c.fillRect(this.x-5,this.y-13,this.w+10,8);c.fillStyle='#ff5b62';c.fillRect(this.x-3,this.y-11,(this.w+6)*clamp(this.hp/18,0,1),4);}}
}
class SmogOrb{
 constructor(x,y,dir){this.x=x;this.y=y;this.w=26;this.h=26;this.vx=dir*190;this.vy=-60;this.life=4;this.t=0;this.dead=false;}
 update(dt){this.t+=dt;this.life-=dt;this.vy+=200*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x<0||this.x>W||this.y>H||this.life<=0)this.dead=true;if(overlap(this,game.player)&&game.player.invuln<=0){this.dead=true;game.hurtPlayer();}}
 draw(c){c.save();c.translate(this.x+13,this.y+13);c.rotate(this.t*4);c.fillStyle='rgba(138,76,214,.85)';c.strokeStyle='#171326';c.lineWidth=4;c.beginPath();for(let i=0;i<16;i++){let a=i*Math.PI/8,r=i%2?10:15;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();c.restore();}
}
class Item{
 constructor(x,y,type=0){this.x=x;this.y=y;this.w=36;this.h=36;this.type=type;this.vy=-190;this.vx=rand(-75,75);this.life=9;this.t=0;this.dead=false;}
 update(dt){this.t+=dt;this.life-=dt;this.vy+=760*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;resolvePlatforms(this,true);if(this.onGround)this.vx*=Math.pow(.1,dt);if(this.x<0)this.x=W;if(this.x>W)this.x=-this.w;if(this.life<=0)this.dead=true;if(overlap(this,game.player)){this.collect();}}
 collect(){if(this.dead)return;this.dead=true;let points=500,color='#35eee0';if(this.type===1){points=1000;color='#ffd53c';}else if(this.type===2){game.player.maxBubbles=Math.min(8,game.player.maxBubbles+1);game.player.bubbleCooldown=Math.max(.16,game.player.bubbleCooldown-.025);points=1200;color='#9dffff';audio.sfx('powerup',.65);}else if(this.type===3){game.player.speedBoost=12;points=900;color='#ff6f59';audio.sfx('powerup',.65);}else if(this.type===4){game.lives++;points=2000;color='#ffef6e';audio.sfx('powerup',.7);}else if(this.type===5){game.player.shield=12;points=1300;color='#c5a5ff';audio.sfx('powerup',.65);}else if(this.type===6){game.timeLeft+=15;points=700;color='#fff';}else if(this.type===7){points=5000;color='#ffd53c';audio.sfx('combo',.7);}else audio.sfx('collect',.48);game.score+=points;game.floaters.push(new FloatingText(this.x+18,this.y,`+${points}`,color,21));game.vfx.push(new SpriteVfx(this.x+18,this.y+18,0,1,.35));for(let i=0;i<10;i++)game.particles.push(new Particle(this.x+18,this.y+18,{shape:'star',color,gravity:160}));}
 draw(c){const bob=Math.sin(this.t*5)*5;c.drawImage(assets.objects,this.type*64,3*64,64,64,this.x-7,this.y-7+bob,this.w+14,this.h+14);}
}

class Player{
 constructor(){this.x=55;this.y=430;this.w=42;this.h=58;this.vx=0;this.vy=0;this.onGround=false;this.facing=1;this.t=0;this.anim='idle';this.fireTimer=0;this.bubbleCooldown=.30;this.maxBubbles=4;this.invuln=1.5;this.shield=0;this.speedBoost=0;this.dead=false;}
 update(dt){
   this.t+=dt;this.fireTimer=Math.max(0,this.fireTimer-dt);this.invuln=Math.max(0,this.invuln-dt);this.shield=Math.max(0,this.shield-dt);this.speedBoost=Math.max(0,this.speedBoost-dt);
   const speed=this.speedBoost>0?300:235;let target=0;if(keys.left)target-=speed;if(keys.right)target+=speed;this.vx+=(target-this.vx)*Math.min(1,dt*13);if(Math.abs(target)<1)this.vx*=Math.pow(.012,dt);if(target)this.facing=Math.sign(target);
   if(pressed.jump&&this.onGround){this.vy=-510;this.onGround=false;audio.sfx('jump',.43);game.vfx.push(new SpriteVfx(this.x+this.w/2,this.y+this.h,0,.75,.28));}
   if(pressed.fire)this.fire();
   this.vy+=980*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;resolvePlatforms(this,false);
   if(this.x+this.w<0)this.x=W;if(this.x>W)this.x=-this.w;if(this.y>H+70)game.hurtPlayer(true);
   // pop or bounce bubbles by contact
   for(const b of game.bubbles){if(b.popQueued||!overlap(this,b))continue; if(b.mode==='trapped'){b.pop(true);this.vy=-260;}else if(this.vy>100&&this.y+this.h-b.y<25){this.vy=-420;b.pop(false);audio.sfx('bounce',.42);}}
   if(this.vy<-45)this.anim='jump';else if(this.vy>85&&!this.onGround)this.anim='fall';else if(Math.abs(this.vx)>35)this.anim='run';else this.anim='idle';
 }
 fire(){
   if(this.fireTimer>0||game.bubbles.filter(b=>!b.popQueued).length>=this.maxBubbles)return;this.fireTimer=this.bubbleCooldown;const b=new Bubble(this.facing>0?this.x+this.w-3:this.x-38,this.y+12,this.facing);game.bubbles.push(b);audio.sfx('shoot',.45);game.vfx.push(new SpriteVfx(this.facing>0?this.x+this.w:this.x,this.y+24,0,.8,.32));this.anim='fire';
 }
 draw(c){
   if(this.invuln>0&&Math.floor(this.invuln*12)%2===0)return;let frame=0;if(this.anim==='idle')frame=Math.floor(this.t*4)%2;else if(this.anim==='run')frame=2+Math.floor(this.t*11)%4;else if(this.anim==='jump')frame=6;else if(this.anim==='fall')frame=7;else if(this.anim==='fire')frame=8+Math.floor(this.fireTimer/.08)%3;
   c.save();if(this.shield>0){c.strokeStyle='rgba(175,126,255,.9)';c.fillStyle='rgba(90,235,230,.09)';c.lineWidth=5;c.beginPath();c.arc(this.x+this.w/2,this.y+this.h/2,42+Math.sin(this.t*5)*3,0,Math.PI*2);c.fill();c.stroke();}
   if(this.facing<0){c.translate(this.x+this.w/2,0);c.scale(-1,1);c.translate(-(this.x+this.w/2),0);}c.drawImage(assets.petroman,frame*96,0,96,96,this.x-25,this.y-22,this.w+50,this.h+38);c.restore();
 }
}

function resolvePlatforms(o,isEnemy){
 o.onGround=false;const oldBottom=o.y+o.h-o.vy*(1/60);
 for(const p of game.platforms){
   if(o.x+o.w<=p.x+3||o.x>=p.x+p.w-3)continue;
   if(o.y+o.h>=p.y&&oldBottom<=p.y+Math.max(10,Math.abs(o.vy)*.03)&&o.vy>=0){o.y=p.y-o.h;o.vy=0;o.onGround=true;}
 }
 if(o.y+o.h>H){o.y=H-o.h;o.vy=0;o.onGround=true;}
}

const game={
 state:'loading',score:0,high:Number(localStorage.getItem('petromanBubbleBlitzHigh')||0),lives:3,levelIndex:0,timeLeft:0,combo:0,comboTimer:0,stageTimer:0,angryTriggered:false,
 player:null,platforms:[],enemies:[],bubbles:[],items:[],particles:[],floaters:[],vfx:[],hazards:[],shake:0,transition:0,lastTime:0,
 startRun(){audio.sfx('start',.55);this.score=0;this.lives=3;this.levelIndex=0;this.loadLevel();},
 loadLevel(){const l=levels[this.levelIndex];this.state='playing';this.platforms=l.platforms.map(p=>({x:p[0],y:p[1],w:p[2],h:p[3]}));this.player=new Player();this.enemies=l.enemies.map(e=>new Enemy(e[0],e[1],e[2]));this.bubbles=[];this.items=[];this.particles=[];this.floaters=[];this.vfx=[];this.hazards=[];this.timeLeft=l.time;this.combo=0;this.comboTimer=0;this.stageTimer=0;this.angryTriggered=false;this.transition=1;audio.playMusic(l.boss?'boss':'gameplay');},
 nextLevel(){if(this.levelIndex>=levels.length-1){this.win();return;}this.levelIndex++;this.loadLevel();},
 enemyPopped(b){
   this.combo=this.comboTimer>0?this.combo+1:1;this.comboTimer=2.1;const multiplier=Math.min(8,this.combo);const pts=(b.enemy?.points||300)*multiplier;this.score+=pts;const c=b.enemy?.kind==='bot'?'#ff9b45':b.enemy?.kind==='bat'?'#68c7ff':b.enemy?.kind==='goblin'?'#76e672':'#c69bff';this.floaters.push(new FloatingText(b.x+b.w/2,b.y,`${multiplier}x +${pts}`,c,20+Math.min(10,multiplier)));
   if(multiplier>=3)audio.sfx('combo',.58);let type=0;const roll=Math.random();if(roll<.07)type=2;else if(roll<.12)type=3;else if(roll<.155)type=5;else if(roll<.18)type=6;else if(roll<.19)type=4;else if(roll<.35)type=1;this.items.push(new Item(b.x+b.w/2-18,b.y+b.h/2-18,type));b.enemy=null;
 },
 hurtPlayer(fell=false){
   if(this.player.shield>0){this.player.shield=0;this.player.invuln=1.2;this.shake=.3;audio.sfx('hit',.28);return;}if(this.player.invuln>0)return;this.lives--;this.shake=.55;audio.sfx('hit',.65);this.vfx.push(new SpriteVfx(this.player.x+this.player.w/2,this.player.y+this.player.h/2,2,1.6,.5));for(let i=0;i<24;i++)this.particles.push(new Particle(this.player.x+20,this.player.y+25,{color:i%2?'#ff674f':'#ffd83d',shape:'star'}));
   if(this.lives<=0){this.lose();return;}this.player.x=55;this.player.y=420;this.player.vx=0;this.player.vy=0;this.player.invuln=2.5;this.bubbles.forEach(b=>{if(!b.popQueued)b.pop(false);});
 },
 clearLevel(){if(this.state!=='playing')return;this.state='levelClear';const bonus=Math.max(0,Math.floor(this.timeLeft))*100;this.score+=bonus;audio.sfx('clear',.7);this.vfx.push(new SpriteVfx(W/2,H/2,3,4.5,1));this.transition=0;},
 win(){this.state='victory';this.high=Math.max(this.high,this.score);localStorage.setItem('petromanBubbleBlitzHigh',String(this.high));audio.playMusic('victory');audio.sfx('victory',.75);},
 lose(){this.state='gameOver';this.high=Math.max(this.high,this.score);localStorage.setItem('petromanBubbleBlitzHigh',String(this.high));audio.playMusic('defeat');audio.sfx('defeat',.75);},
 togglePause(){if(this.state==='playing'){this.state='paused';if(audio.current)audio.current.pause();}else if(this.state==='paused'){this.state='playing';audio.playMusic(levels[this.levelIndex].boss?'boss':'gameplay');}},
 update(dt){
   if(pressed.pause){this.togglePause();pressed.pause=false;}if(this.state!=='playing'){pressed.jump=pressed.fire=false;return;}
   this.stageTimer+=dt;this.timeLeft-=dt;this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;this.transition=Math.max(0,this.transition-dt*1.8);this.shake=Math.max(0,this.shake-dt);
   if(this.timeLeft<=18&&!this.angryTriggered){this.angryTriggered=true;this.enemies.forEach(e=>{if(!e.dead)e.angry=true;});this.floaters.push(new FloatingText(W/2,130,'SMOG SURGE!','#ff5c68',34));}
   if(this.timeLeft<=0){this.timeLeft=0;this.enemies.forEach(e=>{if(!e.dead)e.angry=true;e.vx*=1.35;});}
   this.player.update(dt);this.enemies.forEach(e=>e.update(dt));this.bubbles.forEach(b=>b.update(dt));this.items.forEach(i=>i.update(dt));this.hazards.forEach(h=>h.update(dt));this.particles.forEach(p=>p.update(dt));this.floaters.forEach(f=>f.update(dt));this.vfx.forEach(v=>v.update(dt));
   // bubble/enemy collision
   for(const b of this.bubbles){if(b.popQueued||b.mode!=='shot')continue;for(const e of this.enemies){if(e.dead)continue;if(overlap(b,e)){e.hitByBubble(b);break;}}}
   // projectile pops trapped bubble
   for(let i=0;i<this.bubbles.length;i++){const a=this.bubbles[i];if(a.popQueued||a.mode!=='shot')continue;for(let j=0;j<this.bubbles.length;j++){if(i===j)continue;const b=this.bubbles[j];if(b.popQueued||b.mode!=='trapped')continue;if(overlap(a,b)){a.pop(false);b.pop(true);break;}}}
   this.bubbles=this.bubbles.filter(b=>!b.popQueued);this.enemies=this.enemies.filter(e=>!e.dead);this.items=this.items.filter(i=>!i.dead);this.hazards=this.hazards.filter(h=>!h.dead);this.particles=this.particles.filter(p=>p.life>0);this.floaters=this.floaters.filter(f=>f.life>0);this.vfx=this.vfx.filter(v=>!v.dead);
   const bossAlive=this.enemies.some(e=>e.kind==='boss');const normalAlive=this.enemies.some(e=>e.kind!=='boss');const trapped=this.bubbles.some(b=>b.mode==='trapped');
   const crownWaiting=this.items.some(i=>i.type===7&&!i.dead);if(!bossAlive&&!normalAlive&&!trapped&&!crownWaiting)this.clearLevel();pressed.jump=pressed.fire=false;
 },
 draw(){
   const scaleX=canvas.width/W,scaleY=canvas.height/H;cReset();ctx.save();ctx.scale(scaleX,scaleY);let sx=this.shake?rand(-this.shake*12,this.shake*12):0,sy=this.shake?rand(-this.shake*8,this.shake*8):0;ctx.translate(sx,sy);
   if(this.state==='loading'){ctx.restore();return;}
   if(this.state==='title'){ctx.drawImage(assets.title,0,0,W,H);ctx.restore();return;}
   if(this.state==='victory'){ctx.drawImage(assets.victory,0,0,W,H);this.drawEndScore();ctx.restore();return;}
   if(this.state==='gameOver'){ctx.drawImage(assets.defeat,0,0,W,H);this.drawEndScore();ctx.restore();return;}
   this.drawWorld(ctx);if(this.state==='levelClear')this.drawLevelClear(ctx);if(this.state==='paused')this.drawPaused(ctx);ctx.restore();
 },
 drawWorld(c){
   const l=levels[this.levelIndex];c.drawImage(assets['bg'+(this.levelIndex+1)],0,0,W,H);c.fillStyle='rgba(5,10,28,.20)';c.fillRect(0,HUD_H,W,H-HUD_H);this.platforms.forEach(p=>drawPlatform(c,p,l.theme));
   this.items.forEach(i=>i.draw(c));this.bubbles.filter(b=>b.mode!=='trapped').forEach(b=>b.draw(c));this.enemies.forEach(e=>e.draw(c));this.bubbles.filter(b=>b.mode==='trapped').forEach(b=>b.draw(c));this.hazards.forEach(h=>h.draw(c));this.player.draw(c);this.vfx.forEach(v=>v.draw(c));this.particles.forEach(p=>p.draw(c));this.floaters.forEach(f=>f.draw(c));this.drawHud(c);
   if(this.transition>0){c.fillStyle=`rgba(7,11,32,${this.transition*.85})`;c.fillRect(0,0,W,H);c.save();c.globalAlpha=this.transition;c.textAlign='center';c.font='900 44px Lato,system-ui';c.lineWidth=7;c.strokeStyle='#11152b';c.strokeText(`STAGE ${this.levelIndex+1}`,W/2,H/2-12);c.fillStyle='#fff';c.fillText(`STAGE ${this.levelIndex+1}`,W/2,H/2-12);c.font='800 24px Lato,system-ui';c.fillStyle='#56f5e6';c.fillText(l.name,W/2,H/2+28);c.restore();}
 },
 drawHud(c){
   c.fillStyle='rgba(6,10,28,.92)';c.fillRect(0,0,W,HUD_H);c.strokeStyle='rgba(61,240,224,.55)';c.lineWidth=2;c.beginPath();c.moveTo(0,HUD_H-1);c.lineTo(W,HUD_H-1);c.stroke();
   const icon=(idx,x)=>c.drawImage(assets.ui,(idx%8)*64,Math.floor(idx/8)*64,64,64,x,4,44,44);icon(0,14);icon(1,202);icon(2,329);icon(4,471);icon(5,610);
   const txt=(t,x,color='#fff',align='left',size=21)=>{c.font=`900 ${size}px Lato,system-ui`;c.textAlign=align;c.lineWidth=4;c.strokeStyle='#0a0d20';c.strokeText(t,x,34);c.fillStyle=color;c.fillText(t,x,34);};
   txt(String(this.score).padStart(7,'0'),62,'#fff');txt(`x ${this.lives}`,251,'#ffd84c');txt(`${this.levelIndex+1}/12`,378,'#5df2e4');txt(String(Math.ceil(this.timeLeft)).padStart(2,'0'),520,this.timeLeft<18?'#ff626a':'#fff');txt(`${this.bubbles.length}/${this.player.maxBubbles}`,659,'#a7fff7');
   txt(`HI ${String(this.high).padStart(7,'0')}`,936,'#ffdf58','right',18);
   if(this.combo>1){icon(3,753);txt(`${this.combo}x`,804,'#ff73ba', 'left',22);}
   if(levels[this.levelIndex].boss){const b=this.enemies.find(e=>e.kind==='boss');if(b){c.fillStyle='rgba(8,12,30,.88)';c.fillRect(322,57,316,15);c.fillStyle='#ff5a69';c.fillRect(326,61,308*(b.hp/18),7);c.font='800 12px Lato';c.textAlign='center';c.fillStyle='#fff';c.fillText('SMOG KING',480,69);}}
 },
 drawLevelClear(c){c.fillStyle='rgba(4,9,28,.62)';c.fillRect(0,0,W,H);c.textAlign='center';c.font='900 52px Lato,system-ui';c.lineWidth=8;c.strokeStyle='#10142a';c.strokeText('STAGE PURIFIED!',W/2,220);c.fillStyle='#ffdf4b';c.fillText('STAGE PURIFIED!',W/2,220);c.font='900 28px Lato,system-ui';c.fillStyle='#61f5e8';c.strokeText(`TIME BONUS +${Math.floor(this.timeLeft)*100}`,W/2,270);c.fillText(`TIME BONUS +${Math.floor(this.timeLeft)*100}`,W/2,270);c.font='800 20px Lato';c.fillStyle='#fff';c.fillText('Press Enter / tap for the next stage',W/2,325);},
 drawPaused(c){c.fillStyle='rgba(3,7,24,.78)';c.fillRect(0,0,W,H);c.textAlign='center';c.font='900 58px Lato';c.fillStyle='#fff';c.strokeStyle='#12162f';c.lineWidth=8;c.strokeText('PAUSED',W/2,250);c.fillText('PAUSED',W/2,250);c.font='800 20px Lato';c.fillStyle='#5cf4e6';c.fillText('Press P, Escape, or tap to continue',W/2,295);},
 drawEndScore(){ctx.save();ctx.textAlign='center';ctx.font='900 23px Lato';ctx.lineWidth=5;ctx.strokeStyle='#0c1028';ctx.strokeText(`SCORE ${String(this.score).padStart(7,'0')}   •   HIGH ${String(this.high).padStart(7,'0')}`,W/2,446);ctx.fillStyle='#fff';ctx.fillText(`SCORE ${String(this.score).padStart(7,'0')}   •   HIGH ${String(this.high).padStart(7,'0')}`,W/2,446);ctx.restore();}
};
window.__PETROMAN_BUBBLE_BLITZ__ = game;
function cReset(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;}

function loop(t){const dt=Math.min(.033,(t-game.lastTime)/1000||0);game.lastTime=t;game.update(dt);game.draw();requestAnimationFrame(loop);}
// Sponsor-funded boost. On game over it revives the stage in place; mid-run it
// adds a life plus a shield and a stretch of invulnerability.
window.MMARewardBridge?.({
  slug:'petroman-bubble-blitz',
  label:'Bubble boost',
  onGrant(){
    if(game.state==='gameOver'){
      game.lives=2;
      game.state='playing';
      audio.playMusic(levels[game.levelIndex]&&levels[game.levelIndex].boss?'boss':'gameplay');
    }else{
      game.lives=Math.min(9,game.lives+1);
    }
    if(game.player){
      game.player.x=55;game.player.y=420;game.player.vx=0;game.player.vy=0;
      game.player.invuln=Math.max(game.player.invuln,6);
      game.player.shield=1;
    }
    game.score+=500;
    game.shake=.4;
    audio.sfx('start',.6);
  },
});

loadAssets().then(()=>{setTimeout(()=>{loading.classList.add('hidden');game.state='title';audio.playMusic('title');requestAnimationFrame(loop);},300);}).catch(err=>{loadText.textContent='Asset loading failed: '+err.message;console.error(err);});
})();
