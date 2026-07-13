// Persistent campaign, daily challenge and chapter progression for shared-runtime games.

const FLAGSHIP_STORIES = {
  'puddle-pip-meadow-dash': ['Morning Trail','Rainy Hollow','Firefly Ridge','Bramble Chase','Guardian of the Meadow'],
  'puddles-pancake-panic': ['First Orders','Berry Rush','Maple Mayhem','Midnight Breakfast','Golden Griddle'],
  'mushmoos-moonlit-match': ['Dew Garden','Mooncap Path','Glow Bloom','Spirit Ring','Moonlit Crown'],
  'bloop-bubble-rescue': ['Coral Nursery','Bubble Reef','Jelly Current','Whale Gate','Beacon of the Deep'],
  'nine-gates-mahjong-trails': ['Tea Courtyard','Jade Bridge','Crane Pavilion','Dragon Hall','The Ninth Gate'],
  'snackstreet-rush': ['Breakfast Block','Lunch Lane','Festival Square','Night Market','World Tour'],
  'crownlight-chess': ['The Apprentice','Knight’s Trial','Bishop’s Maze','Queen’s Gambit','Crownlight Champion'],
  'starling-signal-patrol': ['Beacon Test','Moon Relay','Meteor Static','Pirate Signal','Star Patrol'],
  'glitch-garden': ['Bug Patch','Root Restore','Pixel Bloom','Corruption Storm','Garden Reboot'],
  'boot-sector': ['BIOS Beat','Driver Groove','Memory Pulse','Kernel Solo','Perfect Boot'],
  'rooftop-rocket-rumble': ['Alley Launch','Neon Roof','Drone Chase','Storm Tower','Skyline Crown'],
  'tower-of-floppy': ['Boot Stack','Data Floor','Archive Rise','Error Zone','Disk Fortress'],
  'super-seans-racing-rally': ['Qualifier','Rain Circuit','Night Sprint','Rival Cup','S1 Grand Prix'],
  'super-seans-soccer-showdown': ['Training Day','The Derby','Cup Quarterfinal','Penalty Night','Golden Glove Final'],
  'super-seans-pinball-party': ['Warm-up Table','Target Hunt','Multiball','Jackpot Run','Party Champion'],
  'comet-quarry-crew': ['Dust Field','Crystal Belt','Pirate Drill','Core Collapse','Quarry Shield'],
  'floppy-flap': ['Boot Gate','Cable Canyon','Disk Storm','Error Tunnel','Clean Save'],
  'baos-jade-dragon-rescue': ['Lantern Trail','River Tiles','Crane Bridge','Dragon Chamber','Jade Rescue'],
  'the-donut-dragon-derby': ['Sprinkle Sprint','Glaze Bend','Cocoa Tunnel','Dragon Chase','Sugar Crown'],
  'tika-tiger-traffic-tango': ['Market Lane','Monsoon Route','Festival Jam','Night Delivery','Tiger Shortcut']
};

const MODE_CHAPTERS = {
  puzzle: ['First Pattern','Hidden Rule','Twist Board','Master Sequence','Grand Puzzle'],
  arcade: ['Warm-up','Score Chase','Hazard Rush','Champion Run','Arcade Crown'],
  runner: ['First Route','Forked Trail','Chase Stage','Night Run','Final Sprint'],
  management: ['Opening Day','Lunch Rush','VIP Shift','Festival Service','Perfect Business'],
  board: ['Opening Move','Tactical Trial','Rival Match','Master Table','Royal Final'],
  match3: ['First Board','Blocker Garden','Combo Trial','Power Board','Cascade Crown'],
  shooter: ['Patrol','Wave Two','Elite Squadron','Boss Sector','Final Assault'],
  serve: ['First Orders','Busy Shift','Special Menu','Festival Rush','Perfect Service'],
  memory: ['First Pairs','Shuffled Room','Hidden Symbols','Perfect Recall','Memory Crown'],
  rhythm: ['Sound Check','Tempo Rise','Combo Track','Encore','Perfect Performance'],
  racing: ['Qualifier','Technical Track','Night Race','Rival Cup','Grand Prix'],
  sports: ['Practice','League Match','Cup Tie','Championship','Final'],
  platformer: ['First Steps','Secret Route','Hazard Tower','Boss Path','Summit'],
  merge: ['First Merge','Chain Builder','Limited Board','High Tile','Merge Crown'],
  pipeline: ['First Flow','Pressure Grid','Valve Trial','Master Network','Perfect System'],
  default: ['First Challenge','Rising Test','Advanced Run','Master Trial','Finale']
};

