import fs from 'node:fs';
import path from 'node:path';

const publicDir=path.join(process.cwd(),'public');
const indexPath=path.join(publicDir,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
const homeOg='https://www.mochimangoarcade.com/assets/images/og/home.jpg';
const honestMerch='The merchandise area is a concept preview for future character collectibles. Purchasing, stock and pre-orders are not currently available.';
html=html.replaceAll('https://www.mochimangoarcade.com/assets/images/home_hero_banner_200_games.jpg',homeOg);
html=html.replace(/Yes\. planned character merchandise[^"<]*available in the on-site merch shop\.?/gi,honestMerch);
html=html.replace(/Planned character merchandise[^"<]*available in the on-site merch shop\.?/gi,honestMerch);
html=html.replace(/Can I buy plushies and merch of the characters\?<\/h3><p>[^<]*<\/p>/gi,`Can I buy plushies and merch of the characters?</h3><p>${honestMerch}</p>`);
html=html.replace(/<script type="application\/ld\+json">(.*?)<\/script>/s,(full,jsonText)=>{
  try{
    const json=JSON.parse(jsonText);
    const graph=Array.isArray(json['@graph'])?json['@graph']:[];
    const website=graph.find(item=>item['@type']==='WebSite');
    if(website){
      website.publisher={"@type":"Organization","name":"Fire Dragon Interactive","url":"https://www.firedragoninteractive.com"};
      website.isAccessibleForFree=true;
    }
    const organization=graph.find(item=>item['@type']==='Organization');
    if(organization){
      organization.image=homeOg;
      organization.description='Mochi Mango Arcade is a free browser-game portal featuring 392 original HTML5 games. Its merchandise area is a concept preview; purchasing is not currently available.';
    }
    const faq=graph.find(item=>item['@type']==='FAQPage');
    for(const entry of faq?.mainEntity||[]){
      if(/plush|merch/i.test(entry.name||''))entry.acceptedAnswer={"@type":"Answer","text":honestMerch};
    }
    return `<script type="application/ld+json">${JSON.stringify(json)}</script>`;
  }catch{return full}
});
fs.writeFileSync(indexPath,html);

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)])}
let linked=0;
for(const file of walk(publicDir).filter(file=>file.endsWith('.html'))){
  let page=fs.readFileSync(file,'utf8');
  if(!page.includes('/assets/js/trust-polish.js')){
    page=page.replace('<script type="module" src="/assets/js/ux-polish.js"></script>','<script type="module" src="/assets/js/ux-polish.js"></script><script type="module" src="/assets/js/trust-polish.js"></script>');
    fs.writeFileSync(file,page);
    linked++;
  }
}
console.log(JSON.stringify({ok:true,linked,homeOg},null,2));
