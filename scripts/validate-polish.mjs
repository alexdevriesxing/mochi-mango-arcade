import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const publicDir=path.join(root,'public');
const games=JSON.parse(fs.readFileSync(path.join(publicDir,'assets/data/games.json'),'utf8'));
const errors=[];
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

for(const file of ['public/assets/js/ux-polish.js','scripts/apply-ui-seo-gaio-polish.mjs','scripts/ui-seo-smoke.mjs']){
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  if(result.status!==0)errors.push(`${file}: ${result.stderr||result.stdout}`);
}

for(const required of ['public/assets/css/polish-2026.css','public/ai/catalog.json','public/ai/entity-graph.json','public/humans.txt']){
  if(!fs.existsSync(path.join(root,required)))errors.push(`Missing ${required}`);
}

const facts=JSON.parse(read('public/assets/data/site-facts.json'));
const catalogue=JSON.parse(read('public/ai/catalog.json'));
if(facts.gameCount!==games.length)errors.push(`site-facts gameCount ${facts.gameCount} != ${games.length}`);
if(catalogue.games?.length!==games.length)errors.push(`AI catalogue count ${catalogue.games?.length} != ${games.length}`);
if(facts.merchandiseStatus!=='Concept preview')errors.push('Merchandise status must remain honest');

const app=read('public/assets/js/app.js');
for(const stale of ['200+<br>','Browse all 200 games','Mock leaderboard ready','ad monetization and collectibles'])if(app.includes(stale))errors.push(`Stale production copy remains: ${stale}`);
if(!app.includes('Your private on-device high scores'))errors.push('Personal leaderboard replacement missing');

const index=read('public/index.html');
for(const token of ['/assets/css/polish-2026.css','/assets/js/ux-polish.js','/ai/catalog.json','name="application-name"'])if(!index.includes(token))errors.push(`Homepage missing ${token}`);

for(const game of games){
  const og=path.join(publicDir,'assets/images/og/games',`${game.slug}.jpg`);
  if(!fs.existsSync(og))errors.push(`${game.slug}: missing raster OG card`);
  const html=read(`public/games/${game.slug}/index.html`);
  if(!html.includes(`/assets/images/og/games/${game.slug}.jpg`))errors.push(`${game.slug}: detail page not using raster OG card`);
  if(!html.includes('"isAccessibleForFree":true'))errors.push(`${game.slug}: enhanced VideoGame schema missing`);
  if(!html.includes('"@type":"PlayAction"'))errors.push(`${game.slug}: PlayAction missing`);
}

const llms=read('public/llms.txt');
for(const token of ['/ai/catalog.json','/ai/entity-graph.json','No synthetic user ratings'])if(!llms.includes(token))errors.push(`llms.txt missing ${token}`);

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(JSON.stringify({ok:true,games:games.length,ogCards:games.length},null,2));
