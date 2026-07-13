import fs from 'node:fs';
import path from 'node:path';

const publicDir=path.join(process.cwd(),'public');
const embedded=[
  path.join(publicDir,'play/puddles-pancake-panic/game/index.html'),
  path.join(publicDir,'play/puddle-pip-meadow-dash/game/index.html'),
];

const forbidden=[
  '/assets/css/polish-2026.css',
  '/assets/css/polish-fixes.css',
  '/assets/js/ux-polish.js',
  '/assets/js/trust-polish.js',
  'name="application-name"',
  'title="Mochi Mango Arcade verified facts"',
];

let repaired=0;
for(const file of embedded){
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  const before=html;

  // A prior broad "392+" copy replacement accidentally touched this valid
  // coordinate expression in the standalone Pancake Panic canvas bundle.
  html=html.replace('const x=540+col*240,y=392row*92;','const x=540+col*240,y=392+row*92;');

  for(const token of forbidden){
    if(html.includes(token))throw new Error(`Portal metadata leaked into embedded bundle ${path.relative(publicDir,file)}: ${token}`);
  }

  if(html!==before){
    fs.writeFileSync(file,html);
    repaired++;
  }
}

console.log(JSON.stringify({ok:true,embeddedBundles:embedded.length,repaired},null,2));
