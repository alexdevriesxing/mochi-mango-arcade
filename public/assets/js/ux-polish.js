// Mochi Mango Arcade — progressive UX polish. Works on prerendered and hydrated pages.
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const safeJson=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
const state={games:null,applying:false,searchIndex:-1};

async function getGames(){
  if(state.games)return state.games;
  try{
    const response=await fetch('/assets/data/games.json',{credentials:'same-origin'});
    if(!response.ok)throw new Error(String(response.status));
    state.games=await response.json();
  }catch{state.games=[]}
  return state.games;
}

function pageKey(){
  const path=location.pathname;
  if(path==='/')return 'home';
  if(path.startsWith('/games'))return 'games';
  if(path.startsWith('/universes'))return 'universes';
  if(path.startsWith('/characters'))return 'characters';
  if(path.startsWith('/play/'))return 'play';
  if(path.startsWith('/shop'))return 'shop';
  if(path.startsWith('/profile'))return 'profile';
  return 'more';
}

function enhanceHeader(){
  const nav=$('.navlinks');
  if(nav)nav.setAttribute('aria-label','Primary navigation');
  const toggle=$('#mobileMenu');
  const panel=$('#mobilePanel');
  if(toggle&&panel&&!toggle.dataset.polished){
    toggle.dataset.polished='1';
    toggle.setAttribute('aria-controls','mobilePanel');
    toggle.setAttribute('aria-expanded',String(!panel.hidden));
    toggle.setAttribute('aria-label','Open navigation menu');
    panel.setAttribute('aria-label','Mobile navigation');
    panel.setAttribute('role','navigation');
    const sync=()=>{
      const open=!panel.hidden;
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');
      document.body.classList.toggle('menu-open',open);
    };
    toggle.addEventListener('click',()=>queueMicrotask(sync));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!panel.hidden){panel.hidden=true;sync();toggle.focus()}
    });
    panel.addEventListener('click',event=>{if(event.target.closest('a')){panel.hidden=true;sync()}});
  }
}

async function enhanceSearch(){
  const input=$('#globalSearch');
  const box=input?.closest('.searchbox');
  if(!input||!box||input.dataset.polished)return;
  input.dataset.polished='1';
  input.type='search';
  input.autocomplete='off';
  input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('aria-controls','gameSearchSuggestions');
  const list=document.createElement('div');
  list.id='gameSearchSuggestions';
  list.className='search-suggestions';
  list.setAttribute('role','listbox');
  box.appendChild(list);
  const games=await getGames();
  const close=()=>{list.classList.remove('open');input.setAttribute('aria-expanded','false');state.searchIndex=-1};
  const open=()=>{list.classList.add('open');input.setAttribute('aria-expanded','true')};
  const results=()=>$$('.search-result',list);
  const select=index=>{
    const items=results();
    if(!items.length)return;
    state.searchIndex=(index+items.length)%items.length;
    items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===state.searchIndex)));
    items[state.searchIndex].scrollIntoView({block:'nearest'});
  };
  const render=()=>{
    const query=input.value.trim().toLowerCase();
    if(query.length<2){close();list.innerHTML='';return}
    const matches=games.filter(game=>`${game.title} ${game.genre} ${game.mascot} ${game.universeName||game.universe}`.toLowerCase().includes(query)).slice(0,7);
    list.innerHTML=matches.length?matches.map(game=>`<a class="search-result" role="option" aria-selected="false" href="${escapeHtml(game.detailUrl)}"><img src="${escapeHtml(game.image)}" alt="" loading="lazy"><span><strong>${escapeHtml(game.title)}</strong><small>${escapeHtml(game.genre)} · ${escapeHtml(game.mascot)}</small></span></a>`).join(''):`<div class="search-empty">No games found. Try a genre or character.</div>`;
    open();
  };
  input.addEventListener('input',render);
  input.addEventListener('focus',()=>{if(input.value.trim().length>=2)render()});
  input.addEventListener('keydown',event=>{
    const items=results();
    if(event.key==='ArrowDown'&&items.length){event.preventDefault();event.stopImmediatePropagation();select(state.searchIndex+1)}
    if(event.key==='ArrowUp'&&items.length){event.preventDefault();event.stopImmediatePropagation();select(state.searchIndex-1)}
    if(event.key==='Escape'){close()}
    if(event.key==='Enter'&&items.length){event.preventDefault();event.stopImmediatePropagation();location.href=items[Math.max(0,state.searchIndex)]?.href||items[0].href}
  },true);
  document.addEventListener('pointerdown',event=>{if(!box.contains(event.target))close()});
}

function enhanceCards(){
  $$('.game-card').forEach((card,index)=>{
    if(card.dataset.polished)return;
    card.dataset.polished='1';
    const link=$('a',card),title=$('.game-title',card),thumb=$('.thumb',card),image=$('img',card);
    if(link&&title){link.setAttribute('aria-label',`Open ${title.textContent.trim()}`);title.title=title.textContent.trim()}
    if(thumb&&!$('.card-play-cue',thumb))thumb.insertAdjacentHTML('beforeend','<span class="card-play-cue" aria-hidden="true">▶</span>');
    if(image){image.decoding='async';if(index<4&&location.pathname==='/'){image.loading='eager';image.fetchPriority='high'}}
  });
}

