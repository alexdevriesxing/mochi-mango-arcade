(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const CHARACTERS = [
    { id: 'mochi', name: 'Mochi', src: '/assets/images/characters/mochi.svg', tagline: 'Sweet, round, and ready!' },
    { id: 'mango', name: 'Mango', src: '/assets/images/characters/mango.svg', tagline: 'A sunny arcade buddy.' },
    { id: 'pandy', name: 'Pandy', src: '/assets/images/characters/pandy.svg', tagline: 'Cozy quests are calling.' },
    { id: 'neko', name: 'Neko', src: '/assets/images/characters/neko.svg', tagline: 'Quick paws, kind heart.' },
    { id: 'zuzu', name: 'Zuzu', src: '/assets/images/characters/zuzu.svg', tagline: 'Starry-eyed and brave.' },
    { id: 'puddle-pip', name: 'Puddle & Pip', src: '/assets/images/sprites/puddle-pip.png', tagline: 'Better together!' },
    { id: 'toasty-dragon', name: 'Toasty Dragon', src: '/assets/images/characters/toasty-dragon.svg', tagline: 'Warm sparks, big smiles.' }
  ];

  const FRAMES = [
    { id: 'none', name: 'Clean & Cozy', color: '#ddd3e5' },
    { id: 'scallop', name: 'Scallop', color: '#ff84b5' },
    { id: 'berry', name: 'Berry', color: '#d64b70' },
    { id: 'sparkle', name: 'Sparkle', color: '#ffd35c' },
    { id: 'bamboo', name: 'Bamboo', color: '#62ad72' },
    { id: 'starlight', name: 'Starlight', color: '#7760c8' },
    { id: 'flower-crown', name: 'Flowers', color: '#f28cc5' },
    { id: 'world-tour', name: 'World Tour', color: '#44bdd0' },
    { id: 'champion', name: 'Champion', color: '#f2b72c' }
  ];

  const BACKGROUNDS = [
    { id: 'peach-sky', name: 'Peach Sky', css: 'linear-gradient(145deg,#fff4a9,#ffd1e8 58%,#e7d8ff)' },
    { id: 'matcha-meadow', name: 'Matcha', css: 'linear-gradient(145deg,#eaffca,#a8e2bd 58%,#e9f5b0)' },
    { id: 'candy-clouds', name: 'Candy', css: 'linear-gradient(145deg,#ffbddd,#cdb6ff 50%,#aeefff)' },
    { id: 'moonlit', name: 'Moonlit', css: 'linear-gradient(145deg,#322b72,#745baa 62%,#ba9ee9)' },
    { id: 'cosmic', name: 'Cosmic', css: 'linear-gradient(145deg,#503388,#9e61cf 55%,#e093dc)' },
    { id: 'golden-arcade', name: 'Golden', css: 'linear-gradient(145deg,#ffb83f,#ffda68 55%,#ff8b70)' }
  ];

  const ACHIEVEMENT_CATALOG = [
    { id: 'warm-welcome', aliases: [], icon: '🌸', title: 'Warm Welcome', description: 'Finish your first game.', points: 10, target: 1, metric: 'gamesPlayed' },
    { id: 'getting-comfy', aliases: [], icon: '🧸', title: 'Getting Comfy', description: 'Play ten games.', points: 25, target: 10, metric: 'gamesPlayed' },
    { id: 'arcade-regular', aliases: [], icon: '🕹️', title: 'Arcade Regular', description: 'Play fifty games.', points: 75, target: 50, metric: 'gamesPlayed' },
    { id: 'arcade-legend', aliases: [], icon: '👑', title: 'Arcade Legend', description: 'Play two hundred games.', points: 200, target: 200, metric: 'gamesPlayed' },
    { id: 'pocket-sparkles', aliases: [], icon: '✨', title: 'Pocket Sparkles', description: 'Earn 1,000 total points.', points: 15, target: 1000, metric: 'totalScore' },
    { id: 'score-spark', aliases: [], icon: '⭐', title: 'Score Spark', description: 'Earn 10,000 total points.', points: 40, target: 10000, metric: 'totalScore' },
    { id: 'score-superstar', aliases: [], icon: '🌟', title: 'Score Superstar', description: 'Earn 100,000 total points.', points: 100, target: 100000, metric: 'totalScore' },
    { id: 'million-mochi', aliases: [], icon: '💫', title: 'Million Mochi', description: 'Earn one million total points.', points: 300, target: 1000000, metric: 'totalScore' },
    { id: 'first-victory', aliases: [], icon: '🎉', title: 'First Victory', description: 'Win your first game.', points: 15, target: 1, metric: 'wins' },
    { id: 'winning-ways', aliases: [], icon: '🎋', title: 'Winning Ways', description: 'Win twenty-five games.', points: 75, target: 25, metric: 'wins' },
    { id: 'cozy-champion', aliases: [], icon: '🏆', title: 'Cozy Champion', description: 'Win one hundred games.', points: 200, target: 100, metric: 'wins' },
    { id: 'helpful-boost', aliases: [], icon: '🎁', title: 'Helpful Boost', description: 'Claim your first rewarded boost.', points: 10, target: 1, metric: 'rewardedBoosts' },
    { id: 'power-pal', aliases: ['power-up-pal'], icon: '⚡', title: 'Power Pal', description: 'Claim ten rewarded boosts.', points: 35, target: 10, metric: 'rewardedBoosts' },
    { id: 'reward-ranger', aliases: [], icon: '🏅', title: 'Reward Ranger', description: 'Claim fifty rewarded boosts.', points: 100, target: 50, metric: 'rewardedBoosts' },
    { id: 'fresh-look', aliases: [], icon: '🎨', title: 'Fresh Look', description: 'Create your first custom avatar look.', points: 10, target: 1, metric: 'avatarChanges' },
    { id: 'cozy-fashionista', aliases: [], icon: '🪡', title: 'Cozy Fashionista', description: 'Try ten avatar looks.', points: 50, target: 10, metric: 'avatarChanges' },
    { id: 'cozy-explorer', aliases: [], icon: '🗺️', title: 'Cozy Explorer', description: 'Play five different games.', points: 25, target: 5, metric: 'uniqueGames' },
    { id: 'world-traveler', aliases: [], icon: '🌏', title: 'World Traveler', description: 'Play twenty-five different games.', points: 100, target: 25, metric: 'uniqueGames' },
    { id: 'high-flyer', aliases: [], icon: '🚀', title: 'High Flyer', description: 'Score 10,000 points in one game.', points: 60, target: 10000, metric: 'bestScore' },
    { id: 'star-player', aliases: [], icon: '🌠', title: 'Star Player', description: 'Score 100,000 points in one game.', points: 180, target: 100000, metric: 'bestScore' }
  ];

  const state = {
    session: null,
    profile: null,
    isOwnProfile: false,
    publicUsername: new URLSearchParams(location.search).get('u')?.trim() || '',
    starterCharacter: 'mochi',
    avatarDraft: { character: 'mochi', frame: 'none', background: 'peach-sky' },
    noticeTimer: 0,
    toastTimer: 0
  };

  const els = {};

  function cacheElements() {
    [
      'profileLoading', 'accountGateway', 'playerProfile', 'profileError', 'profileNotice',
      'profileNoticeText', 'dismissNotice', 'navPlayerChip', 'navAvatarImage', 'navPlayerName',
      'navAuthButton', 'profileMenuButton', 'profileMobileNav', 'signInTab', 'signUpTab',
      'signInPanel', 'signUpPanel', 'signInForm', 'signUpForm', 'signInMessage', 'signUpMessage',
      'starterAvatarList', 'profileDisplayName', 'profileUsername', 'profileJoinDate', 'profileBio',
      'profileLevelPill', 'profileTitle', 'profileXp', 'profileNextLevel', 'profileXpBar',
      'profileAvatar', 'profileAvatarImage', 'profileStatusBadge', 'editAvatarButton', 'shareProfileButton',
      'signOutButton', 'profilePrivateNote', 'publicProfileName', 'statGamesPlayed', 'statAchievements',
      'statTrophyPoints', 'statPlayTime', 'achievementSummary', 'cabinetUnlocked', 'cabinetTotal',
      'cabinetPercent', 'cabinetProgressBar', 'achievementGrid', 'achievementEmpty', 'showLockedToggle',
      'scoreList', 'scoreEmpty', 'favoriteCharacterImage', 'favoriteCharacterName',
      'favoriteCharacterTagline', 'nextAwardIcon', 'nextAwardHeading', 'nextAwardDescription',
      'nextAwardBar', 'nextAwardProgress', 'profileSignInCta', 'profileErrorTitle', 'profileErrorMessage',
      'retryProfileButton', 'avatarStudio', 'avatarStudioForm', 'studioAvatarPreview', 'studioAvatarImage',
      'studioCharacterName', 'characterChoices', 'frameChoices', 'backgroundChoices', 'studioMessage',
      'saveAvatarButton', 'profileToast', 'profileToastText'
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  const cleanText = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const safeSlug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');

  function setAccountActivity(active) {
    try {
      if (active) localStorage.setItem('mma_profile_active', '1');
      else localStorage.removeItem('mma_profile_active');
    } catch { /* Storage may be unavailable in privacy-restricted browsers. */ }
  }

  function validChoice(value, choices, fallback) {
    return choices.some((choice) => choice.id === value) ? value : fallback;
  }

  function setBusy(button, busy, label = 'Working…') {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.innerHTML = `<span class="button-spinner" aria-hidden="true">◌</span><span>${esc(label)}</span>`;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      delete button.dataset.originalHtml;
    }
  }

  function showOnly(view) {
    [els.profileLoading, els.accountGateway, els.playerProfile, els.profileError].forEach((element) => {
      if (element) element.hidden = element !== view;
    });
  }

  function showNotice(message) {
    if (!message) return;
    els.profileNoticeText.textContent = message;
    els.profileNotice.hidden = false;
    clearTimeout(state.noticeTimer);
    state.noticeTimer = setTimeout(() => { els.profileNotice.hidden = true; }, 9000);
  }

  function showToast(message) {
    els.profileToastText.textContent = message;
    els.profileToast.hidden = false;
    requestAnimationFrame(() => els.profileToast.classList.add('is-visible'));
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      els.profileToast.classList.remove('is-visible');
      setTimeout(() => { els.profileToast.hidden = true; }, 220);
    }, 3200);
  }

  function showFormMessage(element, message, success = false) {
    element.textContent = message;
    element.classList.toggle('is-success', success);
    element.hidden = !message;
  }

  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.payload = payload;
    }
  }

  async function api(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    let payload = null;
    if (response.status !== 204) {
      try { payload = contentType.includes('json') ? await response.json() : { message: await response.text() }; }
      catch { payload = null; }
    }
    if (!response.ok) {
      const message = cleanText(firstDefined(payload?.message, payload?.error?.message, payload?.error), response.status === 401 ? 'Please sign in to continue.' : 'Something went wrong. Please try again.');
      throw new ApiError(message, response.status, payload);
    }
    return payload;
  }

  function unwrap(payload, keys = []) {
    let value = payload;
    if (value && typeof value === 'object' && value.data && typeof value.data === 'object') value = value.data;
    for (const key of keys) {
      if (value && typeof value === 'object' && value[key] !== undefined) return value[key];
      if (payload && typeof payload === 'object' && payload[key] !== undefined) return payload[key];
    }
    return value;
  }

  async function getSession() {
    try {
      const payload = await api('/api/profile/me');
      if (payload?.authenticated === false || payload?.data?.authenticated === false) {
        setAccountActivity(false);
        return null;
      }
      const user = unwrap(payload, ['profile', 'user', 'session']);
      if (!user || typeof user !== 'object' || (!user.username && !user.email && !user.user?.username)) {
        setAccountActivity(false);
        return null;
      }
      setAccountActivity(true);
      return user.user && typeof user.user === 'object' ? user.user : user;
    } catch (error) {
      if (error.status === 401 || error.status === 404) {
        setAccountActivity(false);
        return null;
      }
      throw error;
    }
  }

  async function getOwnProfile() {
    const payload = await api('/api/profile/me');
    return unwrap(payload, ['profile']);
  }

  async function getPublicProfile(username) {
    const safeUsername = encodeURIComponent(username);
    const payload = await api(`/api/profile/u/${safeUsername}`);
    return unwrap(payload, ['profile']);
  }

  function normalizedAvatar(raw) {
    const avatar = raw?.avatar && typeof raw.avatar === 'object' ? raw.avatar : {};
    return {
      character: validChoice(cleanText(firstDefined(avatar.character, raw?.avatarCharacter, raw?.avatar_character), 'mochi'), CHARACTERS, 'mochi'),
      frame: validChoice(cleanText(firstDefined(avatar.frame, raw?.avatarFrame, raw?.avatar_frame), 'none'), FRAMES, 'none'),
      background: validChoice(cleanText(firstDefined(avatar.background, raw?.avatarBackground, raw?.avatar_background), 'peach-sky'), BACKGROUNDS, 'peach-sky')
    };
  }

  function normalizeScores(raw) {
    const source = firstDefined(raw?.bestScores, raw?.best_scores, raw?.scores, raw?.games, []);
    if (Array.isArray(source)) {
      return source.map((score) => ({
        game: cleanText(firstDefined(score.gameName, score.game_name, score.title, score.game), titleFromSlug(firstDefined(score.gameId, score.game_id, score.slug, 'Arcade game'))),
        slug: safeSlug(firstDefined(score.gameSlug, score.game_slug, score.gameId, score.game_id, score.slug, '')),
        score: number(firstDefined(score.score, score.bestScore, score.best_score, score.value)),
        playedAt: firstDefined(score.playedAt, score.played_at, score.lastPlayedAt, score.last_played_at, score.updatedAt, score.updated_at)
      })).filter((score) => score.score >= 0).sort((a, b) => b.score - a.score);
    }
    if (source && typeof source === 'object') {
      return Object.entries(source).map(([slug, value]) => ({
        game: cleanText(value?.gameName || value?.title, titleFromSlug(slug)),
        slug: safeSlug(slug),
        score: number(value?.score ?? value),
        playedAt: value?.playedAt || value?.updatedAt
      })).sort((a, b) => b.score - a.score);
    }
    return [];
  }

  function normalizeProfile(raw = {}) {
    const user = raw.user && typeof raw.user === 'object' ? raw.user : {};
    const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
    const username = cleanText(firstDefined(raw.username, user.username), 'player');
    const displayName = cleanText(firstDefined(raw.displayName, raw.display_name, user.displayName, user.display_name), titleFromSlug(username));
    const achievementsRaw = Array.isArray(raw.achievements) ? raw.achievements : [];
    const games = Array.isArray(raw.games) ? raw.games : [];
    const playMinutesFromGames = games.reduce((total, game) => total + number(firstDefined(game.totalDurationMs, game.total_duration_ms)), 0) / 60000;
    const trophyPoints = number(firstDefined(raw.trophies?.points, stats.trophyPoints, stats.trophy_points, raw.trophyPoints, raw.trophy_points));
    const derivedXp = Math.floor(number(firstDefined(stats.totalScore, stats.total_score)) / 10) + trophyPoints;
    const xp = Math.max(0, number(firstDefined(raw.xp, stats.xp, raw.experience), derivedXp));
    const derivedLevel = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    const cosmetics = raw.cosmetics && typeof raw.cosmetics === 'object' ? raw.cosmetics : null;
    const cosmeticKeys = (bucket) => Array.isArray(cosmetics?.[bucket]) ? cosmetics[bucket].map((item) => cleanText(typeof item === 'string' ? item : firstDefined(item.key, item.id))).filter(Boolean) : null;
    return {
      username,
      displayName,
      bio: cleanText(raw.bio, 'A cozy adventurer making their way through the arcade.'),
      createdAt: firstDefined(raw.memberSince, raw.member_since, raw.createdAt, raw.created_at, user.createdAt, user.created_at),
      avatar: normalizedAvatar(raw),
      level: Math.max(1, number(firstDefined(raw.level, stats.level), derivedLevel)),
      xp,
      title: cleanText(firstDefined(raw.title, raw.playerTitle, raw.player_title), ''),
      stats: {
        gamesPlayed: Math.max(0, number(firstDefined(stats.gamesPlayed, stats.games_played, raw.gamesPlayed, raw.games_played))),
        uniqueGames: Math.max(0, number(firstDefined(stats.uniqueGames, stats.unique_games, stats.distinctGames, stats.distinct_games, raw.uniqueGames))),
        playMinutes: Math.max(0, number(firstDefined(stats.playMinutes, stats.play_minutes, stats.minutesPlayed, stats.minutes_played, raw.playMinutes), playMinutesFromGames)),
        trophyPoints: Math.max(0, trophyPoints),
        bestScore: Math.max(0, number(firstDefined(stats.bestScore, stats.best_score))),
        totalScore: Math.max(0, number(firstDefined(stats.totalScore, stats.total_score))),
        universesVisited: Math.max(0, number(firstDefined(stats.universesVisited, stats.universes_visited))),
        rewardedBoosts: Math.max(0, number(firstDefined(stats.rewardedBoosts, stats.rewarded_boosts, stats.rewardsClaimed, stats.rewards_claimed))),
        avatarChanges: Math.max(0, number(firstDefined(stats.avatarChanges, stats.avatar_changes))),
        wins: Math.max(0, number(firstDefined(stats.wins, raw.wins))),
        streakDays: Math.max(0, number(firstDefined(stats.streakDays, stats.streak_days))),
        perfectRounds: Math.max(0, number(firstDefined(stats.perfectRounds, stats.perfect_rounds)))
      },
      achievements: achievementsRaw,
      scores: normalizeScores(raw),
      cosmetics: {
        characters: cosmeticKeys('characters'),
        frames: cosmeticKeys('frames'),
        backgrounds: cosmeticKeys('backgrounds')
      }
    };
  }

  function titleFromSlug(value) {
    return String(value || 'Arcade Player').replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function titleForLevel(level) {
    if (level >= 20) return 'Arcade Royalty';
    if (level >= 15) return 'Legendary Explorer';
    if (level >= 10) return 'Cozy Champion';
    if (level >= 5) return 'Sparkly Adventurer';
    if (level >= 2) return 'Arcade Sprout';
    return 'New Sprout';
  }

  function formatDate(value) {
    if (!value) return 'recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recently';
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(number(value));
  }

  function formatPlayTime(minutes) {
    const total = Math.max(0, Math.round(number(minutes)));
    if (total < 60) return `${total}m`;
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  function characterById(id) { return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0]; }

  function applyAvatar(container, image, avatar) {
    const safeAvatar = {
      character: validChoice(avatar?.character, CHARACTERS, 'mochi'),
      frame: validChoice(avatar?.frame, FRAMES, 'none'),
      background: validChoice(avatar?.background, BACKGROUNDS, 'peach-sky')
    };
    const character = characterById(safeAvatar.character);
    container.dataset.frame = safeAvatar.frame;
    container.dataset.background = safeAvatar.background;
    image.src = character.src;
    image.alt = `${character.name} avatar`;
    return safeAvatar;
  }

  function achievementKey(value) {
    return String(value || '').trim().toLowerCase().replace(/_/g, '-');
  }

  function findCatalogAchievement(id) {
    const key = achievementKey(id);
    return ACHIEVEMENT_CATALOG.find((entry) => entry.id === key || entry.aliases.some((alias) => achievementKey(alias) === key));
  }

  function buildAchievements(profile) {
    const apiItems = profile.achievements;
    const unlockedMap = new Map();
    const progressMap = new Map();

    apiItems.forEach((item) => {
      const rawId = typeof item === 'string' ? item : firstDefined(item.id, item.slug, item.key, item.achievementId, item.achievement_id, item.title);
      const catalog = findCatalogAchievement(rawId);
      const id = catalog?.id || achievementKey(rawId);
      if (!id) return;
      const explicitlyLocked = typeof item === 'object' && (item.unlocked === false || item.earned === false);
      if (!explicitlyLocked) unlockedMap.set(id, item);
      if (typeof item === 'object') progressMap.set(id, number(firstDefined(item.progress, item.current, item.value), 0));
    });

    const metricProfile = { ...profile.stats, level: profile.level, achievementsUnlocked: unlockedMap.size };
    const catalogItems = ACHIEVEMENT_CATALOG.map((entry) => {
      const apiItem = unlockedMap.get(entry.id);
      const unlocked = unlockedMap.has(entry.id);
      const progress = Math.min(entry.target, Math.max(0, progressMap.has(entry.id) ? progressMap.get(entry.id) : number(metricProfile[entry.metric])));
      return {
        ...entry,
        icon: entry.icon,
        title: typeof apiItem === 'object' ? cleanText(apiItem.title || apiItem.name, entry.title) : entry.title,
        description: typeof apiItem === 'object' ? cleanText(apiItem.description, entry.description) : entry.description,
        points: typeof apiItem === 'object' ? number(firstDefined(apiItem.points, apiItem.trophyPoints, apiItem.trophy_points), entry.points) : entry.points,
        unlocked,
        unlockedAt: typeof apiItem === 'object' ? firstDefined(apiItem.unlockedAt, apiItem.unlocked_at, apiItem.earnedAt, apiItem.earned_at) : null,
        progress
      };
    });

    const catalogIds = new Set(catalogItems.map((item) => item.id));
    apiItems.forEach((item) => {
      if (typeof item !== 'object') return;
      const rawId = firstDefined(item.id, item.slug, item.key, item.achievementId, item.achievement_id, item.title);
      const id = achievementKey(rawId);
      if (!id || catalogIds.has(id) || findCatalogAchievement(id)) return;
      catalogItems.push({
        id,
        icon: cleanText(item.icon, '🏅'),
        title: cleanText(item.title || item.name, titleFromSlug(id)),
        description: cleanText(item.description, 'A special Mochi Mango Arcade award.'),
        points: number(firstDefined(item.points, item.trophyPoints, item.trophy_points), 25),
        target: Math.max(1, number(item.target, 1)),
        progress: number(firstDefined(item.progress, item.current), 1),
        unlocked: item.unlocked !== false && item.earned !== false,
        unlockedAt: firstDefined(item.unlockedAt, item.unlocked_at, item.earnedAt, item.earned_at)
      });
    });

    return catalogItems;
  }

  function renderAchievements(profile) {
    const items = buildAchievements(profile);
    const unlocked = items.filter((item) => item.unlocked);
    const trophyPoints = profile.stats.trophyPoints || unlocked.reduce((sum, item) => sum + item.points, 0);
    const percent = items.length ? Math.round((unlocked.length / items.length) * 100) : 0;

    els.statAchievements.textContent = formatNumber(unlocked.length);
    els.statTrophyPoints.textContent = formatNumber(trophyPoints);
    els.cabinetUnlocked.textContent = formatNumber(unlocked.length);
    els.cabinetTotal.textContent = formatNumber(items.length);
    els.cabinetPercent.textContent = `${percent}%`;
    els.cabinetProgressBar.style.width = `${percent}%`;
    els.achievementSummary.textContent = unlocked.length ? `${unlocked.length} bright moments collected — keep exploring!` : 'Every adventure leaves a little sparkle.';

    els.achievementGrid.innerHTML = items.map((item) => {
      const status = item.unlocked
        ? (item.unlockedAt ? `Unlocked ${formatDate(item.unlockedAt)}` : 'Unlocked')
        : `${formatNumber(item.progress)} / ${formatNumber(item.target)}`;
      return `<article class="achievement-card${item.unlocked ? '' : ' is-locked'}" data-locked="${item.unlocked ? 'false' : 'true'}">
        <span class="achievement-icon" aria-hidden="true">${esc(item.icon)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
        <div class="achievement-meta"><span>${item.unlocked ? '✓ Earned' : 'Locked'}</span><span>${esc(status)} · ${formatNumber(item.points)} pts</span></div>
      </article>`;
    }).join('');
    els.achievementEmpty.hidden = items.length > 0;
    els.achievementGrid.hidden = items.length === 0;

    const next = items.find((item) => !item.unlocked);
    if (next) {
      const progress = Math.min(next.target, next.progress);
      const nextPercent = next.target ? Math.round((progress / next.target) * 100) : 0;
      els.nextAwardIcon.textContent = next.icon;
      els.nextAwardHeading.textContent = next.title;
      els.nextAwardDescription.textContent = next.description;
      els.nextAwardBar.style.width = `${nextPercent}%`;
      els.nextAwardProgress.textContent = `${formatNumber(progress)} / ${formatNumber(next.target)}`;
    } else {
      els.nextAwardIcon.textContent = '👑';
      els.nextAwardHeading.textContent = 'Cabinet complete!';
      els.nextAwardDescription.textContent = 'You found every current achievement.';
      els.nextAwardBar.style.width = '100%';
      els.nextAwardProgress.textContent = '100% complete';
    }
  }

  function gameImage(score) {
    const slug = safeSlug(score.slug);
    return slug ? `/assets/images/games/${slug}.svg` : '/assets/images/hero.jpg';
  }

  function renderScores(profile) {
    const scores = profile.scores.slice(0, 5);
    els.scoreList.innerHTML = scores.map((score) => {
      const linkStart = score.slug ? `<a class="score-row" href="/games/${esc(score.slug)}/">` : '<div class="score-row">';
      const linkEnd = score.slug ? '</a>' : '</div>';
      return `<li>${linkStart}<img class="score-game-image" src="${gameImage(score)}" alt="" loading="lazy" onerror="this.src='/assets/images/hero.jpg'"><div class="score-game-copy"><strong>${esc(score.game)}</strong><span>Personal best${score.playedAt ? ` · ${esc(formatDate(score.playedAt))}` : ''}</span></div><span class="score-value">${formatNumber(score.score)}</span>${linkEnd}</li>`;
    }).join('');
    els.scoreList.hidden = scores.length === 0;
    els.scoreEmpty.hidden = scores.length > 0;
  }

  function xpProgress(profile) {
    const levelStart = Math.pow(profile.level - 1, 2) * 100;
    const levelEnd = Math.pow(profile.level, 2) * 100;
    const xp = Math.max(profile.xp, levelStart);
    return {
      percent: Math.max(0, Math.min(100, ((xp - levelStart) / Math.max(1, levelEnd - levelStart)) * 100)),
      next: Math.max(0, levelEnd - xp),
      levelEnd
    };
  }

  function updateNav() {
    if (!state.session) {
      els.navPlayerChip.hidden = true;
      els.navAuthButton.textContent = 'Sign in';
      els.navAuthButton.href = '/profile/#account';
      return;
    }
    const profile = state.profile || normalizeProfile(state.session);
    const character = characterById(profile.avatar.character);
    els.navAvatarImage.src = character.src;
    els.navPlayerName.textContent = profile.displayName;
    els.navPlayerChip.hidden = false;
    els.navAuthButton.textContent = 'My profile';
    els.navAuthButton.href = '/profile/';
  }

  function renderProfile(profile) {
    const character = characterById(profile.avatar.character);
    const xp = xpProgress(profile);
    document.title = `${profile.displayName} (@${profile.username}) | Mochi Mango Arcade`;
    els.profileDisplayName.textContent = profile.displayName;
    els.profileUsername.textContent = profile.username;
    els.profileJoinDate.textContent = formatDate(profile.createdAt);
    els.profileBio.textContent = profile.bio;
    els.profileLevelPill.textContent = `Level ${formatNumber(profile.level)}`;
    els.profileTitle.textContent = profile.title || titleForLevel(profile.level);
    els.profileXp.textContent = formatNumber(profile.xp);
    els.profileNextLevel.textContent = xp.next ? `${formatNumber(xp.next)} XP to level ${profile.level + 1}` : 'Ready to level up!';
    els.profileXpBar.style.width = `${xp.percent}%`;
    applyAvatar(els.profileAvatar, els.profileAvatarImage, profile.avatar);
    els.statGamesPlayed.textContent = formatNumber(profile.stats.gamesPlayed);
    els.statPlayTime.textContent = formatPlayTime(profile.stats.playMinutes);
    els.favoriteCharacterImage.src = character.src;
    els.favoriteCharacterImage.alt = character.name;
    els.favoriteCharacterName.textContent = character.name;
    els.favoriteCharacterTagline.textContent = character.tagline;
    renderAchievements(profile);
    renderScores(profile);

    els.editAvatarButton.hidden = !state.isOwnProfile;
    els.signOutButton.hidden = !state.isOwnProfile;
    els.profilePrivateNote.hidden = state.isOwnProfile;
    els.profileSignInCta.hidden = Boolean(state.session) || state.isOwnProfile;
    els.profileStatusBadge.innerHTML = `<i aria-hidden="true"></i>${state.isOwnProfile ? 'Your profile' : 'Arcade member'}`;
    if (!state.isOwnProfile) {
      els.publicProfileName.textContent = profile.displayName;
      els.shareProfileButton.innerHTML = '<span aria-hidden="true">🔗</span> Share profile';
    }
    updateNav();
    showOnly(els.playerProfile);
  }

  function showGateway(options = {}) {
    document.title = 'Player Profile | Mochi Mango Arcade';
    state.profile = null;
    updateNav();
    showOnly(els.accountGateway);
    if (options.signup) switchAuth('signup');
    if (location.hash === '#account') setTimeout(() => els.accountGateway.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function showProfileError(title, message, retry = true) {
    els.profileErrorTitle.textContent = title;
    els.profileErrorMessage.textContent = message;
    els.retryProfileButton.hidden = !retry;
    showOnly(els.profileError);
  }

  async function loadPage() {
    showOnly(els.profileLoading);
    try {
      state.session = await getSession();
    } catch (error) {
      state.session = null;
      showNotice('Account services are taking a little nap. You can still browse the arcade and try again shortly.');
    }

    if (state.publicUsername) {
      try {
        const raw = await getPublicProfile(state.publicUsername);
        if (!raw || typeof raw !== 'object') throw new ApiError('Profile not found.', 404);
        state.profile = normalizeProfile(raw);
        state.isOwnProfile = Boolean(state.session && state.session.username && state.session.username.toLowerCase() === state.profile.username.toLowerCase());
        renderProfile(state.profile);
      } catch (error) {
        if (error.status === 404) showProfileError('That profile is still hiding.', `We couldn't find @${state.publicUsername}. Check the spelling and try again.`);
        else showProfileError('The trophy shelf won’t open just yet.', cleanText(error.message, 'Please check your connection and try again.'));
        updateNav();
      }
      return;
    }

    if (!state.session) {
      showGateway({ signup: location.hash === '#signup' });
      return;
    }

    try {
      const raw = await getOwnProfile();
      state.profile = normalizeProfile(raw || state.session);
      state.isOwnProfile = true;
      renderProfile(state.profile);
    } catch (error) {
      if (error.status === 401) {
        state.session = null;
        setAccountActivity(false);
        showGateway();
        showNotice('Your session ended. Sign in again to keep collecting.');
      } else {
        showProfileError('Your profile is taking a cozy break.', cleanText(error.message, 'Please try again in a moment.'));
      }
    }
  }

  function switchAuth(mode) {
    const signup = mode === 'signup';
    els.signInPanel.hidden = signup;
    els.signUpPanel.hidden = !signup;
    els.signInTab.classList.toggle('is-active', !signup);
    els.signUpTab.classList.toggle('is-active', signup);
    els.signInTab.setAttribute('aria-selected', String(!signup));
    els.signUpTab.setAttribute('aria-selected', String(signup));
    els.signInTab.tabIndex = signup ? -1 : 0;
    els.signUpTab.tabIndex = signup ? 0 : -1;
    history.replaceState(null, '', signup ? '#signup' : '#account');
    const target = signup ? $('#signUpDisplayName') : $('#signInIdentifier');
    setTimeout(() => target?.focus({ preventScroll: true }), 30);
  }

  async function handleSignIn(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = $('button[type="submit"]', form);
    showFormMessage(els.signInMessage, '');
    setBusy(button, true, 'Signing in…');
    const data = new FormData(form);
    const identifier = cleanText(data.get('identifier'));
    try {
      const payload = await api('/api/profile/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: identifier, password: data.get('password') })
      });
      const user = unwrap(payload, ['profile', 'user']);
      state.session = user && typeof user === 'object' ? user : { username: identifier };
      setAccountActivity(true);
      showFormMessage(els.signInMessage, 'Welcome back! Opening your trophy shelf…', true);
      showToast('Welcome back to the arcade!');
      form.reset();
      history.replaceState(null, '', '/profile/');
      await loadPage();
    } catch (error) {
      showFormMessage(els.signInMessage, cleanText(error.message, 'We couldn’t sign you in. Check your details and try again.'));
    } finally {
      setBusy(button, false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $('#signUpPassword').value;
    const confirm = $('#signUpConfirm').value;
    if (password !== confirm) {
      $('#signUpConfirm').setCustomValidity('Passwords do not match.');
    } else {
      $('#signUpConfirm').setCustomValidity('');
    }
    if (!form.reportValidity()) return;

    const button = $('button[type="submit"]', form);
    const data = new FormData(form);
    const avatar = { character: state.starterCharacter, frame: 'none', background: 'peach-sky' };
    showFormMessage(els.signUpMessage, '');
    setBusy(button, true, 'Creating profile…');
    try {
      const payload = await api('/api/profile/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: cleanText(data.get('displayName')),
          username: cleanText(data.get('username')).toLowerCase(),
          email: cleanText(data.get('email')).toLowerCase(),
          password,
          avatar
        })
      });
      const user = unwrap(payload, ['profile', 'user']);
      state.session = user && typeof user === 'object' ? user : { username: cleanText(data.get('username')).toLowerCase() };
      setAccountActivity(true);
      if (state.starterCharacter !== 'mochi') {
        try {
          await api('/api/profile/events/avatar', { method: 'POST', body: JSON.stringify({ avatar }) });
        } catch {
          showNotice('Your account is ready. You can finish choosing your buddy in Avatar Studio.');
        }
      }
      showFormMessage(els.signUpMessage, 'Your profile is ready — welcome!', true);
      showToast('Profile created! Your first adventure starts now.');
      history.replaceState(null, '', '/profile/');
      await loadPage();
      if (state.isOwnProfile) setTimeout(openAvatarStudio, 280);
    } catch (error) {
      showFormMessage(els.signUpMessage, cleanText(error.message, 'We couldn’t create your profile. Please try again.'));
    } finally {
      setBusy(button, false);
    }
  }

  async function handleSignOut() {
    setBusy(els.signOutButton, true, 'Signing out…');
    try {
      await api('/api/profile/auth/logout', { method: 'POST' });
    } catch (error) {
      if (error.status !== 401) showNotice('You were signed out locally, but the server took a little longer to respond.');
    } finally {
      setBusy(els.signOutButton, false);
    }
    state.session = null;
    setAccountActivity(false);
    state.profile = null;
    state.isOwnProfile = false;
    history.replaceState(null, '', '/profile/');
    showGateway();
    showToast('Signed out. See you next adventure!');
  }

  function cosmeticAvailable(bucket, id) {
    const available = state.profile?.cosmetics?.[bucket];
    return !Array.isArray(available) || available.includes(id);
  }

  function renderStudioChoices() {
    els.characterChoices.innerHTML = CHARACTERS.map((character) => {
      const available = cosmeticAvailable('characters', character.id);
      return `<button class="avatar-choice${available ? '' : ' is-locked'}" type="button" data-avatar-character="${esc(character.id)}" aria-pressed="false" ${available ? '' : 'disabled'}><img src="${character.src}" alt=""><span>${esc(character.name)}</span></button>`;
    }).join('');
    els.frameChoices.innerHTML = FRAMES.map((frame) => {
      const available = cosmeticAvailable('frames', frame.id);
      return `<button class="frame-choice${available ? '' : ' is-locked'}" style="--choice-color:${frame.color}" type="button" data-avatar-frame="${esc(frame.id)}" aria-pressed="false" ${available ? '' : 'disabled'}><i aria-hidden="true"></i><span>${esc(frame.name)}</span></button>`;
    }).join('');
    els.backgroundChoices.innerHTML = BACKGROUNDS.map((background) => {
      const available = cosmeticAvailable('backgrounds', background.id);
      return `<button class="background-choice${available ? '' : ' is-locked'}" type="button" data-avatar-background="${esc(background.id)}" aria-pressed="false" ${available ? '' : 'disabled'}><i style="background:${background.css}" aria-hidden="true"></i><span>${esc(background.name)}</span></button>`;
    }).join('');
  }

  function updateStudioPreview() {
    state.avatarDraft = applyAvatar(els.studioAvatarPreview, els.studioAvatarImage, state.avatarDraft);
    const character = characterById(state.avatarDraft.character);
    els.studioCharacterName.textContent = character.name;
    $$('[data-avatar-character]', els.characterChoices).forEach((button) => {
      const selected = button.dataset.avatarCharacter === state.avatarDraft.character;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $$('[data-avatar-frame]', els.frameChoices).forEach((button) => {
      const selected = button.dataset.avatarFrame === state.avatarDraft.frame;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $$('[data-avatar-background]', els.backgroundChoices).forEach((button) => {
      const selected = button.dataset.avatarBackground === state.avatarDraft.background;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function openAvatarStudio() {
    if (!state.isOwnProfile || !state.profile) return;
    renderStudioChoices();
    state.avatarDraft = { ...state.profile.avatar };
    showFormMessage(els.studioMessage, '');
    updateStudioPreview();
    if (typeof els.avatarStudio.showModal === 'function') els.avatarStudio.showModal();
    else els.avatarStudio.setAttribute('open', '');
  }

  async function saveAvatar(event) {
    event.preventDefault();
    if (!state.isOwnProfile || !state.profile) return;
    setBusy(els.saveAvatarButton, true, 'Saving…');
    showFormMessage(els.studioMessage, '');
    try {
      const payload = await api('/api/profile/events/avatar', { method: 'POST', body: JSON.stringify({ avatar: state.avatarDraft }) });
      const savedProfile = unwrap(payload, ['profile']);
      if (savedProfile && typeof savedProfile === 'object' && (savedProfile.username || savedProfile.avatar)) {
        state.profile = normalizeProfile(savedProfile);
      } else {
        state.profile.avatar = { ...state.avatarDraft };
      }
      renderProfile(state.profile);
      els.avatarStudio.close();
      showToast('Avatar saved — you look adorable!');
    } catch (error) {
      showFormMessage(els.studioMessage, cleanText(error.message, 'Your avatar couldn’t be saved. Please try again.'));
    } finally {
      setBusy(els.saveAvatarButton, false);
    }
  }

  async function shareProfile() {
    if (!state.profile) return;
    const url = `${location.origin}/profile/?u=${encodeURIComponent(state.profile.username)}`;
    const shareData = { title: `${state.profile.displayName}'s Mochi Mango Arcade profile`, text: `See ${state.profile.displayName}'s trophies and best scores!`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        showToast('Public profile link copied!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        try {
          const input = document.createElement('input');
          input.value = url;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          input.remove();
          showToast('Public profile link copied!');
        } catch { showNotice(`Share this profile: ${url}`); }
      }
    }
  }

  function bindEvents() {
    els.profileMenuButton.addEventListener('click', () => {
      const open = els.profileMenuButton.getAttribute('aria-expanded') === 'true';
      els.profileMenuButton.setAttribute('aria-expanded', String(!open));
      els.profileMobileNav.hidden = open;
    });
    els.dismissNotice.addEventListener('click', () => { els.profileNotice.hidden = true; });
    els.signInTab.addEventListener('click', () => switchAuth('signin'));
    els.signUpTab.addEventListener('click', () => switchAuth('signup'));
    $$('[data-open-auth]').forEach((button) => button.addEventListener('click', () => switchAuth(button.dataset.openAuth)));
    $$('[data-password-toggle]').forEach((button) => button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Hide' : 'Show';
      button.setAttribute('aria-label', `${reveal ? 'Hide' : 'Show'} password`);
    }));

    els.starterAvatarList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-starter-character]');
      if (!button) return;
      state.starterCharacter = button.dataset.starterCharacter;
      $$('[data-starter-character]', els.starterAvatarList).forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle('is-selected', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      });
    });

    els.signInForm.addEventListener('submit', handleSignIn);
    els.signUpForm.addEventListener('submit', handleSignUp);
    $('#signUpConfirm').addEventListener('input', (event) => event.currentTarget.setCustomValidity(''));
    els.signOutButton.addEventListener('click', handleSignOut);
    els.editAvatarButton.addEventListener('click', openAvatarStudio);
    els.shareProfileButton.addEventListener('click', shareProfile);
    els.retryProfileButton.addEventListener('click', loadPage);
    els.showLockedToggle.addEventListener('change', () => {
      $$('.achievement-card[data-locked="true"]', els.achievementGrid).forEach((card) => { card.hidden = !els.showLockedToggle.checked; });
    });

    els.characterChoices.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar-character]');
      if (!button) return;
      state.avatarDraft.character = button.dataset.avatarCharacter;
      updateStudioPreview();
    });
    els.frameChoices.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar-frame]');
      if (!button) return;
      state.avatarDraft.frame = button.dataset.avatarFrame;
      updateStudioPreview();
    });
    els.backgroundChoices.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar-background]');
      if (!button) return;
      state.avatarDraft.background = button.dataset.avatarBackground;
      updateStudioPreview();
    });
    els.avatarStudioForm.addEventListener('submit', (event) => {
      const submitter = event.submitter;
      if (submitter?.id === 'saveAvatarButton') saveAvatar(event);
    });
    els.avatarStudio.addEventListener('click', (event) => {
      if (event.target !== els.avatarStudio) return;
      const rect = els.avatarStudio.getBoundingClientRect();
      const inDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inDialog) els.avatarStudio.close();
    });
  }

  function init() {
    cacheElements();
    renderStudioChoices();
    bindEvents();
    loadPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
