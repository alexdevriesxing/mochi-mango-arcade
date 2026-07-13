// MMA_GLOBAL_QUALITY_CSS_LOADER
if(!document.querySelector('link[data-mma-quality]')){const qualityLink=document.createElement('link');qualityLink.rel='stylesheet';qualityLink.href='/assets/css/game-quality.css';qualityLink.dataset.mmaQuality='1';document.head.appendChild(qualityLink)}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeParse=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
const S={games:[],products:[],universes:{},i18n:{},lang:localStorage.mma_lang||'en',cart:safeParse(localStorage.mma_cart||'[]',[])};

async function J(p){const response=await fetch(p,{credentials:'same-origin'});if(!response.ok)throw new Error(`Failed to load ${p}: ${response.status}`);return response.json()}
function t(k){return (S.i18n[S.lang]?.[k])||S.i18n.en?.[k]||k}
function money(n){return '$'+Number(n).toFixed(2)}
function slug(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

function getProductRating(){return {rating:null,reviews:0,stars:''}}

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
    ['/about/','about', t('about')],
    ['/profile/','profile', '🏆 Profile']
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
    <img src="/assets/images/shop/shop_newsletter_strip.jpg" alt="Newsletter" class="newsletter-strip-img">
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
    <img src="/assets/images/shop/shop_footer_full.jpg" alt="Footer" class="footer-full-img">
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
          <a href="/shop/">${t('shop')}</a>
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

/* Advertising is disabled until consent, privacy and brand-safety controls are implemented. */
const adSlot=()=>'';const adResponsive=()=>'';const adTop=()=>'';const adSide=()=>'';const adNative=()=>'';const adSkyscraper=()=>'';function mountAds(){}function mountSocialBar(){}

function gameCard(g){
  let img = g.image || `/assets/images/games/${g.slug}.jpg`;
  let badge = g.built
    ? (g.new ? '<span class="badge">NEW</span>' : '<span class="badge play">PLAY</span>')
    : '<span class="badge soon">SOON</span>';
  let fallback = `this.onerror=null;this.src='/assets/images/games/${g.slug}.svg';this.onerror=function(){this.style.display='none'}`;
  return `<article class="card game-card${g.built?'':' coming-soon'}" data-genre="${g.genre}" data-universe="${g.universe}" data-built="${g.built?1:0}">
    <a href="${g.detailUrl}">
      ${badge}
      <div class="thumb"><img loading="lazy" src="${img}" alt="${g.title}" onerror="${fallback}">${g.built?'':'<span class="soon-sticker">🚧 Coming Soon</span>'}</div>
      <div class="card-body">
        <h3 class="game-title">${g.title}</h3>
        <div class="meta">
          <span>${g.genre}</span>
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
    <img src="/assets/images/universes/${k}.svg" alt="${u.name}" onerror="this.src='/assets/images/hero.png'">
    <h3>${u.name}</h3>
    <p>${n} games · ${u.description}</p>
  </a>`;
}

function charCard(c,n){
  let s = slug(c);
  return `<a class="card character-card" href="/characters/#${s}">
    <img src="/assets/images/characters/${s}.jpg" alt="${c}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/characters/${s}.png';this.onerror=function(){this.src='/assets/images/characters/${s}.svg';this.onerror=function(){this.src='/assets/images/characters/mochi.svg'}}">
    <strong>${c}</strong>
  </a>`;
}

const characterBios = {
  "mochi": {
    role: "Main mascot / cheerful squishy hero",
    bio: "Mochi is the soft-hearted mascot of Mochi Mango Arcade, a tiny round bundle of joy who believes every problem can be solved with kindness, a snack, and one more try. Mochi started as the guardian of the Playful Meadow, where lost game worlds drift together like clouds.",
    likes: "Warm hugs, cozy naps, helping new players, shiny stars, gentle adventures",
    dislikes: "Mean comments, cold rain, being rushed, losing friends in crowded places",
    food: "Mango cream pancakes",
    happy: "Seeing friends laugh after a difficult level",
    zodiac: "Cancer"
  },
  "mango": {
    role: "Sunny best friend / energy booster",
    bio: "Mango is Mochi's bright and bouncy best friend, born from a golden fruit tree that grows only in the happiest corner of the arcade universe. Mango brings courage, sunshine, and a little chaos wherever they go.",
    likes: "Dancing, tropical music, treasure hunts, fireworks, racing down hills",
    dislikes: "Gloomy rooms, boring rules, sour snacks, waiting too long",
    food: "Mango sticky rice",
    happy: "A big group celebration after a win",
    zodiac: "Leo"
  },
  "pandy": {
    role: "Gentle thinker / puzzle buddy",
    bio: "Pandy is a calm, clever panda who lives in the Bamboo Library, where every book hides a puzzle and every puzzle hides a snack. Pandy helps the team slow down, think clearly, and solve things without panic.",
    likes: "Puzzles, bamboo forests, quiet tea breaks, maps, building collections",
    dislikes: "Loud alarms, messy plans, wasted food, being interrupted mid-thought",
    food: "Bamboo dumplings",
    happy: "Solving a puzzle together with friends",
    zodiac: "Virgo"
  },
  "neko": {
    role: "Cute pink cat / charm collector",
    bio: "Neko is a playful pink kitty who collects lucky charms, ribbons, and tiny magical bells. She wandered into the arcade through a hidden garden gate and quickly became everyone's favourite companion for cozy adventures and collectible quests.",
    likes: "Flowers, ribbons, shiny charms, cozy rooms, secret gardens",
    dislikes: "Dusty corners, broken toys, being ignored, thunderstorms",
    food: "Strawberry mochi",
    happy: "Finding a new charm for her collection",
    zodiac: "Libra"
  },
  "zuzu": {
    role: "Tiny hoodie explorer / gentle adventurer",
    bio: "Zuzu is a small explorer in a green hoodie who loves discovering hidden paths between game worlds. Though a little shy at first, Zuzu is brave when friends need help and always carries snacks for long journeys.",
    likes: "Hoodies, secret paths, stickers, map-making, gentle platforming",
    dislikes: "Very loud crowds, scary shadows, spicy food, getting lost without a map",
    food: "Melon bread",
    happy: "Discovering a peaceful hidden area",
    zodiac: "Pisces"
  },
  "batty": {
    role: "Purple bat sidekick / night scout",
    bio: "Batty is a tiny purple bat who patrols the night skies above Mochi Mango Arcade. Batty looks mischievous, but is actually a loyal lookout who warns everyone about spooky clouds, lost stars, and incoming bonus rounds.",
    likes: "Moonlight, flying loops, spooky jokes, glowing crystals, secret shortcuts",
    dislikes: "Bright flashlights, boring mornings, garlic jokes, tangled wings",
    food: "Blueberry moon cupcakes",
    happy: "Being trusted as the team's brave night scout",
    zodiac: "Scorpio"
  },
  "captain-corgi": {
    role: "Sea captain / brave leader",
    bio: "Captain Corgi sails the Bubble Blue Seas in a tiny ship with a very large sense of duty. He became captain after rescuing a fleet of toy boats from a whirlpool, and now leads every mission with loyalty, courage, and a wagging tail.",
    likes: "Treasure maps, sea breeze, loyal crews, steering wheels, heroic speeches",
    dislikes: "Leaky boats, mutiny, soggy biscuits, being called short",
    food: "Fish-shaped biscuits",
    happy: "Leading friends safely home after an adventure",
    zodiac: "Aries"
  },
  "raccoon-rex": {
    role: "Gadget trickster / clever scavenger",
    bio: "Raccoon Rex is a mischievous inventor who builds amazing gadgets from shiny things nobody else notices. He grew up in the back alleys of Neon Nut City and became famous for turning junk into helpful tools.",
    likes: "Gadgets, shiny buttons, secret switches, harmless pranks, night missions",
    dislikes: "Locked boxes, boring instructions, dull metal, people touching his goggles",
    food: "Caramel popcorn",
    happy: "Finding the perfect missing part for an invention",
    zodiac: "Gemini"
  },
  "dragon-dribble": {
    role: "Tiny dragon / fiery sweetheart",
    bio: "Dragon Dribble is a small dragon with huge feelings and an even bigger imagination. He has not mastered giant dragon fire yet, but his tiny sparks can light lanterns, toast marshmallows, and power magical arcade machines.",
    likes: "Flying practice, warm campfires, shiny stars, heroic stories, making friends",
    dislikes: "Cold caves, being underestimated, wet wings, scary silence",
    food: "Star-shaped marshmallows",
    happy: "Using his little fire to help someone feel safe",
    zodiac: "Sagittarius"
  },
  "bunny-blossom": {
    role: "Garden helper / kindness mascot",
    bio: "Bunny Blossom tends the Carrot Cloud Garden, where every flower grows from a kind thought. She brings comfort to nervous players, grows power-up carrots, and believes even the toughest levels need a little softness.",
    likes: "Flowers, watering cans, carrots, spring mornings, helping shy friends",
    dislikes: "Trampled gardens, rude shouting, wilted flowers, muddy paws",
    food: "Honey-glazed carrots",
    happy: "Watching something bloom because she cared for it",
    zodiac: "Taurus"
  },
  "ninja-neko": {
    role: "Stealth hero / silent protector",
    bio: "Ninja Neko is Neko's mysterious night-time alter ego, trained in the Velvet Dojo under moonlight. Silent, swift, and surprisingly dramatic, Ninja Neko protects the arcade from shadow bugs and stolen bonus coins.",
    likes: "Moon jumps, ninja stars, rooftops, quiet focus, dramatic entrances",
    dislikes: "Noisy bells, clumsy traps, bright spotlights, being mistaken for ordinary Neko",
    food: "Black sesame rice balls",
    happy: "Completing a mission without anyone noticing",
    zodiac: "Capricorn"
  },
  "astro-zuzu": {
    role: "Space explorer / cosmic optimist",
    bio: "Astro Zuzu is Zuzu's spacefaring counterpart, travelling between planets in a bubble helmet and tiny rocket boots. They chart candy comets, rescue lost stars, and send postcards from the farthest corners of the Mochi Mango galaxy.",
    likes: "Planets, rocket rides, star maps, alien pets, floating in zero gravity",
    dislikes: "Asteroid traffic, empty snack packs, cracked helmets, homesickness",
    food: "Galaxy jelly pudding",
    happy: "Discovering a new friendly planet",
    zodiac: "Aquarius"
  },
  "madame-fortuna": {
    role: "Mystic seer / cheerful destiny guide",
    bio: "Madame Fortuna is a joyful little fortune teller who reads stars, cards, and crystal sparkles to help friends find lucky paths. She never tells anyone their future is fixed; instead, she believes every player can choose a brighter adventure with courage and kindness.",
    likes: "Crystal balls, tarot cards, moon charms, lucky stars, helping friends make brave choices",
    dislikes: "Broken promises, gloomy predictions, dusty old curtains, people giving up too early",
    food: "Moonberry cream tarts",
    happy: "When someone discovers they are braver than they thought",
    zodiac: "Scorpio"
  },
  "morpheus": {
    role: "Dream traveler / cozy magic guide",
    bio: "Morpheus travels through soft dream clouds, collecting forgotten wishes and turning them into gentle adventures. He appears when players are tired, worried, or stuck, bringing calm, comfort, and a little sleepy magic to help them try again.",
    likes: "Moon pillows, cloud surfing, bedtime stories, starlight, cozy blankets",
    dislikes: "Nightmares, loud alarms, rushed mornings, cold floors",
    food: "Vanilla moon cupcakes",
    happy: "Helping a friend fall asleep with a happy dream",
    zodiac: "Pisces"
  },
  "umbra": {
    role: "Moonlight maze guide / starry night protector",
    bio: "Umbra is a curious little night guide who knows every twist of the Moonlight Maze. With a glowing crescent charm and a cloak full of tiny stars, Umbra helps lost friends find their way through spooky paths without ever feeling alone.",
    likes: "Moonlight, star maps, secret passages, quiet adventures, purple magic",
    dislikes: "Harsh daylight, broken lanterns, being misunderstood, scary echoes",
    food: "Midnight berry donuts",
    happy: "Guiding someone safely out of the dark",
    zodiac: "Cancer"
  },
  "sol-frog": {
    role: "Lucky sunshine frog / good-vibes leaper",
    bio: "Sol Frog hops wherever the sun shines brightest, spreading luck, joy, and warm-hearted courage. Legend says every leap leaves behind a tiny sunbeam, and every smile makes Sol's lucky charm glow a little brighter.",
    likes: "Sunshine, lucky charms, lily pads, cheerful music, good-luck wishes",
    dislikes: "Rainy gloom, bad vibes, unlucky grumbling, cloudy picnic days",
    food: "Golden honey bubble tea",
    happy: "When everyone feels lucky enough to try one more time",
    zodiac: "Leo"
  },
  "tika-tiger": {
    role: "Speedy delivery adventurer / reliable courier",
    bio: "Tika Tiger is the fastest delivery cub in Mochi Mango Arcade, racing across rooftops, markets, and floating islands to bring packages and smiles on time. Tika believes no friend is too far away and no surprise is too small to matter.",
    likes: "Fast routes, parcels, skateboards, surprise gifts, helping friends quickly",
    dislikes: "Late deliveries, traffic jams, damaged packages, boring waiting rooms",
    food: "Spicy mango buns",
    happy: "Delivering the perfect package at exactly the right moment",
    zodiac: "Aries"
  },
  "nori-ninja": {
    role: "Tiny ninja / stealthy snack protector",
    bio: "Nori Ninja is a tiny master of stealth who moves like seaweed in the wind and vanishes behind leaves, smoke puffs, and snack carts. Small in size but huge in heart, Nori protects friends, solves sneaky problems, and always keeps one rice ball ready for emergencies.",
    likes: "Onigiri, miso soup, hide-and-seek, quiet rooftops, clever shortcuts",
    dislikes: "Loud noises, being late, clumsy traps, soggy seaweed",
    food: "Onigiri with miso soup",
    happy: "Completing a mission quietly and sharing snacks afterward",
    zodiac: "Capricorn"
  },
  "uncle-lee": {
    role: "Tea house host / lucky wisdom keeper",
    bio: "Uncle Lee runs the warmest corner of the Nine Gates Tea House, where every cup of tea comes with a story and every mahjong tile has a little lesson hidden inside. He is gentle, patient, and somehow always knows when a friend needs advice, a snack, or one more lucky draw.",
    likes: "Tea ceremonies, mahjong tiles, old stories, peaceful mornings, helping young players learn",
    dislikes: "Rushed tea, noisy arguments, broken teapots, people ignoring good advice",
    food: "Steamed custard buns with jasmine tea",
    happy: "Seeing friends solve problems calmly and kindly",
    zodiac: "Taurus"
  },
  "auntie-li-wen": {
    role: "Elegant tea master / graceful caretaker",
    bio: "Auntie Li-Wen is the heart of the tea house, famous for turning simple tea into tiny moments of magic. She knows every guest's favourite blend and believes manners, patience, and warmth can fix almost any bad day.",
    likes: "Flower tea, lanterns, dumplings, graceful dancing, welcoming guests",
    dislikes: "Cold tea, messy tables, rude behaviour, wilted blossoms",
    food: "Lotus tea cakes",
    happy: "Making everyone feel welcome, safe, and cared for",
    zodiac: "Libra"
  },
  "red-crane": {
    role: "Graceful rival / festival challenger",
    bio: "Red Crane is a proud and elegant bird from the Lantern Highlands who challenges friends to games of skill, speed, and strategy. Though sometimes dramatic, Red Crane is never cruel; every rivalry is meant to make everyone stronger, sharper, and more confident.",
    likes: "Festival lanterns, strategy games, elegant flights, fair contests, lucky charms",
    dislikes: "Cheating, clumsy shortcuts, boring matches, dull feathers",
    food: "Red bean mooncakes",
    happy: "Winning fairly or losing beautifully after a great challenge",
    zodiac: "Leo"
  },
  "clockwork-crow": {
    role: "Courier inventor / sky messenger",
    bio: "Clockwork Crow is a clever sky courier with goggles, gears, maps, and a satchel full of urgent letters. Built for adventure and powered by curiosity, Crow delivers messages across floating cities, clock towers, and cloud routes no one else can reach.",
    likes: "Letters, clock towers, brass gadgets, wind-up keys, secret routes",
    dislikes: "Rusty gears, late deliveries, confusing maps, heavy rain on wings",
    food: "Caramel seed crackers",
    happy: "Delivering an important message exactly on time",
    zodiac: "Gemini"
  },
  "coco-cannon": {
    role: "Tropical pirate mascot / coconut kingdom hero",
    bio: "Coco Cannon is a cheerful coconut pirate from the Sunny Shoals who prefers treasure hunts to trouble. With a flowered bandana, tiny cannon, and huge laugh, Coco protects island friends from grumpy sea goblins and always shares the loot.",
    likes: "Treasure maps, coconut drinks, sunny beaches, pirate flags, big cannon booms",
    dislikes: "Empty treasure chests, stormy seas, soggy maps, selfish pirates",
    food: "Coconut pudding with mango sauce",
    happy: "Finding treasure and sharing it with the whole crew",
    zodiac: "Sagittarius"
  },
  "professor-pogo": {
    role: "Inventor scientist / impossible-island genius",
    bio: "Professor Pogo is a tiny scientist with huge glasses, a spinning hat, and inventions that usually work after only three or four hilarious explosions. He studies impossible islands, bouncing machines, and the science of making playtime more surprising.",
    likes: "Gadgets, experiments, bouncing, gears, bright ideas, silly inventions",
    dislikes: "Boring instructions, failed batteries, people saying impossible, missing tools",
    food: "Vanilla gear cookies",
    happy: "When a strange invention actually helps a friend",
    zodiac: "Aquarius"
  },
  "puddle": {
    role: "Rainy-day duckling / cheerful splash maker",
    bio: "Puddle is a tiny blue duckling in a yellow raincoat who believes rainy days are secret invitations to play. Hatched during the Great Sprinkle Festival, Puddle can find joy in every puddle, storm cloud, and splashy surprise.",
    likes: "Rainy days, puddle jumping, umbrellas, cheering up friends, shiny raindrops",
    dislikes: "Dry boring afternoons, broken umbrellas, muddy socks, friends feeling gloomy",
    food: "Blueberry rain-drop jelly",
    happy: "Making everyone laugh by turning a rainy day into an adventure",
    zodiac: "Pisces"
  },
  "pip": {
    role: "Meadow hopper / lucky little explorer",
    bio: "Pip is a tiny green frog from Clover Meadow who hops between lily pads, secret gardens, and hidden arcade paths. Pip is small, curious, and endlessly optimistic, always ready to leap first and ask questions halfway through the jump.",
    likes: "Clover leaves, lily pads, dragonflies, spring mornings, hidden paths",
    dislikes: "Dry ponds, loud stomping, losing lucky charms, being told a jump is impossible",
    food: "Clover honey pancakes",
    happy: "Landing a brave jump and helping friends cross safely",
    zodiac: "Sagittarius"
  },
  "bramble-bear": {
    role: "Honey rescue helper / gentle forest friend",
    bio: "Bramble Bear is a kind bear cub from Honey Hollow who protects the forest's sweetest treasures. He started helping others after saving a lost bee family, and now carries honey, hugs, and courage wherever he goes.",
    likes: "Honey pots, forest walks, helping bees, warm blankets, sharing snacks",
    dislikes: "Empty honey jars, greedy stealing, thorny bushes, friends arguing",
    food: "Warm honey toast",
    happy: "Sharing honey with friends after a successful rescue",
    zodiac: "Taurus"
  },
  "lulu-lantern": {
    role: "Glow garden guide / magical light keeper",
    bio: "Lulu Lantern is a tiny golden fox spirit who carries a glowing lantern through the Dreamwood Garden. Her light turns dark paths into magical trails and helps lost dreamers find their way back home.",
    likes: "Lanterns, moonlit gardens, guiding friends, glowing flowers, gentle magic",
    dislikes: "Pitch-black tunnels, broken lantern glass, rushed decisions, scary whispers",
    food: "Mooncake with honey glaze",
    happy: "Lighting the path so nobody has to feel lost",
    zodiac: "Libra"
  },
  "mei-mei": {
    role: "Tile spirit scholar / puzzle prodigy",
    bio: "Mei Mei is a clever tile spirit scholar who sees patterns everywhere, from flower petals to game boards. Raised in the Nine Gates Tea House, she studies lucky tiles, ancient puzzles, and the art of solving problems with patience and heart.",
    likes: "Mahjong tiles, cherry blossoms, logic puzzles, bubble tea, lucky charms",
    dislikes: "Messy tile sets, unfair tricks, broken teacups, people giving up too quickly",
    food: "Cherry blossom milk tea and sesame cookies",
    happy: "Solving a puzzle and teaching a friend how to do it too",
    zodiac: "Virgo"
  },
  "bao": {
    role: "Jade dragon adventurer / brave festival hero",
    bio: "Bao is a cheerful adventurer from Jade Valley who wears a lucky dragon hood and carries a tiny jade dragon charm. Bao believes courage works best with kindness, and every quest is better when shared with friends.",
    likes: "Dragon charms, festival drums, brave quests, steamed buns, helping smaller friends",
    dislikes: "Bullies, broken lucky charms, missing festival lights, bland soup",
    food: "Steamed custard buns",
    happy: "Facing a big challenge with friends cheering nearby",
    zodiac: "Aries"
  }
};

function charBioCard(c, bio) {
  if (!bio) return '';
  let charSlug = slug(c);
  let portraitSrc = `/assets/images/characters/${charSlug}.jpg`;
  return `<div class="character-bio-card" id="${charSlug}">
    <div class="bio-header">
      <img src="${portraitSrc}" alt="${c}" class="bio-portrait" onerror="this.onerror=null;this.src='/assets/images/characters/${charSlug}.png';this.onerror=function(){this.src='/assets/images/characters/mochi.svg'}">
      <div class="bio-title-area">
        <h3 class="bio-name">${c}</h3>
        <span class="bio-role">${bio.role}</span>
      </div>
      <span class="bio-zodiac">${bio.zodiac}</span>
    </div>
    <p class="bio-story">${bio.bio}</p>
    <div class="bio-details">
      <div class="bio-detail">
        <span class="bio-detail-label">❤️ Likes</span>
        <span class="bio-detail-value">${bio.likes}</span>
      </div>
      <div class="bio-detail">
        <span class="bio-detail-label">💔 Dislikes</span>
        <span class="bio-detail-value">${bio.dislikes}</span>
      </div>
      <div class="bio-detail">
        <span class="bio-detail-label">🍽️ Favourite Food</span>
        <span class="bio-detail-value">${bio.food}</span>
      </div>
      <div class="bio-detail">
        <span class="bio-detail-label">✨ What Makes Them Happy</span>
        <span class="bio-detail-value">${bio.happy}</span>
      </div>
    </div>
  </div>`;
}

function charsPage(){
  let cc={};
  S.games.forEach(g=>cc[g.mascot]=(cc[g.mascot]||0)+1);
  let sortedChars = Object.entries(cc).sort((a,b)=>a[0].localeCompare(b[0]));
  let hasBios = sortedChars.filter(([c]) => characterBios[slug(c)]);
  let noBios = sortedChars.filter(([c]) => !characterBios[slug(c)]);
  
  return `<main id="main" class="container">
    ${adTop()}
    <section class="page-hero">
      <h1 data-i18n="characters">${t('characters')}</h1>
      <p>Meet the mascots behind the games. Each character is designed for plush, pins, stickers and collectibles.</p>
    </section>

    <section class="section">
      <div class="section-head">
        <h2><span class="emoji">📖</span> Character Stories</h2>
      </div>
      <div class="bio-grid">
        ${hasBios.map(([c,n])=>charBioCard(c, characterBios[slug(c)])).join('')}
      </div>
    </section>

    ${adNative()}

    <section class="section">
      <div class="section-head">
        <h2><span class="emoji">⭐</span> All Characters</h2>
      </div>
      <div class="grid character-grid">
        ${sortedChars.map(([c,n])=>charCard(c,n)).join('')}
      </div>
    </section>
  </main>`;
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
  let built=S.games.filter(g=>g.built);
  let f=[...built].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)).slice(0,5);
  let fset=new Set(f.map(g=>g.slug));
  let n=built.filter(g=>!fset.has(g.slug)).slice(0,5);
  let cc={};
  S.games.forEach(g=>cc[g.mascot]=(cc[g.mascot]||0)+1);
  let chars=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  
  return `<main id="main" class="container">
    ${adTop()}
    <div class="hero-wrap">
      <section class="hero-card">
        <img src="/assets/images/home_hero_main_characters.jpg" alt="Mochi Mango Arcade" class="hero-banner-img">
        <div class="hero-content">
          <div class="hero-badges">
            <span class="hero-badge-pill">🎮 ${built.length} Playable Now</span>
            <span class="hero-badge-pill">👶 Kid-Friendly</span>
            <span class="hero-badge-pill">⭐ Always Free</span>
          </div>
          <h1>200+<br><span>Playful HTML5 Games</span></h1>
          <p>${built.length} playable today with fresh games and collectible merch added every week.</p>
          <div class="hero-actions">
            <a href="/games/" class="btn">🎮 Play Now</a>
            <a href="/universes/" class="btn secondary">Explore Universes</a>
          </div>
        </div>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card merch-promo-card">
          <img src="/assets/images/home_homepage_merch_promo_card.jpg" alt="Merch Shop" class="merch-promo-img">
        </div>
        <div class="promo-card why-play-card">
          <img src="/assets/images/home_why_play_card.jpg" alt="Why Play" class="why-play-img">
        </div>
      </aside>
    </div>
    
    ${section('featuredGames',f)}

    ${adNative()}

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
    ${adTop()}
    <section class="page-hero">
      <h1 data-i18n="allGames">${t('allGames')}</h1>
      <p>Browse all 200 games — <b>${S.games.filter(g=>g.built).length} playable now</b>, with more added every week.</p>
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
        ${adSkyscraper('b160x600')}
      </aside>
      <section>
        <div class="toolbar">
          <div class="count" id="gameCount"></div>
          <div class="chip-row" style="margin:0">
            <button class="chip" id="playableToggle">🎮 Playable</button>
            <button class="chip active" data-sort="id">Newest</button>
            <button class="chip" data-sort="popular">Popular</button>
            <button class="chip" id="randomGame" data-i18n="randomGame">${t('randomGame')}</button>
          </div>
        </div>
        ${adNative()}
        <div id="gamesGrid" class="grid game-grid"></div>
      </section>
    </div>
  </main>`;
}

