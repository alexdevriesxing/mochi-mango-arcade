import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const publicDir=path.join(root,'public');
const games=JSON.parse(fs.readFileSync(path.join(publicDir,'assets/data/games.json'),'utf8'));
const errors=[];
const badHosts=['demolishwrestconclusions.com','n6wxm.com','5gvci.com'];
const seen=new Set();
for(const game of games){
  if(seen.has(game.slug))errors.push(`Duplicate slug: ${game.slug}`);seen.add(game.slug);
  for(const key of ['title','slug','genre','engine','mascot','universe','description','image','detailUrl','playUrl'])if(!game[key])errors.push(`${game.slug}: missing ${key}`);
  if('rating' in game||'plays' in game)errors.push(`${game.slug}: synthetic rating/play fields remain`);
  const image=path.join(publicDir,String(game.image||'').replace(/^\//,''));
  if(!fs.existsSync(image))errors.push(`${game.slug}: missing image ${game.image}`);
  for(const kind of ['games','play'])if(!fs.existsSync(path.join(publicDir,kind,game.slug,'index.html')))errors.push(`${game.slug}: missing ${kind} page`);
}
for(const target of ['public/assets/js/app.js','public/assets/js/mmengine.js','public/assets/js/game-quality.js','public/assets/js/game-campaign.js','src/worker.js','scripts/sitewide-audit.mjs','scripts/remediation-smoke.mjs']){
  const result=spawnSync(process.execPath,['--check',path.join(root,target)],{encoding:'utf8'});
  if(result.status!==0)errors.push(`${target}: ${result.stderr||result.stdout}`);
}
for(const target of ['public/assets/js/app.js','public/assets/js/mmengine.js','public/js/monetag-loader.js']){
  const text=fs.readFileSync(path.join(root,target),'utf8');
  for(const host of badHosts)if(text.includes(host))errors.push(`${target}: residual blocked host ${host}`);
}
const sitemap=fs.readFileSync(path.join(publicDir,'sitemap.xml'),'utf8');
for(const game of games){
  if(!sitemap.includes(`/games/${game.slug}/`))errors.push(`${game.slug}: missing detail URL in sitemap`);
  if(!sitemap.includes(`/play/${game.slug}/`))errors.push(`${game.slug}: missing play URL in sitemap`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(JSON.stringify({ok:true,games:games.length,playable:games.filter(g=>g.built).length},null,2));
