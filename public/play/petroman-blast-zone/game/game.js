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

const W = 1280, H = 720;
const TILE = 48, GW = 17, GH = 13;
const AX = 24, AY = 76, AW = GW * TILE, AH = GH * TILE;
const PANEL_X = 872, PANEL_Y = 92;
const TAU = Math.PI * 2;
const DIRS = [{x:1,y:0,name:'right'},{x:-1,y:0,name:'left'},{x:0,y:1,name:'down'},{x:0,y:-1,name:'up'}];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const cellKey = (x,y)=>`${x},${y}`;
const centerOf = (x,y)=>({x:AX+x*TILE+TILE/2,y:AY+y*TILE+TILE/2});
const cellOf = (px,py)=>({x:Math.floor((px-AX)/TILE),y:Math.floor((py-AY)/TILE)});
const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

function fitCanvas(){
  const r=canvas.getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.floor(r.width*dpr));
  canvas.height=Math.max(1,Math.floor(r.height*dpr));
}
window.addEventListener('resize',fitCanvas,{passive:true}); fitCanvas();

const imagePaths = {
  title:'assets/ui/title-screen.png', victory:'assets/ui/victory-screen.png', defeat:'assets/ui/defeat-screen.png',
  clear:'assets/ui/stage-clear.png', pause:'assets/ui/pause.png', hud:'assets/ui/hud-frame.png', panel:'assets/ui/side-panel.png', icons:'assets/ui/ui-icons.png',
  petroman:'assets/sprites/petroman-spritesheet.png', enemies:'assets/sprites/enemy-spritesheet.png', bombs:'assets/sprites/purifier-bomb-atlas.png',
  pickups:'assets/sprites/pickups-atlas.png', vfx:'assets/sprites/vfx-spritesheet.png', objects:'assets/sprites/object-atlas-source.png', tiles:'assets/tiles/world-tiles.png'
};
for(let i=1;i<=6;i++) imagePaths['world'+i]=`assets/backgrounds/world-${i}.png`;
const img={};

const audio = {
  unlocked:false, muted:false, current:null, currentName:'', pending:'title',
  tracks:{
    title:new Audio('assets/audio/music-title.wav'),
    victory:new Audio('assets/audio/music-victory.wav'),
    defeat:new Audio('assets/audio/music-defeat.wav'),
    ...Object.fromEntries(Array.from({length:6},(_,i)=>[`world${i+1}`,new Audio(`assets/audio/music-world-${i+1}.wav`)]))
  },
  sfxPaths:{place:'assets/audio/bomb-place.wav',explode:'assets/audio/explosion.wav',kick:'assets/audio/kick.wav',power:'assets/audio/powerup.wav',collect:'assets/audio/collect.wav',hurt:'assets/audio/hit.wav',clear:'assets/audio/clear.wav',start:'assets/audio/start.wav',life:'assets/audio/extra-life.wav',enemy:'assets/audio/enemy-pop.wav'},
  unlock(){ if(this.unlocked)return; this.unlocked=true; this.playMusic(this.pending); },
  playMusic(name){
    this.pending=name; if(!this.unlocked)return;
    if(this.currentName===name&&this.current&&!this.current.paused)return;
    if(this.current){this.current.pause();this.current.currentTime=0;}
    const t=this.tracks[name]; if(!t)return;
    this.current=t; this.currentName=name; t.loop=!['victory','defeat'].includes(name); t.volume=name==='title'?0.34:0.27; t.muted=this.muted; t.currentTime=0; t.play().catch(()=>{});
  },
  sfx(name,vol=.55){ if(this.muted||!this.unlocked||!this.sfxPaths[name])return; const a=new Audio(this.sfxPaths[name]); a.volume=vol; a.play().catch(()=>{}); },
  toggle(){this.muted=!this.muted;Object.values(this.tracks).forEach(t=>t.muted=this.muted);muteButton.textContent=this.muted?'Sound off':'Sound on';muteButton.setAttribute('aria-pressed',String(this.muted));}
};

function loadImages(){
  const entries=Object.entries(imagePaths); let done=0;
  return Promise.all(entries.map(([k,src])=>new Promise((resolve,reject)=>{
    const im=new Image(); im.onload=()=>{img[k]=im;done++;loadBar.style.width=`${done/entries.length*100}%`;loadText.textContent=`Loading hand-drawn assets ${done}/${entries.length}`;resolve();}; im.onerror=()=>reject(new Error(`Missing asset: ${src}`)); im.src=src;
  })));
}

const keys={left:false,right:false,up:false,down:false,bomb:false,remote:false};
const pressed={bomb:false,remote:false,pause:false,start:false};
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'bomb',KeyX:'bomb',KeyK:'bomb',KeyC:'remote',KeyL:'remote'};
window.addEventListener('keydown',e=>{
  if(keyMap[e.code]){const k=keyMap[e.code]; if((k==='bomb'||k==='remote')&&!keys[k])pressed[k]=true; keys[k]=true; e.preventDefault();}
  if(e.code==='Escape'||e.code==='KeyP'){pressed.pause=true;e.preventDefault();}
  if(e.code==='Enter'||(e.code==='Space'&&['title','clear','defeat','victory','paused'].includes(game.state))){pressed.start=true;e.preventDefault();}
});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){keys[keyMap[e.code]]=false;e.preventDefault();}});
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(game.state==='playing')game.togglePause();});
touchControls.querySelectorAll('button[data-key]').forEach(btn=>{
  const k=btn.dataset.key;
  const down=e=>{e.preventDefault();audio.unlock();if((k==='bomb'||k==='remote')&&!keys[k])pressed[k]=true;keys[k]=true;btn.classList.add('active');};
  const up=e=>{e.preventDefault();keys[k]=false;btn.classList.remove('active');};
  btn.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up));
});
canvas.addEventListener('pointerdown',e=>{audio.unlock();pressed.start=true;e.preventDefault();});
muteButton.addEventListener('click',()=>{audio.unlock();audio.toggle();});
pauseButton.addEventListener('click',()=>{audio.unlock();game.togglePause();});