function universesPage(){
  return `<main id="main" class="container">
    ${adTop()}
    <section class="page-hero">
      <h1 data-i18n="universes">${t('universes')}</h1>
      <p>Recurring worlds designed for games, plush toys, merch drops and franchise growth.</p>
    </section>
    <div class="grid universe-grid">${Object.entries(S.universes).map(([k,u])=>universeCard(k,u)).join('')}</div>
    ${adNative()}
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


function shopPage(){
  let types = ["Plushies", "Apparel", "Mugs", "Stickers", "Pins", "Accessories", "Bundles"];
  let characters = ["Mochi", "Mango", "Neko", "Pandy", "Zuzu"];
  
  return `<main id="main" class="container">
    ${adTop()}
    <section class="shop-hero-section">
      <img src="/assets/images/shop/shop_shop_hero_banner.jpg" alt="Merch Shop" class="shop-hero-img">
      <img src="/assets/images/shop/shop_shop_hero_characters.jpg" alt="Characters" class="shop-hero-characters">
      <div class="shop-hero-overlay">
        <div class="shop-hero-text">
          <h1 data-i18n="shopTitle">${t('shopTitle')}</h1>
          <p data-i18n="shopSub">${t('shopSub')}</p>
          <div class="shop-hero-badges">
            <span class="shop-hero-badge">✅ Officially Licensed</span>
            <span class="shop-hero-badge">⭐ Cute Quality</span>
            <span class="shop-hero-badge">💖 Playful Joy</span>
          </div>
        </div>
      </div>
    </section>
    
    <div class="shop-limited-drop-banner">
      <img src="/assets/images/shop/shop_limited_drop_banner.jpg" alt="Limited Drop">
    </div>
    
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
        ${adSkyscraper('b160x300')}
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
        ${adNative()}
        <div id="productsGrid" class="grid product-grid"></div>
      </section>
    </div>

    <div class="merch-promo-banner">
      <img src="/assets/images/shop/shop_bundle_banner.jpg" alt="Bundle Offer" class="bundle-banner-img">
      <div class="merch-promo-left">
        <img src="/assets/images/shop/shop_save_25_bundle_badge.jpg" alt="Save 25%" class="save-badge-img">
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
    ${adTop()}
    <section class="page-hero">
      <h1 data-i18n="newReleases">${t('newReleases')}</h1>
      <p>Fresh concepts, mascot drops and upcoming prototypes.</p>
    </section>
    ${adNative()}
    <div class="grid game-grid">${S.games.filter(g=>g.new).map(gameCard).join('')}</div>
  </main>`;
}

function aboutPage(){
  return `<main id="main" class="container">
    ${adTop()}
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
    ${adSlot('b468x60')}
  </main>`;
}

function leaderboardPage(){
  let top=[...S.games].sort((a,b)=>b.plays-a.plays).slice(0,50);
  let rows=top.map((g,i)=>`<div class="leader-row">
      <div class="rank">#${i+1}</div>
      <div>
        <strong>${g.title}</strong>
        <div class="meta"><span>${g.genre}</span><span>${g.universeName}</span></div>
      </div>
      <div class="hide-sm rating">★ ${g.rating}</div>
      <div class="hide-sm" style="font-weight:800;color:var(--muted)">${g.plays.toLocaleString()} plays</div>
    </div>`);
  if(rows.length>10)rows.splice(10,0,adSlot('b468x60','leader-ad'));
  if(rows.length>26)rows.splice(26,0,adNative());
  return `<main id="main" class="container">
    ${adTop()}
    <section class="page-hero">
      <h1 data-i18n="leaderboards">${t('leaderboards')}</h1>
      <p>Mock leaderboard ready for D1, KV or Durable Objects later.</p>
    </section>
    ${rows.join('')}
  </main>`;
}

function adMapPage(){
  // One live instance of every distinct Adsterra unit used across the site —
  // this page intentionally does NOT call adTop()/adSide()/adNative(), since
  // those reuse the same keys shown explicitly below (no unit repeats here).
  const showcase=[
    ['native','Native Banner','In-feed card that blends with site content. Live on: Home, Games, Universes, Characters, Shop, New Releases, Play, Leaderboards.'],
    ['b728x90','Leaderboard 728×90','Top-of-page banner on desktop screens ≥820px.'],
    ['b320x50','Mobile Banner 320×50','Top-of-page banner on mobile — swaps in automatically for the 728×90 below 820px.'],
    ['b300x250','Medium Rectangle 300×250','Sidebar placement on Home, Game Detail, Play and Product pages.'],
    ['b160x600','Wide Skyscraper 160×600','Sidebar slot next to the filters on the Games page (desktop only).'],
    ['b160x300','Half Banner 160×300','Sidebar slot next to the filters on the Shop page (desktop only).'],
    ['b468x60','Banner 468×60','Slim inline banner on the About page and mid-way down the Leaderboard.']
  ];
  return `<main id="main" class="container">
    <section class="page-hero">
      <h1 data-i18n="adMap">${t('adMap')}</h1>
      <p>Every live Adsterra placement on Mochi Mango Arcade, shown here for reference. Each unit appears at most once per page across the site.</p>
    </section>
    <div class="ad-map-grid">
      ${showcase.map(([unit,title,desc])=>`<div class="ad-map-card">
        <h3>${title}</h3>
        <p>${desc}</p>
        ${adSlot(unit)}
      </div>`).join('')}
      <div class="ad-map-card">
        <h3>Social Bar</h3>
        <p>Site-wide sticky unit loaded once per page load across every page — not tied to a content slot.</p>
        <div class="ad-map-status">✅ Active on this page</div>
      </div>
    </div>
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
  let img = g.image || `/assets/images/games/${g.slug}.jpg`;
  let fb = `this.onerror=null;this.src='/assets/images/games/${g.slug}.svg';this.onerror=function(){this.style.display='none'}`;
  return `<main id="main" class="container">
    ${adTop()}
    <div class="detail-layout">
      <section>
        <div class="detail-card">
          <div class="detail-img"><img src="${img}" alt="${g.title}" onerror="${fb}"></div>
          <h1>${g.title}</h1>
          <p>${g.description}</p>
          <div class="chip-row">
            <span class="chip">${g.genre}</span>
            <span class="chip">${g.universeName}</span>
            <span class="chip">${g.mascot}</span>
            <span class="chip">★ ${g.rating}</span>
          </div>
          <div class="hero-actions">
            ${g.built
              ? `<a class="btn" href="${g.playUrl}">🎮 <span data-i18n="playNow">${t('playNow')}</span></a>`
              : `<span class="btn disabled" aria-disabled="true">🚧 Coming Soon</span>`}
            <a class="btn secondary" href="/shop/">🛍️ <span data-i18n="shopNow">${t('shopNow')}</span></a>
          </div>
          ${g.built ? '' : `<p class="soon-note">This game is in the works — its mascot art is coming to plush, tees and stickers first. Explore the <a href="/games/">playable games</a> meanwhile!</p>`}
        </div>
        ${adNative()}
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

const EXPLICIT_GAME_MODES = new Set([
  'sports', 'racing', 'breakout', 'snake', 'rhythm', 'tower', 'pinball',
  'fishing', 'archery', 'pong', 'bubbleshooter', 'cannon', 'merge', 'helix',
  'doodlejump', 'asteroids', 'pipeline', 'gallery', 'idleclicker', 'flappy',
  'platformer', 'shooter', 'whack', 'match3', 'serve', 'maze', 'memory',
  'stacker', 'dodger', 'runner', 'board',
]);

function engineMode(g) {
  const s = (g.genre + ' ' + g.engine + ' ' + (g.title || '') + ' ' + (g.slug || '')).toLowerCase();
  if (EXPLICIT_GAME_MODES.has(g.engine)) return g.engine;
  if (/(soccer|football|kick|penalty|goal|sport|basketball|hoop|shoot-out|stadium|league|club|team)/.test(s)) return 'sports';
  if (/(racing|racer|driv|kart|speed|grand.prix|circuit|track|\bdrag\b|drift|moto|\bcar\b|vehicle|wheels|race|derby)/.test(s)) return 'racing';
  if (/(breakout|brick|smash|block.blast|blocky|bouncer|paddle|wall.break|brick.break)/.test(s)) return 'breakout';
  if (/(snake|slither|serpent|worm|noodle|crawler|coil|conda)/.test(s)) return 'snake';
  if (/(rhythm|beat|dance|music|tempo|groove|jam|jukebox|drumline|drum|bongo|concert|melody|tune|harmony|band)/.test(s)) return 'rhythm';
  if (/(tower|defense|defence|guard|fortress|castle.defense|wave|siege|bastion|warden)/.test(s)) return 'tower';
  if (/(pinball|flipper|bumper|arcade.ball|plunger|tilt)/.test(s)) return 'pinball';
  if (/(fish|fishing|angle|angler|cast|reel|hook|pond|lake|tide|aquarium|ocean|whale|submarine|deep)/.test(s)) return 'fishing';
  if (/(pong|tennis|paddle|racket|ping.pong|table.tennis)/.test(s)) return 'pong';
  if (/(bubble|pop|shoot.bubble|burst|color.match|balloon)/.test(s)) return 'bubbleshooter';
  if (/(cannon|artillery|launch|projectile|catapult|mortar|howitzer)/.test(s)) return 'cannon';
  if (/(merge|2048|combine|grow|evolve|synthesize|fuse|combine.tile)/.test(s)) return 'merge';
  if (/(helix|spiral|spin|fall|descent|tunnel|vortex|whirl|rotating)/.test(s)) return 'helix';
  if (/(doodle|doodle.jump|bounce.up|spring|jump.climb|vertical.climb|ascend|flap.up)/.test(s)) return 'doodlejump';
  if (/(asteroid|space.shoot|meteor|alien.invader|space.battle|cosmic|shooter.space)/.test(s)) return 'asteroids';
  if (/(pipe|pipeline|connect|plumb|flow|route|tube|pipe.puzzle|water.pipe)/.test(s)) return 'pipeline';
  if (/(gallery|shooting.gallery|shoot.gallery|target.range|aim.bonus|sharpshooter|fair.shoot)/.test(s)) return 'gallery';
  if (/(idle|clicker|tap|farm|mine|earn|incremental|collect|grind|tapper|auto.click)/.test(s)) return 'idleclicker';
  if (/(archery|arrow|bow|target|aim|bullseye|dart|crossbow|sharpshoot|hunter|snipe)/.test(s)) return 'archery';
  if (/(parcel|kite|airlift|balloon|glide|flight|flying|aerial|paraglide|sky-diner|sky diner)/.test(s)) return 'flappy';
  if (/(maze|labyrinth|heist)/.test(s)) return 'maze';
  if (/(memory|mirror|hidden|detective|solitaire|concentration|mooncat|tarot|matching)/.test(s)) return 'memory';
  if (/(\bstack\b|\bfort\b|blanket|pillow|sleepover|snowflake|honey-rescue)/.test(s)) return 'stacker';
  if (/(defen|patrol|survival|boss|arena|shooter|bullet|battler|tactic)/.test(s)) return 'shooter';
  if (/(whack|reaction|coordination|emergency|reflex|cleanup)/.test(s)) return 'whack';
  if (/(match|tile|mahjong|sort|flow|logic|gravity|deduction|slide)/.test(s)) return 'match3';
  if (/(manage|cook|serv|shop|hotel|tavern|farm|sim|cafe|kitchen|bakery|time management|market|salon|dress|diner|restaurant)/.test(s)) return 'serve';
  if (/(platform|jump|hop|bounce|climb|parkour|wall)/.test(s)) return 'platformer';
  if (/(runner|lane|dash|sprint|drift|run)/.test(s)) return 'runner';
  if (g.engine === 'runner') return 'runner';
  if (g.engine === 'puzzle') return 'match3';
  if (g.engine === 'management') return 'serve';
  return 'dodger';
}

const IFRAME_GAMES = [];

function rewardBenefit(g) {
  if (g.slug === 'puddle-pip-meadow-dash') return 'Revive with a guardian shield and keep your score';
  if (g.slug === 'puddles-pancake-panic') return '+20 seconds, full power charge and Golden Rush';
  const mode = engineMode(g);
  if (['match3', 'memory', 'pipeline'].includes(mode)) return '+20 seconds and double score';
  if (mode === 'gallery') return '+10 seconds and double score';
  if (['sports', 'archery'].includes(mode)) return '+3 attempts and a power shield';
  if (mode === 'tower') return '+100 tower coins and one life';
  if (mode === 'idleclicker') return '90 seconds of bonus earnings';
  if (['bubbleshooter', 'cannon'].includes(mode)) return 'Extra shots and double score';
  if (mode === 'serve') return 'Full patience and a Rush Hour boost';
  if (mode === 'racing') return 'Turbo boost and double score';
  if (mode === 'pong') return 'Mega paddle and double score';
  return '+1 life, a 12-second shield and double score';
}

function rewardCard(){return ''}

function playPage(sl){
  let g=S.games.find(x=>x.slug==sl)||S.games[0];
  if(!g.built){
    return `<main id="main" class="container">
      ${adTop()}
      <div class="soon-hero">
        <div class="soon-hero-emoji">🚧</div>
        <h1>${g.title}</h1>
        <p class="soon-hero-tag">Coming Soon</p>
        <p>${g.mascot} is still training for this one. We're polishing the gameplay — check back soon!</p>
        <div class="hero-actions" style="justify-content:center">
          <a class="btn" href="/games/">🎮 Play available games</a>
          <a class="btn secondary" href="${g.detailUrl}">ℹ️ Game details</a>
        </div>
      </div>
    </main>`;
  }
  if(sl==='puddle-pip-meadow-dash'){
    return `<main id="main" class="container">
      ${adTop()}
      <div class="detail-layout">
        <section>
          <div class="play-shell" data-universe="${g.universe}" style="padding:0;overflow:hidden;aspect-ratio:16/9;background:#000;border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.6);border:1.5px solid var(--border-color);">
            <iframe src="game/index.html" style="width:100%;height:100%;border:none;display:block;border-radius:26px;" allow="autoplay"></iframe>
          </div>
          ${rewardCard(g)}
          ${adNative('post-game-ad')}
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
          <div class="play-shell" data-universe="${g.universe}" style="padding:0;overflow:hidden;aspect-ratio:16/9;background:#000;border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.6);border:1.5px solid var(--border-color);">
            <iframe src="game/index.html" style="width:100%;height:100%;border:none;display:block;border-radius:26px;" allow="autoplay"></iframe>
          </div>
          ${rewardCard(g)}
          ${adNative('post-game-ad')}
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
  let modeHints = {
    runner: 'Space / Tap to jump (double-jump!) · hold ↓ to duck the overhead bars · grab coin arcs · ride the Sugar Rush.',
    flappy: 'Tap / Space to flap through the gaps · some pillars drift up & down · thread the ✨ bonus rings.',
    platformer: 'Auto-bounce up · tilt / ← → to steer · springs launch you high, crumbling tiles vanish, dodge spikes.',
    shooter: '← → or drag to move · auto-fire the swarm · dodge enemy fire · take down the boss when it warps in.',
    whack: 'Tap treats the instant they pop up · avoid hazards · nab the golden ⭐ and survive the Frenzy.',
    match3: 'Swap tiles to line up 3+ · make 4 for a Rocket, 5 for a Bomb · chain combos, beat the clock.',
    serve: 'Serve every item on each ticket before patience runs out · fast serves earn bigger tips · brace for Rush Hour.',
    maze: 'Arrows / WASD / swipe to steer · collect every treat · dodge the guards · grab ✨ to fight back.',
    memory: 'Flip two cards to find matching pairs · clear the board before the timer · chain matches for combos · one golden pair hides a bonus power.',
    stacker: 'Tap / Space to drop each block · line it up — overhang is sliced off · nail perfects, build sky-high.',
    dodger: 'Drag or ← → to catch treats & power-ups · dodge the hazards · watch for Treat Storms and golden jackpots.',
    sports: 'Aim with your finger/mouse, release to kick! Beat the goalie, score goals, and chain combos for bonus points!',
    racing: 'Steer with ← → or drag! Collect boost pads 🟡, dodge cones 🔴, and survive as many laps as possible!',
    breakout: 'Move the paddle with ← → or drag! Break all bricks, grab falling power-ups, and clear every level!',
    snake: 'Steer with arrows or swipe! Eat treats to grow, grab power-ups, and don\'t hit yourself or the walls!',
    rhythm: 'Tap when the shrinking circle matches the target ring! Hit PERFECT for combo multipliers!',
    tower: 'Tap empty spots to build towers! Towers auto-fire at enemies. Survive the waves and earn coins for more towers!',
    pinball: 'Hold ← / → or tap left/right side to flip! Keep the ball alive, hit bumpers and targets for big points!',
    fishing: 'Tap to cast! When a fish bites, tap rapidly to reel it in. Different fish = different points!',
    archery: 'Hold to charge power, release to shoot! Hit the bullseye for maximum points. Mind the wind!',
    pong: 'Drag or arrow keys to move your paddle! First to 7 wins. Catch power-ups for multi-ball and mega paddle!',
    bubbleshooter: 'Tap to aim, release to shoot bubbles! Match 3+ same-color bubbles to pop them. Clear the board to advance!',
    cannon: 'Drag back to aim and set power, release to fire! Destroy all targets with limited shots. Watch the wind!',
    merge: 'Swipe or arrow keys to slide tiles! Same tiles merge into bigger numbers. Can you reach 2048?',
    helix: 'Tap left/right to rotate the helix! Guide the ball down through the gaps without falling off!',
    doodlejump: 'Tilt/drag/arrows to move left & right! Bounce on platforms, avoid spikes, grab jetpacks to fly high!',
    asteroids: '← → rotate, ↑ thrust, Space to shoot! Destroy all asteroids before they hit you — they split when shot!',
    pipeline: 'Tap pipe segments to rotate them! Connect the water source to the endpoint before time runs out!',
    gallery: 'Tap targets as they pop up! Hit moving targets for bonus points. Don\'t miss the rare golden ones!',
    idleclicker: 'Tap to earn coins! Buy upgrades and auto-tappers. Unlock milestones and prestige for massive bonuses!'
  };
  let mode = engineMode(g);
  return `<main id="main" class="container">
    ${adTop()}
    <div class="detail-layout">
      <section>
        <h1 class="play-heading">${g.title}</h1>
        <div class="play-shell game-stage-shell" data-universe="${g.universe}">
          <div id="gameStage" class="game-stage" data-slug="${g.slug}"></div>
        </div>
        ${rewardCard(g)}
        ${adNative('post-game-ad')}
        <div class="play-links">
          <a class="btn secondary small" href="${g.detailUrl}">ℹ️ Game details</a>
          <a class="btn secondary small" href="/games/">🎮 More games</a>
          <a class="btn secondary small" href="/shop/">🛍️ ${g.mascot} merch</a>
        </div>
      </section>
      <aside class="side-stack">
        ${adSide()}
        <div class="promo-card">
          <h3>How to play</h3>
          <p>${modeHints[mode] || modeHints.dodger}</p>
          <p style="opacity:.75;font-size:13px;margin-top:8px">Works with keyboard, mouse and touch. Tap 🔊 to toggle sound.</p>
        </div>
        <div class="promo-card">
          <h3>Merch Hook</h3>
          <p>${g.merchHook}</p>
        </div>
      </aside>
    </div>
  </main>`;
}

