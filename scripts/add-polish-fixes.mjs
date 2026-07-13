import fs from 'node:fs';
import path from 'node:path';

const publicDir=path.join(process.cwd(),'public');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)])}
let updated=0;
for(const file of walk(publicDir).filter(file=>file.endsWith('.html'))){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('/assets/css/polish-fixes.css')){
    html=html.replace('<link rel="stylesheet" href="/assets/css/polish-2026.css">','<link rel="stylesheet" href="/assets/css/polish-2026.css"><link rel="stylesheet" href="/assets/css/polish-fixes.css">');
    fs.writeFileSync(file,html);
    updated++;
  }
}
console.log(JSON.stringify({ok:true,updated},null,2));
