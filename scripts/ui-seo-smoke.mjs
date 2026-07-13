import {chromium} from 'playwright';

const base=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const failures=[];
const results=[];

async function check(name,viewport,path,assertions){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error.message||error)));
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|Failed to load resource|cloudflareinsights/i.test(message.text()))errors.push(message.text())});
  try{
    const response=await page.goto(`${base}${path}`,{waitUntil:'networkidle',timeout:30000});
    await page.waitForTimeout(450);
    const common=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth+3,
      polish:Boolean(document.querySelector('link[href="/assets/css/polish-2026.css"]')),
      mobileNav:Boolean(document.querySelector('.mobile-bottom-nav')),
      title:document.title
    }));
    const detail=await assertions(page);
    const fatal=errors.filter(error=>!/favicon|Failed to load resource|cloudflareinsights/i.test(error));
    const ok=response?.status()===200&&!common.overflow&&common.polish&&fatal.length===0&&detail.ok;
    results.push({name,viewport,path,status:response?.status(),common,detail,errors:fatal,ok});
    if(!ok)failures.push(results.at(-1));
  }catch(error){failures.push({name,viewport,path,error:String(error)})}
  await page.close();
  await context.close();
}

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  await check('home',viewport,'/',async page=>{
    const hero=await page.locator('.hero-content h1').textContent();
    const discovery=await page.locator('#mmaDiscovery').isVisible().catch(()=>false);
    const search=page.locator('#globalSearch');
    await search.fill('Mochi');
    await page.waitForTimeout(250);
    const suggestions=await page.locator('.search-suggestions.open .search-result').count();
    const cardTitles=await page.locator('.game-title').evaluateAll(nodes=>nodes.slice(0,4).map(node=>({scrollHeight:node.scrollHeight,clientHeight:node.clientHeight,text:node.textContent})));
    return {ok:/392/.test(hero||'')&&discovery&&suggestions>0&&cardTitles.every(item=>item.clientHeight>20),hero,discovery,suggestions,cardTitles};
  });
  await check('games',viewport,'/games/',async page=>{
    const count=await page.locator('#gameCount').textContent();
    const toggle=page.locator('.mobile-filter-toggle');
    let filterWorks=true;
    if(viewport.name==='mobile'){
      filterWorks=await toggle.isVisible().catch(()=>false);
      if(filterWorks){await toggle.click();filterWorks=await page.locator('.catalog-layout.filters-open .filters').isVisible().catch(()=>false)}
    }
    return {ok:/392/.test(count||'')&&filterWorks,count,filterWorks};
  });
  await check('about',viewport,'/about/',async page=>{
    const trust=await page.locator('.about-trust').isVisible().catch(()=>false);
    const machineLinks=await page.locator('.about-trust a[href="/ai/catalog.json"]').count();
    return {ok:trust&&machineLinks===1,trust,machineLinks};
  });
  await check('play-tools',viewport,'/play/puddle-pip-meadow-dash/',async page=>{
    const canvas=await page.locator('canvas').first().isVisible().catch(()=>false);
    const tools=await page.locator('.play-tools').isVisible().catch(()=>false);
    const campaign=await page.locator('.mma-campaign-panel').isVisible().catch(()=>false);
    return {ok:canvas&&tools&&campaign,canvas,tools,campaign};
  });
}

await browser.close();
console.log(JSON.stringify({tested:results.length,passed:results.filter(result=>result.ok).length,failures},null,2));
if(failures.length)process.exit(1);