const MODE_MODIFIERS = {
  puzzle: [['Insight','freeze'],['Combo Bonus','x2'],['Board Clear','bomb']],
  match3: [['Insight','freeze'],['Combo Bonus','x2'],['Board Clear','bomb']],
  arcade: [['Safety Shield','shield'],['Score Burst','x2'],['Overdrive','rush']],
  runner: [['Safety Shield','shield'],['Coin Magnet','magnet'],['Turbo Route','rush']],
  management: [['Patient Crowd','freeze'],['Tip Multiplier','x2'],['Rush Hour','rush']],
  serve: [['Patient Crowd','freeze'],['Tip Multiplier','x2'],['Rush Hour','rush']],
  board: [['Tactical Pause','freeze'],['Double Reward','x2'],['Guardian Move','shield']],
  shooter: [['Sector Shield','shield'],['Heavy Weapon','mega'],['Overdrive','rush']],
  memory: [['Time Freeze','freeze'],['Match Bonus','x2'],['Perfect Hint','shield']],
  rhythm: [['Beat Focus','freeze'],['Combo Bonus','x2'],['Tempo Rush','rush']],
  racing: [['Safety Shield','shield'],['Turbo','rush'],['Score Line','x2']],
  sports: [['Precision Focus','freeze'],['Score Bonus','x2'],['Captain Shield','shield']],
  platformer: [['Air Shield','shield'],['Secret Magnet','magnet'],['Speed Run','rush']],
  merge: [['Undo Guard','shield'],['Merge Bonus','x2'],['Tile Spark','mega']],
  pipeline: [['Pressure Pause','freeze'],['Flow Bonus','x2'],['Auto Valve','shield']],
  default: [['Safety Shield','shield'],['Double Score','x2'],['Arcade Rush','rush']]
};

