import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const publicDir=path.join(root,'public');
const appPath=path.join(publicDir,'assets/js/app.js');
const gamesPath=path.join(publicDir,'assets/data/games.json');
const games=JSON.parse(fs.readFileSync(gamesPath,'utf8'));
const universes=JSON.parse(fs.readFileSync(path.join(publicDir,'assets/data/universes.json'),'utf8'));
const today='2026-07-13';

const replaceOnce=(text,needle,value,label)=>{
  if(text.includes(value))return text;
  if(!text.includes(needle))throw new Error(`Missing replacement target: ${label}`);
  return text.replace(needle,value);
};

let app=fs.readFileSync(appPath,'utf8');
app=replaceOnce(app,'<a class="skip-link" href="#main">Skip</a>','<a class="skip-link" href="#main">Skip to main content</a>','skip link');
app=replaceOnce(app,'<label class="searchbox">🔍 <input id="globalSearch" data-i18n-placeholder="search" placeholder="${t(\'search\')}"></label>','<div class="searchbox">🔍 <label class="sr-only" for="globalSearch">Search games</label><input id="globalSearch" data-i18n-placeholder="search" placeholder="${t(\'search\')}"></div>','accessible search markup');
app=replaceOnce(app,'<h1>200+<br><span>Playful HTML5 Games</span></h1>','<h1>${built.length} free games.<br><span>One playful universe.</span></h1>','home hero count');
app=replaceOnce(app,'<p>${built.length} playable today with fresh games and collectible merch added every week.</p>','<p>Instant browser games with original characters, campaign goals and daily reasons to come back — no download and no account required.</p>','home hero copy');
app=app.replace(/slice\(0,5\)/g,'slice(0,4)');
app=replaceOnce(app,'<p>Browse all 200 games — <b>${S.games.filter(g=>g.built).length} playable now</b>, with more added every week.</p>','<p>Browse all <b>${S.games.length} free games</b> — every title is playable now on mobile and desktop.</p>','catalog count');
app=replaceOnce(app,'<p>Mochi Mango Arcade is a scalable HTML5 game and merch platform by Fire Dragon Interactive for 200+ games, recurring universes, ad monetization and collectibles.</p>','<p>Mochi Mango Arcade is a family-friendly browser arcade by Fire Dragon Interactive, built around original games, recurring characters and transparent free-to-play access.</p>','about hero');

const leaderboardStart=app.indexOf('function leaderboardPage(){');
const adMapStart=app.indexOf('function adMapPage(){');
if(leaderboardStart<0||adMapStart<0||adMapStart<=leaderboardStart)throw new Error('Could not locate leaderboard function');
const leaderboard=`function leaderboardPage(){
  const saved=S.games.map(game=>{
    const mastery=safeParse(localStorage.getItem(\`mma_mastery_\${game.slug}\`)||'{}',{});
    const campaign=safeParse(localStorage.getItem(\`mma_campaign_\${game.slug}\`)||'{}',{});
    return {game,best:Number(mastery.best)||0,medals:Number(campaign.medals)||0};
  }).filter(item=>item.best>0||item.medals>0).sort((a,b)=>b.best-a.best||b.medals-a.medals).slice(0,50);
  const rows=saved.map((item,index)=>\`<a class="leader-row" href="\${item.game.playUrl}"><div class="rank">#\${index+1}</div><div><strong>\${item.game.title}</strong><div class="meta"><span>\${item.game.genre}</span><span>\${item.medals} medals</span></div></div><div class="hide-sm" style="font-weight:900;color:var(--purple)">\${item.best.toLocaleString()}</div><div class="hide-sm" style="font-weight:800;color:var(--muted)">personal best</div></a>\`);
  return \`<main id="main" class="container">
    \${adTop()}
    <section class="page-hero"><h1 data-i18n="leaderboards">\${t('leaderboards')}</h1><p>Your private on-device high scores and campaign medals. Nothing is invented and no account is required.</p></section>
    \${adNative()}
    \${rows.length?rows.join(''):'<div class="empty">Play a game to create your personal leaderboard.</div>'}
    \${adSlot('b468x60')}
  </main>\`;
}

`;
app=app.slice(0,leaderboardStart)+leaderboard+app.slice(adMapStart);
fs.writeFileSync(appPath,app);

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
}