let activeGame=null,queuedReward=null,arcadeEventsBound=false;
const profileRunStartedAt=new Map(),submittedRewardIds=new Set();

function mountEngine(sl){
  const stage=document.getElementById('gameStage');
  if(!stage)return;
  const g=S.games.find(x=>x.slug===sl)||S.games[0];
  Promise.all([import('/assets/js/mmengine.js'),import('/assets/js/game-quality.js')]).then(([engine,quality])=>{
    try{activeGame=engine.startGame(stage,g)}catch(error){console.error('Primary game runtime failed',error);activeGame=quality.startFallback(stage,g);return}
    setTimeout(()=>{
      const visible=stage.querySelector('canvas,iframe');
      if(!visible){try{activeGame?.destroy?.()}catch{}activeGame=quality.startFallback(stage,g)}
      else activeGame=quality.enhanceShared(stage,g,activeGame)||activeGame;
      if(queuedReward){activeGame?.applyReward?.(queuedReward);queuedReward=null}
    },350);
  }).catch(error=>{
    console.error('Game engine failed to load',error);
    import('/assets/js/game-quality.js').then(quality=>{activeGame=quality.startFallback(stage,g)}).catch(()=>{stage.innerHTML='<div class="empty" style="padding:40px">This game could not load. <a href="'+g.detailUrl+'">View details</a></div>'});
  });
}

