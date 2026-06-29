const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S={games:[],products:[],universes:{},i18n:{},lang:localStorage.mma_lang||'en',cart:JSON.parse(localStorage.mma_cart||'[]')};

async function J(p){return (await fetch(p)).json()}
function t(k){return (S.i18n[S.lang]?.[k])||S.i18n.en?.[k]||k}
function money(n){return '$'+Number(n).toFixed(2)}
function slug(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

function getProductRating(id) {
  let hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let rating = 4.2 + (hash % 9) / 10.0; // between 4.2 and 5.0
  let reviews = 42 + (hash % 380); // between 42 and 422 reviews
  let stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return { rating: rating.toFixed(1), reviews, stars };
}

function applyI18n(){
  let l=S.i18n[S.lang]||S.i18n.en;
  document.documentElement.lang=S.lang;
  document.body.dir=l.dir||'ltr';
  $$('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
  $$('[data-i18n-placeholder]').forEach(e=>e.placeholder=t(e.dataset.i18nPlaceholder));
  $$('.lang-select').forEach(e=>{if(e.dataset.skip!=='1')e.value=S.lang});
  badge();
}

function header(active='home'){
  let nav=[
    ['/','home', t('home')],
    ['/games/','games', t('games')],
    ['/universes/','universes', t('universes')],
    ['/characters/','characters', t('characters')],
    ['/shop/','shop', 'Merch Shop'],
    ['/new-releases/','newReleases', 'New Releases <span class="new-dot">NEW</span>'],
    ['/about/','about', t('about')]
  ];
  return `<a class="skip-link" href="#main">Skip</a>
  <header class="topbar">
    <div class="container nav">
      <a class="brand" href="/">
        <img src="/assets/images/logo.svg" alt="Mochi Mango Arcade">
      </a>
      <nav class="navlinks">
        ${nav.map(([u,k,label])=>`<a class="${active==k?'active':''}" href="${u}">${label}</a>`).join('')}
      </nav>
      <div class="nav-actions">
        <label class="searchbox">🔍 <input id="globalSearch" data-i18n-placeholder="search" placeholder="${t('search')}"></label>
        <select class="lang-select" aria-label="Language">
          ${Object.entries(S.i18n).map(([c,l])=>`<option value="${c}">${l.name}</option>`).join('')}
        </select>
        <button class="btn small header-cart-btn" id="cartOpen">🛒 Cart (<span id="cartBadge">0</span>)</button>
        <a href="/games/" class="btn small header-play-btn">🎮 Play Now</a>
        <button class="btn small mobile-toggle" id="mobileMenu">☰</button>
      </div>
    </div>
  </header>
  <div id="mobilePanel" class="container" hidden>
    <div class="chip-row">
      ${nav.map(([u,k,label])=>`<a class="chip ${active==k?'active':''}" href="${u}">${label}</a>`).join('')}
    </div>
  </div>`;
}

function footer(){
  return `<section class="newsletter">
    <div class="container inner">
      <div>
        <h3>✉️ Stay in the Loop!</h3>
        <p>Get new game alerts, merch drops & playful surprises!</p>
      </div>
      <form class="newsletter-form" onsubmit="event.preventDefault();toast('Subscribed!')">
        <input type="email" placeholder="Enter your email address" required>
        <button class="btn btn-subscribe">Subscribe</button>
      </form>
      <div class="social-icons">
        <a href="https://discord.com" class="social-icon" target="_blank" aria-label="Discord">🎮</a>
        <a href="https://tiktok.com" class="social-icon" target="_blank" aria-label="TikTok">🎵</a>
        <a href="https://youtube.com" class="social-icon" target="_blank" aria-label="YouTube">📺</a>
        <a href="https://instagram.com" class="social-icon" target="_blank" aria-label="Instagram">📸</a>
        <a href="https://twitter.com" class="social-icon" target="_blank" aria-label="Twitter">🐦</a>
      </div>
    </div>
  </section>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <img src="/assets/images/logo.svg" alt="Mochi Mango Logo">
          <p>A playful universe of games, characters, and collectibles for everyone!</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="/">${t('home')}</a>
          <a href="/games/">${t('games')}</a>
          <a href="/universes/">${t('universes')}</a>
          <a href="/characters/">${t('characters')}</a>
        </div>
        <div>
          <h4>Community</h4>
          <a href="/new-releases/">${t('newReleases')}</a>
          <a href="/leaderboards/">${t('leaderboards')}</a>
          <a href="/adsterra-map/">${t('adMap')}</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="/about/">${t('about')}</a>
          <a href="/privacy/">Privacy Policy</a>
          <a href="/terms/">Terms of Use</a>
        </div>
        <div>
          <div class="footer-love-card">
            Made with ❤️ for playful gamers around the world!
          </div>
        </div>
      </div>
      <div class="copyright">
        <span>© 2026 by <strong>Fire Dragon Interactive</strong> · <a href="https://www.firedragoninteractive.com" target="_blank" rel="noopener">www.firedragoninteractive.com</a></span>
        <span style="color:#10b981">🛡️ Play safe. Have fun!</span>
      </div>
    </div>
  </footer>
  <div class="cart-drawer" id="cartDrawer"></div>
  <div class="toast" id="toast"></div>`;
}

const adTop=()=>`<div class="ad-slot ad-top">Leaderboard Banner 728×90 · Your ad here · Reach playful gamers!</div>`;
const adSide=()=>`<div class="ad-slot ad-side">Sidebar Rectangle 300×250 · Your ad here</div>`;

function gameCard(g){
  return `<article class="card game-card" data-genre="${g.genre}" data-universe="${g.universe}">
    <a href="${g.detailUrl}">
      <span class="badge ${g.new?'':g.status.includes('Playable')?'play':'soon'}">${g.new?'NEW':g.status.includes('Playable')?'PLAY':'SOON'}</span>
      <div class="thumb"><img loading="lazy" src="${g.image}" alt="${g.title}"></div>
      <div class="card-body">
        <h3 class="game-title">${g.title}</h3>
        <div class="meta">
          <span>${g.genre}</span>
          <span class="rating">★ ${g.rating}</span>
        </div>
      </div>
    </a>
  </article>`;
}

function productCard(p){
  let r = getProductRating(p.id);
  return `<article class="card product-card" data-type="${p.type}" data-character="${p.character}">
    <span class="badge">${p.tag}</span>
    <a href="/shop/${p.id}/">
      <div class="product-img"><img loading="lazy" src="${p.image}" alt="${p.name}"></div>
    </a>
    <div class="card-body">
      <h3 class="product-title">${p.name}</h3>
      <div class="product-rating-row">
        <span class="stars">${r.stars}</span>
        <span>(${r.reviews})</span>
      </div>
      <div class="product-actions">
        <span class="price">${money(p.price)}</span>
        <button class="btn small add-cart" data-id="${p.id}">🛍️ Add to Cart</button>
      </div>
    </div>
  </article>`;
}

function universeCard(k,u){
  let n=S.games.filter(g=>g.universe==k).length;
  return `<a class="card universe-card" href="/universes/#${k}">
    <img src="/assets/images/universes/${k}.svg" alt="${u.name}" onerror="this.src='/assets/images/hero.svg'">
    <h3>${u.name}</h3>
    <p>${n} games · ${u.description}</p>
  </a>`;
}

function charCard(c,n){
  return `<a class="card character-card" href="/characters/#${slug(c)}">
    <img src="/assets/images/characters/${slug(c)}.svg" alt="${c}" onerror="this.src='/assets/images/characters/mochi.svg'">
    <strong>${c}</strong>
  </a>`;
}

function section(key,arr,icon='🎮',link='/games/'){
  return `<section class="section">
    <div class="section-head">
      <h2><span class="emoji">${icon}</span> <span data-i18n="${key}">${t(key)}</span></h2>
      <a class="view-all-link" href="${link}">View all &gt;</a>
    </div>
    <div class="grid game-grid">${arr.map(gameCard).join('')}</div>
  </section>`;
}

function home(){
  let f=S.games.filter(g=>g.featured).slice(0,5);
  let n=S.games.filter(g=>g.new).slice(0,5);
  let cc={};
  S.games.forEach(g=>cc[g.mascot]=(cc[g.mascot]||0)+1);
  let chars=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  
  return `<main id="main" class="container">
    ${adTop()}
    <div class="hero-wrap">
      <section class="hero-card">
        <img src="/assets/images/hero.svg" alt="Mochi Mango Arcade">
        <div class="hero-content">
          <div class="hero-badges">
            <span class="hero-badge-pill">⚡ Instant Play</span>
            <span class="hero-badge-pill">👶 Kid-Friendly</span>
            <span class="hero-badge-pill">⭐ Always Free</span>
          </div>
          <h1>200+<br><span>Playful HTML5 Games</span></h1>
          <p>Games, plushies, and collectible merch in one colorful universe.</p>
          <div class="hero-actions">
            <a href="/games/" class="btn">🎮 Play Now</a>
            <a href="/universes/" class="btn secondary">Explore Universes</a>
          </div>
        </div>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card">
          <h3 class="promo-title">🛍️ Mochi Mango Merch Shop</h3>
          <p>Plushies, mugs, stickers, shirts & more!</p>
          <a class="btn small" href="/shop/">Shop Now</a>
        </div>
        <div class="promo-card why-play">
          <h3 class="promo-title" style="color: var(--purple);">💜 Why Play?</h3>
          <ul>
            <li>No downloads. Instant HTML5 fun!</li>
            <li>Safe, family-friendly & ad-supported</li>
            <li>New games & content added weekly</li>
            <li>Play on any device, anytime</li>
          </ul>
        </div>
      </aside>
    </div>
    
    ${section('featuredGames',f)}
    
    <section class="section">
      <div class="section-head">
        <h2><span class="emoji">🌈</span> <span data-i18n="gameUniverses">${t('gameUniverses')}</span></h2>
        <a class="view-all-link" href="/universes/">View all &gt;</a>
      </div>
      <div class="grid universe-grid">
        ${Object.entries(S.universes).slice(0,3).map(([k,u])=>universeCard(k,u)).join('')}
      </div>
    </section>
    
    ${section('newThisWeek',n,'✨','/new-releases/')}
    
    <section class="section">
      <div class="section-head">
        <h2><span class="emoji">🔥</span> <span data-i18n="trendingCharacters">${t('trendingCharacters')}</span></h2>
        <a class="view-all-link" href="/characters/">View all &gt;</a>
      </div>
      <div class="grid character-grid">
        ${chars.map(([c,n])=>charCard(c,n)).join('')}
      </div>
    </section>
  </main>`;
}

function gamesPage(){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="allGames">${t('allGames')}</h1>
      <p>Browse all 200 concepts by universe, genre, character and engine type.</p>
    </section>
    <div class="catalog-layout">
      <aside class="filters">
        <h3>🎛️ Filters</h3>
        <div class="field">
          <label data-i18n="universes">${t('universes')}</label>
          <select id="fu">
            <option value="">All</option>
            ${Object.entries(S.universes).map(([k,u])=>`<option value="${k}">${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Genre</label>
          <select id="fg">
            <option value="">All</option>
            ${[...new Set(S.games.map(g=>g.genre))].sort().map(x=>`<option>${x}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label data-i18n="character">${t('character')}</label>
          <input id="fc" placeholder="Mochi, Puddle, Pip...">
        </div>
        <button class="btn secondary small clear-filters" id="clearGames" data-i18n="clearFilters">${t('clearFilters')}</button>
      </aside>
      <section>
        <div class="toolbar">
          <div class="count" id="gameCount"></div>
          <div class="chip-row" style="margin:0">
            <button class="chip active" data-sort="id">Newest</button>
            <button class="chip" data-sort="popular">Popular</button>
            <button class="chip" id="randomGame" data-i18n="randomGame">${t('randomGame')}</button>
          </div>
        </div>
        <div id="gamesGrid" class="grid game-grid"></div>
      </section>
    </div>
  </main>`;
}

function universesPage(){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="universes">${t('universes')}</h1>
      <p>Recurring worlds designed for games, plush toys, merch drops and franchise growth.</p>
    </section>
    <div class="grid universe-grid">${Object.entries(S.universes).map(([k,u])=>universeCard(k,u)).join('')}</div>
    ${Object.entries(S.universes).map(([k,u])=>`<section id="${k}" class="section">
      <div class="section-head">
        <h2>${u.name}</h2>
        <span class="chip" style="pointer-events:none">${S.games.filter(g=>g.universe==k).length} games</span>
      </div>
      <p style="color:var(--muted); font-weight:700; margin-bottom:16px;">${u.description}</p>
      <div class="grid game-grid">${S.games.filter(g=>g.universe==k).slice(0,5).map(gameCard).join('')}</div>
    </section>`).join('')}
  </main>`;
}

function charsPage(){
  let cc={};
  S.games.forEach(g=>cc[g.mascot]=(cc[g.mascot]||0)+1);
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="characters">${t('characters')}</h1>
      <p>Meet the mascots behind the games. Each character is designed for plush, pins, stickers and collectibles.</p>
    </section>
    <div class="grid character-grid">
      ${Object.entries(cc).sort((a,b)=>a[0].localeCompare(b[0])).map(([c,n])=>charCard(c,n)).join('')}
    </div>
  </main>`;
}

function shopPage(){
  let types = ["Plushies", "Apparel", "Mugs", "Stickers", "Pins", "Accessories", "Bundles"];
  let characters = ["Mochi", "Mango", "Neko", "Pandy", "Zuzu"];
  
  return `<main id="main" class="container">
    <section class="page-hero shop-hero">
      <div class="shop-hero-text">
        <h1 data-i18n="shopTitle">${t('shopTitle')}</h1>
        <p data-i18n="shopSub">${t('shopSub')}</p>
        <div class="shop-hero-badges">
          <span class="shop-hero-badge">✅ Officially Licensed</span>
          <span class="shop-hero-badge">⭐ Cute Quality</span>
          <span class="shop-hero-badge">💖 Playful Joy</span>
        </div>
      </div>
    </section>
    
    <div class="shop-categories-tabs">
      <button class="shop-tab active" data-type="">All Products</button>
      ${types.map(type => `<button class="shop-tab" data-type="${type}">${type} ${type==='Bundles'||type==='Plushies'?`<span class="new-dot">NEW</span>`:''}</button>`).join('')}
    </div>

    <div class="shop-layout">
      <aside class="filters">
        <h3>🎛️ Filter Products</h3>
        
        <div class="field">
          <label data-i18n="productType">${t('productType')}</label>
          <div class="checkbox-group">
            ${types.map(type => `
              <label class="checkbox-label">
                <input type="checkbox" class="pt-checkbox" value="${type}">
                <span>${type}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="field">
          <label>Price Range</label>
          <div class="price-range-slider">
            <input type="range" id="priceRange" min="0" max="100" value="100">
            <div class="price-values">
              <span>$0</span>
              <span id="priceVal">$100+</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label data-i18n="character">${t('character')}</label>
          <div class="checkbox-group">
            ${characters.map(char => `
              <label class="checkbox-label">
                <input type="checkbox" class="pc-checkbox" value="${char}">
                <span>${char}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="field">
          <label>Size</label>
          <div class="checkbox-group">
            ${['XS', 'S', 'M', 'L', 'XL', '2XL'].map(sz => `
              <label class="checkbox-label">
                <input type="checkbox" class="ps-checkbox" value="${sz}">
                <span>${sz}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="field">
          <label>Availability</label>
          <div class="checkbox-group">
            <label class="checkbox-label"><input type="checkbox" checked> <span>In Stock</span></label>
            <label class="checkbox-label"><input type="checkbox"> <span>Pre-order</span></label>
          </div>
        </div>

        <button class="btn secondary small clear-filters" id="clearProducts" data-i18n="clearFilters">${t('clearFilters')}</button>
      </aside>
      
      <section>
        <div class="toolbar">
          <div class="count" id="productCount"></div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:13px; font-weight:800; color:var(--muted)">Sort by:</span>
            <select id="sortProducts" class="sort-select">
              <option value="popular">Popular</option>
              <option value="priceLow">Price Low</option>
              <option value="priceHigh">Price High</option>
            </select>
          </div>
        </div>
        <div id="productsGrid" class="grid product-grid"></div>
      </section>
    </div>

    <div class="merch-promo-banner">
      <div class="merch-promo-left">
        <div class="merch-promo-badge">SAVE<br>25%</div>
        <div class="merch-promo-text">
          <h3>Play More, Save More!</h3>
          <p>Bundles are the best way to collect your favorite Mochi Mango merch and save big!</p>
        </div>
      </div>
      <button class="btn" id="shopBundlesBtn">Shop All Bundles</button>
    </div>
  </main>`;
}

function newPage(){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="newReleases">${t('newReleases')}</h1>
      <p>Fresh concepts, mascot drops and upcoming prototypes.</p>
    </section>
    <div class="grid game-grid">${S.games.filter(g=>g.new).map(gameCard).join('')}</div>
  </main>`;
}

function aboutPage(){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="about">${t('about')}</h1>
      <p>Mochi Mango Arcade is a scalable HTML5 game and merch platform by Fire Dragon Interactive for 200+ games, recurring universes, ad monetization and collectibles.</p>
    </section>
    <section class="section">
      <div class="grid universe-grid">
        <div class="promo-card">
          <h3>Cloudflare-ready</h3>
          <p>Worker routing, static assets, GitHub deployment and R2-ready asset architecture.</p>
        </div>
        <div class="promo-card">
          <h3>Merch-first IP</h3>
          <p>Characters and universes support plush, apparel, stickers and collectibles.</p>
        </div>
        <div class="promo-card">
          <h3>Multilingual</h3>
          <p>18-language UI selector with RTL support for Arabic.</p>
        </div>
      </div>
    </section>
  </main>`;
}

function leaderboardPage(){
  let top=[...S.games].sort((a,b)=>b.plays-a.plays).slice(0,50);
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="leaderboards">${t('leaderboards')}</h1>
      <p>Mock leaderboard ready for D1, KV or Durable Objects later.</p>
    </section>
    ${top.map((g,i)=>`<div class="leader-row">
      <div class="rank">#${i+1}</div>
      <div>
        <strong>${g.title}</strong>
        <div class="meta"><span>${g.genre}</span><span>${g.universeName}</span></div>
      </div>
      <div class="hide-sm rating">★ ${g.rating}</div>
      <div class="hide-sm" style="font-weight:800;color:var(--muted)">${g.plays.toLocaleString()} plays</div>
    </div>`).join('')}
  </main>`;
}

function adMapPage(){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="adMap">${t('adMap')}</h1>
      <p>Adsterra-ready placements for desktop and mobile without interrupting fair gameplay moments.</p>
    </section>
    <div class="ad-map-grid">${['Top leaderboard 728×90','Sidebar rectangle 300×250','In-feed native card','Pre-game interstitial placeholder','Post-game reward panel','Shop sidebar rectangle','Footer banner','Mobile safe-area slot'].map((x,i)=>`<div class="ad-map-card">
      <h3>${x}</h3>
      <p>Use after load, between blocks, or after level completion. Avoid accidental clicks.</p>
      <div class="mock-line"></div>
      <div class="mock-line" style="width:${70+i*3}%"></div>
    </div>`).join('')}</div>
  </main>`;
}

function legal(kind){
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="${kind}">${t(kind)}</h1>
      <p>Placeholder legal page. Replace with reviewed legal copy before launch.</p>
    </section>
    <div class="detail-card">
      <h2>Draft placeholder</h2>
      <p>Add final privacy, cookie, advertising, ecommerce and child-safety terms before production.</p>
    </div>
  </main>`;
}

function gameDetail(sl){
  let g=S.games.find(x=>x.slug==sl)||S.games[0],rel=S.games.filter(x=>x.universe==g.universe&&x.slug!=g.slug).slice(0,5);
  return `<main id="main" class="container">
    <div class="detail-layout">
      <section>
        <div class="detail-card">
          <div class="detail-img"><img src="${g.image}" alt="${g.title}" onerror="this.src='/assets/images/hero.svg'"></div>
          <h1>${g.title}</h1>
          <p>${g.description}</p>
          <div class="chip-row">
            <span class="chip">${g.genre}</span>
            <span class="chip">${g.universeName}</span>
            <span class="chip">${g.mascot}</span>
            <span class="chip">★ ${g.rating}</span>
          </div>
          <div class="hero-actions">
            <a class="btn" href="${g.playUrl}">🎮 <span data-i18n="playNow">${t('playNow')}</span></a>
            <a class="btn secondary" href="/shop/">🛍️ <span data-i18n="shopNow">${t('shopNow')}</span></a>
          </div>
        </div>
        <section class="section">
          <h2>Related Games</h2>
          <div class="grid game-grid">${rel.map(gameCard).join('')}</div>
        </section>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card">
          <h3>Merch Hook</h3>
          <p>${g.merchHook}</p>
        </div>
        <div class="promo-card">
          <h3>Build Notes</h3>
          <p>Engine template: ${g.engine}. Replace play shell with actual HTML5 bundle later.</p>
        </div>
      </aside>
    </div>
  </main>`;
}

function playPage(sl){
  let g=S.games.find(x=>x.slug==sl)||S.games[0];
  if(sl==='puddle-pip-meadow-dash'){
    return `<main id="main" class="container">
      ${adTop()}
      <div class="detail-layout">
        <section>
          <div class="play-shell" style="padding:0;overflow:hidden;aspect-ratio:16/9;background:#000;border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.6);border:1.5px solid var(--border-color);">
            <iframe src="game/index.html" style="width:100%;height:100%;border:none;display:block;border-radius:26px;" allow="autoplay"></iframe>
          </div>
          <div class="ad-slot" style="margin-top:18px; min-height:80px;">Post-game / reward ad placement</div>
        </section>
        <aside class="side-stack">
          ${adSide()}
          <div class="promo-card">
            <h3>Controls</h3>
            <p><strong>Jump / Glide:</strong> Space / Up / W (Hold to Glide)</p>
            <p><strong>Roll:</strong> Down / S</p>
            <p><strong>Pause:</strong> Esc / P</p>
          </div>
          <div class="promo-card">
            <h3>Tip</h3>
            <p>Touch players can swipe down or tap the on-screen Roll button to slide under sleeping branches.</p>
          </div>
        </aside>
      </div>
    </main>`;
  }
  if(sl==='puddles-pancake-panic'){
    return `<main id="main" class="container">
      ${adTop()}
      <div class="detail-layout">
        <section>
          <div class="play-shell" style="padding:0;overflow:hidden;aspect-ratio:16/9;background:#000;border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.6);border:1.5px solid var(--border-color);">
            <iframe src="game/index.html" style="width:100%;height:100%;border:none;display:block;border-radius:26px;" allow="autoplay"></iframe>
          </div>
          <div class="ad-slot" style="margin-top:18px; min-height:80px;">Post-game / reward ad placement</div>
        </section>
        <aside class="side-stack">
          ${adSide()}
          <div class="promo-card">
            <h3>Controls</h3>
            <p><strong>Mouse / Touch:</strong> Tap pans, toppings, serve button and order cards.</p>
            <p><strong>Space / Enter:</strong> Start / Resume / Pause</p>
            <p><strong>Q:</strong> Activate power when charged</p>
            <p><strong>Esc:</strong> Pause / Resume</p>
          </div>
          <div class="promo-card">
            <h3>Tip</h3>
            <p>Serve order combinations quickly to keep your multiplier combo meter high!</p>
          </div>
        </aside>
      </div>
    </main>`;
  }
  return `<main id="main" class="container">
    ${adTop()}
    <div class="detail-layout">
      <section>
        <div class="play-shell">
          <div class="game-canvas">
            <h2>${g.title}</h2>
            <p>${g.description}</p>
            <a class="btn" href="${g.detailUrl}">Game details</a>
            <p style="font-size:14px;opacity:.8;margin-top:18px">Drop the real HTML5 game build into this play shell later.</p>
          </div>
        </div>
        <div class="ad-slot" style="margin-top:18px">Post-game / reward ad placement</div>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card">
          <h3>Controls</h3>
          <p>Mobile-first shell. Add tap, swipe, pointer and keyboard bindings during integration.</p>
        </div>
      </aside>
    </div>
  </main>`;
}

function productPage(id){
  let p=S.products.find(x=>x.id==id)||S.products[0],rel=S.products.filter(x=>x.id!=p.id).slice(0,4);
  return `<main id="main" class="container">
    <div class="detail-layout">
      <section>
        <div class="detail-card">
          <div class="detail-img" style="aspect-ratio:1; background:#fff8fd; display:flex; align-items:center; justify-content:center;"><img src="${p.image}" alt="${p.name}" style="height:100%; object-fit:contain;"></div>
          <h1>${p.name}</h1>
          <p>${p.description}</p>
          <div class="chip-row">
            <span class="chip">${p.type}</span>
            <span class="chip">${p.character}</span>
            <span class="chip">${p.tag}</span>
          </div>
          <div class="product-actions" style="border:none; padding:0; margin-top:20px;">
            <span class="price" style="font-size:32px">${money(p.price)}</span>
            <button class="btn add-cart" data-id="${p.id}">🛍️ Add to Cart</button>
          </div>
        </div>
        <section class="section">
          <h2>More Merch</h2>
          <div class="grid product-grid">${rel.map(productCard).join('')}</div>
        </section>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card">
          <h3>Checkout placeholder</h3>
          <p>Connect Shopify, WooCommerce, Snipcart, Medusa, Stripe or a Cloudflare backend later.</p>
        </div>
      </aside>
    </div>
  </main>`;
}

function hydrateGames(){
  let grid=$('#gamesGrid');
  if(!grid)return;
  let sort='id';
  function run(){
    let a=[...S.games],u=$('#fu').value,g=$('#fg').value,c=$('#fc').value.toLowerCase();
    if(u)a=a.filter(x=>x.universe==u);
    if(g)a=a.filter(x=>x.genre==g);
    if(c)a=a.filter(x=>x.mascot.toLowerCase().includes(c)||x.title.toLowerCase().includes(c));
    if(sort=='popular')a.sort((x,y)=>y.plays-x.plays);
    grid.innerHTML=a.map(gameCard).join('')||'<div class="empty">No games found.</div>';
    $('#gameCount').textContent=`${a.length} / ${S.games.length} games`;
    tilt();
  }
  ['fu','fg','fc'].forEach(id=>$('#'+id).addEventListener('input',run));
  $('#clearGames').onclick=()=>{
    $('#fu').value='';
    $('#fg').value='';
    $('#fc').value='';
    run();
  };
  $$('[data-sort]').forEach(b=>b.onclick=()=>{
    $$('[data-sort]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    sort=b.dataset.sort;
    run();
  });
  $('#randomGame').onclick=()=>location.href=S.games[Math.floor(Math.random()*S.games.length)].detailUrl;
  run();
}

function getCheckedValues(selector) {
  return $$(selector).filter(el => el.checked).map(el => el.value);
}

function hydrateShop(){
  let grid=$('#productsGrid');
  if(!grid)return;
  
  function run(){
    let a=[...S.products];
    
    // Check Category Tabs first
    let activeTab = $('.shop-tab.active')?.dataset.type || '';
    let checkedTypes = getCheckedValues('.pt-checkbox');
    
    if (activeTab) {
      a = a.filter(x => x.type === activeTab);
      // Synchronize sidebar checkboxes
      $$('.pt-checkbox').forEach(cb => {
        cb.checked = (cb.value === activeTab);
      });
    } else if (checkedTypes.length > 0) {
      a = a.filter(x => checkedTypes.includes(x.type));
    }
    
    // Character checkboxes
    let checkedChars = getCheckedValues('.pc-checkbox');
    if (checkedChars.length > 0) {
      a = a.filter(x => checkedChars.includes(x.character));
    }
    
    // Price range range input
    let priceVal = parseFloat($('#priceRange').value);
    a = a.filter(x => x.price <= priceVal);
    $('#priceVal').textContent = priceVal >= 100 ? '$100+' : money(priceVal);
    
    // Sort
    let s=$('#sortProducts').value;
    if(s=='priceLow')a.sort((x,y)=>x.price-y.price);
    if(s=='priceHigh')a.sort((x,y)=>y.price-x.price);
    
    grid.innerHTML=a.map(productCard).join('')||'<div class="empty">No products found.</div>';
    $('#productCount').textContent=`${a.length} / ${S.products.length} products`;
    cartButtons();
    tilt();
  }
  
  // Listen to sidebar inputs
  $$('.pt-checkbox, .pc-checkbox, #sortProducts').forEach(el => el.addEventListener('change', run));
  $('#priceRange').addEventListener('input', run);
  
  // Listen to Category Tabs clicks
  $$('.shop-tab').forEach(tab => {
    tab.onclick = () => {
      $$('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      run();
    };
  });
  
  // Clear Filters
  $('#clearProducts').onclick=()=>{
    $$('.pt-checkbox, .pc-checkbox, .ps-checkbox').forEach(cb => cb.checked = false);
    $$('.shop-tab').forEach(t => t.classList.remove('active'));
    $('.shop-tab[data-type=""]').classList.add('active');
    $('#priceRange').value = 100;
    run();
  };
  
  // Shop bundles banner click
  let shopBundlesBtn = $('#shopBundlesBtn');
  if (shopBundlesBtn) {
    shopBundlesBtn.onclick = () => {
      $$('.shop-tab').forEach(t => t.classList.remove('active'));
      $('.shop-tab[data-type="Bundles"]').classList.add('active');
      run();
      window.scrollTo({ top: $('.shop-categories-tabs').offsetTop - 100, behavior: 'smooth' });
    };
  }
  
  run();
}

function badge(){
  let b=$('#cartBadge');
  if(b)b.textContent=S.cart.reduce((s,i)=>s+i.qty,0);
}

function save(){
  localStorage.mma_cart=JSON.stringify(S.cart);
  badge();
}

function cartButtons(){
  $$('.add-cart').forEach(b=>b.onclick=()=>{
    let p=S.products.find(x=>x.id==b.dataset.id),e=S.cart.find(x=>x.id==p.id);
    e?e.qty++:S.cart.push({id:p.id,qty:1});
    save();
    drawCart();
    toast(`${p.name} added to cart!`);
  });
}

function drawCart(){
  let d=$('#cartDrawer');
  if(!d)return;
  let items=S.cart.map(i=>({...i,p:S.products.find(p=>p.id==i.id)})).filter(x=>x.p),total=items.reduce((s,i)=>s+i.p.price*i.qty,0);
  d.innerHTML=`<div class="section-head" style="margin-bottom:12px; padding-bottom:6px;">
    <h3>🛒 <span data-i18n="cart">${t('cart')}</span></h3>
    <button class="chip" id="cartClose" style="font-size:18px; padding:2px 10px; border-radius:50%">×</button>
  </div>
  ${items.length?items.map(i=>`<div class="cart-item">
    <img src="${i.p.image}">
    <div style="flex:1">
      <strong style="font-size:14px; color:var(--ink);">${i.p.name}</strong>
      <div class="meta" style="margin-top:2px;">
        <span style="color:var(--pink); font-weight:800;">${money(i.p.price)}</span>
        <span>Qty ${i.qty}</span>
      </div>
    </div>
    <button class="chip remove-cart" data-id="${i.id}" style="padding:2px 8px; border-radius:6px">−</button>
  </div>`).join(''):'<div class="empty">Your cart is empty.</div>'}
  <div class="cart-total">
    <span>Total</span>
    <span>${money(total)}</span>
  </div>
  <button class="btn" style="width:100%; justify-content:center;" onclick="toast('Checkout simulated! Thanks for playing.')">Checkout Now</button>`;
  
  $('#cartClose')?.addEventListener('click',()=>d.classList.remove('open'));
  
  $$('.remove-cart',d).forEach(b=>b.onclick=()=>{
    let it=S.cart.find(x=>x.id==b.dataset.id);
    if(it){
      it.qty--;
      if(it.qty<=0)S.cart=S.cart.filter(x=>x.id!=b.dataset.id);
      save();
      drawCart();
    }
  });
}

function toast(m){
  let e=$('#toast');
  if(!e)return;
  e.textContent=m;
  e.classList.add('show');
  clearTimeout(window.tt);
  window.tt=setTimeout(()=>e.classList.remove('show'),2200);
}

function bind(){
  $$('.lang-select').forEach(sel=>{
    if(sel.dataset.skip==='1')return;
    sel.value=S.lang;
    sel.onchange=()=>{
      S.lang=sel.value;
      localStorage.mma_lang=S.lang;
      applyI18n();
    };
  });
  $('#cartOpen')?.addEventListener('click',()=>{$('#cartDrawer').classList.add('open');drawCart()});
  $('#mobileMenu')?.addEventListener('click',()=>{$('#mobilePanel').hidden=!$('#mobilePanel').hidden});
  
  $('#globalSearch')?.addEventListener('keydown',e=>{
    if(e.key=='Enter'){
      let q=e.target.value.toLowerCase(),g=S.games.find(x=>x.title.toLowerCase().includes(q)||x.mascot.toLowerCase().includes(q)),p=S.products.find(x=>x.name.toLowerCase().includes(q));
      location.href=g?g.detailUrl:p?'/shop/'+p.id+'/':'/games/';
    }
  });
  
  document.addEventListener('pointermove',spark,{passive:true});
  cartButtons();
  tilt();
  badge();
}

let st=0;
function spark(e){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let n=performance.now();
  if(n-st<60)return;
  st=n;
  let s=document.createElement('span');
  s.className='spark';
  s.style.left=e.clientX+'px';
  s.style.top=e.clientY+'px';
  s.style.setProperty('--dx',(Math.random()*70-35)+'px');
  s.style.setProperty('--dy',(Math.random()*70-35)+'px');
  document.body.appendChild(s);
  setTimeout(()=>s.remove(),700);
}

function tilt(){
  $$('.card').forEach(c=>{
    c.onpointermove=e=>{
      let r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5;
      c.style.setProperty('--tilt',`${x*1.5}deg`);
    };
    c.onpointerleave=()=>c.style.removeProperty('--tilt');
  });
}

function render(){
  let p=document.body.dataset.page,sl=document.body.dataset.slug,active=p||'home';
  $('#appHeader').innerHTML=header(active);
  let out=p=='games'?gamesPage():p=='universes'?universesPage():p=='characters'?charsPage():p=='shop'?shopPage():p=='newReleases'?newPage():p=='about'?aboutPage():p=='leaderboards'?leaderboardPage():p=='adMap'?adMapPage():p=='privacy'||p=='terms'?legal(p):p=='gameDetail'?gameDetail(sl):p=='play'?playPage(sl):p=='product'?productPage(sl):home();
  $('#appMain').innerHTML=out;
  $('#appFooter').innerHTML=footer();
  bind();
  hydrateGames();
  hydrateShop();
  drawCart();
  applyI18n();
  if(location.hash)setTimeout(()=>$(location.hash)?.scrollIntoView({behavior:'smooth'}),120);
}

async function boot(){
  [S.games,S.products,S.universes,S.i18n]=await Promise.all([
    J('/assets/data/games.json'),
    J('/assets/data/products.json'),
    J('/assets/data/universes.json'),
    J('/assets/data/i18n.json')
  ]);
  render();
}
boot();