function recordRecent(){
  const match=location.pathname.match(/^\/(?:games|play)\/([^/]+)\/?/);
  if(!match)return;
  const slug=match[1];
  const items=safeJson(localStorage.getItem('mma_recent_games')||'[]',[]).filter(item=>item.slug!==slug);
  items.unshift({slug,visitedAt:Date.now()});
  localStorage.setItem('mma_recent_games',JSON.stringify(items.slice(0,8)));
}

async function enhanceHome(){
  if(location.pathname!=='/'||$('#mmaDiscovery'))return;
  const games=await getGames();
  const playable=games.filter(game=>game.built!==false);
  const hero=$('.hero-content');
  if(hero){
    const heading=$('h1',hero);
    if(heading)heading.innerHTML=`${playable.length} free games.<br><span>One playful universe.</span>`;
    const paragraph=$('p',hero);
    if(paragraph)paragraph.textContent='Instant browser games with original characters, campaign goals and daily reasons to come back — no download and no account required.';
    if(!$('.hero-proof',hero))hero.insertAdjacentHTML('beforeend','<div class="hero-proof"><span>Mobile & desktop</span><span>Family-friendly</span><span>Progress saves locally</span></div>');
  }
  const heroWrap=$('.hero-wrap');
  if(!heroWrap)return;
  const genreCounts=new Map();
  playable.forEach(game=>genreCounts.set(game.genre,(genreCounts.get(game.genre)||0)+1));
  const genres=[...genreCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
  heroWrap.insertAdjacentHTML('afterend',`<section class="discovery-strip" id="mmaDiscovery" aria-labelledby="discoverTitle"><div class="discovery-head"><div><h2 id="discoverTitle">Find your next game</h2><p>Jump straight into a favourite style or let the arcade surprise you.</p></div><button class="btn small" type="button" id="surpriseGame">🎲 Surprise me</button></div><div class="genre-quicklinks">${genres.map(([genre,count])=>`<a class="genre-chip" href="/games/?genre=${encodeURIComponent(genre)}">${escapeHtml(genre)} <span aria-label="${count} games">${count}</span></a>`).join('')}</div></section>`);
  $('#surpriseGame')?.addEventListener('click',()=>{const game=playable[Math.floor(Math.random()*playable.length)];if(game)location.href=game.playUrl||game.detailUrl});
  const recent=safeJson(localStorage.getItem('mma_recent_games')||'[]',[]);
  const recentGames=recent.map(item=>playable.find(game=>game.slug===item.slug)).filter(Boolean).slice(0,4);
  const discovery=$('#mmaDiscovery');
  discovery.insertAdjacentHTML('afterend',`<section class="continue-section" id="continuePlaying" ${recentGames.length?'':'hidden'} aria-labelledby="continueTitle"><div class="section-head"><h2 id="continueTitle">↩ Continue playing</h2><a class="view-all-link" href="/games/">Browse all games</a></div><div class="continue-grid">${recentGames.map(game=>`<a class="continue-card" href="${escapeHtml(game.playUrl||game.detailUrl)}"><img src="${escapeHtml(game.image)}" alt="" loading="lazy"><span><strong>${escapeHtml(game.title)}</strong><small>${escapeHtml(game.genre)} · resume</small></span></a>`).join('')}</div></section>`);
}

function enhanceCatalog(){
  const layout=$('.catalog-layout, .shop-layout');
  const filters=layout?.querySelector('.filters');
  if(layout&&filters&&!layout.dataset.filterPolished){
    layout.dataset.filterPolished='1';
    const button=document.createElement('button');
    button.className='btn secondary small mobile-filter-toggle';
    button.type='button';
    button.setAttribute('aria-expanded','false');
    button.textContent='🎛️ Show filters';
    layout.parentElement.insertBefore(button,layout);
    button.addEventListener('click',()=>{
      const open=layout.classList.toggle('filters-open');
      button.setAttribute('aria-expanded',String(open));
      button.textContent=open?'✕ Hide filters':'🎛️ Show filters';
      if(open)filters.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  $$('[data-sort],#playableToggle').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.classList.contains('active')));
    if(!button.dataset.pressSync){button.dataset.pressSync='1';button.addEventListener('click',()=>queueMicrotask(()=>button.setAttribute('aria-pressed',String(button.classList.contains('active')))))}
  });
  const params=new URLSearchParams(location.search);
  const genre=params.get('genre');
  const genreSelect=$('#fg');
  if(genre&&genreSelect&&[...genreSelect.options].some(option=>option.value===genre||option.text===genre)){
    genreSelect.value=genre;
    genreSelect.dispatchEvent(new Event('input',{bubbles:true}));
  }
}