const safeParse = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const modeFor = game => String(game.engine || 'default').toLowerCase();
const campaignKey = game => `mma_campaign_${game.slug}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

function loadState(game) {
  const data = safeParse(localStorage.getItem(campaignKey(game)) || '{}', {});
  return {
    chapter: Math.min(5, Math.max(1, Number(data.chapter) || 1)),
    xp: Math.max(0, Number(data.xp) || 0),
    tokens: Math.max(0, Number(data.tokens) || 0),
    medals: Math.max(0, Number(data.medals) || 0),
    modifier: Math.max(0, Number(data.modifier) || 0),
    dailyDate: data.dailyDate || '',
    dailyComplete: Boolean(data.dailyComplete),
    finished: Boolean(data.finished)
  };
}

function saveState(game, state) { localStorage.setItem(campaignKey(game), JSON.stringify(state)); }
function chaptersFor(game) { return FLAGSHIP_STORIES[game.slug] || MODE_CHAPTERS[modeFor(game)] || MODE_CHAPTERS.default; }
function modifiersFor(game) { return MODE_MODIFIERS[modeFor(game)] || MODE_MODIFIERS.default; }
function targetFor(state, daily = false) { return Math.round((250 + state.chapter * 375) * (daily ? 1.35 : 1)); }

function postTelemetry(event, game, value, outcome) {
  const body = { event, game: game.slug, mode: modeFor(game), viewport: innerWidth < 700 ? 'mobile' : 'desktop', value, outcome, version: 'campaign-1' };
  try { fetch('/api/telemetry', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {}); } catch {}
}

function applyModifier(instance, modifier) {
  const power = modifier?.[1] || 'x2';
  if (typeof instance?.grantPower === 'function') instance.grantPower(power, power === 'bomb' ? 0.1 : 12);
  else if (instance) instance.powers = { ...(instance.powers || {}), [power]: 12 };
  instance?.float?.(instance.W / 2, instance.H * 0.3, modifier?.[0] || 'Campaign boost', instance.theme?.accent || '#ffd166');
}

function buildPanel(stage, game, state) {
  const chapters = chaptersFor(game);
  const modifiers = modifiersFor(game);
  const dailyActive = state.dailyDate === todayKey() && !state.dailyComplete;
  const panel = document.createElement('section');
  panel.className = 'mma-campaign-panel';
  panel.innerHTML = `
    <div class="mma-campaign-heading">
      <div><span class="mma-campaign-kicker">Campaign</span><strong data-campaign-title>Chapter ${state.chapter}: ${chapters[state.chapter - 1]}</strong></div>
      <div class="mma-campaign-wallet"><span data-campaign-xp>${state.xp} XP</span><span data-campaign-tokens>◆ ${state.tokens}</span><span data-campaign-medals>🏅 ${state.medals}</span></div>
    </div>
    <div class="mma-campaign-objective">
      <span data-campaign-objective>Reach ${targetFor(state).toLocaleString()} points</span>
      <div class="mma-campaign-progress"><i data-campaign-progress></i></div>
    </div>
    <div class="mma-campaign-actions">
      <button type="button" data-campaign-modifier>Modifier: ${modifiers[state.modifier % modifiers.length][0]}</button>
      <button type="button" data-campaign-daily aria-pressed="${dailyActive}">${dailyActive ? 'Daily challenge active' : 'Start daily challenge'}</button>
    </div>
    <ol class="mma-campaign-chapters">${chapters.map((chapter, index) => `<li class="${index + 1 < state.chapter || state.finished ? 'complete' : index + 1 === state.chapter ? 'active' : ''}"><span>${index + 1}</span>${chapter}</li>`).join('')}</ol>`;
  stage.parentElement?.insertAdjacentElement('afterend', panel);
  return panel;
}

function resultCard(instance, game, state, success, reward, daily) {
  const host = instance?.overlay?.querySelector?.('.mma-panel') || instance?.overlay;
  if (!host) return;
  host.querySelector('.mma-campaign-result')?.remove();
  const card = document.createElement('div');
  card.className = `mma-campaign-result ${success ? 'success' : ''}`;
  card.innerHTML = success
    ? `<strong>${state.finished ? 'Campaign complete!' : 'Chapter cleared!'}</strong><span>+${reward.xp} XP · +${reward.tokens} tokens${daily ? ' · Daily medal earned' : ''}</span>`
    : `<strong>Chapter objective not reached</strong><span>Try again or change the campaign modifier.</span>`;
  host.appendChild(card);
}

export function enhanceCampaign(stage, game, instance) {
  if (!stage || !game || !instance || stage.dataset.campaignEnhanced === '1') return instance;
  stage.dataset.campaignEnhanced = '1';
  const state = loadState(game);
  const panel = buildPanel(stage, game, state);
  const modifiers = modifiersFor(game);
  const chapters = chaptersFor(game);
  const progress = panel.querySelector('[data-campaign-progress]');
  const objective = panel.querySelector('[data-campaign-objective]');
  const modifierButton = panel.querySelector('[data-campaign-modifier]');
  const dailyButton = panel.querySelector('[data-campaign-daily]');
  let dailyActive = state.dailyDate === todayKey() && !state.dailyComplete;
  let currentScore = Math.max(0, Number(instance.score) || 0);

  const refresh = () => {
    const target = targetFor(state, dailyActive);
    panel.querySelector('[data-campaign-title]').textContent = `Chapter ${state.chapter}: ${chapters[state.chapter - 1]}`;
    panel.querySelector('[data-campaign-xp]').textContent = `${state.xp} XP`;
    panel.querySelector('[data-campaign-tokens]').textContent = `◆ ${state.tokens}`;
    panel.querySelector('[data-campaign-medals]').textContent = `🏅 ${state.medals}`;
    panel.querySelector('.mma-campaign-chapters').innerHTML = chapters.map((chapter,index)=>`<li class="${index + 1 < state.chapter || state.finished ? 'complete' : index + 1 === state.chapter ? 'active' : ''}"><span>${index + 1}</span>${chapter}</li>`).join('');
    objective.textContent = `${dailyActive ? 'Daily: ' : ''}Reach ${target.toLocaleString()} points`;
    progress.style.width = `${Math.min(100, currentScore / target * 100)}%`;
    modifierButton.textContent = `Modifier: ${modifiers[state.modifier % modifiers.length][0]}`;
    dailyButton.textContent = dailyActive ? 'Daily challenge active' : state.dailyComplete && state.dailyDate === todayKey() ? 'Daily challenge complete' : 'Start daily challenge';
    dailyButton.setAttribute('aria-pressed', String(dailyActive));
    dailyButton.disabled = state.dailyComplete && state.dailyDate === todayKey();
  };

  modifierButton.addEventListener('click', () => {
    state.modifier = (state.modifier + 1) % modifiers.length;
    saveState(game, state);
    refresh();
  });
  dailyButton.addEventListener('click', () => {
    if (state.dailyComplete && state.dailyDate === todayKey()) return;
    state.dailyDate = todayKey();
    state.dailyComplete = false;
    dailyActive = true;
    saveState(game, state);
    refresh();
    postTelemetry('start', game, 0, 'daily-selected');
  });

  const baseSetScore = typeof instance.setScore === 'function' ? instance.setScore.bind(instance) : null;
  if (baseSetScore) instance.setScore = value => { baseSetScore(value); currentScore = Math.max(0, Math.floor(Number(value) || 0)); refresh(); };

  const baseStart = typeof instance.start === 'function' ? instance.start.bind(instance) : null;
  if (baseStart) instance.start = (...args) => {
    currentScore = 0;
    instance.challenge = state.chapter >= 5 ? 'legend' : state.chapter >= 3 ? 'arcade' : instance.challenge;
    const result = baseStart(...args);
    setTimeout(() => applyModifier(instance, modifiers[state.modifier % modifiers.length]), 80);
    refresh();
    postTelemetry('start', game, state.chapter, dailyActive ? 'daily' : 'campaign');
    return result;
  };

  const baseOver = typeof instance.showOver === 'function' ? instance.showOver.bind(instance) : null;
  if (baseOver) instance.showOver = (...args) => {
    const wasDaily = dailyActive;
    currentScore = Math.max(currentScore, Math.floor(Number(instance.score) || 0));
    const target = targetFor(state, dailyActive);
    const outcome = String(instance.outcome || instance.raceResult || '');
    const success = currentScore >= target || /win|victory|complete|first/i.test(outcome);
    const chapterBefore = state.chapter;
    let reward = { xp: 0, tokens: 0 };
    if (success) {
      reward = { xp: 100 + chapterBefore * 60 + (dailyActive ? 100 : 0), tokens: chapterBefore + (dailyActive ? 2 : 0) };
      state.xp += reward.xp;
      state.tokens += reward.tokens;
      state.medals += 1;
      if (dailyActive) { state.dailyComplete = true; state.dailyDate = todayKey(); dailyActive = false; }
      if (chapterBefore >= 5) state.finished = true;
      else state.chapter = chapterBefore + 1;
      saveState(game, state);
      refresh();
    }
    const result = baseOver(...args);
    setTimeout(() => resultCard(instance, game, state, success, reward, wasDaily), 30);
    postTelemetry('finish', game, currentScore, success ? `chapter-${chapterBefore}-clear` : `chapter-${chapterBefore}-retry`);
    return result;
  };

  refresh();
  return instance;
}