function enhanceGameSchema(json,game){
  const graph=Array.isArray(json['@graph'])?json['@graph']:[];
  const node=json['@type']==='VideoGame'?json:graph.find(item=>item['@type']==='VideoGame');
  if(!node)return json;
  node.isAccessibleForFree=true;
  node.datePublished=game.releaseDate||today;
  node.dateModified=today;
  node.version=game.version||'1.0';
  node.mainEntityOfPage=`https://www.mochimangoarcade.com/games/${game.slug}/`;
  node.creator={"@type":"Organization","name":"Fire Dragon Interactive","url":"https://www.firedragoninteractive.com"};
  node.potentialAction={"@type":"PlayAction","target":`https://www.mochimangoarcade.com/play/${game.slug}/`};
  node.keywords=[game.genre,game.mascot,game.universeName||game.universe,'free browser game','HTML5 game'].filter(Boolean);
  node.accessibilityFeature=['keyboardControl','mouseControl','touchControl','highContrastDisplay','reducedMotion'];
  return json;
}

const gameBySlug=new Map(games.map(game=>[game.slug,game]));
for(const file of walk(publicDir).filter(file=>file.endsWith('.html'))){
  let html=fs.readFileSync(file,'utf8');
  html=html.replaceAll('392+','392');
  html=html.replaceAll('200+ games','392 games').replaceAll('Browse all 200 games','Browse all 392 games');
  if(!html.includes('/assets/css/polish-2026.css'))html=html.replace('<link rel="stylesheet" href="/assets/css/styles.css">','<link rel="stylesheet" href="/assets/css/styles.css"><link rel="stylesheet" href="/assets/css/polish-2026.css">');
  if(!html.includes('/assets/js/ux-polish.js'))html=html.replace('<script type="module" src="/assets/js/app.js"></script>','<script type="module" src="/assets/js/app.js"></script><script type="module" src="/assets/js/ux-polish.js"></script>');
  if(!html.includes('name="application-name"'))html=html.replace(/<meta name="theme-color" content="[^"]+">/,match=>`${match}<meta name="application-name" content="Mochi Mango Arcade"><meta name="color-scheme" content="light"><meta name="referrer" content="strict-origin-when-cross-origin">`);
  if(!html.includes('title="Mochi Mango Arcade verified facts"'))html=html.replace('<link rel="manifest" href="/manifest.webmanifest">','<link rel="manifest" href="/manifest.webmanifest"><link rel="alternate" type="application/json" href="/assets/data/site-facts.json" title="Mochi Mango Arcade verified facts"><link rel="alternate" type="application/json" href="/ai/catalog.json" title="Mochi Mango Arcade game catalogue">');
  const bodySlug=html.match(/<body[^>]*data-slug="([^"]+)"/)?.[1];
  const game=gameBySlug.get(bodySlug);
  if(game){
    const og=`https://www.mochimangoarcade.com/assets/images/og/games/${game.slug}.jpg`;
    html=html.replace(/<meta property="og:image" content="[^"]+">(?:<meta property="og:image:type" content="image\/jpeg">)?/,`<meta property="og:image" content="${og}"><meta property="og:image:type" content="image/jpeg">`);
    if(/<meta name="twitter:image" content="[^"]+">/.test(html)){
      html=html.replace(/<meta name="twitter:image" content="[^"]+">(?:<meta name="twitter:image:alt" content="[^"]+">)?/,`<meta name="twitter:image" content="${og}"><meta name="twitter:image:alt" content="${String(game.title).replaceAll('"','&quot;')} — free browser game">`);
    }
    html=html.replace(/<script type="application\/ld\+json">(.*?)<\/script>/s,(full,jsonText)=>{
      try{return `<script type="application/ld+json">${JSON.stringify(enhanceGameSchema(JSON.parse(jsonText),game))}</script>`}catch{return full}
    });
  }
  fs.writeFileSync(file,html);
}

const characterCounts={};
for(const game of games)characterCounts[game.mascot]=(characterCounts[game.mascot]||0)+1;
const catalogue={name:'Mochi Mango Arcade game catalogue',canonicalUrl:'https://www.mochimangoarcade.com/',publisher:{name:'Fire Dragon Interactive',url:'https://www.firedragoninteractive.com'},lastVerified:today,gameCount:games.length,pricing:'Free to play',accountRequired:false,games:games.map(game=>({id:game.slug,title:game.title,url:`https://www.mochimangoarcade.com/games/${game.slug}/`,playUrl:`https://www.mochimangoarcade.com/play/${game.slug}/`,genre:game.genre,character:game.mascot,universe:game.universeName||universes[game.universe]?.name||game.universe,description:game.description,objective:game.objective,version:game.version||'1.0',releaseDate:game.releaseDate||today,image:`https://www.mochimangoarcade.com${game.image}`}))};
fs.mkdirSync(path.join(publicDir,'ai'),{recursive:true});
fs.writeFileSync(path.join(publicDir,'ai/catalog.json'),JSON.stringify(catalogue,null,2)+'\n');