function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296;};}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}return a;}

const worlds=[
  {name:'Petro Park',tip:'Learn clean escapes before chasing big combos.'},
  {name:'Refinery Row',tip:'Use conveyor lanes to send moving charges around corners.'},
  {name:'Neon Grid',tip:'Teleport pads create fast flanks—and dangerous surprises.'},
  {name:'Crystal Core',tip:'Ice preserves momentum. Plan turns before the fuse runs out.'},
  {name:'Skyport 88',tip:'Open lanes reward bomb kicks and long chain reactions.'},
  {name:'Smog Citadel',tip:'Collect reactor cores to unlock fortress gates.'}
];

const levels=[
  {world:1,name:'Welcome to the Blast',pattern:'classic',density:.42,enemies:['wander','wander'],cores:0,gimmick:'none',time:105,seed:1101},
  {world:1,name:'Twin Reactor Lanes',pattern:'lanes',density:.48,enemies:['wander','wander','chaser'],cores:2,gimmick:'none',time:105,seed:1102},
  {world:1,name:'Garden Gridlock',pattern:'cross',density:.52,enemies:['wander','drill','drill','chaser'],cores:2,gimmick:'hazard',time:100,seed:1103,letter:0},
  {world:1,name:'Park Warden',pattern:'boss',density:.26,enemies:['boss','wander','wander'],cores:0,gimmick:'hazard',time:110,seed:1104,boss:true},

  {world:2,name:'Pipeway Express',pattern:'lanes',density:.50,enemies:['drill','drill','chaser'],cores:2,gimmick:'conveyor',time:100,seed:2201},
  {world:2,name:'Pressure Split',pattern:'split',density:.54,enemies:['wander','drill','patrol','chaser'],cores:3,gimmick:'hazard',time:100,seed:2202},
  {world:2,name:'Boiler Rings',pattern:'rings',density:.56,enemies:['drill','patrol','patrol','chaser','wander'],cores:3,gimmick:'conveyor-hazard',time:95,seed:2203,letter:1},
  {world:2,name:'Furnace Foreman',pattern:'fortress',density:.30,enemies:['boss','drill','drill'],cores:0,gimmick:'conveyor',time:110,seed:2204,boss:true},

  {world:3,name:'Blink Alley',pattern:'classic',density:.50,enemies:['drone','wander','chaser'],cores:2,gimmick:'teleport',time:95,seed:3301},
  {world:3,name:'Neon Quadrants',pattern:'split',density:.53,enemies:['drone','drone','patrol','chaser'],cores:3,gimmick:'teleport',time:95,seed:3302},
  {world:3,name:'Circuit Crossfire',pattern:'cross',density:.57,enemies:['drone','patrol','patrol','chaser','drill'],cores:4,gimmick:'teleport-hazard',time:90,seed:3303,letter:2},
  {world:3,name:'Cyber Sentinel',pattern:'boss',density:.24,enemies:['boss','drone','drone'],cores:0,gimmick:'teleport',time:105,seed:3304,boss:true},

  {world:4,name:'Frozen Rings',pattern:'rings',density:.49,enemies:['wander','patrol','chaser'],cores:2,gimmick:'ice',time:95,seed:4401},
  {world:4,name:'Prism Runways',pattern:'lanes',density:.53,enemies:['patrol','patrol','drone','chaser'],cores:3,gimmick:'ice',time:92,seed:4402},
  {world:4,name:'Shatterpoint',pattern:'split',density:.56,enemies:['drone','drill','patrol','chaser','chaser'],cores:4,gimmick:'ice-teleport',time:88,seed:4403,letter:3},
  {world:4,name:'Crystal Colossus',pattern:'boss',density:.22,enemies:['boss','patrol','drone'],cores:0,gimmick:'ice',time:105,seed:4404,boss:true},

  {world:5,name:'Runway Rush',pattern:'open',density:.46,enemies:['patrol','patrol','drone','chaser'],cores:3,gimmick:'conveyor',time:88,seed:5501},
  {world:5,name:'Storm Crossroads',pattern:'cross',density:.52,enemies:['drone','drone','patrol','chaser','drill'],cores:4,gimmick:'hazard',time:85,seed:5502},
  {world:5,name:'Cloud Ring Relay',pattern:'rings',density:.54,enemies:['patrol','drone','drone','chaser','chaser'],cores:4,gimmick:'teleport-hazard',time:82,seed:5503,letter:4},
  {world:5,name:'Skyport Gunship',pattern:'boss',density:.20,enemies:['boss','drone','patrol'],cores:0,gimmick:'conveyor-hazard',time:100,seed:5504,boss:true},

  {world:6,name:'Citadel Gates',pattern:'fortress',density:.54,enemies:['drill','patrol','chaser','chaser'],cores:3,gimmick:'gates',time:90,seed:6601},
  {world:6,name:'Royal Divide',pattern:'split',density:.57,enemies:['drone','patrol','patrol','chaser','chaser'],cores:4,gimmick:'gates-teleport',time:86,seed:6602},
  {world:6,name:'Last Labyrinth',pattern:'rings',density:.60,enemies:['drone','drill','patrol','chaser','chaser','chaser'],cores:5,gimmick:'all',time:82,seed:6603},
  {world:6,name:'Smog King Showdown',pattern:'final',density:.18,enemies:['boss','boss','drone','patrol'],cores:0,gimmick:'all',time:120,seed:6604,boss:true,final:true}
];