function profileEventId(prefix='event'){
  if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

async function syncProfileEvent(endpoint,payload){
  if(localStorage.getItem('mma_profile_active')!=='1')return;
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if(response.status===401)localStorage.removeItem('mma_profile_active');
    if(!response.ok)return;
    const result=await response.json();
    const unlocked=result.newAchievements||[];
    if(unlocked.length){
      const trophy=unlocked[0];
      toast(`🏆 Achievement unlocked: ${trophy.name||'New trophy!'}`);
    }
  }catch(error){/* Profile sync is optional while signed out/offline. */}
}

function beginProfileRun(slug){
  if(slug)profileRunStartedAt.set(slug,performance.now());
}

function finishProfileRun(slug,data={}){
  if(!slug)return;
  const startedAt=profileRunStartedAt.get(slug)??performance.now();
  profileRunStartedAt.delete(slug);
  const score=Math.max(0,Math.min(10_000_000,Math.floor(Number(data.score)||0)));
  const durationMs=Math.max(0,Math.min(21_600_000,Math.floor(performance.now()-startedAt)));
  const game=S.games.find(item=>item.slug===slug);
  syncProfileEvent('/api/profile/events/game',{
    eventId:profileEventId('game'),gameId:slug,score,durationMs,outcome:data.outcome||'loss',
    mode:game?engineMode(game):undefined,
  });
}

