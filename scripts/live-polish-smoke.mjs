import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.SMOKE_BASE_URL||'https://www.mochimangoarcade.com';
const browser=await chromium.launch({headless:true});
const cases=[];
const failures=[];

async function runCase(viewport,name,path,waitMs,assertion){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(/cloudflareinsights|googletagmanager|google-analytics|doubleclick/i.test(url))return route.abort();
    return route.continue();
  });
  page.on('pageerror',error=>errors.push(String(error.message||error)));
  page.on('console',message=>{
    const text=message.text();
    if(message.type()==='error'&&!/favicon|cloudflareinsights|Failed to load resource/i.test(text))errors.push(text);
  });
  try{
    const response=await page.goto(`${base}${path}`,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForTimeout(waitMs);
    const common=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth+3,
      polish:Boolean(document.querySelector('link[href="/assets/css/polish-2026.css"]')),
      fixes:Boolean(document.querySelector('link[href="/assets/css/polish-fixes.css"]')),
      mobileNav:Boolean(document.querySelector('.mobile-bottom-nav')),
      header:Boolean(document.querySelector('#appHeader')),
    }));
    const detail=await assertion(page);
    const result={viewport, name, path, status:response?.status()||0, common, detail, errors};
    result.ok=result.status===200&&common.header&&common.polish&&common.fixes&&!common.overflow&&errors.length===0&&detail.ok;
    cases.push(result);
    if(!result.ok)failures.push(result);
  }catch(error){
    failures.push({viewport,name,path,error:String(error)});
  }finally{
    await page.close();
    await context.close();
  }
}

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  await runCase(viewport,'home','/',1800,async page=>{
    const data=await page.evaluate(()=>({
      hero:document.querySelector('.hero-content h1')?.textContent||'',
      discovery:Boolean(document.querySelector('#mmaDiscovery')),
      searchLabel:document.querySelectorAll('label[for="globalSearch"]').length,
      cards:document.querySelectorAll('.game-card').length,
    }));
    return {...data,ok:/392/.test(data.hero)&&data.discovery&&data.searchLabel===1&&data.cards>=4};
  });
  await runCase(viewport,'games','/games/',1800,async page=>{
    const data=await page.evaluate(()=>({
      count:document.querySelector('#gameCount')?.textContent||'',
      cards:document.querySelectorAll('.game-card').length,
      mobileToggle:innerWidth>820||Boolean(document.querySelector('.mobile-filter-toggle')),
    }));
    return {...data,ok:/392/.test(data.count)&&data.cards===392&&data.mobileToggle};
  });
  await runCase(viewport,'about','/about/',1600,async page=>{
    const data=await page.evaluate(()=>({
      trust:Boolean(document.querySelector('.about-trust')),
      catalogueLinks:document.querySelectorAll('.about-trust a[href="/ai/catalog.json"]').length,
    }));
    return {...data,ok:data.trust&&data.catalogueLinks===1};
  });
  await runCase(viewport,'shop','/shop/',1800,async page=>{
    const data=await page.evaluate(()=>({
      notice:Boolean(document.querySelector('#shopConceptNotice')),
      enabledCart:document.querySelectorAll('.add-cart:not([disabled])').length,
      headerCart:document.querySelectorAll('.header-cart-btn').length,
      products:document.querySelectorAll('.product-card').length,
    }));
    return {...data,ok:data.notice&&data.enabledCart===0&&data.headerCart===0&&data.products>0};
  });
  await runCase(viewport,'play','/play/mushmoos-moonlit-match/',3000,async page=>{
    const data=await page.evaluate(()=>({
      canvas:[...document.querySelectorAll('canvas')].some(node=>{const r=node.getBoundingClientRect();return r.width>120&&r.height>120}),
      tools:Boolean(document.querySelector('.play-tools')),
      campaign:Boolean(document.querySelector('.mma-campaign-panel')),
    }));
    return {...data,ok:data.canvas&&data.tools&&data.campaign};
  });
}

await browser.close();
const report={generatedAt:new Date().toISOString(),tested:cases.length,passed:cases.filter(item=>item.ok).length,failures,cases};
fs.mkdirSync('.github',{recursive:true});
fs.writeFileSync('.github/live-polish-smoke.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({tested:report.tested,passed:report.passed,failures},null,2));
if(failures.length)process.exit(1);