function makeHard(pattern){
  const a=Array.from({length:GH},()=>Array(GW).fill(false));
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(x===0||y===0||x===GW-1||y===GH-1)a[y][x]=true;
  const set=(x,y)=>{if(x>0&&y>0&&x<GW-1&&y<GH-1)a[y][x]=true;};
  if(pattern==='classic'){
    for(let y=2;y<GH-1;y+=2)for(let x=2;x<GW-1;x+=2)set(x,y);
  }else if(pattern==='lanes'){
    for(let x of [4,8,12])for(let y=2;y<GH-1;y++)if(y%4!==1)set(x,y);
    for(let y of [4,8])for(let x=2;x<GW-1;x+=4)set(x,y);
  }else if(pattern==='cross'){
    for(let y=2;y<GH-1;y+=2)for(let x=2;x<GW-1;x+=2)if(x!==8&&y!==6)set(x,y);
    for(let x=3;x<14;x+=2)if(x!==7&&x!==9)set(x,6);
    for(let y=3;y<10;y+=2)if(y!==5&&y!==7)set(8,y);
  }else if(pattern==='rings'){
    for(let x=3;x<=13;x++)if(![5,8,11].includes(x)){set(x,3);set(x,9);}
    for(let y=4;y<=8;y++)if(y!==6){set(3,y);set(13,y);}
    for(let x=6;x<=10;x++)if(x!==8){set(x,5);set(x,7);}
    set(6,6);set(10,6);
  }else if(pattern==='split'){
    for(let y=2;y<GH-1;y++)if(![3,6,9].includes(y))set(8,y);
    for(let x=2;x<GW-1;x++)if(![4,8,12].includes(x))set(x,6);
    for(let y=2;y<GH-1;y+=4)for(let x=2;x<GW-1;x+=4)set(x,y);
  }else if(pattern==='open'){
    for(let y of [3,6,9])for(let x of [3,6,10,13])if((x+y)%3!==0)set(x,y);
  }else if(pattern==='fortress'){
    for(let x=4;x<=12;x++){if(![6,10].includes(x)){set(x,3);set(x,9);}}
    for(let y=4;y<=8;y++){if(y!==6){set(4,y);set(12,y);}}
    for(let y=2;y<GH-1;y+=2)for(let x=2;x<GW-1;x+=2)if(!(x>=4&&x<=12&&y>=3&&y<=9))set(x,y);
  }else if(pattern==='boss'||pattern==='final'){
    for(let y of [3,9])for(let x of [3,6,10,13])set(x,y);
    for(let y of [5,7])for(let x of [5,11])set(x,y);
    if(pattern==='final'){for(let x=3;x<=13;x+=2)set(x,6);a[6][7]=false;a[6][9]=false;}
  }
  // Always preserve clean spawn routes.
  [[1,1],[2,1],[1,2],[2,2],[3,1],[1,3]].forEach(([x,y])=>a[y][x]=false);
  return a;
}

function specialCells(gimmick){
  const conveyor=[],hazard=[],ice=[],teleports=[],gates=[];
  if(gimmick.includes('conveyor')||gimmick==='all'){
    for(let x=2;x<=14;x++)if(x!==8)conveyor.push({x,y:5,dir:x<8?0:1});
    for(let x=2;x<=14;x++)if(x!==8)conveyor.push({x,y:7,dir:x<8?1:0});
  }
  if(gimmick.includes('hazard')||gimmick==='all'){
    [[5,3],[11,3],[4,6],[12,6],[5,9],[11,9]].forEach(([x,y])=>hazard.push({x,y}));
  }
  if(gimmick.includes('ice')||gimmick==='all'){
    for(let y=4;y<=8;y++)for(let x=5;x<=11;x++)if((x+y)%2===0)ice.push({x,y});
  }
  if(gimmick.includes('teleport')||gimmick==='all'){
    teleports.push({x:2,y:10,pair:1},{x:14,y:2,pair:0});
    if(gimmick==='all')teleports.push({x:14,y:10,pair:3},{x:2,y:2,pair:2});
  }
  if(gimmick.includes('gates')||gimmick==='all'){
    gates.push({x:8,y:3},{x:8,y:9});
  }
  return {conveyor,hazard,ice,teleports,gates};
}

function buildStage(config){
  const r=rng(config.seed); const hard=makeHard(config.pattern); const specials=specialCells(config.gimmick);
  const reserved=new Set(['1,1','2,1','1,2','2,2','3,1','1,3']);
  for(const group of Object.values(specials))for(const c of group){reserved.add(cellKey(c.x,c.y));if(hard[c.y]&&hard[c.y][c.x]!==undefined)hard[c.y][c.x]=false;}
  const open=[];
  for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++)if(!hard[y][x]&&!reserved.has(cellKey(x,y)))open.push({x,y});
  shuffle(open,r);
  const soft=new Set();
  const target=Math.floor(open.length*config.density);
  for(let i=0;i<target;i++)soft.add(cellKey(open[i].x,open[i].y));
  const farCells=open.filter(c=>manhattan(c,{x:1,y:1})>10);
  const exitCell=farCells.find(c=>soft.has(cellKey(c.x,c.y)))||open[0]; soft.add(cellKey(exitCell.x,exitCell.y));
  const hidden=new Map([[cellKey(exitCell.x,exitCell.y),{kind:'exit'}]]);
  // Enemy spawn cells are kept clear and distributed around the field.
  const candidates=open.filter(c=>manhattan(c,{x:1,y:1})>8 && cellKey(c.x,c.y)!==cellKey(exitCell.x,exitCell.y));
  shuffle(candidates,r);
  const enemySpawns=[];
  for(let i=0;i<config.enemies.length;i++){
    const c=candidates[i]||{x:GW-2-(i%3),y:GH-2-Math.floor(i/3)}; soft.delete(cellKey(c.x,c.y)); enemySpawns.push({...c,type:config.enemies[i]});
  }
  // Hidden reactor cores.
  const softCells=()=>Array.from(soft).map(k=>{const [x,y]=k.split(',').map(Number);return{x,y};}).filter(c=>!hidden.has(cellKey(c.x,c.y)));
  let pool=shuffle(softCells(),r);
  for(let i=0;i<config.cores;i++){const c=pool.pop();if(c)hidden.set(cellKey(c.x,c.y),{kind:'core',type:i%4});}
  // Curated power-up distribution.
  const powerCount=config.boss?4:3+Math.min(3,Math.floor(config.world/2));
  pool=shuffle(softCells().filter(c=>!hidden.has(cellKey(c.x,c.y))),r);
  const types=[0,1,2,3,4];
  for(let i=0;i<powerCount;i++){const c=pool.pop();if(c)hidden.set(cellKey(c.x,c.y),{kind:'pickup',type:types[(i+config.world)%types.length]});}
  if(Number.isInteger(config.letter)){const c=pool.pop();if(c)hidden.set(cellKey(c.x,c.y),{kind:'letter',type:config.letter});}
  return {hard,soft,hidden,exitCell,enemySpawns,specials};
}