function recordProfileReward(slug,data={}){
  if(!slug)return;
  const supplied=typeof data.requestId==='string'&&/^[A-Za-z0-9_-]{8,80}$/.test(data.requestId)?data.requestId:null;
  const eventId=supplied||profileEventId('reward');
  if(submittedRewardIds.has(eventId))return;
  submittedRewardIds.add(eventId);
  syncProfileEvent('/api/profile/events/reward',{
    eventId,gameId:slug,rewardType:'power-up',amount:1,
  });
}

function setRewardPanel(state,message){
  $$('[data-reward-panel]').forEach(panel=>{
    const button=panel.querySelector('[data-reward-ad]'),status=panel.querySelector('.reward-status');
    if(status)status.textContent=message;
    if(button){
      button.disabled=state==='pending'||state==='applied';
      button.textContent=state==='pending'?'Sponsor opened — return to unlock':state==='applied'?'Boost unlocked ✓':'Visit sponsor & unlock';
    }
    panel.dataset.state=state;
  });
}

function bindRewardButtons(){
  $$('[data-reward-ad]').forEach(button=>button.addEventListener('click',()=>{
    const panel=button.closest('[data-reward-panel]');
    const slug=button.dataset.slug||document.body.dataset.slug;
    if(!window.MochiMangoRewards?.request){
      setRewardPanel('blocked','The reward service is still loading. Please try again.');
      return;
    }
    const accepted=window.MochiMangoRewards.request({slug,source:'play-page'});
    if(!accepted)setRewardPanel('blocked','Pop-up blocked. Allow pop-ups, then try again.');
    else if(panel)panel.dataset.state='pending';
  }));
}

