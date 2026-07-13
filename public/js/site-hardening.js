(() => {
  'use strict';

  let catalogue = { total: 392, playable: 392 };
  let patchQueued = false;

  document.addEventListener('pointermove', event => {
    if (!event.target.closest('canvas,.game-stage,.play-shell')) event.stopImmediatePropagation();
  }, { capture: true, passive: true });

  function replaceText(root, pattern, replacement) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement?.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) node.nodeValue = node.nodeValue.replace(pattern, replacement);
  }

  function hardenProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      card.classList.add('commerce-preview');
      const badge = card.querySelector('.badge');
      if (badge) badge.textContent = 'PREVIEW';
      const price = card.querySelector('.price');
      if (price) price.textContent = 'Concept preview';
      card.querySelectorAll('.add-cart,.product-rating-row,.stars').forEach(element => element.remove());
      const body = card.querySelector('.card-body');
      if (body && !body.querySelector('.preview-copy')) {
        const note = document.createElement('p');
        note.className = 'preview-copy';
        note.textContent = 'Character merchandise concept. Purchasing is not yet available.';
        body.append(note);
      }
    });
  }

  function replacePlaceholderPages() {
    const page = document.body.dataset.page;
    const main = document.querySelector('#appMain');
    if (!main) return;

    if (page === 'leaderboards' && !main.dataset.hardenedPage) {
      main.dataset.hardenedPage = 'leaderboards';
      main.innerHTML = `<main id="main" class="container">
        <section class="page-hero"><h1>Community Leaderboards</h1><p>Verified community rankings are coming soon.</p></section>
        <section class="detail-card"><h2>Fair scores first</h2><p>Leaderboards will open after server-side score validation and anti-cheat controls are live. Placeholder ratings and play counts are not displayed.</p><a class="btn" href="/games/">Play the games</a></section>
      </main>`;
    }

    if (page === 'adMap' && !main.dataset.hardenedPage) {
      main.dataset.hardenedPage = 'advertising';
      main.innerHTML = `<main id="main" class="container">
        <section class="page-hero"><h1>Advertising Controls</h1><p>Third-party advertising is currently disabled.</p></section>
        <section class="detail-card"><h2>Trust before monetisation</h2><p>Advertising will only return after consent, child-safety, privacy and brand-safety controls have been implemented and reviewed.</p><a class="btn" href="/games/">Browse games</a></section>
      </main>`;
    }
  }

  function patchDom() {
    patchQueued = false;

    document.querySelectorAll('.ad-slot,.reward-card,.product-rating-row,.rating,.stars,.spark').forEach(element => element.remove());
    document.querySelectorAll('.add-cart,#cartOpen,.header-cart-btn,.cart-drawer,.shop-limited-drop-banner,.merch-promo-banner').forEach(element => element.remove());
    document.querySelectorAll('.social-icons,.newsletter').forEach(element => element.remove());

    document.querySelectorAll('.promo-card h3').forEach(heading => {
      if (/build notes|merch hook/i.test(heading.textContent || '')) heading.closest('.promo-card')?.remove();
    });

    document.querySelectorAll('.chip').forEach(chip => {
      if (/^★\s*[\d.]+/.test((chip.textContent || '').trim())) chip.remove();
    });

    document.querySelectorAll('button').forEach(button => {
      if (/checkout|shop all bundles|add to cart|visit sponsor/i.test(button.textContent || '')) button.remove();
    });

    document.querySelectorAll('a[href="/shop/"]').forEach(link => {
      if (/shop now|merch shop/i.test(link.textContent || '')) link.textContent = 'Merch Preview';
    });

    hardenProductCards();
    replacePlaceholderPages();

    if (document.body.dataset.page === 'shop') {
      const hero = document.querySelector('.shop-hero-text');
      const heading = hero?.querySelector('h1');
      const lead = hero?.querySelector('p');
      if (heading) heading.textContent = 'Character Merchandise Preview';
      if (lead) lead.textContent = 'Explore planned plushies, apparel and collectibles. Purchasing is not yet available.';
    }

    replaceText(document.body, /200\+/g, String(catalogue.playable));
    replaceText(document.body, /Browse all 200 games/gi, `Browse all ${catalogue.total} games`);
    replaceText(document.body, /392\+ free HTML5 games/gi, `${catalogue.playable} free HTML5 games`);
    replaceText(document.body, /collectible merch added every week/gi, 'new original games added regularly');
    replaceText(document.body, /Officially Licensed/gi, 'Original Concepts');
    replaceText(document.body, /Cute Quality/gi, 'Product Preview');
    replaceText(document.body, /In Stock/gi, 'Concept Preview');
    replaceText(document.body, /Merch Shop/gi, 'Merch Preview');
    replaceText(document.body, /Official Mochi Mango Arcade merch[^.]*is available in the on-site merch shop\./gi, 'Character merchandise is currently a concept preview and is not yet available for purchase.');

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

  function schedulePatch() {
    if (patchQueued) return;
    patchQueued = true;
    queueMicrotask(patchDom);
  }

  const observer = new MutationObserver(schedulePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  fetch('/assets/data/games.json', { credentials: 'same-origin' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('catalogue unavailable')))
    .then(games => {
      catalogue = { total: games.length, playable: games.filter(game => game.built).length };
      schedulePatch();
    })
    .catch(schedulePatch);

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