function drawAtlas(image,cellW,cellH,col,row,dx,dy,dw=cellW,dh=cellH){ctx.drawImage(image,col*cellW,row*cellH,cellW,cellH,dx,dy,dw,dh);}
function text(str,x,y,size=22,color='#fff',align='left',weight=900){
  ctx.save();ctx.font=`${weight} ${size}px Lato,Arial,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineWidth=Math.max(2,size*.15);ctx.strokeStyle='rgba(5,9,28,.9)';ctx.strokeText(str,x,y);ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore();
}

class Spark{
  constructor(x,y,row=3,scale=1,life=.45){this.x=x;this.y=y;this.row=row;this.scale=scale;this.life=this.max=life;this.t=0;}
  update(dt){this.t+=dt;this.life-=dt;}
  draw(){const f=clamp(Math.floor(this.t/this.max*8),0,7);const s=64*this.scale;ctx.drawImage(img.vfx,f*64,this.row*64,64,64,this.x-s/2,this.y-s/2,s,s);}
}
class FloatText{
  constructor(x,y,s,c='#fff',size=22){this.x=x;this.y=y;this.s=s;this.c=c;this.size=size;this.life=1;}
  update(dt){this.life-=dt;this.y-=42*dt;}
  draw(){ctx.save();ctx.globalAlpha=clamp(this.life,0,1);text(this.s,this.x,this.y,this.size,this.c,'center');ctx.restore();}
}

class Pickup{
  constructor(x,y,type,kind='pickup'){this.x=x;this.y=y;this.type=type;this.kind=kind;this.t=0;this.dead=false;}
  update(dt){this.t+=dt;const p=game.player;if(p&&p.cellX===this.x&&p.cellY===this.y)this.collect();}
  collect(){if(this.dead)return;this.dead=true;const p=game.player;let label='',points=500;
    if(this.kind==='core'){game.coresCollected++;label='REACTOR CORE';points=900;audio.sfx('collect',.6);}
    else if(this.kind==='letter'){const letter='PETRO'[this.type];game.letters.add(letter);label=`PETRO: ${letter}`;points=1500;audio.sfx('power',.65);if(game.letters.size===5){game.lives++;game.letters.clear();audio.sfx('life',.8);game.floats.push(new FloatText(this.px,this.py-25,'EXTRA LIFE!','#ffe24d',30));}}
    else {switch(this.type){
      case 0:p.range=Math.min(8,p.range+1);label='FLAME +1';break;
      case 1:p.maxBombs=Math.min(8,p.maxBombs+1);label='CHARGE +1';break;
      case 2:p.speed=Math.min(250,p.speed+14);label='SPEED +';break;
      case 3:p.kick=true;label='BOMB KICK';points=1200;break;
      case 4:p.remote=true;label='REMOTE';points=1200;break;
    }audio.sfx('power',.65);}
    game.score+=points;const c=centerOf(this.x,this.y);game.sparks.push(new Spark(c.x,c.y,2,1.2,.42));game.floats.push(new FloatText(c.x,c.y-28,`${label} +${points}`,'#ffe45c',20));
  }
  get px(){return centerOf(this.x,this.y).x} get py(){return centerOf(this.x,this.y).y}
  draw(){const c=centerOf(this.x,this.y);const bob=Math.sin(this.t*5)*4;let col=this.type;if(this.kind==='letter')col=5+this.type;drawAtlas(img.pickups,64,64,col,0,c.x-27,c.y-27+bob,54,54);}
}

class Bomb{
  constructor(x,y,owner,hostile=false){this.x=x;this.y=y;this.owner=owner;this.hostile=hostile;this.fuse=hostile?1.8:2.45;this.range=hostile?2:owner.range;this.dead=false;this.ownerPass=true;this.moveDir=null;this.moveTimer=0;this.age=0;}
  update(dt){this.age+=dt;this.fuse-=dt;if(this.ownerPass&&this.owner){const c=cellOf(this.owner.x,this.owner.y);if(c.x!==this.x||c.y!==this.y)this.ownerPass=false;}
    if(this.moveDir){this.moveTimer-=dt;if(this.moveTimer<=0){this.moveTimer=.075;const nx=this.x+this.moveDir.x,ny=this.y+this.moveDir.y;if(game.isSolidCell(nx,ny,true)){this.moveDir=null;}else{this.x=nx;this.y=ny;audio.sfx('kick',.18);}}}
    if(this.fuse<=0)this.explode();
  }
  explode(){if(this.dead)return;this.dead=true;game.makeBlast(this.x,this.y,this.range,this.hostile);audio.sfx('explode',.42);}
  draw(){const c=centerOf(this.x,this.y);const f=Math.floor(this.age*7)%4;drawAtlas(img.bombs,64,64,f,0,c.x-30,c.y-30,60,60);}
}

class Blast{
  constructor(cells,hostile=false){this.cells=cells;this.hostile=hostile;this.life=.58;this.max=.58;this.hit=new Set();this.kills=0;}
  update(dt){this.life-=dt;for(const c of this.cells){
      const k=cellKey(c.x,c.y); if(!this.hit.has('p'+k)&&game.player&&game.player.cellX===c.x&&game.player.cellY===c.y){this.hit.add('p'+k);game.hurtPlayer();}
      for(const e of game.enemies){if(e.dead)continue;if(e.cellX===c.x&&e.cellY===c.y&&!this.hit.has(e.id)){this.hit.add(e.id);if(e.hit()){this.kills++;game.score+=300*this.kills;game.floats.push(new FloatText(e.x,e.y-25,`${this.kills}x +${300*this.kills}`,'#ffdc4b',20));}}
      }
    }}
  draw(){const t=1-this.life/this.max;const frame=clamp(Math.floor(t*8),0,7);for(const c of this.cells){const p=centerOf(c.x,c.y);ctx.drawImage(img.vfx,frame*64,3*64,64,64,p.x-31,p.y-31,62,62);}}
}

let ENEMY_ID=0;
class Enemy{
  constructor(type,x,y){this.id='e'+(++ENEMY_ID);this.type=type;this.cellX=x;this.cellY=y;const c=centerOf(x,y);this.x=c.x;this.y=c.y;this.dir={x:0,y:0};this.progress=0;this.dead=false;this.t=0;this.think=0;this.invuln=0;this.row={wander:0,drill:1,drone:2,patrol:3,boss:4}[type]??0;this.hp=type==='boss'?(game.level.final?10:7):type==='patrol'?2:1;this.speed={wander:72,drill:86,drone:100,patrol:112,chaser:94,boss:78}[type]||92;if(type==='chaser')this.row=0;this.mineTimer=2.4+Math.random()*2;}
  canEnter(x,y){if(x<=0||y<=0||x>=GW-1||y>=GH-1)return false;if(game.stage.hard[y][x])return false;if(game.isGate(x,y))return false;if(this.type!=='drone'&&game.stage.soft.has(cellKey(x,y)))return false;if(game.bombAt(x,y))return false;return true;}
  chooseDir(){const dirs=DIRS.filter(d=>this.canEnter(this.cellX+d.x,this.cellY+d.y));if(!dirs.length){this.dir={x:0,y:0};return;}
    const rev={x:-this.dir.x,y:-this.dir.y};let pool=dirs.filter(d=>!(d.x===rev.x&&d.y===rev.y));if(!pool.length)pool=dirs;
    if(this.type==='chaser'||this.type==='patrol'||this.type==='boss')pool.sort((a,b)=>manhattan({x:this.cellX+a.x,y:this.cellY+a.y},{x:game.player.cellX,y:game.player.cellY})-manhattan({x:this.cellX+b.x,y:this.cellY+b.y},{x:game.player.cellX,y:game.player.cellY}));
    this.dir=(this.type==='wander'||this.type==='drill'||this.type==='drone')?pool[(Math.random()*pool.length)|0]:pool[0];
  }
  update(dt){if(this.dead)return;this.t+=dt;this.invuln=Math.max(0,this.invuln-dt);this.mineTimer-=dt;
    if(this.progress<=0){this.chooseDir();this.progress=TILE;}
    if(this.dir.x||this.dir.y){const step=Math.min(this.progress,this.speed*dt);this.x+=this.dir.x*step;this.y+=this.dir.y*step;this.progress-=step;if(this.progress<=.01){this.cellX+=this.dir.x;this.cellY+=this.dir.y;const c=centerOf(this.cellX,this.cellY);this.x=c.x;this.y=c.y;this.progress=0;}}
    if(this.type==='boss'&&this.mineTimer<=0){this.mineTimer=2.2+Math.random()*1.8;if(!game.bombAt(this.cellX,this.cellY))game.bombs.push(new Bomb(this.cellX,this.cellY,null,true));}
    if(game.player&&Math.hypot(this.x-game.player.x,this.y-game.player.y)<30)game.hurtPlayer();
  }
  hit(){if(this.invuln>0)return false;this.hp--;this.invuln=.48;game.sparks.push(new Spark(this.x,this.y,2,this.type==='boss'?1.8:1.1,.42));if(this.hp<=0){this.dead=true;audio.sfx('enemy',.6);if(Math.random()<.12&&this.type!=='boss')game.pickups.push(new Pickup(this.cellX,this.cellY,(Math.random()*5)|0));return true;}return false;}
  draw(){if(this.dead)return;if(this.invuln>0&&Math.floor(this.invuln*15)%2===0)return;const frame=Math.floor(this.t*7)%4;const size=this.type==='boss'?92:58;ctx.save();if(this.dir.x<0){ctx.translate(this.x,0);ctx.scale(-1,1);ctx.translate(-this.x,0);}ctx.drawImage(img.enemies,frame*96,this.row*96,96,96,this.x-size/2,this.y-size/2,size,size);ctx.restore();if(this.type==='boss'){const w=84;ctx.drawImage(img.hud,0,0,img.hud.width,img.hud.height,this.x-w/2,this.y-64,w,10);ctx.fillStyle='#ff596e';ctx.fillRect(this.x-w/2+3,this.y-61,(w-6)*clamp(this.hp/(game.level.final?10:7),0,1),4);}}
}

class Player{
  constructor(){const c=centerOf(1,1);this.x=c.x;this.y=c.y;this.cellX=1;this.cellY=1;this.speed=156;this.maxBombs=1;this.range=2;this.kick=false;this.remote=false;this.shield=0;this.invuln=2;this.dir={x:0,y:1};this.animT=0;this.moveVel={x:0,y:0};this.teleportCd=0;}
  update(dt){this.animT+=dt;this.invuln=Math.max(0,this.invuln-dt);this.teleportCd=Math.max(0,this.teleportCd-dt);
    let dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0);if(dx&&dy){if(Math.abs(this.moveVel.x)>Math.abs(this.moveVel.y))dy=0;else dx=0;}
    const here=cellOf(this.x,this.y);this.cellX=clamp(here.x,0,GW-1);this.cellY=clamp(here.y,0,GH-1);
    const onIce=game.isSpecial('ice',this.cellX,this.cellY);
    if(dx||dy){this.dir={x:dx,y:dy};this.moveVel.x=dx*this.speed;this.moveVel.y=dy*this.speed;}else if(!onIce){this.moveVel.x*=Math.pow(.01,dt);this.moveVel.y*=Math.pow(.01,dt);}else{this.moveVel.x*=Math.pow(.5,dt);this.moveVel.y*=Math.pow(.5,dt);}
    // Corner assist: snap the perpendicular axis near a tile center.
    if(dx){const cy=centerOf(this.cellX,this.cellY).y;if(Math.abs(this.y-cy)<12)this.y+=(cy-this.y)*Math.min(1,dt*18);}
    if(dy){const cx=centerOf(this.cellX,this.cellY).x;if(Math.abs(this.x-cx)<12)this.x+=(cx-this.x)*Math.min(1,dt*18);}
    this.moveAxis(this.moveVel.x*dt,0);this.moveAxis(0,this.moveVel.y*dt);
    this.cellX=clamp(cellOf(this.x,this.y).x,0,GW-1);this.cellY=clamp(cellOf(this.x,this.y).y,0,GH-1);
    const conv=game.specialAt('conveyor',this.cellX,this.cellY);if(conv){this.moveAxis((conv.dir===0?1:-1)*52*dt,0);}
    const tp=game.specialAt('teleports',this.cellX,this.cellY);if(tp&&this.teleportCd<=0){const pair=game.stage.specials.teleports[tp.pair];const c=centerOf(pair.x,pair.y);this.x=c.x;this.y=c.y;this.teleportCd=.8;game.sparks.push(new Spark(this.x,this.y,1,1.25,.5));}
    if(pressed.bomb)this.placeBomb();if(pressed.remote&&this.remote){const b=game.bombs.find(b=>!b.hostile&&!b.dead);if(b)b.explode();}
    const exit=game.exitVisible&&this.cellX===game.stage.exitCell.x&&this.cellY===game.stage.exitCell.y;if(exit&&game.exitUnlocked)game.clearLevel();
  }
  moveAxis(dx,dy){if(!dx&&!dy)return;let nx=this.x+dx,ny=this.y+dy;const radius=15;const samples=[[nx-radius,ny-radius],[nx+radius,ny-radius],[nx-radius,ny+radius],[nx+radius,ny+radius]];
    let blocked=false;for(const [sx,sy] of samples){const c=cellOf(sx,sy);if(game.isSolidCell(c.x,c.y,false,this)){blocked=true;break;}}
    if(blocked&&this.kick){const c=cellOf(nx+Math.sign(dx)*radius,ny+Math.sign(dy)*radius);const b=game.bombAt(c.x,c.y);if(b&&!b.moveDir){const dir={x:Math.sign(dx),y:Math.sign(dy)};if(!game.isSolidCell(c.x+dir.x,c.y+dir.y,true)){b.moveDir=dir;b.moveTimer=.05;audio.sfx('kick',.45);blocked=false;}}}
    if(!blocked){this.x=nx;this.y=ny;}
  }
  placeBomb(){const c=cellOf(this.x,this.y);const mine=game.bombs.filter(b=>!b.dead&&!b.hostile&&b.owner===this).length;if(mine>=this.maxBombs||game.bombAt(c.x,c.y))return;game.bombs.push(new Bomb(c.x,c.y,this,false));audio.sfx('place',.46);}
  draw(){if(this.invuln>0&&Math.floor(this.invuln*12)%2===0)return;const moving=Math.hypot(this.moveVel.x,this.moveVel.y)>25;let frame=moving?2+Math.floor(this.animT*10)%4:Math.floor(this.animT*3)%2;if(this.dir.y<0)frame=6;if(this.dir.y>0&&moving)frame=4+Math.floor(this.animT*8)%2;const size=70;ctx.save();if(this.dir.x<0){ctx.translate(this.x,0);ctx.scale(-1,1);ctx.translate(-this.x,0);}ctx.drawImage(img.petroman,frame*96,0,96,96,this.x-size/2,this.y-size/2-8,size,size);ctx.restore();}
}

const game={
  state:'loading',levelIndex:0,level:null,stage:null,player:null,enemies:[],bombs:[],blasts:[],pickups:[],sparks:[],floats:[],score:0,high:Number(localStorage.getItem('petromanBlastZoneHigh')||0),lives:3,timeLeft:0,coresCollected:0,letters:new Set(),exitVisible:false,exitUnlocked:false,shake:0,flash:0,intro:0,hazardClock:0,hazardOn:false,clearDelay:0,
  startRun(){audio.unlock();audio.sfx('start',.6);this.score=0;this.lives=3;this.levelIndex=0;this.letters.clear();this.loadLevel();},
  loadLevel(){this.level=levels[this.levelIndex];this.stage=buildStage(this.level);this.player=new Player();this.enemies=this.stage.enemySpawns.map(s=>new Enemy(s.type,s.x,s.y));this.bombs=[];this.blasts=[];this.pickups=[];this.sparks=[];this.floats=[];this.timeLeft=this.level.time;this.coresCollected=0;this.exitVisible=false;this.exitUnlocked=false;this.intro=1.8;this.hazardClock=0;this.hazardOn=false;this.state='playing';audio.playMusic('world'+this.level.world);},
  isGate(x,y){return this.stage.specials.gates.some(g=>g.x===x&&g.y===y)&&this.coresCollected<this.level.cores;},
  isSpecial(type,x,y){return this.stage.specials[type]?.some(c=>c.x===x&&c.y===y);},
  specialAt(type,x,y){return this.stage.specials[type]?.find(c=>c.x===x&&c.y===y);},
  bombAt(x,y){return this.bombs.find(b=>!b.dead&&b.x===x&&b.y===y);},
  isSolidCell(x,y,ignoreBomb=false,entity=null){if(x<0||y<0||x>=GW||y>=GH)return true;if(this.stage.hard[y][x]||this.stage.soft.has(cellKey(x,y))||this.isGate(x,y))return true;if(!ignoreBomb){const b=this.bombAt(x,y);if(b&&!(entity===b.owner&&b.ownerPass))return true;}return false;},
  reveal(x,y){const k=cellKey(x,y),h=this.stage.hidden.get(k);if(!h)return;if(h.kind==='exit')this.exitVisible=true;else if(h.kind==='core')this.pickups.push(new Pickup(x,y,h.type,'core'));else if(h.kind==='pickup')this.pickups.push(new Pickup(x,y,h.type,'pickup'));else if(h.kind==='letter')this.pickups.push(new Pickup(x,y,h.type,'letter'));this.stage.hidden.delete(k);},
  makeBlast(x,y,range,hostile){const cells=[{x,y}];const dirs=DIRS;for(const d of dirs){for(let i=1;i<=range;i++){const nx=x+d.x*i,ny=y+d.y*i;if(nx<0||ny<0||nx>=GW||ny>=GH)break;if(this.stage.hard[ny][nx]||this.isGate(nx,ny))break;cells.push({x:nx,y:ny});const b=this.bombAt(nx,ny);if(b&&!b.dead)b.fuse=0;if(this.stage.soft.has(cellKey(nx,ny))){this.stage.soft.delete(cellKey(nx,ny));this.reveal(nx,ny);this.score+=50;break;}}}
    this.blasts.push(new Blast(cells,hostile));for(const c of cells){const p=centerOf(c.x,c.y);this.sparks.push(new Spark(p.x,p.y,3,1.05,.48));}this.shake=Math.max(this.shake,.22);
  },
  hurtPlayer(){if(!this.player||this.player.invuln>0)return;if(this.player.shield>0){this.player.shield=0;this.player.invuln=1.3;return;}this.lives--;audio.sfx('hurt',.7);this.shake=.5;this.sparks.push(new Spark(this.player.x,this.player.y,2,1.6,.55));if(this.lives<=0){this.gameOver();return;}const p=this.player;const c=centerOf(1,1);p.x=c.x;p.y=c.y;p.cellX=1;p.cellY=1;p.invuln=2.5;p.maxBombs=Math.max(1,p.maxBombs-1);p.range=Math.max(1,p.range-1);p.speed=Math.max(156,p.speed-10);this.bombs=this.bombs.filter(b=>b.hostile);},
  clearLevel(){if(this.state!=='playing')return;this.state='clear';const bonus=Math.max(0,Math.ceil(this.timeLeft))*100;this.score+=bonus;this.clearBonus=bonus;this.clearDelay=.7;audio.sfx('clear',.75);},
  nextLevel(){if(this.levelIndex>=levels.length-1){this.victory();return;}this.levelIndex++;this.loadLevel();},
  victory(){this.state='victory';this.high=Math.max(this.high,this.score);localStorage.setItem('petromanBlastZoneHigh',String(this.high));audio.playMusic('victory');},
  gameOver(){this.state='defeat';this.high=Math.max(this.high,this.score);localStorage.setItem('petromanBlastZoneHigh',String(this.high));audio.playMusic('defeat');},
  togglePause(){if(this.state==='playing'){this.state='paused';if(audio.current)audio.current.pause();}else if(this.state==='paused'){this.state='playing';audio.playMusic('world'+this.level.world);}},
  update(dt){
    if(pressed.pause){this.togglePause();pressed.pause=false;}
    if(pressed.start){audio.unlock();if(this.state==='title'||this.state==='defeat'||this.state==='victory')this.startRun();else if(this.state==='clear'&&this.clearDelay<=0)this.nextLevel();else if(this.state==='paused')this.togglePause();pressed.start=false;}
    if(this.state==='clear'){this.clearDelay-=dt;return;}if(this.state!=='playing'){pressed.bomb=pressed.remote=false;return;}
    this.intro=Math.max(0,this.intro-dt);this.timeLeft-=dt;this.hazardClock+=dt;if(this.hazardClock>2.6){this.hazardClock=0;this.hazardOn=!this.hazardOn;}
    if(this.timeLeft<=0){this.timeLeft=0;this.hazardOn=true;for(const e of this.enemies)e.speed*=1.0018;}
    this.player.update(dt);for(const b of this.bombs)b.update(dt);for(const bl of this.blasts)bl.update(dt);for(const e of this.enemies)e.update(dt);for(const p of this.pickups)p.update(dt);for(const s of this.sparks)s.update(dt);for(const f of this.floats)f.update(dt);
    if(this.hazardOn&&this.isSpecial('hazard',this.player.cellX,this.player.cellY))this.hurtPlayer();
    this.bombs=this.bombs.filter(b=>!b.dead);this.blasts=this.blasts.filter(b=>b.life>0);this.enemies=this.enemies.filter(e=>!e.dead);this.pickups=this.pickups.filter(p=>!p.dead);this.sparks=this.sparks.filter(s=>s.life>0);this.floats=this.floats.filter(f=>f.life>0);this.shake=Math.max(0,this.shake-dt);
    this.exitUnlocked=this.enemies.length===0&&this.coresCollected>=this.level.cores;
    pressed.bomb=pressed.remote=false;
  },
  draw(){const sx=canvas.width/W,sy=canvas.height/H;ctx.setTransform(sx,0,0,sy,0,0);ctx.clearRect(0,0,W,H);if(this.state==='loading')return;
    if(this.state==='title'){ctx.drawImage(img.title,0,0,W,H);text(`HIGH ${String(this.high).padStart(8,'0')}`,1230,28,20,'#ffe052','right');return;}
    if(this.state==='victory'){ctx.drawImage(img.victory,0,0,W,H);text(`FINAL SCORE ${String(this.score).padStart(8,'0')}`,640,610,28,'#ffe052','center');return;}
    if(this.state==='defeat'){ctx.drawImage(img.defeat,0,0,W,H);text(`SCORE ${String(this.score).padStart(8,'0')}  •  HIGH ${String(this.high).padStart(8,'0')}`,640,610,26,'#fff','center');return;}
    ctx.save();if(this.shake){ctx.translate((Math.random()-.5)*this.shake*20,(Math.random()-.5)*this.shake*14);}this.drawWorld();ctx.restore();
    if(this.state==='clear')this.drawOverlay(img.clear,`TIME BONUS +${this.clearBonus}`);if(this.state==='paused')this.drawOverlay(img.pause,'');
  },
  drawWorld(){const world=this.level.world;ctx.drawImage(img['world'+world],0,0,W,H);ctx.fillStyle='rgba(3,8,24,.36)';ctx.fillRect(0,0,W,H);
    // arena floor and cells
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const px=AX+x*TILE,py=AY+y*TILE;drawAtlas(img.tiles,64,64,0,world-1,px,py,TILE,TILE);const conv=this.specialAt('conveyor',x,y);if(conv)drawAtlas(img.tiles,64,64,4,world-1,px,py,TILE,TILE);if(this.isSpecial('ice',x,y))drawAtlas(img.tiles,64,64,5,world-1,px,py,TILE,TILE);if(this.isSpecial('teleports',x,y))drawAtlas(img.tiles,64,64,6,world-1,px,py,TILE,TILE);if(this.isSpecial('hazard',x,y)&&this.hazardOn)drawAtlas(img.tiles,64,64,3,world-1,px,py,TILE,TILE);}
    if(this.exitVisible){const e=this.stage.exitCell;drawAtlas(img.tiles,64,64,7,world-1,AX+e.x*TILE,AY+e.y*TILE,TILE,TILE);if(!this.exitUnlocked)text('LOCKED',AX+e.x*TILE+24,AY+e.y*TILE+42,11,'#ff6575','center');}
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const px=AX+x*TILE,py=AY+y*TILE;if(this.stage.hard[y][x]||this.isGate(x,y))drawAtlas(img.tiles,64,64,1,world-1,px,py,TILE,TILE);else if(this.stage.soft.has(cellKey(x,y)))drawAtlas(img.tiles,64,64,2,world-1,px,py,TILE,TILE);}
    for(const p of this.pickups)p.draw();for(const b of this.bombs)b.draw();for(const e of this.enemies)e.draw();this.player.draw();for(const bl of this.blasts)bl.draw();for(const s of this.sparks)s.draw();for(const f of this.floats)f.draw();this.drawHud();
    if(this.intro>0){ctx.save();ctx.globalAlpha=clamp(this.intro/.45,0,1);ctx.drawImage(img.clear,360,220,560,260);text(`ZONE ${this.levelIndex+1}: ${this.level.name}`,640,300,31,'#ffe052','center');text(worlds[world-1].tip,640,365,18,'#b8f5ef','center');ctx.restore();}
  },
  drawHud(){ctx.drawImage(img.hud,0,0,img.hud.width,img.hud.height,0,0,W,70);text(String(this.score).padStart(8,'0'),82,36,22,'#fff');text(`x${this.lives}`,285,36,22,'#ffe052');text(`${this.levelIndex+1}/24`,458,36,22,'#68f0e8');text(String(Math.ceil(this.timeLeft)).padStart(3,'0'),662,36,22,this.timeLeft<20?'#ff6575':'#fff');text(`${this.player.maxBombs}`,825,36,22,'#fff');text(`${this.player.range}`,1014,36,22,'#fff');text(`HI ${String(this.high).padStart(8,'0')}`,1250,36,19,'#ffe052','right');
    ctx.drawImage(img.panel,PANEL_X,PANEL_Y,340,580);text(worlds[this.level.world-1].name,PANEL_X+170,PANEL_Y+35,24,'#ffe052','center');text(this.level.name,PANEL_X+170,PANEL_Y+72,18,'#fff','center');
    text('OBJECTIVES',PANEL_X+32,PANEL_Y+142,19,'#59eee4');text(`Enemies: ${this.enemies.length}`,PANEL_X+35,PANEL_Y+178,18,'#fff');text(`Cores: ${this.coresCollected}/${this.level.cores}`,PANEL_X+35,PANEL_Y+208,18,this.coresCollected>=this.level.cores?'#74ee83':'#fff');text(`Exit: ${this.exitVisible?(this.exitUnlocked?'OPEN':'LOCKED'):'HIDDEN'}`,PANEL_X+35,PANEL_Y+238,18,this.exitUnlocked?'#ffe052':'#fff');
    text('UPGRADES',PANEL_X+32,PANEL_Y+332,19,'#b99bff');text(`Charges ${this.player.maxBombs}   Flame ${this.player.range}`,PANEL_X+35,PANEL_Y+370,17,'#fff');text(`Speed ${Math.round(this.player.speed)}`,PANEL_X+35,PANEL_Y+400,17,'#fff');text(`Kick ${this.player.kick?'YES':'NO'}   Remote ${this.player.remote?'YES':'NO'}`,PANEL_X+35,PANEL_Y+430,17,'#fff');
    text('PETRO LETTERS',PANEL_X+32,PANEL_Y+478,18,'#ffe052');const letters='PETRO';for(let i=0;i<5;i++)text(letters[i],PANEL_X+55+i*52,PANEL_Y+520,27,this.letters.has(letters[i])?'#ffe052':'#5b6681','center');
    text(this.exitUnlocked?'Find the glowing exit!':'Blast smart. Keep an escape lane.',PANEL_X+170,PANEL_Y+555,15,'#b8f5ef','center');
  },
  drawOverlay(image,sub){ctx.fillStyle='rgba(2,6,22,.72)';ctx.fillRect(0,0,W,H);ctx.drawImage(image,360,230,560,260);if(sub)text(sub,640,390,24,'#68eee5','center');}
};
window.__PETROMAN_BLAST_ZONE__=game;window.__PETROMAN_BLAST_ZONE_LEVELS__=levels;window.__PETROMAN_BLAST_ZONE_BUILD_STAGE__=buildStage;

let last=performance.now();
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;game.update(dt);game.draw();requestAnimationFrame(loop);}
// Sponsor-funded boost. On defeat it puts Petroman straight back into the
// stage; mid-run it adds a life, a shield and an upgraded charge.
window.MMARewardBridge?.({
  slug:'petroman-blast-zone',
  label:'Blast boost',
  onGrant(){
    if(game.state==='defeat'){
      game.lives=2;
      game.loadLevel();
      audio.playMusic('gameplay');
    }else{
      game.lives=Math.min(9,game.lives+1);
    }
    if(game.player){
      game.player.invuln=Math.max(game.player.invuln,6);
      game.player.shield=1;
      game.player.maxBombs=Math.min(8,game.player.maxBombs+1);
      game.player.range=Math.min(8,game.player.range+1);
    }
    game.score+=500;
    game.shake=.4;
    audio.sfx('start',.6);
  },
});

loadImages().then(()=>{loading.classList.add('hidden');game.state='title';audio.playMusic('title');requestAnimationFrame(loop);}).catch(err=>{loadText.textContent=err.message;console.error(err);});
})();