function bindArcadeEvents(){
  if(arcadeEventsBound)return;
  arcadeEventsBound=true;
  addEventListener('mma:reward-granted',event=>{
    const slug=document.body.dataset.slug;
    if(event.detail?.slug===slug&&!IFRAME_GAMES.includes(slug)&&!activeGame)queuedReward=event.detail;
    if(IFRAME_GAMES.includes(slug)){
      setRewardPanel('applied','Boost delivered to the game. Have fun!');
    }
  });
  addEventListener('mma:reward-pending',()=>setRewardPanel('pending','Sponsor opened. Return after your visit to unlock the boost.'));
  addEventListener('mma:reward-blocked',event=>{
    const reason=event.detail?.reason;
    const message=reason==='returned-too-quickly'?'Stay on the sponsor page a little longer, then return.':'Reward not opened. Check your pop-up settings and try again.';
    setRewardPanel('blocked',message);
  });
  addEventListener('mma:reward-applied',event=>{
    setRewardPanel('applied',`Unlocked: ${event.detail?.label||'reward boost'}.`);
    toast(`🎁 ${event.detail?.label||'Reward boost unlocked!'}`);
    recordProfileReward(event.detail?.slug||document.body.dataset.slug,event.detail);
  });
  addEventListener('mma:run-started',event=>{
    setRewardPanel('ready','Visit our sponsor, then return to unlock your boost.');
    beginProfileRun(event.detail?.slug);
  });
  addEventListener('mma:game-over',event=>finishProfileRun(event.detail?.slug,event.detail));
  addEventListener('message',event=>{
    const frame=$('.play-shell iframe');
    if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow)return;
    const message=event.data||{};
    const data=message.payload||message.data||{};
    if(message.source!=='mochi-mango-arcade')return;
    const gameSlug=document.body.dataset.slug;
    if(message.event==='gameover'||message.event==='game_end')finishProfileRun(gameSlug,data);
    if(message.event==='start'||message.event==='game_start')beginProfileRun(gameSlug);
    if(message.event==='revive'||message.event==='reward_applied')recordProfileReward(gameSlug,data);
  });
}

