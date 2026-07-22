/**
 * Rewarded-boost bridge for standalone (iframe) arcade games.
 *
 * Games that ship as their own bundle run inside an iframe on the play page,
 * so they cannot see window.MochiMangoRewards directly. monetag-loader.js
 * posts the grant into the frame on the 'mma-reward-v1' channel instead; this
 * turns that message into a single onGrant callback and takes care of the
 * parts every game gets wrong on its own: verifying the message really came
 * from our own parent page, and ignoring repeats of a grant already spent.
 *
 * Usage, from inside the game's own scope:
 *
 *   window.MMARewardBridge({
 *     slug: 'petroman-reactor-rush',
 *     onGrant(detail) { ...award the boost... },
 *   });
 */
(function () {
  'use strict';

  const CHANNEL = 'mma-reward-v1';

  window.MMARewardBridge = function installRewardBridge(config) {
    if (!config || typeof config.onGrant !== 'function') return () => {};

    const spent = new Set();

    const handler = (event) => {
      // Only our own parent page may grant a boost. Without both checks any
      // embedded third-party frame could hand out free power-ups.
      if (event.origin !== location.origin || event.source !== parent) return;

      const message = event.data || {};
      if (message.channel !== CHANNEL || message.type !== 'result' || !message.granted) return;

      const detail = message.detail || {};
      if (config.slug && detail.slug && detail.slug !== config.slug) return;

      // Returning from the sponsor can deliver the same grant more than once.
      const requestId = detail.requestId;
      if (requestId) {
        if (spent.has(requestId)) return;
        spent.add(requestId);
      }

      try {
        config.onGrant(detail);
      } catch (error) {
        // A failed boost must never take the game down with it.
        console.error('Reward boost failed', error);
      }

      // Let the page know the reward actually landed, so its panel can stop
      // telling the player to go and visit the sponsor.
      try {
        parent.postMessage({
          source: 'mochi-mango-arcade',
          game: config.slug,
          type: 'reward-applied',
          detail: { slug: config.slug, requestId, label: config.label || 'Boost applied' },
        }, location.origin);
      } catch (error) { /* the page-level event still reports the grant */ }
    };

    addEventListener('message', handler);
    return () => removeEventListener('message', handler);
  };
})();
