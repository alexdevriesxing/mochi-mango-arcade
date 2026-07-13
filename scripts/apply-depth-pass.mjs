import fs from 'node:fs';

const required=(text,needle,replacement,label)=>{if(!text.includes(needle))throw new Error(`Missing ${label}`);return text.replace(needle,replacement)};

let app=fs.readFileSync('public/assets/js/app.js','utf8');
app=required(app,
"Promise.all([import('/assets/js/mmengine.js'),import('/assets/js/game-quality.js')]).then(([engine,quality])=>{",
"Promise.all([import('/assets/js/mmengine.js'),import('/assets/js/game-quality.js'),import('/assets/js/game-campaign.js')]).then(([engine,quality,campaign])=>{",
'engine imports');
app=required(app,
"try{activeGame=engine.startGame(stage,g)}catch(error){console.error('Primary game runtime failed',error);activeGame=quality.startFallback(stage,g);return}",
"try{activeGame=engine.startGame(stage,g)}catch(error){console.error('Primary game runtime failed',error);activeGame=quality.startFallback(stage,g);activeGame=campaign.enhanceCampaign(stage,g,activeGame)||activeGame;return}",
'fallback campaign');
app=required(app,
"else activeGame=quality.enhanceShared(stage,g,activeGame)||activeGame;",
"else {activeGame=quality.enhanceShared(stage,g,activeGame)||activeGame;activeGame=campaign.enhanceCampaign(stage,g,activeGame)||activeGame;}",
'campaign enhancement');
app=required(app,
"import('/assets/js/game-quality.js').then(quality=>{activeGame=quality.startFallback(stage,g)}).catch(()=>{stage.innerHTML='<div class=\"empty\" style=\"padding:40px\">This game could not load. <a href=\"'+g.detailUrl+'\">View details</a></div>'});",
"Promise.all([import('/assets/js/game-quality.js'),import('/assets/js/game-campaign.js')]).then(([quality,campaign])=>{activeGame=quality.startFallback(stage,g);activeGame=campaign.enhanceCampaign(stage,g,activeGame)||activeGame}).catch(()=>{stage.innerHTML='<div class=\"empty\" style=\"padding:40px\">This game could not load. <a href=\"'+g.detailUrl+'\">View details</a></div>'});",
'load failure campaign');
fs.writeFileSync('public/assets/js/app.js',app);

const cssPath='public/assets/css/game-quality.css';
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes('MMA_CAMPAIGN_DEPTH'))css+=`\n/* MMA_CAMPAIGN_DEPTH */\n.mma-campaign-panel{margin:16px 0 22px;padding:18px;border:1px solid rgba(198,31,104,.18);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,244,250,.96));box-shadow:0 12px 32px rgba(61,29,78,.09)}\n.mma-campaign-heading{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.mma-campaign-heading>div:first-child{display:grid;gap:4px}.mma-campaign-kicker{text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:900;color:#c61f68}.mma-campaign-heading strong{font-size:20px;color:#2b2340}.mma-campaign-wallet{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.mma-campaign-wallet span{padding:6px 9px;border-radius:999px;background:#fff;border:1px solid rgba(138,92,255,.14);font-size:12px;font-weight:900;color:#5b427e}.mma-campaign-objective{margin-top:14px;display:grid;gap:8px;color:#5f5574;font-size:13px;font-weight:800}.mma-campaign-progress{height:9px;border-radius:999px;background:#eadff2;overflow:hidden}.mma-campaign-progress i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c61f68,#8a5cff,#19c39c);transition:width .25s ease}.mma-campaign-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}.mma-campaign-actions button{border:1px solid rgba(91,47,209,.2);background:#fff;color:#4b376b;border-radius:999px;padding:9px 13px;font-weight:900;cursor:pointer}.mma-campaign-actions button[aria-pressed=\"true\"]{background:#2b2340;color:#fff}.mma-campaign-actions button:disabled{opacity:.65;cursor:default}.mma-campaign-chapters{list-style:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;padding:0;margin:16px 0 0}.mma-campaign-chapters li{display:grid;grid-template-columns:auto 1fr;gap:6px;align-items:center;min-width:0;padding:8px;border-radius:12px;background:#f5eff9;color:#77698b;font-size:11px;font-weight:800}.mma-campaign-chapters li span{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#fff}.mma-campaign-chapters li.active{background:#efe5ff;color:#5b2fd1;box-shadow:inset 0 0 0 1px rgba(91,47,209,.18)}.mma-campaign-chapters li.complete{background:#e8faf4;color:#087b5e}.mma-campaign-result{display:grid;gap:3px;margin-top:14px;padding:12px 14px;border-radius:14px;background:#fff2f5;color:#6b3a4c}.mma-campaign-result.success{background:#e9faf4;color:#087b5e}.mma-campaign-result strong{font-size:15px}.mma-campaign-result span{font-size:12px}\n@media(max-width:720px){.mma-campaign-heading{display:grid}.mma-campaign-wallet{justify-content:flex-start}.mma-campaign-chapters{grid-template-columns:1fr}.mma-campaign-actions{display:grid;grid-template-columns:1fr 1fr}.mma-campaign-actions button{white-space:normal}}\n@media(prefers-reduced-motion:reduce){.mma-campaign-progress i{transition:none}}\n`;
fs.writeFileSync(cssPath,css);

let validate=fs.readFileSync('scripts/validate-site.mjs','utf8');
validate=validate.replace("'public/assets/js/game-quality.js','src/worker.js','scripts/remediate-site.mjs','scripts/sitewide-audit.mjs'","'public/assets/js/game-quality.js','public/assets/js/game-campaign.js','src/worker.js','scripts/sitewide-audit.mjs','scripts/remediation-smoke.mjs'");
if(!validate.includes("public/assets/js/game-campaign.js"))throw new Error('Validator campaign insertion failed');
fs.writeFileSync('scripts/validate-site.mjs',validate);

let smoke=fs.readFileSync('scripts/remediation-smoke.mjs','utf8');
smoke=required(smoke,
"qualityPanel: Boolean(document.querySelector('.mma-quality-panel')),",
"qualityPanel: Boolean(document.querySelector('.mma-quality-panel')),\n        campaignPanel: Boolean(document.querySelector('.mma-campaign-panel')),",
'smoke metric');
smoke=required(smoke,
"const ok = status === 200 && (metrics.canvas || metrics.iframe) && !metrics.horizontalOverflow && fatal.length === 0;",
"const ok = status === 200 && (metrics.canvas || metrics.iframe) && (!metrics.canvas || metrics.campaignPanel) && !metrics.horizontalOverflow && fatal.length === 0;",
'smoke campaign assertion');
fs.writeFileSync('scripts/remediation-smoke.mjs',smoke);
console.log('Applied campaign depth pass.');