function productPage(id){
  let p=S.products.find(x=>x.id==id)||S.products[0],rel=S.products.filter(x=>x.id!=p.id).slice(0,4);
  return `<main id="main" class="container">
    ${adTop()}
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
        ${adNative()}
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
    if(playableOnly)a=a.filter(x=>x.built);
    // always lead with playable games, then apply the chosen sort
    a.sort((x,y)=>{ if(!!y.built!==!!x.built) return (y.built?1:0)-(x.built?1:0); return sort=='popular'? Number(y.featured)-Number(x.featured)||y.id-x.id : x.id-y.id; });
    grid.innerHTML=a.map(gameCard).join('')||'<div class="empty">No games found.</div>';
    let pc=a.filter(x=>x.built).length;
    $('#gameCount').innerHTML=`<b>${pc}</b> playable · ${a.length} shown`;
    tilt();
  }
  let playableOnly=false;
  ['fu','fg','fc'].forEach(id=>$('#'+id).addEventListener('input',run));
  $('#clearGames').onclick=()=>{
    $('#fu').value='';
    $('#fg').value='';
    $('#fc').value='';
    playableOnly=false; const pb=$('#playableToggle'); if(pb)pb.classList.remove('active');
    run();
  };
  $$('[data-sort]').forEach(b=>b.onclick=()=>{
    $$('[data-sort]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    sort=b.dataset.sort;
    run();
  });
  const pt=$('#playableToggle');
  if(pt)pt.onclick=()=>{ playableOnly=!playableOnly; pt.classList.toggle('active',playableOnly); run(); };
  $('#randomGame').onclick=()=>{ let pool=S.games.filter(x=>x.built); location.href=(pool[Math.floor(Math.random()*pool.length)]||S.games[0]).detailUrl; };
  let q=new URLSearchParams(location.search).get('q');
  if(q)$('#fc').value=q;
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
  
  /* Pointer spark disabled for performance and reduced visual noise. */
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

function tilt(){/* Card tilt disabled for stable mobile and keyboard interaction. */}

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
  bindArcadeEvents();
  bindRewardButtons();
  if(p=='play'&&sl&&!IFRAME_GAMES.includes(sl))mountEngine(sl);
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
