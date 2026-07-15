(function installMonetagRewards() {
  'use strict';

  const DIRECT_LINK = 'https://omg10.com/4/11269418';
  const VIGNETTE_ZONE = '11269408';
  const MINIMUM_AWAY_MS = 5000;
  const ATTEMPT_TIMEOUT_MS = 120000;
  const READY_TTL_MS = 10 * 60 * 1000;
  const CHANNEL = 'mma-reward-v1';
  let activeAttempt = null;

  const makeId = () => {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `reward_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  };

  const readyKey = (slug) => `mma_reward_ready_${String(slug || '').replace(/[^a-z0-9-]/gi, '')}`;
  const readReady = (slug) => {
    try {
      const key = readyKey(slug);
      const value = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!value || value.expiresAt <= Date.now() || value.slug !== slug) {
        sessionStorage.removeItem(key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  };
  const rememberReady = (detail) => {
    try {
      sessionStorage.setItem(readyKey(detail.slug), JSON.stringify({
        ...detail,
        expiresAt: Date.now() + READY_TTL_MS,
      }));
    } catch { /* A boost still works in-memory when storage is restricted. */ }
  };
  const consumeReady = (slug, requestId) => {
    const value = readReady(slug);
    if (!value || (requestId && value.requestId !== requestId)) return null;
    try { sessionStorage.removeItem(readyKey(slug)); } catch { /* noop */ }
    return value;
  };

  if (window.top === window.self && !document.querySelector(`script[data-zone="${VIGNETTE_ZONE}"]`)) {
    const vignetteScript = document.createElement('script');
    vignetteScript.dataset.zone = VIGNETTE_ZONE;
    vignetteScript.src = 'https://n6wxm.com/vignette.min.js';
    vignetteScript.async = true;
    (document.body || document.documentElement).appendChild(vignetteScript);
  }

  function resolveTargetWindow(options, slug) {
    if (options.targetWindow && options.targetWindow !== window) return options.targetWindow;
    const frame = document.querySelector(`.play-shell iframe[data-slug="${CSS.escape(slug)}"]`)
      || document.querySelector('.play-shell iframe');
    return frame?.contentWindow || null;
  }

  function postToTarget(targetWindow, type, detail, granted) {
    if (!targetWindow) return;
    try {
      targetWindow.postMessage({ channel: CHANNEL, type, granted, detail }, window.location.origin);
    } catch { /* The page-level event still delivers the result to shared games. */ }
  }

  window.triggerRewardedAd = function triggerRewardedAd(onRewardGranted, onRewardFailed, meta = {}) {
    if (activeAttempt) {
      if (typeof onRewardFailed === 'function') onRewardFailed('already-pending');
      return null;
    }

    const attempt = {
      id: meta.requestId || makeId(),
      awayAt: 0,
      settled: false,
      timeoutId: 0,
      closedPollId: 0,
      adWindow: null,
    };
    activeAttempt = attempt;

    const cleanup = () => {
      clearTimeout(attempt.timeoutId);
      clearInterval(attempt.closedPollId);
      window.removeEventListener('blur', markAway);
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (activeAttempt === attempt) activeAttempt = null;
    };

    const finish = (granted, reason) => {
      if (attempt.settled) return;
      attempt.settled = true;
      cleanup();
      const callback = granted ? onRewardGranted : onRewardFailed;
      if (typeof callback === 'function') callback(reason);
    };
    attempt.cancel = (reason = 'cancelled') => finish(false, reason);

    function markAway() {
      if (!attempt.awayAt) attempt.awayAt = Date.now();
    }

    function handleReturn() {
      if (!attempt.awayAt || document.hidden || !document.hasFocus()) return;
      const awayMs = Date.now() - attempt.awayAt;
      if (awayMs < MINIMUM_AWAY_MS) {
        attempt.awayAt = 0;
        if (typeof meta.onProgress === 'function') meta.onProgress('returned-too-quickly', {
          remainingMs: MINIMUM_AWAY_MS - awayMs,
        });
        return;
      }
      finish(true, 'sponsor-visit-complete');
    }

    function handleVisibility() {
      if (document.hidden) markAway();
      else handleReturn();
    }

    window.addEventListener('blur', markAway);
    window.addEventListener('focus', handleReturn);
    document.addEventListener('visibilitychange', handleVisibility);

    attempt.adWindow = window.open(DIRECT_LINK, '_blank');
    if (!attempt.adWindow) {
      finish(false, 'popup-blocked');
      return null;
    }
    try { attempt.adWindow.opener = null; } catch { /* Cross-origin window protection is best-effort. */ }

    attempt.closedPollId = setInterval(() => {
      if (!attempt.adWindow?.closed || attempt.settled) return;
      const awayMs = attempt.awayAt ? Date.now() - attempt.awayAt : 0;
      if (awayMs >= MINIMUM_AWAY_MS) finish(true, 'sponsor-window-closed');
      else finish(false, 'sponsor-closed-too-quickly');
    }, 750);
    attempt.timeoutId = setTimeout(() => finish(false, 'timed-out'), ATTEMPT_TIMEOUT_MS);
    return attempt.adWindow;
  };

  window.MochiMangoRewards = {
    get pending() { return Boolean(activeAttempt); },
    peekReady: readReady,
    consumeReady,
    clearReady(slug) {
      try { sessionStorage.removeItem(readyKey(slug)); } catch { /* noop */ }
    },
    cancel(reason = 'cancelled') {
      if (!activeAttempt) return false;
      const attempt = activeAttempt;
      try { attempt.adWindow?.close(); } catch { /* noop */ }
      attempt.cancel?.(reason);
      return true;
    },

    request(options = {}) {
      if (activeAttempt) return false;
      const requestId = makeId();
      const detail = {
        requestId,
        attemptId: requestId,
        slug: options.slug || document.body?.dataset.slug || '',
        source: options.source || 'start-boost',
        intent: options.intent || 'next-run',
        boosterId: options.boosterId || 'mode-special',
      };
      const targetWindow = resolveTargetWindow(options, detail.slug);

      const adWindow = window.triggerRewardedAd(
        () => {
          const grantedDetail = { ...detail, grantedAt: Date.now() };
          rememberReady(grantedDetail);
          window.dispatchEvent(new CustomEvent('mma:reward-granted', { detail: grantedDetail }));
          postToTarget(targetWindow, 'result', grantedDetail, true);
          if (typeof options.onRewardGranted === 'function') options.onRewardGranted(grantedDetail);
        },
        (reason) => {
          const blockedDetail = { ...detail, reason };
          window.dispatchEvent(new CustomEvent('mma:reward-blocked', { detail: blockedDetail }));
          postToTarget(targetWindow, 'result', blockedDetail, false);
          if (typeof options.onRewardFailed === 'function') options.onRewardFailed(reason, blockedDetail);
        },
        {
          requestId,
          onProgress(reason, progress) {
            const progressDetail = { ...detail, reason, ...progress };
            window.dispatchEvent(new CustomEvent('mma:reward-progress', { detail: progressDetail }));
            postToTarget(targetWindow, 'progress', progressDetail, false);
          },
        },
      );

      if (!adWindow) return false;
      window.dispatchEvent(new CustomEvent('mma:reward-pending', { detail }));
      postToTarget(targetWindow, 'pending', detail, false);
      return true;
    },
  };
})();
