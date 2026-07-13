import fs from 'node:fs';

const enginePath='public/assets/js/mmengine.js';
let engine=fs.readFileSync(enginePath,'utf8');
const mergeStart=engine.indexOf('class Merge extends Base');
const helixStart=engine.indexOf('class Helix extends Base',mergeStart);
if(mergeStart<0||helixStart<0)throw new Error('Merge class boundaries not found');
let merge=engine.slice(mergeStart,helixStart);
const renderStart=merge.indexOf('  render() {');
if(renderStart<0)throw new Error('Merge render not found');
const head=merge.slice(0,renderStart);
let render=merge.slice(renderStart);
if(!render.includes('colIndex')){
  render=render.replace(/for \(let r = 0; r < this\.size; r\+\+\) for \(let c = 0; c < this\.size; c\+\+\)/g,'for (let r = 0; r < this.size; r++) for (let colIndex = 0; colIndex < this.size; colIndex++)');
  render=render.replace(/this\.grid\[r\]\[c\]/g,'this.grid[r][colIndex]');
  render=render.replace(/pad \+ c \* cellSize/g,'pad + colIndex * cellSize');
  render=render.replace(/p\.c - c/g,'p.c - colIndex');
  render=render.replace(/p\.c === c/g,'p.c === colIndex');
  const fixed=head+render;
  if(fixed===merge)throw new Error('Merge render shadow replacement made no changes');
  engine=engine.slice(0,mergeStart)+fixed+engine.slice(helixStart);
  fs.writeFileSync(enginePath,engine);
}

const cssPath='public/assets/css/game-quality.css';
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('MMA_BESPOKE_MOBILE_FIX')){
  css += `\n/* MMA_BESPOKE_MOBILE_FIX */\n@media(max-width:720px){\n  body[data-page="play"] .detail-layout{display:block!important;min-width:0!important;width:100%!important}\n  body[data-page="play"] .detail-layout>*,body[data-page="play"] .play-shell,body[data-page="play"] .game-stage-shell{min-width:0!important;max-width:100%!important;width:100%!important}\n  body[data-page="play"] .play-shell iframe{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;border:0!important}\n  body[data-page="play"] .container{max-width:100%!important;overflow-x:clip!important}\n}\n`;
  fs.writeFileSync(cssPath,css);
}
console.log('Applied final Merge and bespoke mobile fixes.');
