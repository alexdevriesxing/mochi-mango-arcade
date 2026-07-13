(() => {
  'use strict';

  const original = {};
  const save = name => {
    if (typeof window[name] === 'function') original[name] = window[name];
  };
  [
    'gameCard', 'productCard', 'home', 'gamesPage', 'shopPage', 'aboutPage',
    'leaderboardPage', 'gameDetail', 'footer', 'render'
  ].forEach(save);

  const empty = () => '';
  window.adTop = empty;
  window.adSide = empty;
  window.adNative = empty;
  window.adSkyscraper = empty;
  window.adSlot = empty;
  window.adResponsive = empty;
  window.mountAds = () => {};
  window.mountSocialBar = () => {};
  window.rewardCard = empty;
  window.spark = () => {};
  window.tilt = () => {};
  window.getProductRating = () => ({ rating: null, reviews: 0, stars: '' });

  if (original.gameCard) {
    window.gameCard = g => {
      const image = g.image || `/assets/images/games/${g.slug}.jpg`;
      const badge = g.built
        ? (g.new ? '<span class="badge">NEW</span>' : '<span class="badge play">PLAY</span>')
        : '<span class="badge soon">SOON</span>';
      return `<article class="card game-card${g.built ? '' : ' coming-soon'}" data-genre="${g.genre}" data-universe="${g.universe}" data-built="${g.built ? 1 : 0}">
        <a href="${g.detailUrl}">
          ${badge}
          <div class="thumb"><img loading="lazy" src="${image}" alt="${g.title}">${g.built ? '' : '<span class="soon-sticker">Coming Soon</span>'}</div>
          <div class="card-body">
            <h3 class="game-title">${g.title}</h3>
            <div class="meta"><span>${g.genre}</span><span>${g.mascot}</span></div>
          </div>
        </a>
      </article>`;
    };
  }

  window.productCard = p => `<article class="card product-card commerce-preview" data-type="${p.type}" data-character="${p.character}">
    <span class="badge">PREVIEW</span>
    <div class="product-img"><img loading="lazy" src="${p.image}" alt="${p.name}"></div>
    <div class="card-body">
      <h3 class="product-title">${p.name}</h3>
      <p class="preview-copy">Character merchandise concept. Purchasing is not yet available.</p>
      <span class="btn small disabled" aria-disabled="true">Coming Soon</span>
    </div>
  </article>`;

  const wrap = (name, transform) => {
    if (!original[name]) return;
    window[name] = (...args) => transform(original[name](...args), ...args);
  };

  wrap('home', html => {
    const playable = html.match(/(\d+) playable today/i)?.[1] || '392';
    return html
      .replace('<h1>200+<br>', `<h1>${playable}<br>`)
      .replace(/collectible merch added every week\./i, 'new original games and character worlds added regularly.')
      .replace(/<div class="promo-card merch-promo-card">[\s\S]*?<\/div>/i, '<div class="promo-card"><h3 class="promo-title">Merch Preview</h3><p>Character merchandise concepts are being developed. Sales are not open yet.</p></div>');
  });

  wrap('gamesPage', html => html.replace(/Browse all 200 games/i, 'Browse the complete game catalogue'));

  wrap('shopPage', html => html
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '<h1>Character Merchandise Preview</h1>')
    .replace(/<p data-i18n="shopSub">[\s\S]*?<\/p>/i, '<p>Explore planned plushies, apparel and collectibles. Purchasing is not yet available.</p>')
    .replace(/✅ Officially Licensed/g, '🎨 Original Concepts')
    .replace(/⭐ Cute Quality/g, '🧸 Product Preview')
    .replace(/💖 Playful Joy/g, '🚧 Coming Soon')
    .replace(/<div class="shop-limited-drop-banner">[\s\S]*?<\/div>/i, '')
    .replace(/<div class="merch-promo-banner">[\s\S]*?<\/div>\s*<\/main>/i, '</main>'));

  wrap('aboutPage', html => html
    .replace(/for 200\+ games/i, 'for the complete game catalogue')
    .replace(/game and merch platform/i, 'game platform and character merchandise preview'));

  window.leaderboardPage = () => `<main id="main" class="container">
    <section class="page-hero"><h1>Community Leaderboards</h1><p>Verified community rankings are coming soon.</p></section>
    <section class="detail-card"><h2>Fair scores first</h2><p>Leaderboards will open after server-side score validation and anti-cheat controls are live. No placeholder play counts or ratings are shown.</p><a class="btn" href="/games/">Play the games</a></section>
  </main>`;

  wrap('gameDetail', html => html
    .replace(/<span class="chip">★[^<]*<\/span>/g, '')
    .replace(/<a class="btn secondary" href="\/shop\/">[\s\S]*?<\/a>/i, '<a class="btn secondary" href="/characters/">Meet the Characters</a>')
    .replace(/<div class="promo-card">\s*<h3>Merch Hook<\/h3>[\s\S]*?<\/div>/i, '<div class="promo-card"><h3>Character World</h3><p>Explore the recurring mascot and universe behind this game.</p></div>')
    .replace(/<div class="promo-card">\s*<h3>Build Notes<\/h3>[\s\S]*?<\/div>/i, ''));

  window.footer = () => `<footer class="footer">
    <div class="container">
      <div class="footer-grid hardened-footer-grid">
        <div><img src="/assets/images/logo.svg" alt="Mochi Mango Arcade"><p>Original, family-friendly browser games from Fire Dragon Interactive.</p></div>
        <div><h4>Explore</h4><a href="/games/">Games</a><a href="/universes/">Universes</a><a href="/characters/">Characters</a><a href="/new-releases/">New releases</a></div>
        <div><h4>Information</h4><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/shop/">Merch preview</a></div>
      </div>
      <div class="copyright"><span>© 2026 <strong>Fire Dragon Interactive</strong></span><span>Play safe. Have fun.</span></div>
    </div>
  </footer><div class="toast" id="toast"></div>`;

  function replaceText(root, pattern, replacement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) node.nodeValue = node.nodeValue.replace(pattern, replacement);
  }

  let catalogue = { total: 392, playable: 392 };

  function patchDom() {
    document.querySelectorAll('.ad-slot,.product-rating-row,.rating,.stars,.spark').forEach(element => element.remove());

    document.querySelectorAll('.promo-card h3').forEach(heading => {
      if (/build notes|merch hook/i.test(heading.textContent || '')) heading.closest('.promo-card')?.remove();
    });

    document.querySelectorAll('.add-cart,#cartOpen,.header-cart-btn,.cart-drawer,.shop-limited-drop-banner,.merch-promo-banner').forEach(element => element.remove());
    document.querySelectorAll('button').forEach(button => {
      if (/checkout|shop all bundles|add to cart/i.test(button.textContent || '')) button.remove();
    });

    const newsletter = document.querySelector('.newsletter');
    if (newsletter) newsletter.remove();
    document.querySelectorAll('.social-icons').forEach(element => element.remove());

    replaceText(document.body, /200\+/g, String(catalogue.playable));
    replaceText(document.body, /Browse all 200 games/gi, `Browse all ${catalogue.total} games`);
    replaceText(document.body, /392\+ free HTML5 games/gi, `${catalogue.playable} free HTML5 games`);
    replaceText(document.body, /collectible merch added every week/gi, 'new original games added regularly');
    replaceText(document.body, /Officially Licensed/gi, 'Original Concepts');
    replaceText(document.body, /In Stock/gi, 'Concept Preview');

    document.querySelectorAll('[data-catalog-total]').forEach(element => { element.textContent = String(catalogue.total); });

    const menuButton = document.querySelector('#mobileMenu');
    const panel = document.querySelector('#mobilePanel');
    if (menuButton && panel) {
      menuButton.setAttribute('aria-controls', 'mobilePanel');
      menuButton.setAttribute('aria-expanded', String(!panel.hidden));
      if (!menuButton.dataset.hardened) {
        menuButton.dataset.hardened = '1';
        menuButton.addEventListener('click', () => menuButton.setAttribute('aria-expanded', String(!panel.hidden)));
      }
    }

    document.querySelectorAll('a[target="_blank"]').forEach(link => link.setAttribute('rel', 'noopener noreferrer'));
  }

  const observer = new MutationObserver(() => queueMicrotask(patchDom));
  observer.observe(document.documentElement, { childList: true, subtree: true });

  fetch('/assets/data/games.json', { credentials: 'same-origin' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('catalogue unavailable')))
    .then(games => {
      catalogue = { total: games.length, playable: games.filter(game => game.built).length };
      patchDom();
    })
    .catch(() => patchDom());

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(async registrations => {
      const hadRegistrations = registrations.length > 0;
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if (hadRegistrations && !sessionStorage.getItem('mma_sw_cleanup_complete')) {
        sessionStorage.setItem('mma_sw_cleanup_complete', '1');
        location.reload();
      }
    }).catch(() => {});
  }

  patchDom();
})();