const entityGraph={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':'https://www.firedragoninteractive.com/#organization',name:'Fire Dragon Interactive',url:'https://www.firedragoninteractive.com'},{'@type':'WebSite','@id':'https://www.mochimangoarcade.com/#website',name:'Mochi Mango Arcade',url:'https://www.mochimangoarcade.com/',publisher:{'@id':'https://www.firedragoninteractive.com/#organization'},inLanguage:'en',isAccessibleForFree:true},{'@type':'CollectionPage','@id':'https://www.mochimangoarcade.com/games/#collection',name:'Mochi Mango Arcade Games',url:'https://www.mochimangoarcade.com/games/',numberOfItems:games.length,about:Object.entries(universes).map(([id,u])=>({'@type':'CreativeWorkSeries','@id':`https://www.mochimangoarcade.com/universes/#${id}`,name:u.name,description:u.description}))},...Object.entries(characterCounts).map(([name,count])=>({'@type':'FictionalCharacter',name,url:`https://www.mochimangoarcade.com/characters/#${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`,description:`Original Mochi Mango Arcade character appearing in ${count} games.`}))]};
fs.writeFileSync(path.join(publicDir,'ai/entity-graph.json'),JSON.stringify(entityGraph,null,2)+'\n');

const facts={name:'Mochi Mango Arcade',canonicalUrl:'https://www.mochimangoarcade.com/',publisher:'Fire Dragon Interactive',gameCount:games.length,playableCount:games.filter(game=>game.built!==false).length,universeCount:Object.keys(universes).length,pricing:'Free to play',accountRequired:false,merchandiseStatus:'Concept preview',lastVerified:today,contentOwnership:'Original games, characters and artwork published by Fire Dragon Interactive',catalogue:'https://www.mochimangoarcade.com/ai/catalog.json',entityGraph:'https://www.mochimangoarcade.com/ai/entity-graph.json'};
fs.writeFileSync(path.join(publicDir,'assets/data/site-facts.json'),JSON.stringify(facts,null,2)+'\n');
fs.writeFileSync(path.join(publicDir,'llms.txt'),`# Mochi Mango Arcade\n\n> Free family-friendly browser arcade published by Fire Dragon Interactive.\n\n## Verified facts\n- Canonical URL: https://www.mochimangoarcade.com/\n- Publisher: Fire Dragon Interactive\n- Games: ${games.length}\n- Playable now: ${facts.playableCount}\n- Original universes: ${facts.universeCount}\n- Price: Free to play\n- Account: Optional; not required to play\n- Merchandise: Concept preview; purchasing is not currently available\n- Last verified: ${today}\n\n## Machine-readable sources\n- Verified facts: https://www.mochimangoarcade.com/assets/data/site-facts.json\n- Concise game catalogue: https://www.mochimangoarcade.com/ai/catalog.json\n- Entity graph: https://www.mochimangoarcade.com/ai/entity-graph.json\n- Source catalogue: https://www.mochimangoarcade.com/assets/data/games.json\n- Sitemap: https://www.mochimangoarcade.com/sitemap.xml\n\n## Content and ownership\nGame pages identify the title, genre, character, universe, objective, version, release date and direct play URL. Games, characters and artwork are original to Fire Dragon Interactive unless a page explicitly states otherwise. No synthetic user ratings, review counts or play counts are published.\n\n## Access\nGames run in modern browsers on mobile and desktop. Shared runtimes support touch, mouse and keyboard. Campaign progress and personal bests can be stored locally; an account is not required.\n`);
fs.writeFileSync(path.join(publicDir,'humans.txt'),`Mochi Mango Arcade\nPublisher: Fire Dragon Interactive\nWebsite: https://www.mochimangoarcade.com/\nGames: ${games.length}\nOriginal universes: ${facts.universeCount}\nTechnology: HTML5, JavaScript, Cloudflare Workers and D1\nLast verified: ${today}\n`);

console.log(JSON.stringify({ok:true,games:games.length,htmlFiles:walk(publicDir).filter(file=>file.endsWith('.html')).length},null,2));