async function enhanceDetail(){
  const match=location.pathname.match(/^\/games\/([^/]+)\/?/);
  if(!match||$('.game-context-card'))return;
  const games=await getGames();
  const game=games.find(item=>item.slug===match[1]);
  const card=$('.detail-card');
  if(!game||!card)return;
  const facts=`<section class="game-context-card" aria-label="Game release information" style="margin-top:16px;padding:16px 18px"><strong>Release details</strong><p style="margin:5px 0 0">Version ${escapeHtml(game.version||'1.0')} · Released ${escapeHtml(game.releaseDate||'2026')} · Created by Fire Dragon Interactive · Free to play</p></section>`;
  card.insertAdjacentHTML('beforeend',facts);
}

function enhancePlay(){
  if(!location.pathname.startsWith('/play/')||$('.play-tools'))return;
  const shell=$('.play-shell');
  const heading=$('.play-heading');
  if(!shell||!heading)return;
  heading.insertAdjacentHTML('afterend','<div class="play-tools"><button class="play-tool" type="button" id="focusGame">⛶ Focus mode</button><button class="play-tool" type="button" id="fullscreenGame">↗ Full screen</button><a class="play-tool" href="/games/">← All games</a></div>');
  $('#focusGame')?.addEventListener('click',event=>{
    const active=document.body.classList.toggle('game-focus');
    event.currentTarget.textContent=active?'✕ Exit focus mode':'⛶ Focus mode';
    shell.scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#fullscreenGame')?.addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen()}catch{}
  });
}

function enhanceAbout(){
  if(location.pathname!=='/about/'||$('.about-trust'))return;
  const hero=$('.page-hero');
  if(hero){
    const p=$('p',hero);
    if(p)p.textContent='Mochi Mango Arcade is a family-friendly browser arcade by Fire Dragon Interactive, built around original games, recurring characters and transparent free-to-play access.';
  }
  const main=$('#main');
  if(!main)return;
  const trust=`<section class="about-trust"><h2>What players can expect</h2><div class="trust-grid"><div class="trust-card"><strong>Original worlds</strong><p>Games, characters and artwork are created for Mochi Mango Arcade and its connected universes.</p></div><div class="trust-card"><strong>Honest free access</strong><p>All 392 games can be played in the browser without an account or download.</p></div><div class="trust-card"><strong>Accessible controls</strong><p>Shared runtimes support touch, mouse and keyboard, with reduced-motion and visible-focus support.</p></div><div class="trust-card"><strong>Clear ownership</strong><p>The arcade is published and maintained by Fire Dragon Interactive.</p></div></div><div class="footer-proof"><a href="/assets/data/site-facts.json">Machine-readable facts</a><a href="/ai/catalog.json">AI-readable catalogue</a><a href="/llms.txt">LLM overview</a><a href="/privacy/">Privacy policy</a></div></section>`;
  hero.insertAdjacentHTML('afterend',trust);
}

function enhanceFooter(){
  const newsletter=$('.newsletter');
  if(newsletter&&!newsletter.dataset.polished){
    newsletter.dataset.polished='1';
    const form=$('.newsletter-form',newsletter);
    if(form)form.outerHTML='<div class="newsletter-cta"><a class="btn btn-subscribe" href="/new-releases/">See new releases</a><a class="btn secondary" href="/games/">Browse all games</a></div>';
    const copy=$('.inner > div:first-child p',newsletter);
    if(copy)copy.textContent='New games and character updates are published directly on the arcade — no pretend signup form.';
    $('.social-icons',newsletter)?.remove();
  }
  const footer=$('.footer');
  if(footer&&!footer.dataset.polished){
    footer.dataset.polished='1';
    const first=$('.footer-grid > div:first-child',footer);
    if(first)first.insertAdjacentHTML('beforeend','<div class="footer-proof"><span>392 playable games</span><span>14 original universes</span><a href="/assets/data/site-facts.json">Verified site facts</a><a href="/llms.txt">AI/LLM guide</a></div>');
  }
}

function addMobileNav(){
  if($('.mobile-bottom-nav'))return;
  const key=pageKey();
  document.body.insertAdjacentHTML('beforeend',`<nav class="mobile-bottom-nav" aria-label="Mobile quick navigation"><a class="${key==='home'?'active':''}" href="/"><span>⌂</span>Home</a><a class="${key==='games'||key==='play'?'active':''}" href="/games/"><span>🎮</span>Games</a><a class="${key==='universes'?'active':''}" href="/universes/"><span>🌈</span>Worlds</a><a class="${key==='characters'?'active':''}" href="/characters/"><span>✨</span>Characters</a><a class="${key==='profile'?'active':''}" href="/profile/"><span>🏆</span>Profile</a></nav>`);
}

async function apply(){
  if(state.applying)return;
  state.applying=true;
  try{
    enhanceHeader();
    await enhanceSearch();
    enhanceCards();
    recordRecent();
    await enhanceHome();
    enhanceCatalog();
    await enhanceDetail();
    enhancePlay();
    enhanceAbout();
    enhanceFooter();
    addMobileNav();
  }finally{state.applying=false}
}

let scheduled=false;
const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
