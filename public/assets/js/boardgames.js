/**
 * Mochi Mango Board-Game Universe
 *
 * A dependency-free, seeded, solo-vs-AI canvas collection.  The factory is
 * deliberately independent of mmengine.js: the host passes its Base class to
 * createBoardArena(Base), which keeps this module easy to test and reuse.
 */

export const HUMAN = 1;
export const AI = -1;

const VARIANTS = [
  ['chess', 'Crownlight Chess', 'Quick Chess', 8, 8,
    'Move your ivory army, protect your king, and checkmate the moon court. Streamlined Quick Chess: standard movement, check, checkmate, stalemate and queen promotion; castling, en passant and repetition draws are omitted.',
    ['crownlight-chess', 'quick-chess']],
  ['checkers', 'Biscuit Brigade Checkers', 'American Checkers', 8, 8,
    'Move diagonally on dark squares. Captures are mandatory; chain every available jump. Reach the far edge to crown a king. Win by taking or trapping every rival piece.',
    ['biscuit-checkers', 'draughts']],
  ['tic-tac-toe', 'Trio Bloom', 'Three in a Row', 3, 3,
    'Place a blossom and make three in a row. The moon sprite plays a perfect reply, so build a fork!',
    ['trio-bloom', 'noughts-and-crosses', 'tictactoe']],
  ['connect-four', 'Starstack Four', 'Four in a Row', 6, 7,
    'Tap a column to drop a star. Connect four horizontally, vertically or diagonally before the sky keeper.',
    ['starstack-four', 'connect4', 'four-in-a-row']],
  ['reversi', 'Moonflip Garden', 'Disk Flipping', 8, 8,
    'Place a sun disk to bracket moon disks in any direction and flip them. A player with no legal move passes; the fuller garden wins.',
    ['moonflip-garden', 'othello', 'disk-flipping']],
  ['gomoku', 'Petal Five', 'Freestyle Five', 13, 13,
    'Place petals on the intersections. First to form five or more in an unbroken line wins this compact freestyle game.',
    ['petal-five', 'five-in-row', 'five-in-a-row']],
  ['mancala', 'Mango Mancala Market', 'Kalah', 2, 6,
    'Choose one of your six bowls and sow every seed counter-clockwise. Skip the rival store, capture opposite seeds, and earn another turn by landing in your store.',
    ['mango-mancala', 'kalah']],
  ['dots-and-boxes', 'Doodle Paddocks', 'Dots and Boxes', 4, 4,
    'Tap between neighboring dots to draw a fence. Completing a paddock scores it and grants another turn. Claim more than half the paddocks.',
    ['doodle-paddocks', 'dots-boxes']],
  ['nine-mens-morris', 'Lantern Mill', "Nine Men's Morris", 7, 7,
    'Place nine lanterns on marked points; every line of three lets you remove one rival lantern. Then slide along paths. With three lanterns you may fly. Trap or reduce the rival below three.',
    ['lantern-mill', 'morris', 'nine-mens-morris']],
  ['go-9x9', 'Pebble Pond Go', '9x9 Area Go', 9, 9,
    'Surround empty space and capture groups with no liberties. Suicide and repeated positions are forbidden. Tap Pass; two passes score stones plus territory (the moon side receives 6.5 komi).',
    ['pebble-pond-go', '9x9-go', 'go']],
  ['hex', 'Hexbridge Heroes', 'Connection Game', 9, 9,
    'Connect your left and right shores with a chain of sun stones. The moon keeper connects top to bottom. Hex has no draw.',
    ['hexbridge-heroes', 'hex-game']],
  ['treasure-fleet', 'Treasure Fleet Tactics', 'Hidden Fleet', 8, 8,
    'Your fleets are placed automatically on an 8x8 sea. Tap the rival chart to fire one unique shot per turn; sink every ship first. Ships may touch. Streamlined fleet: four ships of lengths 4, 3, 3 and 2.',
    ['battleship', 'treasure-fleet-tactics', 'hidden-fleet']],
  ['codebreaker', 'Codebreaker Crystals', 'Secret Code', 10, 6,
    'Build a four-crystal guess from six colors; duplicates are allowed. Exact and color-only clues appear after submission. Crack the AI keeper\'s code within ten guesses.',
    ['mastermind', 'codebreaker-crystals', 'secret-code']],
  ['snakes-and-ladders', 'Cloudpath Chutes & Charms', '100-Square Race', 10, 10,
    'Tap Roll and race to square 100. Ladders lift you and cloud chutes drift you down once per turn. An overshooting roll stays put; first home wins.',
    ['cloudpath-chutes', 'chutes-and-ladders', 'snakes-ladders']],
  ['backgammon', 'Cozy Backgammon', 'Streamlined Race', 2, 12,
    'Roll two dice, then move ivory checkers toward home. Blocked points hold two rivals; a lone rival is bumped to the bar. Bar pieces re-enter first. Streamlined kid-friendly rules: each die is a separate move, blocked dice skip, exact-or-beyond bearing off is flexible, no doubling cube or gammon scoring, and doubles use two moves.',
    ['cozy-backgammon', 'backgammon-race']],
  ['cross-and-crown', 'Cross-Crown Carnival', 'Streamlined Ludo', 11, 11,
    'Race two pawns against three AI colors. Roll a six to leave the yard; land on a rival to send it home, while starred squares are safe. Reach home exactly. Streamlined: two pawns, no blockades or triple-six penalty.',
    ['ludo', 'cross-crown', 'cross-and-crown-carnival']],
];

export const BOARD_VARIANTS = Object.freeze(Object.fromEntries(VARIANTS.map(([id, title, subtitle, rows, cols, instructions, aliases]) => [id, Object.freeze({
  id, title, subtitle, rows, cols, instructions, aliases: Object.freeze(aliases),
})])));
export const BOARD_VARIANT_IDS = Object.freeze(VARIANTS.map(v => v[0]));

const aliasMap = new Map();
for (const variant of Object.values(BOARD_VARIANTS)) {
  for (const key of [variant.id, variant.title, ...variant.aliases]) aliasMap.set(normalizeKey(key), variant.id);
}

function normalizeKey(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function resolveBoardVariant(game = {}) {
  const candidates = [game.boardVariant, game.slug, game.engine, game.genre, game.title].filter(Boolean).map(normalizeKey);
  for (const candidate of candidates) {
    if (aliasMap.has(candidate)) return BOARD_VARIANTS[aliasMap.get(candidate)];
  }
  for (const candidate of candidates) {
    for (const [alias, id] of aliasMap) if (candidate.includes(alias) || alias.includes(candidate)) return BOARD_VARIANTS[id];
  }
  return BOARD_VARIANTS['tic-tac-toe'];
}

export function hashSeed(value = '') {
  let h = 2166136261 >>> 0;
  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function createSeededRandom(seed = 1) {
  let a = (Number(seed) || 1) >>> 0;
  const random = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.int = n => Math.floor(random() * Math.max(1, n));
  random.pick = values => values[random.int(values.length)];
  return random;
}

const deepClone = value => JSON.parse(JSON.stringify(value));
const idx = (r, c, cols) => r * cols + c;
const rc = (i, cols) => [Math.floor(i / cols), i % cols];
const inBounds = (r, c, rows, cols) => r >= 0 && c >= 0 && r < rows && c < cols;
const other = player => -player;
const owner = value => Math.sign(value || 0);
const DIR8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

export function checkLineWinner(board, rows, cols, need) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const p = board[idx(r, c, cols)]; if (!p) continue;
    for (const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      let n = 1;
      while (n < need && inBounds(r + dr*n, c + dc*n, rows, cols) && board[idx(r + dr*n, c + dc*n, cols)] === p) n++;
      if (n >= need) return p;
    }
  }
  return 0;
}

function makeGridState(id, rows, cols) {
  return { id, board: Array(rows * cols).fill(0), rows, cols, turn: HUMAN, moveCount: 0, winner: 0, draw: false, lastMove: null };
}

const MILL_POINTS = [
  [0,0],[0,3],[0,6],[1,1],[1,3],[1,5],[2,2],[2,3],[2,4],[3,0],[3,1],[3,2],
  [3,4],[3,5],[3,6],[4,2],[4,3],[4,4],[5,1],[5,3],[5,5],[6,0],[6,3],[6,6],
];
const MILL_EDGES = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[9,10],[10,11],[12,13],[13,14],[15,16],[16,17],[18,19],[19,20],[21,22],[22,23],
  [0,9],[9,21],[3,10],[10,18],[6,11],[11,15],[1,4],[4,7],[16,19],[19,22],[8,12],[12,17],[5,13],[13,20],[2,14],[14,23]];
const MILL_LINES = [[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],
  [0,9,21],[3,10,18],[6,11,15],[1,4,7],[16,19,22],[8,12,17],[5,13,20],[2,14,23]];
const MILL_ADJ = Array.from({length:24}, () => []);
for (const [a,b] of MILL_EDGES) { MILL_ADJ[a].push(b); MILL_ADJ[b].push(a); }

function initialChess() {
  const board = Array(64).fill('');
  const back = ['R','N','B','Q','K','B','N','R'];
  for (let c=0;c<8;c++) { board[c]=back[c].toLowerCase(); board[8+c]='p'; board[48+c]='P'; board[56+c]=back[c]; }
  return { id:'chess', board, rows:8, cols:8, turn:HUMAN, moveCount:0, winner:0, draw:false, lastMove:null, check:0 };
}

function initialCheckers() {
  const s=makeGridState('checkers',8,8);
  for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2) s.board[idx(r,c,8)]=-1;
  for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2) s.board[idx(r,c,8)]=1;
  s.forcedFrom=null;s.noProgress=0;return s;
}

function initialReversi(){ const s=makeGridState('reversi',8,8); s.board[27]=-1;s.board[28]=1;s.board[35]=1;s.board[36]=-1;s.passCount=0;return s; }

function initialMancala(){ return {id:'mancala',pits:[4,4,4,4,4,4,0,4,4,4,4,4,4,0],turn:HUMAN,moveCount:0,winner:0,draw:false,lastMove:null}; }

function initialDots(){ return {id:'dots-and-boxes',dotRows:4,dotCols:4,h:Array.from({length:4},()=>Array(3).fill(0)),v:Array.from({length:3},()=>Array(4).fill(0)),boxes:Array.from({length:3},()=>Array(3).fill(0)),scores:{human:0,ai:0},turn:HUMAN,moveCount:0,winner:0,draw:false,lastMove:null}; }

function initialMorris(){ return {id:'nine-mens-morris',board:Array(24).fill(0),placed:{human:0,ai:0},turn:HUMAN,removeBy:0,moveCount:0,winner:0,draw:false,lastMove:null,noProgress:0}; }

function initialGo(){ const s=makeGridState('go-9x9',9,9);s.passCount=0;s.captures={human:0,ai:0};s.history=[boardHash(s.board)];s.komi=6.5;s.finalScore=null;return s; }

function initialFleet(rng){
  const placeFleet=()=>{
    const grid=Array(64).fill(0), ships=[];
    for(const length of [4,3,3,2]){
      let placed=false;
      for(let tries=0;tries<500&&!placed;tries++){
        const horizontal=rng()<0.5, r=rng.int(horizontal?8:9-length), c=rng.int(horizontal?9-length:8);
        const cells=Array.from({length},(_,k)=>idx(r+(horizontal?0:k),c+(horizontal?k:0),8));
        if(cells.every(i=>!grid[i])){ const shipId=ships.length+1; for(const i of cells)grid[i]=shipId;ships.push({length,cells,hits:[]});placed=true; }
      }
    }
    return {grid,ships};
  };
  const enemy=placeFleet(), human=placeFleet();
  return {id:'treasure-fleet',size:8,enemyGrid:enemy.grid,enemyShips:enemy.ships,humanGrid:human.grid,humanShips:human.ships,humanShots:Array(64).fill(0),aiShots:Array(64).fill(0),turn:HUMAN,moveCount:0,winner:0,draw:false,lastMove:null,aiTargets:[]};
}

const CODE_COLORS=['#ff5b91','#ffb829','#29d6ad','#4aa8ff','#9a72ff','#f4f1df'];
function initialCodebreaker(rng){ return {id:'codebreaker',code:Array.from({length:4},()=>rng.int(6)),draft:[null,null,null,null],guesses:[],maxGuesses:10,turn:HUMAN,moveCount:0,winner:0,draw:false,pendingGuess:null,lastMove:null}; }

const SNAKES={98:78,95:56,92:71,87:24,64:42,49:11,36:6};
const LADDERS={2:23,8:30,17:44,28:54,39:63,51:72,62:81,75:96};
function initialSnakes(){return{id:'snakes-and-ladders',positions:{human:1,ai:1},turn:HUMAN,moveCount:0,winner:0,draw:false,lastRoll:0,lastMove:null};}

function initialBackgammon(){
  const points=Array(24).fill(0); points[0]=2;points[11]=5;points[16]=3;points[18]=5;points[23]=-2;points[12]=-5;points[7]=-3;points[5]=-5;
  return{id:'backgammon',points,bar:{human:0,ai:0},off:{human:0,ai:0},turn:HUMAN,dice:[],moveCount:0,winner:0,draw:false,lastMove:null};
}

function initialLudo(){return{id:'cross-and-crown',players:Array.from({length:4},()=>({pawns:[-1,-1]})),current:0,turn:HUMAN,die:null,moveCount:0,winner:0,draw:false,lastMove:null};}

export function createInitialState(variantOrId, seed=1){
  const id=typeof variantOrId==='string'?(BOARD_VARIANTS[variantOrId]?variantOrId:resolveBoardVariant({boardVariant:variantOrId}).id):resolveBoardVariant(variantOrId).id;
  const rng=createSeededRandom(seed);
  switch(id){
    case'chess':return initialChess(); case'checkers':return initialCheckers(); case'tic-tac-toe':return makeGridState(id,3,3);
    case'connect-four':return makeGridState(id,6,7); case'reversi':return initialReversi(); case'gomoku':return makeGridState(id,13,13);
    case'mancala':return initialMancala(); case'dots-and-boxes':return initialDots(); case'nine-mens-morris':return initialMorris();
    case'go-9x9':return initialGo(); case'hex':return makeGridState(id,9,9); case'treasure-fleet':return initialFleet(rng);
    case'codebreaker':return initialCodebreaker(rng); case'snakes-and-ladders':return initialSnakes(); case'backgammon':return initialBackgammon();
    case'cross-and-crown':return initialLudo(); default:return makeGridState('tic-tac-toe',3,3);
  }
}

/* -------------------------------------------------------------------------- */
/* Pure rules: grid, capture, connection, chess and checkers                   */

function placementMoves(state){ const out=[];for(let i=0;i<state.board.length;i++)if(!state.board[i])out.push({cell:i});return out; }

function connectMoves(state){
  const out=[];for(let c=0;c<state.cols;c++)if(!state.board[c])out.push({col:c});return out;
}

function reversiFlips(board,cell,player){
  if(board[cell])return[];const [r,c]=rc(cell,8),flips=[];
  for(const[dr,dc]of DIR8){const line=[];let rr=r+dr,cc=c+dc;while(inBounds(rr,cc,8,8)&&board[idx(rr,cc,8)]===other(player)){line.push(idx(rr,cc,8));rr+=dr;cc+=dc;}
    if(line.length&&inBounds(rr,cc,8,8)&&board[idx(rr,cc,8)]===player)flips.push(...line);
  }return flips;
}
function reversiMoves(state,player=state.turn){const out=[];for(let i=0;i<64;i++){const flips=reversiFlips(state.board,i,player);if(flips.length)out.push({cell:i,flips});}return out;}

function checkerCapturesFrom(state,from,player){
  const piece=state.board[from], [r,c]=rc(from,8), dirs=Math.abs(piece)===2?[-1,1]:(player===HUMAN?[-1]:[1]),out=[];
  for(const dr of dirs)for(const dc of[-1,1]){const mr=r+dr,mc=c+dc,tr=r+dr*2,tc=c+dc*2;if(inBounds(tr,tc,8,8)&&owner(state.board[idx(mr,mc,8)])===other(player)&&!state.board[idx(tr,tc,8)])out.push({from,to:idx(tr,tc,8),capture:idx(mr,mc,8)});}
  return out;
}
function checkersMoves(state,player=state.turn){
  if(state.forcedFrom!=null)return checkerCapturesFrom(state,state.forcedFrom,player);
  const captures=[];for(let i=0;i<64;i++)if(owner(state.board[i])===player)captures.push(...checkerCapturesFrom(state,i,player));if(captures.length)return captures;
  const out=[];for(let from=0;from<64;from++){const piece=state.board[from];if(owner(piece)!==player)continue;const[r,c]=rc(from,8),dirs=Math.abs(piece)===2?[-1,1]:(player===HUMAN?[-1]:[1]);for(const dr of dirs)for(const dc of[-1,1]){const rr=r+dr,cc=c+dc;if(inBounds(rr,cc,8,8)&&!state.board[idx(rr,cc,8)])out.push({from,to:idx(rr,cc,8)});}}return out;
}

const KNIGHT=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
function chessRawFrom(board,from,attacksOnly=false){
  const piece=board[from];if(!piece)return[];const player=piece===piece.toUpperCase()?HUMAN:AI,type=piece.toLowerCase(),[r,c]=rc(from,8),moves=[];
  const add=(rr,cc)=>{if(!inBounds(rr,cc,8,8))return false;const target=board[idx(rr,cc,8)],targetOwner=target?(target===target.toUpperCase()?HUMAN:AI):0;if(targetOwner!==player)moves.push({from,to:idx(rr,cc,8)});return!target;};
  if(type==='p'){
    const dr=player===HUMAN?-1:1;
    if(attacksOnly){for(const dc of[-1,1])if(inBounds(r+dr,c+dc,8,8))moves.push({from,to:idx(r+dr,c+dc,8)});}
    else{
      if(inBounds(r+dr,c,8,8)&&!board[idx(r+dr,c,8)]){moves.push({from,to:idx(r+dr,c,8)});const start=player===HUMAN?6:1;if(r===start&&!board[idx(r+dr*2,c,8)])moves.push({from,to:idx(r+dr*2,c,8)});}
      for(const dc of[-1,1])if(inBounds(r+dr,c+dc,8,8)){const target=board[idx(r+dr,c+dc,8)];if(target&&ownerChess(target)===other(player))moves.push({from,to:idx(r+dr,c+dc,8)});}
    }
  }else if(type==='n'){for(const[dr,dc]of KNIGHT)add(r+dr,c+dc);}
  else if(type==='k'){for(const[dr,dc]of DIR8)add(r+dr,c+dc);}
  else{
    const dirs=type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;while(inBounds(rr,cc,8,8)){if(!add(rr,cc))break;rr+=dr;cc+=dc;}}
  }
  return moves;
}
function ownerChess(piece){return!piece?0:piece===piece.toUpperCase()?HUMAN:AI;}
function chessAttacked(board,square,byPlayer){
  for(let i=0;i<64;i++)if(ownerChess(board[i])===byPlayer&&chessRawFrom(board,i,true).some(m=>m.to===square))return true;return false;
}
function chessInCheck(board,player){const king=board.findIndex(p=>p===(player===HUMAN?'K':'k'));return king<0||chessAttacked(board,king,other(player));}
function chessMoves(state,player=state.turn){
  const out=[];for(let i=0;i<64;i++)if(ownerChess(state.board[i])===player)for(const move of chessRawFrom(state.board,i)){
    const target=state.board[move.to];if(target&&target.toLowerCase()==='k')continue;
    const board=state.board.slice();board[move.to]=board[move.from];board[move.from]='';if(!chessInCheck(board,player))out.push(move);
  }return out;
}

function boardHash(board){return board.join(',');}
function orthNeighbors(cell,size){const[r,c]=rc(cell,size),out=[];for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]])if(inBounds(r+dr,c+dc,size,size))out.push(idx(r+dr,c+dc,size));return out;}
function goGroup(board,start,size=9){
  const color=board[start],stones=[],libs=new Set(),seen=new Set([start]),stack=[start];while(stack.length){const at=stack.pop();stones.push(at);for(const n of orthNeighbors(at,size)){if(!board[n])libs.add(n);else if(board[n]===color&&!seen.has(n)){seen.add(n);stack.push(n);}}}return{stones,liberties:[...libs]};
}
function simulateGo(state,cell,player){
  if(cell==null)return{board:state.board.slice(),captured:0,hash:boardHash(state.board)};if(state.board[cell])return null;
  const board=state.board.slice();board[cell]=player;let captured=0;
  for(const n of orthNeighbors(cell,9))if(board[n]===other(player)){const g=goGroup(board,n);if(!g.liberties.length){for(const s of g.stones)board[s]=0;captured+=g.stones.length;}}
  if(!goGroup(board,cell).liberties.length)return null;const hash=boardHash(board);if((state.history||[]).includes(hash))return null;return{board,captured,hash};
}
function goMoves(state,player=state.turn){const out=[];for(let i=0;i<81;i++){const result=simulateGo(state,i,player);if(result)out.push({cell:i,captured:result.captured});}out.push({pass:true});return out;}

function hexWinner(board,size=9){
  const search=(player,starts,isGoal)=>{const seen=new Set(starts.filter(i=>board[i]===player)),stack=[...seen];while(stack.length){const at=stack.pop();if(isGoal(at))return true;const[r,c]=rc(at,size);for(const[dr,dc]of[[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0]]){const rr=r+dr,cc=c+dc,n=idx(rr,cc,size);if(inBounds(rr,cc,size,size)&&board[n]===player&&!seen.has(n)){seen.add(n);stack.push(n);}}}return false;};
  if(search(HUMAN,Array.from({length:size},(_,r)=>idx(r,0,size)),i=>i%size===size-1))return HUMAN;
  if(search(AI,Array.from({length:size},(_,c)=>c),i=>Math.floor(i/size)===size-1))return AI;return 0;
}

function millAt(board,point,player){return MILL_LINES.some(line=>line.includes(point)&&line.every(i=>board[i]===player));}
function morrisMoves(state,player=state.turn){
  if(state.removeBy===player){const enemy=other(player),all=[];for(let i=0;i<24;i++)if(state.board[i]===enemy)all.push(i);let removable=all.filter(i=>!millAt(state.board,i,enemy));if(!removable.length)removable=all;return removable.map(remove=>({remove}));}
  const key=player===HUMAN?'human':'ai';if(state.placed[key]<9){const out=[];for(let i=0;i<24;i++)if(!state.board[i])out.push({to:i,place:true});return out;}
  const pieces=state.board.filter(v=>v===player).length,fly=pieces===3,out=[];for(let from=0;from<24;from++)if(state.board[from]===player){const targets=fly?state.board.map((v,i)=>v?null:i).filter(i=>i!=null):MILL_ADJ[from].filter(i=>!state.board[i]);for(const to of targets)out.push({from,to,fly});}return out;
}

export function legalMovesFor(state, variantId=state.id, player=state.turn){
  if(!state||state.winner||state.draw)return[];switch(variantId){
    case'tic-tac-toe':case'gomoku':case'hex':return placementMoves(state);
    case'connect-four':return connectMoves(state);case'reversi':return reversiMoves(state,player);case'checkers':return checkersMoves(state,player);
    case'chess':return chessMoves(state,player);case'go-9x9':return goMoves(state,player);case'nine-mens-morris':return morrisMoves(state,player);
    case'mancala':return mancalaMoves(state,player);case'dots-and-boxes':return dotsMoves(state);case'treasure-fleet':return fleetMoves(state,player);
    case'snakes-and-ladders':return[{roll:true}];case'backgammon':return backgammonMoves(state,player);case'cross-and-crown':return ludoMoves(state);
    default:return[];
  }
}

function scoreGo(board){
  let human=board.filter(v=>v===HUMAN).length,ai=board.filter(v=>v===AI).length+6.5;const seen=new Set();for(let i=0;i<81;i++)if(!board[i]&&!seen.has(i)){
    const area=[],border=new Set(),stack=[i];seen.add(i);while(stack.length){const at=stack.pop();area.push(at);for(const n of orthNeighbors(at,9)){if(!board[n]&&!seen.has(n)){seen.add(n);stack.push(n);}else if(board[n])border.add(board[n]);}}
    if(border.size===1){if([...border][0]===HUMAN)human+=area.length;else ai+=area.length;}
  }return{human,ai,winner:human>ai?HUMAN:AI};
}

function finishGrid(state,need){const w=checkLineWinner(state.board,state.rows,state.cols,need);if(w)state.winner=w;else if(state.board.every(Boolean))state.draw=true;}

function applyCoreMove(state,id,move,rng){
  const next=deepClone(state),player=state.turn;next.lastMove=deepClone(move);next.moveCount=(next.moveCount||0)+1;
  if(id==='tic-tac-toe'||id==='gomoku'||id==='hex'){
    if(!Number.isInteger(move.cell)||next.board[move.cell])return state;next.board[move.cell]=player;
    if(id==='hex'){next.winner=hexWinner(next.board,9);}else finishGrid(next,id==='tic-tac-toe'?3:5);if(!next.winner&&!next.draw)next.turn=other(player);return next;
  }
  if(id==='connect-four'){
    if(!Number.isInteger(move.col)||move.col<0||move.col>=7)return state;let row=-1;for(let r=5;r>=0;r--)if(!next.board[idx(r,move.col,7)]){row=r;break;}if(row<0)return state;move={...move,cell:idx(row,move.col,7)};next.lastMove=move;next.board[move.cell]=player;finishGrid(next,4);if(!next.winner&&!next.draw)next.turn=other(player);return next;
  }
  if(id==='reversi'){
    const flips=reversiFlips(next.board,move.cell,player);if(!flips.length)return state;next.board[move.cell]=player;for(const i of flips)next.board[i]=player;next.turn=other(player);
    if(!reversiMoves(next,next.turn).length){next.passCount=(next.passCount||0)+1;next.turn=player;}else next.passCount=0;
    if(!reversiMoves(next,HUMAN).length&&!reversiMoves(next,AI).length||next.board.every(Boolean)){const h=next.board.filter(v=>v===HUMAN).length,a=next.board.filter(v=>v===AI).length;next.winner=h===a?0:h>a?HUMAN:AI;next.draw=h===a;}
    return next;
  }
  if(id==='checkers'){
    if(next.board[move.from]==null||!next.board[move.from]||next.board[move.to])return state;let piece=next.board[move.from];next.board[move.from]=0;next.board[move.to]=piece;if(move.capture!=null)next.board[move.capture]=0;
    const[row]=rc(move.to,8);if(piece===HUMAN&&row===0)next.board[move.to]=2;if(piece===AI&&row===7)next.board[move.to]=-2;
    next.forcedFrom=null;if(move.capture!=null&&Math.abs(piece)===Math.abs(next.board[move.to])){const more=checkerCapturesFrom(next,move.to,player);if(more.length)next.forcedFrom=move.to;}
    next.noProgress=move.capture!=null?0:(next.noProgress||0)+1;if(next.forcedFrom==null){next.turn=other(player);const foe=other(player);if(!next.board.some(v=>owner(v)===foe)||!checkersMoves(next,foe).length)next.winner=player;else if(next.noProgress>=80)next.draw=true;}return next;
  }
  if(id==='chess'){
    const piece=next.board[move.from];if(!piece)return state;next.board[move.from]='';next.board[move.to]=piece;const[row]=rc(move.to,8);if(piece==='P'&&row===0)next.board[move.to]='Q';if(piece==='p'&&row===7)next.board[move.to]='q';next.turn=other(player);next.check=chessInCheck(next.board,next.turn)?next.turn:0;
    const replies=chessMoves(next,next.turn);if(!replies.length){if(next.check)next.winner=player;else next.draw=true;}return next;
  }
  if(id==='go-9x9'){
    if(move.pass){next.passCount=(next.passCount||0)+1;if(next.passCount>=2){next.finalScore=scoreGo(next.board);next.winner=next.finalScore.winner;}else next.turn=other(player);return next;}
    const sim=simulateGo(next,move.cell,player);if(!sim)return state;next.board=sim.board;next.history=[...(next.history||[]),sim.hash].slice(-180);const k=player===HUMAN?'human':'ai';next.captures[k]+=sim.captured;next.passCount=0;next.turn=other(player);return next;
  }
  if(id==='nine-mens-morris'){
    if(move.remove!=null&&next.removeBy===player){next.board[move.remove]=0;next.removeBy=0;next.turn=other(player);next.noProgress=0;}
    else{if(move.place){next.board[move.to]=player;next.placed[player===HUMAN?'human':'ai']++;}else{next.board[move.from]=0;next.board[move.to]=player;}if(millAt(next.board,move.to,player))next.removeBy=player;else next.turn=other(player);next.noProgress++;}
    const placementDone=next.placed.human>=9&&next.placed.ai>=9;if(placementDone&&!next.removeBy){const foe=next.turn,foeCount=next.board.filter(v=>v===foe).length;if(foeCount<3||!morrisMoves(next,foe).length)next.winner=other(foe);else if(next.noProgress>=100)next.draw=true;}return next;
  }
  return state;
}

/* -------------------------------------------------------------------------- */
/* Pure rules: sowing, edges, hidden information and race games               */

function mancalaMoves(state,player=state.turn){const range=player===HUMAN?[0,1,2,3,4,5]:[7,8,9,10,11,12];return range.filter(pit=>state.pits[pit]>0).map(pit=>({pit}));}
function applyMancala(state,move){
  const next=deepClone(state),player=state.turn,pit=move.pit;if(!mancalaMoves(state,player).some(m=>m.pit===pit))return state;let stones=next.pits[pit];next.pits[pit]=0;let at=pit;
  while(stones>0){at=(at+1)%14;if(player===HUMAN&&at===13||player===AI&&at===6)continue;next.pits[at]++;stones--;}
  const ownPit=player===HUMAN?at>=0&&at<=5:at>=7&&at<=12;if(ownPit&&next.pits[at]===1){const opposite=12-at;if(next.pits[opposite]>0){const store=player===HUMAN?6:13;next.pits[store]+=next.pits[opposite]+1;next.pits[opposite]=0;next.pits[at]=0;next.lastCapture=opposite;}}
  next.lastMove={pit,landing:at};next.moveCount++;const humanEmpty=next.pits.slice(0,6).every(v=>v===0),aiEmpty=next.pits.slice(7,13).every(v=>v===0);
  if(humanEmpty||aiEmpty){next.pits[6]+=next.pits.slice(0,6).reduce((a,b)=>a+b,0);next.pits[13]+=next.pits.slice(7,13).reduce((a,b)=>a+b,0);for(let i=0;i<6;i++)next.pits[i]=0;for(let i=7;i<13;i++)next.pits[i]=0;next.winner=next.pits[6]===next.pits[13]?0:next.pits[6]>next.pits[13]?HUMAN:AI;next.draw=next.pits[6]===next.pits[13];}
  else{const ownStore=player===HUMAN?6:13;if(at!==ownStore)next.turn=other(player);else next.extraTurn=true;}return next;
}

function dotsMoves(state){const out=[];for(let r=0;r<state.dotRows;r++)for(let c=0;c<state.dotCols-1;c++)if(!state.h[r][c])out.push({axis:'h',r,c});for(let r=0;r<state.dotRows-1;r++)for(let c=0;c<state.dotCols;c++)if(!state.v[r][c])out.push({axis:'v',r,c});return out;}
function boxComplete(s,r,c){return s.h[r][c]&&s.h[r+1][c]&&s.v[r][c]&&s.v[r][c+1];}
function applyDots(state,move){
  const next=deepClone(state);if(!dotsMoves(state).some(m=>m.axis===move.axis&&m.r===move.r&&m.c===move.c))return state;next[move.axis][move.r][move.c]=state.turn;let made=0;
  const candidates=move.axis==='h'?[[move.r-1,move.c],[move.r,move.c]]:[[move.r,move.c-1],[move.r,move.c]];for(const[r,c]of candidates)if(r>=0&&c>=0&&r<3&&c<3&&!next.boxes[r][c]&&boxComplete(next,r,c)){next.boxes[r][c]=state.turn;made++;}
  const key=state.turn===HUMAN?'human':'ai';next.scores[key]+=made;next.lastMove={...move,boxes:made};next.moveCount++;if(!made)next.turn=other(state.turn);else next.extraTurn=true;
  if(!dotsMoves(next).length){next.winner=next.scores.human===next.scores.ai?0:next.scores.human>next.scores.ai?HUMAN:AI;next.draw=next.scores.human===next.scores.ai;}return next;
}

function fleetMoves(state,player=state.turn){const shots=player===HUMAN?state.humanShots:state.aiShots;const out=[];for(let i=0;i<shots.length;i++)if(!shots[i])out.push({cell:i});return out;}
function applyFleet(state,move){
  const next=deepClone(state),player=state.turn,shots=player===HUMAN?next.humanShots:next.aiShots,grid=player===HUMAN?next.enemyGrid:next.humanGrid,ships=player===HUMAN?next.enemyShips:next.humanShips;
  if(!Number.isInteger(move.cell)||shots[move.cell])return state;const shipId=grid[move.cell];shots[move.cell]=shipId?2:1;let sunk=false;if(shipId){const ship=ships[shipId-1];if(!ship.hits.includes(move.cell))ship.hits.push(move.cell);sunk=ship.hits.length===ship.cells.length;}
  next.lastMove={cell:move.cell,hit:!!shipId,sunk};next.moveCount++;if(ships.every(s=>s.hits.length===s.cells.length))next.winner=player;else next.turn=other(player);return next;
}

export function scoreCodeGuess(code,guess){
  let exact=0;const codeRest=[],guessRest=[];for(let i=0;i<code.length;i++){if(code[i]===guess[i])exact++;else{codeRest.push(code[i]);guessRest.push(guess[i]);}}
  const counts=new Map();for(const value of codeRest)counts.set(value,(counts.get(value)||0)+1);let color=0;for(const value of guessRest)if(counts.get(value)>0){color++;counts.set(value,counts.get(value)-1);}return{exact,color};
}
function applyCodebreaker(state,move){
  const next=deepClone(state);if(state.turn===HUMAN&&move.type==='set'&&Number.isInteger(move.color)&&move.color>=0&&move.color<6){let slot=Number.isInteger(move.slot)?move.slot:next.draft.findIndex(v=>v==null);if(slot<0)slot=3;if(slot>=0&&slot<4)next.draft[slot]=move.color;next.lastMove={type:'set',slot,color:move.color};return next;}
  if(state.turn===HUMAN&&move.type==='clear'){const slot=Number.isInteger(move.slot)?move.slot:next.draft.map(v=>v!=null).lastIndexOf(true);if(slot>=0)next.draft[slot]=null;return next;}
  if(state.turn===HUMAN&&move.type==='submit'&&next.draft.every(v=>v!=null)){next.pendingGuess=next.draft.slice();next.turn=AI;next.lastMove={type:'submit'};return next;}
  if(state.turn===AI&&move.type==='resolve'&&next.pendingGuess){const clue=scoreCodeGuess(next.code,next.pendingGuess);next.guesses.push({colors:next.pendingGuess.slice(),...clue});next.moveCount++;next.draft=[null,null,null,null];next.pendingGuess=null;if(clue.exact===4)next.winner=HUMAN;else if(next.guesses.length>=next.maxGuesses)next.winner=AI;else next.turn=HUMAN;next.lastMove={type:'clue',...clue};return next;}return state;
}

function applySnakes(state,move,rng){
  const next=deepClone(state),roll=Math.max(1,Math.min(6,Number(move.rollValue)||1+rng.int(6))),key=state.turn===HUMAN?'human':'ai',from=next.positions[key];let to=from+roll;if(to>100)to=from;else to=LADDERS[to]||SNAKES[to]||to;next.positions[key]=to;next.lastRoll=roll;next.lastMove={from,to,roll,transport:to!==from+roll};next.moveCount++;if(to===100)next.winner=state.turn;else next.turn=other(state.turn);return next;
}

function bgKey(player){return player===HUMAN?'human':'ai';}
function bgAllHome(state,player){const key=bgKey(player);if(state.bar[key])return false;for(let i=0;i<24;i++)if(owner(state.points[i])===player){if(player===HUMAN&&i<18||player===AI&&i>5)return false;}return true;}
function bgOpen(points,to,player){return to>=0&&to<24&&!(owner(points[to])===other(player)&&Math.abs(points[to])>=2);}
function backgammonMoves(state,player=state.turn){
  if(!state.dice.length)return[{roll:true}];const key=bgKey(player),out=[];
  for(let di=0;di<state.dice.length;di++){const die=state.dice[di];if(state.bar[key]>0){const to=player===HUMAN?die-1:24-die;if(bgOpen(state.points,to,player))out.push({from:'bar',to,dieIndex:di,die});continue;}
    for(let from=0;from<24;from++)if(owner(state.points[from])===player){const to=from+player*die;if(bgOpen(state.points,to,player))out.push({from,to,dieIndex:di,die});else if((to>23&&player===HUMAN||to<0&&player===AI)&&bgAllHome(state,player))out.push({from,to:'off',dieIndex:di,die});}
  }return out;
}
function applyBackgammon(state,move,rng){
  const next=deepClone(state),player=state.turn,key=bgKey(player),foeKey=bgKey(other(player));if(move.roll){if(next.dice.length)return state;const forced=Array.isArray(move.dice)&&move.dice.length===2?move.dice.map(v=>Math.max(1,Math.min(6,Math.floor(v)))):null,a=forced?forced[0]:1+rng.int(6),b=forced?forced[1]:1+rng.int(6);next.dice=a===b?[a,a]:[a,b];next.lastMove={roll:next.dice.slice()};if(!backgammonMoves(next,player).some(m=>!m.roll)){next.dice=[];next.turn=other(player);}return next;}
  const legal=backgammonMoves(state,player).find(m=>m.from===move.from&&m.to===move.to&&(move.dieIndex==null||m.dieIndex===move.dieIndex));if(!legal)return state;
  if(legal.from==='bar')next.bar[key]--;else{next.points[legal.from]-=player;if(!next.points[legal.from])next.points[legal.from]=0;}
  if(legal.to==='off')next.off[key]++;else{if(owner(next.points[legal.to])===other(player)&&Math.abs(next.points[legal.to])===1){next.points[legal.to]=0;next.bar[foeKey]++;}next.points[legal.to]+=player;}
  next.dice.splice(legal.dieIndex,1);next.lastMove=legal;next.moveCount++;if(next.off[key]>=15)next.winner=player;else if(!next.dice.length||!backgammonMoves(next,player).some(m=>!m.roll)){next.dice=[];next.turn=other(player);}return next;
}

const LUDO_START=[0,10,20,30],LUDO_SAFE=new Set([0,10,20,30]);
function ludoMoves(state){
  if(state.die==null)return[{roll:true}];const p=state.players[state.current],out=[];for(let token=0;token<p.pawns.length;token++){const at=p.pawns[token];if(at<0){if(state.die===6)out.push({token,to:0});}else if(at<44&&at+state.die<=44)out.push({token,to:at+state.die});}if(!out.length)out.push({pass:true});return out;
}
function ludoPhysical(player,progress){return progress>=0&&progress<40?(progress+LUDO_START[player])%40:null;}
function advanceLudoTurn(next,keep=false){if(!keep)next.current=(next.current+1)%4;next.turn=next.current===0?HUMAN:AI;next.die=null;}
function applyLudo(state,move,rng){
  const next=deepClone(state);if(move.roll){if(next.die!=null)return state;next.die=Math.max(1,Math.min(6,Number(move.rollValue)||1+rng.int(6)));next.lastMove={roll:next.die,player:next.current};if(ludoMoves(next).every(m=>m.pass)){const six=next.die===6;advanceLudoTurn(next,six);}return next;}
  if(move.pass){const six=next.die===6;advanceLudoTurn(next,six);return next;}const legal=ludoMoves(state).find(m=>m.token===move.token);if(!legal)return state;const die=next.die,player=next.current;next.players[player].pawns[move.token]=legal.to;const physical=ludoPhysical(player,legal.to);let captures=0;
  if(physical!=null&&!LUDO_SAFE.has(physical))for(let p=0;p<4;p++)if(p!==player)for(let t=0;t<2;t++)if(ludoPhysical(p,next.players[p].pawns[t])===physical){next.players[p].pawns[t]=-1;captures++;}
  next.lastMove={player,token:move.token,to:legal.to,roll:die,captures};next.moveCount++;if(next.players[player].pawns.every(v=>v===44))next.winner=player===0?HUMAN:AI;else advanceLudoTurn(next,die===6);return next;
}

function sameMove(a,b){return ['cell','col','from','to','capture','pit','axis','r','c','remove','place','token','pass','roll'].every(k=>a[k]===b[k]||a[k]==null&&b[k]==null);}

export function applyRuleMove(state,variantId=state.id,move={},random=createSeededRandom(1)){
  if(!state||state.winner||state.draw)return state;const id=BOARD_VARIANTS[variantId]?variantId:state.id;
  if(id==='codebreaker')return applyCodebreaker(state,move);
  const legal=legalMovesFor(state,id,id==='cross-and-crown'?state.turn:state.turn);if(!legal.some(m=>sameMove(m,move))&&id!=='snakes-and-ladders')return state;
  if(['chess','checkers','tic-tac-toe','connect-four','reversi','gomoku','nine-mens-morris','go-9x9','hex'].includes(id))return applyCoreMove(state,id,move,random);
  if(id==='mancala')return applyMancala(state,move);if(id==='dots-and-boxes')return applyDots(state,move);if(id==='treasure-fleet')return applyFleet(state,move);
  if(id==='snakes-and-ladders')return applySnakes(state,move,random);if(id==='backgammon')return applyBackgammon(state,move,random);if(id==='cross-and-crown')return applyLudo(state,move,random);return state;
}

export function evaluateTerminal(state){
  if(!state)return{terminal:false,winner:0,draw:false};let score=state.finalScore||state.scores;if(state.id==='mancala')score={human:state.pits[6],ai:state.pits[13]};return{terminal:!!state.winner||!!state.draw,winner:state.winner||0,draw:!!state.draw,score};
}

/* -------------------------------------------------------------------------- */
/* Deterministic, legal-move-only AI                                           */

function bestBy(moves,score,rng){let best=-Infinity,ties=[];for(const move of moves){const value=score(move);if(value>best+1e-9){best=value;ties=[move];}else if(Math.abs(value-best)<1e-9)ties.push(move);}return ties.length?ties[rng.int(ties.length)]:null;}
function wouldWin(state,id,move,player){const probe=deepClone(state);probe.turn=player;const result=applyRuleMove(probe,id,move,createSeededRandom(7));return result.winner===player;}

function tttMinimax(board,turn,depth=0){const w=checkLineWinner(board,3,3,3);if(w)return w===AI?10-depth:depth-10;if(board.every(Boolean))return 0;let best=turn===AI?-99:99;for(let i=0;i<9;i++)if(!board[i]){board[i]=turn;const v=tttMinimax(board,other(turn),depth+1);board[i]=0;best=turn===AI?Math.max(best,v):Math.min(best,v);}return best;}
function chooseTtt(state,rng){return bestBy(placementMoves(state),m=>{const board=state.board.slice();board[m.cell]=AI;return tttMinimax(board,HUMAN,1)+(m.cell===4?.1:0);},rng);}

function linePotential(board,cell,player,rows,cols,need){
  const[r,c]=rc(cell,cols);let score=0;for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){let own=1,open=0;for(const sign of[-1,1]){for(let k=1;k<need;k++){const rr=r+dr*k*sign,cc=c+dc*k*sign;if(!inBounds(rr,cc,rows,cols))break;const v=board[idx(rr,cc,cols)];if(v===player)own++;else{if(!v)open++;break;}}}score=Math.max(score,own*own*8+open*3);}return score;
}
function choosePlacementAI(state,id,rng){
  let moves=legalMovesFor(state,id,AI);if(id==='gomoku'&&state.board.some(Boolean)){const occupied=state.board.map((v,i)=>v?i:-1).filter(i=>i>=0);moves=moves.filter(m=>{const[r,c]=rc(m.cell,state.cols);return occupied.some(i=>{const[rr,cc]=rc(i,state.cols);return Math.max(Math.abs(r-rr),Math.abs(c-cc))<=2;});});}
  for(const move of moves)if(wouldWin(state,id,move,AI))return move;for(const move of moves)if(wouldWin(state,id,move,HUMAN))return move;
  return bestBy(moves,move=>{const cell=id==='connect-four'?(()=>{for(let r=state.rows-1;r>=0;r--)if(!state.board[idx(r,move.col,state.cols)])return idx(r,move.col,state.cols);return 0;})():move.cell;
    const board=state.board.slice();board[cell]=AI;const center=(state.cols-1)/2,cc=cell%state.cols;if(id==='hex'){const won=hexWinner(board,9)===AI?1e6:0;let near=0;for(const n of orthNeighbors(cell,9))if(board[n]===AI)near+=12;return won+near-Math.abs(cc-center);}
    return linePotential(board,cell,AI,state.rows,state.cols,id==='gomoku'?5:4)+linePotential(board,cell,HUMAN,state.rows,state.cols,id==='gomoku'?5:4)*.9-Math.abs(cc-center)*2;},rng);
}

function chooseChess(state,rng){const value={p:100,n:320,b:330,r:500,q:900,k:20000};return bestBy(chessMoves(state,AI),m=>{const target=state.board[m.to],piece=state.board[m.from].toLowerCase(),[r,c]=rc(m.to,8);let s=(target?value[target.toLowerCase()]:0)-value[piece]*.02+(3.5-Math.abs(c-3.5))*3+(r-3.5)*2;const n=applyCoreMove(state,'chess',m,rng);if(n.winner===AI)s+=1e6;if(n.check===HUMAN)s+=45;return s;},rng);}
function chooseCheckers(state,rng){return bestBy(checkersMoves(state,AI),m=>{const piece=state.board[m.from],[r]=rc(m.to,8);let s=m.capture!=null?200:0;if(Math.abs(piece)===1&&r===7)s+=160;if(Math.abs(piece)===2)s+=30;s+=r*4;const n=applyCoreMove(state,'checkers',m,rng);if(n.winner===AI)s+=1e6;return s;},rng);}
function chooseReversi(state,rng){const corners=new Set([0,7,56,63]),bad=new Set([1,6,8,9,14,15,48,49,54,55,57,62]);return bestBy(reversiMoves(state,AI),m=>(corners.has(m.cell)?500:0)-(bad.has(m.cell)?120:0)+m.flips.length*8-reversiMoves(applyCoreMove(state,'reversi',m,rng),HUMAN).length*2,rng);}
function chooseMancala(state,rng){return bestBy(mancalaMoves(state,AI),m=>{const n=applyMancala(state,m);return(n.pits[13]-state.pits[13])*25+(n.turn===AI?35:0)-(n.pits[6]-state.pits[6])*10+(n.winner===AI?1e5:0);},rng);}
function edgeRisk(state,move){const probe=deepClone(state);probe[move.axis][move.r][move.c]=AI;const candidates=move.axis==='h'?[[move.r-1,move.c],[move.r,move.c]]:[[move.r,move.c-1],[move.r,move.c]];let complete=0,third=0;for(const[r,c]of candidates)if(r>=0&&c>=0&&r<3&&c<3){const sides=+!!probe.h[r][c]+!!probe.h[r+1][c]+!!probe.v[r][c]+!!probe.v[r][c+1];if(sides===4)complete++;else if(sides===3)third++;}return complete*100-third*25;}
function chooseDots(state,rng){return bestBy(dotsMoves(state),m=>edgeRisk(state,m),rng);}
function chooseMorris(state,rng){return bestBy(morrisMoves(state,AI),m=>{if(m.remove!=null)return(state.board.filter(v=>v===HUMAN).length<=3?500:0)+(MILL_ADJ[m.remove]?.filter(i=>state.board[i]===HUMAN).length||0)*10;const n=applyCoreMove(state,'nine-mens-morris',m,rng);let s=n.removeBy===AI?250:0;if(m.place){for(const line of MILL_LINES)if(line.includes(m.to)&&line.filter(i=>n.board[i]===AI).length===2&&line.some(i=>!n.board[i]))s+=18;}if(n.winner===AI)s+=1e6;return s;},rng);}
function chooseGo(state,rng){const moves=goMoves(state,AI).filter(m=>!m.pass);if(!moves.length)return{pass:true};if(state.board.filter(Boolean).length>74&&moves.every(m=>!m.captured))return{pass:true};return bestBy(moves,m=>{const sim=simulateGo(state,m.cell,AI),[r,c]=rc(m.cell,9);let libs=sim?goGroup(sim.board,m.cell).liberties.length:0;return m.captured*180+libs*5-(Math.abs(r-4)+Math.abs(c-4))*.4;},rng);}
function chooseFleet(state,rng){
  const unseen=fleetMoves(state,AI),targets=[];for(let i=0;i<64;i++)if(state.aiShots[i]===2)for(const n of orthNeighbors(i,8))if(!state.aiShots[n])targets.push(n);const unique=[...new Set(targets)];if(unique.length)return{cell:unique[rng.int(unique.length)]};const parity=unseen.filter(m=>{const[r,c]=rc(m.cell,8);return(r+c)%2===0;});return(parity.length?parity:unseen)[rng.int((parity.length?parity:unseen).length)];
}
function chooseBackgammon(state,rng){const moves=backgammonMoves(state,AI);if(moves.length===1&&moves[0].roll)return moves[0];return bestBy(moves,m=>{if(m.roll)return 0;let s=m.to==='off'?300:0;if(m.to!=='off'&&state.points[m.to]===1)s+=180;if(m.from==='bar')s+=140;if(typeof m.to==='number')s+=(23-m.to)*2;return s;},rng);}
function chooseLudo(state,rng){const moves=ludoMoves(state);if(moves.length===1&&(moves[0].roll||moves[0].pass))return moves[0];return bestBy(moves,m=>{if(m.pass)return-1000;const player=state.current,physical=ludoPhysical(player,m.to);let s=m.to===44?1000:m.to*3;if(state.players[player].pawns[m.token]<0)s+=90;if(physical!=null&&!LUDO_SAFE.has(physical))for(let p=0;p<4;p++)if(p!==player)for(const v of state.players[p].pawns)if(ludoPhysical(p,v)===physical)s+=250;if(physical!=null&&LUDO_SAFE.has(physical))s+=45;return s;},rng);}

export function chooseAIMove(state,variantId=state.id,random=createSeededRandom(1)){
  const id=BOARD_VARIANTS[variantId]?variantId:state.id;if(!state||state.winner||state.draw)return null;
  switch(id){case'tic-tac-toe':return chooseTtt(state,random);case'connect-four':case'gomoku':case'hex':return choosePlacementAI(state,id,random);
    case'reversi':return chooseReversi(state,random);case'chess':return chooseChess(state,random);case'checkers':return chooseCheckers(state,random);
    case'mancala':return chooseMancala(state,random);case'dots-and-boxes':return chooseDots(state,random);case'nine-mens-morris':return chooseMorris(state,random);
    case'go-9x9':return chooseGo(state,random);case'treasure-fleet':return chooseFleet(state,random);case'codebreaker':return{type:'resolve'};
    case'snakes-and-ladders':return{roll:true};case'backgammon':return chooseBackgammon(state,random);case'cross-and-crown':return chooseLudo(state,random);default:return null;}
}

/* -------------------------------------------------------------------------- */
/* Canvas arena                                                               */

function rounded(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function countPieces(board,player){return board.filter(v=>owner(v)===player).length;}
function moveKey(move){return JSON.stringify(move||null);}

export function createBoardArena(Base){
  if(typeof Base!=='function')throw new TypeError('createBoardArena(Base) requires the shared Base class');

  return class BoardArena extends Base{
    instructions(){return resolveBoardVariant(this.game).instructions;}

    reset(){
      this.variant=resolveBoardVariant(this.game);this.variantId=this.variant.id;this.seed=hashSeed(`${this.game.slug||this.game.title||this.variantId}:${this.game.boardSeed??'launch'}`);
      this.random=createSeededRandom(this.seed);this.state=createInitialState(this.variantId,this.seed);this.selected=null;this.hintMove=null;this.hintTime=0;this.hintCharges=0;this.aiThinking=false;this.aiDelay=0;this.endDelay=0;this.endStarted=false;this.layout=null;this.hover=null;this.turnPulse=0;this.history=[];
      this.lives=0;this.drawLives();this.setScore(0);this._syncHud();
    }

    onResize(){this.layout=null;}

    rewardLabel(){return '3 oracle hints or lucky rolls + 250 bonus points';}

    applyReward(detail={}){
      if(this._applyingBoardReward){const nested=super.applyReward?super.applyReward(detail):false;if(nested&&this.started&&!this.over)this._grantBoardReward();return nested;}this._applyingBoardReward=true;const wasStarted=this.started&&!this.over;const applied=super.applyReward?super.applyReward(detail):false;this._applyingBoardReward=false;if(!applied)return false;
      if(wasStarted){this.hintCharges=Math.max(this.hintCharges||0,3);this.addScore(150);this.lives=0;this.drawLives();}return true;
    }
    _grantBoardReward(){this.hintCharges=Math.max(this.hintCharges||0,3);this.addScore(150);this.lives=0;this.drawLives();}

    _isHumanTurn(){if(this.variantId==='cross-and-crown')return this.state.current===0;return this.state.turn===HUMAN;}
    _isAITurn(){return !this.state.winner&&!this.state.draw&&!this._isHumanTurn();}

    _syncHud(){
      if(!this.comboEl||!this.state)return;const turn=this._isHumanTurn()?'YOUR TURN':'MOON AI';let extra='';
      if(this.aiThinking)extra='  -  THINKING';else if(this.state.check===HUMAN)extra='  -  CHECK';else if(this.state.removeBy)extra='  -  REMOVE ONE';else if(this.state.dice?.length)extra=`  -  DICE ${this.state.dice.join(' / ')}`;else if(this.state.die)extra=`  -  ROLL ${this.state.die}`;
      this.comboEl.textContent=turn+extra;this.comboEl.style.color=this._isHumanTurn()?'#fff4bb':'#cdbdff';
    }

    _statusText(){
      const s=this.state;if(this.endStarted)return s.draw?'A brilliant draw!':s.winner===HUMAN?'Victory! The board sparkles.':'The moon keeper wins this round.';
      if(this.aiThinking)return'The moon keeper is thinking...';if(s.removeBy===HUMAN)return'Your mill glows - remove a rival lantern.';
      if(this.variantId==='codebreaker')return s.turn===AI?'The keeper is reading your crystals...':`${s.maxGuesses-s.guesses.length} guesses remain`;
      if(this.variantId==='backgammon'&&this._isHumanTurn())return s.dice.length?'Choose a checker, then its destination.':'Tap ROLL for two dice.';
      if(this.variantId==='cross-and-crown'&&this._isHumanTurn())return s.die==null?'Tap ROLL.':`You rolled ${s.die}. Choose a glowing pawn.`;
      return this._isHumanTurn()?'Choose your move.':'Moon AI turn.';
    }

    _beginEnd(){
      if(this.endStarted)return;this.endStarted=true;this.aiThinking=false;this.endDelay=1.25;const humanWin=this.state.winner===HUMAN;
      const base=this.state.draw?500:humanWin?1200:120;this.addScore(base+Math.max(0,500-(this.state.moveCount||0)*4));
      if(this.state.draw){this.ring?.(this.W/2,this.H*.45,'#fff1b8');this.sound?.power?.();}
      else if(humanWin){this.confetti?.(this.W/2,this.H*.42);this.confetti?.(this.W*.3,this.H*.5);this.confetti?.(this.W*.7,this.H*.5);this.sound?.power?.();}
      else{this.flash?.('#7654c7',.35);this.sound?.hit?.();}
    }

    showOver(){
      super.showOver();const panel=this.overlay?.querySelector('.mma-panel');if(!panel)return;const title=panel.querySelector('h2'),final=panel.querySelector('.mma-final'),medal=panel.querySelector('.mma-medal');
      if(title)title.textContent=this.state.draw?'Honorable Draw':this.state.winner===HUMAN?'Board Conquered!':'Moon Keeper Wins';if(medal)medal.textContent=this.state.draw?'=':this.state.winner===HUMAN?'*':'o';
      if(final)final.innerHTML=`${this.variant.title}<br><b>${Math.floor(this.score)} points</b>`;
    }

    update(dt){
      this.turnPulse=(this.turnPulse+dt)%10;if(this.hintTime>0){this.hintTime-=dt;if(this.hintTime<=0)this.hintMove=null;}
      if(this.state.winner||this.state.draw){this._beginEnd();this.endDelay-=dt;if(this.endDelay<=0&&!this.over)this.showOver();return;}
      if(this.pointer.tapped&&this._isHumanTurn()&&!this.aiThinking)this._handleTap(this.pointer.x,this.pointer.y);
      if(this._isAITurn()){
        if(!this.aiThinking){this.aiThinking=true;this.aiDelay=.48+this.random()*.34;this._syncHud();}
        else{this.aiDelay-=dt;if(this.aiDelay<=0){this.aiThinking=false;this._performAI();}}
      }else if(this.aiThinking){this.aiThinking=false;this._syncHud();}
    }

    _performAI(){const move=chooseAIMove(this.state,this.variantId,this.random);if(move)this._commit(move,true);else if(this.variantId==='reversi'){this.state={...this.state,turn:HUMAN,passCount:(this.state.passCount||0)+1};}this._syncHud();}

    _commit(move,byAI=false){
      const before=this.state;this.history.push(deepClone(before));if(this.history.length>12)this.history.shift();const next=applyRuleMove(before,this.variantId,move,this.random);if(next===before){this.history.pop();return false;}
      this.state=next;this.selected=null;this.hintMove=null;this.hintTime=0;this.shake=.08;const p=this._movePoint(next.lastMove||move);if(p){this.ring?.(p.x,p.y,byAI?'#9e8cff':'#ffe07a');this.burst?.(p.x,p.y,byAI?'#9e8cff':'#ffe07a',6,.45);}this.sound?.blip?.(byAI?360:620,.07,'triangle',.12);
      const quietCode=this.variantId==='codebreaker'&&['set','clear'].includes(move.type),gain=byAI||quietCode?0:20+(next.lastMove?.capture!=null||next.lastMove?.hit?30:0)+(next.lastMove?.boxes||0)*40;this.addScore(gain);this._syncHud();return true;
    }

    _hint(){
      if(!this._isHumanTurn()||!(this.hintCharges>0))return;if(this.variantId==='codebreaker'){const slot=this.state.draft.findIndex((v,i)=>v!==this.state.code[i]);if(slot>=0){this._commit({type:'set',slot,color:this.state.code[slot]});this.hintCharges--;this.sound?.power?.();}return;}
      if(this.variantId==='snakes-and-ladders'){this._commit({roll:true,rollValue:6});this.hintCharges--;this.sound?.power?.();return;}if(this.variantId==='cross-and-crown'&&this.state.die==null){this._commit({roll:true,rollValue:6});this.hintCharges--;this.sound?.power?.();return;}if(this.variantId==='backgammon'&&!this.state.dice.length){this._commit({roll:true,dice:[6,6]});this.hintCharges--;this.sound?.power?.();return;}
      if(this.variantId==='treasure-fleet'){const cells=this.state.enemyShips.flatMap(ship=>ship.cells).filter(cell=>!this.state.humanShots[cell]);if(cells.length){this.hintMove={cell:cells[this.random.int(cells.length)]};this.hintTime=6;this.hintCharges--;this.sound?.power?.();}return;}const moves=legalMovesFor(this.state,this.variantId,HUMAN).filter(m=>!m.roll);if(!moves.length)return;
      let hint=moves.find(m=>wouldWin(this.state,this.variantId,m,HUMAN));if(!hint){const aiThreat=moves.find(m=>wouldWin(this.state,this.variantId,m,AI));hint=aiThreat||moves[Math.floor(this.random()*moves.length)];}
      this.hintMove=hint;this.hintTime=5;this.hintCharges--;this.sound?.power?.();
    }

    _handleTap(x,y){
      const L=this.layout;if(!L)return;if(L.hint&&this._inside(x,y,L.hint)){this._hint();return;}const id=this.variantId;
      if(id==='codebreaker'){this._tapCode(x,y);return;}if(id==='snakes-and-ladders'){if(L.action&&this._inside(x,y,L.action))this._commit({roll:true});return;}
      if(id==='cross-and-crown'){if(this.state.die==null){if(L.action&&this._inside(x,y,L.action))this._commit({roll:true});}else{const hit=(L.tokens||[]).find(t=>t.player===0&&Math.hypot(x-t.x,y-t.y)<=t.r*1.45);if(hit){const move=ludoMoves(this.state).find(m=>m.token===hit.token);if(move)this._commit(move);}}return;}
      if(id==='backgammon'){this._tapBackgammon(x,y);return;}if(id==='mancala'){const hit=(L.pits||[]).find(p=>p.player===HUMAN&&Math.hypot(x-p.x,y-p.y)<p.r);if(hit)this._commit({pit:hit.index});return;}
      if(id==='dots-and-boxes'){let best=null,dist=Infinity;for(const e of L.edges||[]){const d=Math.hypot(x-e.x,y-e.y);if(d<dist){dist=d;best=e;}}if(best&&dist<L.cell*.38)this._commit({axis:best.axis,r:best.r,c:best.c});return;}
      if(id==='nine-mens-morris'){const point=this._nearestPoint(x,y,L.points,L.cell*.42);if(point!=null)this._tapMorris(point);return;}
      if(id==='treasure-fleet'){const cell=this._gridCellAt(x,y,L.grid);if(cell!=null)this._commit({cell});return;}
      if(id==='go-9x9'&&L.action&&this._inside(x,y,L.action)){this._commit({pass:true});return;}
      if(id==='hex'){const hit=this._nearestHex(x,y,L.hexes);if(hit!=null)this._commit({cell:hit});return;}
      const cell=this._gridCellAt(x,y,L.grid);if(cell==null)return;
      if(id==='connect-four'){this._commit({col:cell%7});return;}if(id==='tic-tac-toe'||id==='gomoku'||id==='reversi'||id==='go-9x9'){this._commit({cell});return;}
      if(id==='chess'||id==='checkers')this._tapPieceGrid(cell);
    }

    _tapPieceGrid(cell){
      const moves=legalMovesFor(this.state,this.variantId,HUMAN);const target=moves.find(m=>m.from===this.selected&&m.to===cell);if(target){this._commit(target);return;}
      const owns=this.variantId==='chess'?ownerChess(this.state.board[cell])===HUMAN:owner(this.state.board[cell])===HUMAN;if(owns&&moves.some(m=>m.from===cell)){this.selected=cell;this.sound?.blip?.(520,.04,'sine',.08);}else this.selected=null;
    }

    _tapMorris(point){const moves=morrisMoves(this.state,HUMAN);if(this.state.removeBy===HUMAN){const move=moves.find(m=>m.remove===point);if(move)this._commit(move);return;}const place=moves.find(m=>m.place&&m.to===point);if(place){this._commit(place);return;}const target=moves.find(m=>m.from===this.selected&&m.to===point);if(target){this._commit(target);return;}if(this.state.board[point]===HUMAN&&moves.some(m=>m.from===point))this.selected=point;else this.selected=null;}

    _tapCode(x,y){const L=this.layout;for(const p of L.palette||[])if(Math.hypot(x-p.x,y-p.y)<p.r*1.35){this._commit({type:'set',color:p.color});return;}for(const s of L.draft||[])if(Math.hypot(x-s.x,y-s.y)<s.r*1.3){this._commit({type:'clear',slot:s.slot});return;}if(L.action&&this._inside(x,y,L.action))this._commit({type:'submit'});}

    _tapBackgammon(x,y){
      const L=this.layout;if(!this.state.dice.length){if(L.action&&this._inside(x,y,L.action))this._commit({roll:true});return;}const moves=backgammonMoves(this.state,HUMAN).filter(m=>!m.roll);if(this.state.bar.human>0)this.selected='bar';
      if(this.selected!=null){if(L.off&&this._inside(x,y,L.off)){const move=moves.find(m=>m.from===this.selected&&m.to==='off');if(move){this._commit(move);return;}}const point=this._bgPointAt(x,y,L);const move=moves.find(m=>m.from===this.selected&&m.to===point);if(move){this._commit(move);return;}}
      const point=this._bgPointAt(x,y,L);if(point!=null&&owner(this.state.points[point])===HUMAN&&moves.some(m=>m.from===point))this.selected=point;else if(this.state.bar.human>0)this.selected='bar';else this.selected=null;
    }

    _inside(x,y,r){return x>=r.x&&y>=r.y&&x<=r.x+r.w&&y<=r.y+r.h;}
    _gridCellAt(x,y,g){if(!g||!this._inside(x,y,g))return null;const c=Math.min(g.cols-1,Math.floor((x-g.x)/g.cellW)),r=Math.min(g.rows-1,Math.floor((y-g.y)/g.cellH));return idx(r,c,g.cols);}
    _nearestPoint(x,y,points,max){let best=null,d=max;for(let i=0;i<(points||[]).length;i++){const q=points[i],dd=Math.hypot(x-q.x,y-q.y);if(dd<d){d=dd;best=i;}}return best;}
    _nearestHex(x,y,hexes){let best=null,d=Infinity;for(const h of hexes||[]){const dd=Math.hypot(x-h.x,y-h.y);if(dd<d){d=dd;best=h;}}return best&&d<best.r*1.1?best.cell:null;}
    _bgPointAt(x,y,L){if(!L.board||!this._inside(x,y,L.board))return null;const col=Math.max(0,Math.min(11,Math.floor((x-L.board.x)/L.cell)));return y>L.board.y+L.board.h/2?col:23-col;}

    _movePoint(move){
      const L=this.layout;if(!L||!move)return null;if(Number.isInteger(move.cell)&&L.grid){const[r,c]=rc(move.cell,L.grid.cols);return{x:L.grid.x+(c+.5)*L.grid.cellW,y:L.grid.y+(r+.5)*L.grid.cellH};}
      if(Number.isInteger(move.to)&&L.grid){const[r,c]=rc(move.to,L.grid.cols);return{x:L.grid.x+(c+.5)*L.grid.cellW,y:L.grid.y+(r+.5)*L.grid.cellH};}
      if(Number.isInteger(move.to)&&L.points)return L.points[move.to];if(Number.isInteger(move.pit)&&L.pits)return L.pits.find(p=>p.index===move.pit);if(Number.isInteger(move.cell)&&L.hexes)return L.hexes.find(h=>h.cell===move.cell);return{x:this.W/2,y:this.H*.5};
    }

    renderText(){
      const s=this.state||{},id=this.variantId||resolveBoardVariant(this.game).id,payload={coordinateSystem:'origin top-left; x right; y down; taps use CSS canvas pixels',mode:'board-arena',variant:id,title:this.variant?.title||BOARD_VARIANTS[id].title,phase:this.over?'gameover':this.started?(this.running?'playing':'paused'):'menu',turn:this._isHumanTurn()?'human':'ai',aiThinking:!!this.aiThinking,status:this._statusText(),score:Math.floor(this.score||0),moveCount:s.moveCount||0,winner:s.draw?'draw':s.winner===HUMAN?'human':s.winner?'ai':null,selected:this.selected,hintCharges:this.hintCharges||0,lastMove:s.lastMove||null};
      if(!['treasure-fleet','codebreaker'].includes(id)&&Array.isArray(s.board))payload.board=s.board;if(id==='mancala')payload.pits=s.pits;if(id==='dots-and-boxes')Object.assign(payload,{horizontalEdges:s.h,verticalEdges:s.v,boxes:s.boxes,scores:s.scores});if(id==='nine-mens-morris')Object.assign(payload,{board:s.board,placed:s.placed,removeBy:s.removeBy});if(id==='go-9x9')Object.assign(payload,{captures:s.captures,passes:s.passCount,finalScore:s.finalScore});
      if(id==='treasure-fleet')Object.assign(payload,{targetChart:s.humanShots,ownFleet:s.humanShips.map(ship=>({cells:ship.cells,hits:ship.hits})),incomingShots:s.aiShots});if(id==='codebreaker')Object.assign(payload,{draft:s.draft,guesses:s.guesses,colors:CODE_COLORS,secret:s.winner?s.code:undefined});
      if(id==='snakes-and-ladders')Object.assign(payload,{positions:s.positions,lastRoll:s.lastRoll});if(id==='backgammon')Object.assign(payload,{points:s.points,bar:s.bar,off:s.off,dice:s.dice});if(id==='cross-and-crown')Object.assign(payload,{players:s.players,currentPlayer:s.current,die:s.die});
      const legal=this._isHumanTurn()?legalMovesFor(s,id,HUMAN):[];payload.legalMoves=legal.slice(0,40);payload.legalMoveCount=legal.length;return JSON.stringify(payload);
    }

    render(){
      if(!this.state)return;const c=this.ctx;c.save();this.applyShake?.(c);this._drawBackdrop();this.layout={};
      switch(this.variantId){
        case'chess':case'checkers':case'tic-tac-toe':case'connect-four':case'reversi':case'gomoku':case'go-9x9':this._drawGridGame();break;
        case'mancala':this._drawMancala();break;case'dots-and-boxes':this._drawDots();break;case'nine-mens-morris':this._drawMorris();break;
        case'hex':this._drawHex();break;case'treasure-fleet':this._drawFleet();break;case'codebreaker':this._drawCode();break;
        case'snakes-and-ladders':this._drawSnakes();break;case'backgammon':this._drawBackgammon();break;case'cross-and-crown':this._drawLudo();break;
      }
      this._drawTop();this._drawFooter();this.drawFx?.();c.restore();
    }

    _drawBackdrop(){
      const c=this.ctx,W=this.W,H=this.H,primary=this.theme?.primary||'#8459df',accent=this.theme?.accent||'#ffd05e';const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#18133b');g.addColorStop(.48,'#302060');g.addColorStop(1,'#102c4c');c.fillStyle=g;c.fillRect(0,0,W,H);
      const glow=c.createRadialGradient(W*.5,H*.42,0,W*.5,H*.42,Math.max(W,H)*.7);glow.addColorStop(0,primary+'45');glow.addColorStop(.55,accent+'16');glow.addColorStop(1,'#05071999');c.fillStyle=glow;c.fillRect(0,0,W,H);
      c.save();c.globalAlpha=.22;for(let i=0;i<28;i++){const x=(i*83.7+Math.sin(this.time*.18+i)*18)%W,y=(i*47.3)%H,r=1+(i%3);c.fillStyle=i%4===0?accent:'#fff';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}c.restore();
      const vignette=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(2,4,20,.55)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
    }

    _drawTop(){
      const c=this.ctx,W=this.W;c.save();c.globalAlpha=1;c.textAlign='center';c.textBaseline='middle';c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=8;c.fillStyle='#fff8db';c.font=`900 ${Math.max(17,Math.min(24,W/18))}px Fredoka, Outfit, system-ui, sans-serif`;c.fillText(this.variant.title,W/2,28);c.shadowBlur=0;c.fillStyle='rgba(227,222,255,.72)';c.font='700 10px Outfit, system-ui, sans-serif';c.fillText(this.variant.subtitle.toUpperCase()+'  -  SOLO VS MOON AI',W/2,51);
      const turnW=Math.min(190,W*.58),x=(W-turnW)/2;c.fillStyle=this._isHumanTurn()?'rgba(255,224,122,.16)':'rgba(164,139,255,.18)';rounded(c,x,60,turnW,21,11);c.fill();c.strokeStyle=this._isHumanTurn()?'rgba(255,224,122,.55)':'rgba(173,154,255,.55)';c.lineWidth=1;c.stroke();c.fillStyle=this._isHumanTurn()?'#ffe992':'#cfc3ff';c.font='900 10px Outfit, system-ui';c.fillText(this.aiThinking?'MOON AI IS THINKING':this._isHumanTurn()?'YOUR MOVE':'MOON AI TURN',W/2,70.5);c.restore();
    }

    _drawFooter(){
      const c=this.ctx,W=this.W,H=this.H;if(this.hintCharges>0){const b={x:12,y:H-66,w:88,h:34};this.layout.hint=b;this._button(b,`HINT x${this.hintCharges}`,'#3ccfb4');}
      c.textAlign='center';c.textBaseline='middle';c.fillStyle='rgba(245,241,255,.86)';c.font=`700 ${Math.max(10,Math.min(13,W/32))}px Outfit, system-ui`;const max=W-28;let text=this._statusText();while(c.measureText(text).width>max&&text.length>12)text=text.slice(0,-2);if(text!==this._statusText())text+='...';c.fillText(text,W/2,H-18);
    }

    _button(b,label,color='#ffbf48'){
      const c=this.ctx;c.save();c.shadowColor=color;c.shadowBlur=12;c.fillStyle=color;rounded(c,b.x,b.y,b.w,b.h,12);c.fill();c.shadowBlur=0;const g=c.createLinearGradient(0,b.y,0,b.y+b.h);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;rounded(c,b.x+2,b.y+2,b.w-4,b.h*.46,10);c.fill();c.fillStyle='#1a1633';c.font='900 12px Outfit, system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(label,b.x+b.w/2,b.y+b.h/2+1);c.restore();
    }

    _boardGrid(rows,cols,top=93,bottom=82){
      const maxW=this.W-26,maxH=Math.max(80,this.H-top-bottom),cell=Math.max(8,Math.min(maxW/cols,maxH/rows)),w=cell*cols,h=cell*rows;return{x:(this.W-w)/2,y:top+(maxH-h)/2,w,h,cellW:cell,cellH:cell,cell,rows,cols};
    }

    _frame(rect,colorA='#d29a55',colorB='#6f3f32'){
      const c=this.ctx,pad=7;c.save();c.shadowColor='rgba(0,0,0,.65)';c.shadowBlur=20;c.shadowOffsetY=7;const g=c.createLinearGradient(rect.x,rect.y,rect.x+rect.w,rect.y+rect.h);g.addColorStop(0,colorA);g.addColorStop(.5,'#f4c87a');g.addColorStop(1,colorB);c.fillStyle=g;rounded(c,rect.x-pad,rect.y-pad,rect.w+pad*2,rect.h+pad*2,12);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,247,199,.5)';c.lineWidth=2;rounded(c,rect.x-pad+2,rect.y-pad+2,rect.w+pad*2-4,rect.h+pad*2-4,10);c.stroke();c.restore();
    }

    _stone(x,y,r,player,label=''){
      const c=this.ctx;c.save();c.shadowColor=player===HUMAN?'rgba(255,224,117,.65)':'rgba(124,88,255,.7)';c.shadowBlur=r*.5;c.shadowOffsetY=r*.14;const g=c.createRadialGradient(x-r*.28,y-r*.35,r*.08,x,y,r);if(player===HUMAN){g.addColorStop(0,'#fffef1');g.addColorStop(.46,'#ffe6a0');g.addColorStop(1,'#b96e31');}else{g.addColorStop(0,'#e0d7ff');g.addColorStop(.42,'#8461df');g.addColorStop(1,'#291858');}c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle=player===HUMAN?'rgba(255,255,255,.9)':'rgba(220,206,255,.65)';c.lineWidth=Math.max(1,r*.08);c.stroke();c.globalAlpha=.35;c.fillStyle='#fff';c.beginPath();c.ellipse(x-r*.24,y-r*.3,r*.36,r*.16,-.45,0,Math.PI*2);c.fill();c.globalAlpha=1;if(label){c.fillStyle=player===HUMAN?'#4f2c31':'#fff9df';c.font=`900 ${Math.max(9,r*1.05)}px Georgia, serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(label,x,y+1);}c.restore();
    }

    _drawGridGame(){
      const s=this.state,id=this.variantId,g=this._boardGrid(s.rows,s.cols,id==='gomoku'||id==='go-9x9'?96:92,id==='go-9x9'?98:80);this.layout.grid=g;this._frame(g,id==='connect-four'?'#498edd':'#d89b55',id==='connect-four'?'#17386a':'#68402f');const c=this.ctx;
      const wood=c.createLinearGradient(g.x,g.y,g.x+g.w,g.y+g.h);wood.addColorStop(0,id==='connect-four'?'#164f9b':'#e6bb73');wood.addColorStop(.5,id==='connect-four'?'#2676cf':'#c9894c');wood.addColorStop(1,id==='connect-four'?'#0c376f':'#9b5a39');c.fillStyle=wood;c.fillRect(g.x,g.y,g.w,g.h);
      const intersections=id==='gomoku'||id==='go-9x9';if(intersections){c.strokeStyle='rgba(65,35,29,.58)';c.lineWidth=1;for(let r=0;r<s.rows;r++){c.beginPath();c.moveTo(g.x+g.cellW*.5,g.y+(r+.5)*g.cellH);c.lineTo(g.x+g.w-g.cellW*.5,g.y+(r+.5)*g.cellH);c.stroke();}for(let col=0;col<s.cols;col++){c.beginPath();c.moveTo(g.x+(col+.5)*g.cellW,g.y+g.cellH*.5);c.lineTo(g.x+(col+.5)*g.cellW,g.y+g.h-g.cellH*.5);c.stroke();}}
      else for(let r=0;r<s.rows;r++)for(let col=0;col<s.cols;col++){const x=g.x+col*g.cellW,y=g.y+r*g.cellH;if(id==='chess'||id==='checkers'){c.fillStyle=(r+col)%2?'rgba(79,40,51,.78)':'rgba(255,227,164,.72)';c.fillRect(x,y,g.cellW,g.cellH);}else if(id==='connect-four'){c.fillStyle='rgba(1,20,55,.72)';c.beginPath();c.arc(x+g.cellW/2,y+g.cellH/2,Math.min(g.cellW,g.cellH)*.37,0,Math.PI*2);c.fill();}else{c.strokeStyle='rgba(255,247,213,.3)';c.lineWidth=1;c.strokeRect(x+.5,y+.5,g.cellW-1,g.cellH-1);}}
      const legal=this._isHumanTurn()?legalMovesFor(s,id,HUMAN):[];if(this.selected!=null){for(const m of legal.filter(m=>m.from===this.selected)){const[r,col]=rc(m.to,s.cols),x=g.x+(col+.5)*g.cellW,y=g.y+(r+.5)*g.cellH;c.fillStyle='rgba(95,255,204,.72)';c.beginPath();c.arc(x,y,Math.max(3,g.cell*.11),0,Math.PI*2);c.fill();}}
      if(id==='reversi'&&this._isHumanTurn())for(const m of legal){const[r,col]=rc(m.cell,8);c.fillStyle='rgba(255,244,167,.5)';c.beginPath();c.arc(g.x+(col+.5)*g.cellW,g.y+(r+.5)*g.cellH,Math.max(2,g.cell*.07),0,Math.PI*2);c.fill();}
      for(let i=0;i<s.board.length;i++){const value=s.board[i];if(!value)continue;const[r,col]=rc(i,s.cols),x=g.x+(col+.5)*g.cellW,y=g.y+(r+.5)*g.cellH,rad=Math.min(g.cellW,g.cellH)*.38;
        if(id==='chess'){const p=ownerChess(value),label=value.toUpperCase();this._stone(x,y,rad,p,label);}else if(id==='checkers'){this._stone(x,y,rad,owner(value),Math.abs(value)===2?'K':'');}else if(id==='tic-tac-toe'){this._stone(x,y,rad*.9,value,value===HUMAN?'S':'M');}else this._stone(x,y,rad,value,'');
      }
      if(this.selected!=null){const[r,col]=rc(this.selected,s.cols);c.strokeStyle='#66ffd2';c.lineWidth=3;c.strokeRect(g.x+col*g.cellW+2,g.y+r*g.cellH+2,g.cellW-4,g.cellH-4);}
      if(s.lastMove?.cell!=null){const[r,col]=rc(s.lastMove.cell,s.cols);c.strokeStyle='rgba(255,247,170,.75)';c.lineWidth=2;c.strokeRect(g.x+col*g.cellW+3,g.y+r*g.cellH+3,g.cellW-6,g.cellH-6);}
      if(this.hintMove){const cell=this.hintMove.cell??this.hintMove.to;if(Number.isInteger(cell)){const[r,col]=rc(cell,s.cols);c.strokeStyle='#65ffd1';c.lineWidth=4;c.shadowColor='#65ffd1';c.shadowBlur=14;c.strokeRect(g.x+col*g.cellW+4,g.y+r*g.cellH+4,g.cellW-8,g.cellH-8);c.shadowBlur=0;}}
      if(id==='go-9x9'){const b={x:this.W-93,y:this.H-67,w:81,h:34};this.layout.action=b;this._button(b,'PASS','#ffd05a');this._drawSmallScore(`CAP ${s.captures.human} - ${s.captures.ai}`,g.x,g.y-13);}
      if(id==='reversi')this._drawSmallScore(`${s.board.filter(v=>v===HUMAN).length}  -  ${s.board.filter(v=>v===AI).length}`,g.x,g.y-13);
    }

    _drawSmallScore(text,x,y){const c=this.ctx;c.fillStyle='rgba(10,8,30,.7)';rounded(c,x,y-9,82,19,9);c.fill();c.fillStyle='#fff4c5';c.font='800 10px Outfit, system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x+41,y+.5);}

    _drawMancala(){
      const c=this.ctx,W=this.W,H=this.H,top=H*.27,bh=Math.min(H*.43,250),x=14,w=W-28,r=Math.min(w/15,bh*.2);const board={x,y:top,w,h:bh};this._frame(board,'#d89b53','#663829');const g=c.createLinearGradient(x,top,x+w,top+bh);g.addColorStop(0,'#8b4c31');g.addColorStop(.5,'#e7a75e');g.addColorStop(1,'#75402e');c.fillStyle=g;rounded(c,x,top,w,bh,Math.min(38,bh*.18));c.fill();this.layout.pits=[];
      const storeR=Math.min(bh*.27,w*.075);for(const store of[{index:13,player:AI,x:x+storeR+9},{index:6,player:HUMAN,x:x+w-storeR-9}]){const py=top+bh/2;this._pit(store.x,py,storeR,storeR*1.45,this.state.pits[store.index],store.player);this.layout.pits.push({...store,y:py,r:storeR});}
      const innerL=x+storeR*2+17,innerR=x+w-storeR*2-17,step=(innerR-innerL)/5,pitR=Math.min(r,step*.39);for(let col=0;col<6;col++){const px=innerL+col*step,hy=top+bh*.69,ay=top+bh*.31,hi=col,ai=12-col;this._pit(px,hy,pitR,pitR*.82,this.state.pits[hi],HUMAN);this._pit(px,ay,pitR,pitR*.82,this.state.pits[ai],AI);this.layout.pits.push({index:hi,player:HUMAN,x:px,y:hy,r:pitR},{index:ai,player:AI,x:px,y:ay,r:pitR});}
      c.fillStyle='rgba(255,249,215,.8)';c.font='800 10px Outfit, system-ui';c.textAlign='center';c.fillText(`YOUR STORE ${this.state.pits[6]}       MOON STORE ${this.state.pits[13]}`,W/2,top+bh+23);
    }

    _pit(x,y,rx,ry,count,player){const c=this.ctx;c.save();c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=9;c.fillStyle='rgba(45,21,24,.72)';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.shadowBlur=0;const g=c.createRadialGradient(x-rx*.2,y-ry*.2,2,x,y,rx);g.addColorStop(0,'#704536');g.addColorStop(1,'#2a1620');c.fillStyle=g;c.beginPath();c.ellipse(x,y,rx*.88,ry*.86,0,0,Math.PI*2);c.fill();const shown=Math.min(14,count);for(let i=0;i<shown;i++){const a=i*2.399,rr=Math.sqrt((i+.5)/Math.max(1,shown))*rx*.56;this._stone(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.66,Math.max(3,rx*.115),player);}if(count>14){c.fillStyle='#fff';c.font='900 10px Outfit';c.textAlign='center';c.fillText(count,x,y+3);}c.restore();}

    _drawDots(){
      const c=this.ctx,g=this._boardGrid(3,3,112,102),step=Math.min(g.w/3,g.h/3),size=step*3,x=(this.W-size)/2,y=g.y;this.layout.cell=step;this.layout.edges=[];this.layout.points=[];const s=this.state;
      c.fillStyle='rgba(255,247,211,.08)';rounded(c,x-22,y-22,size+44,size+44,20);c.fill();
      for(let r=0;r<3;r++)for(let col=0;col<3;col++)if(s.boxes[r][col]){const bx=x+col*step,by=y+r*step;c.fillStyle=s.boxes[r][col]===HUMAN?'rgba(255,221,112,.32)':'rgba(145,112,255,.3)';rounded(c,bx+5,by+5,step-10,step-10,10);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.font=`900 ${step*.22}px Outfit`;c.textAlign='center';c.fillText(s.boxes[r][col]===HUMAN?'S':'M',bx+step/2,by+step*.58);}
      c.lineCap='round';for(let r=0;r<4;r++)for(let col=0;col<3;col++){const x1=x+col*step,y1=y+r*step,x2=x1+step,own=s.h[r][col];c.strokeStyle=own===HUMAN?'#ffe17a':own===AI?'#9a7cff':'rgba(255,255,255,.12)';c.lineWidth=own?Math.max(5,step*.09):3;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y1);c.stroke();this.layout.edges.push({axis:'h',r,c:col,x:(x1+x2)/2,y:y1});}
      for(let r=0;r<3;r++)for(let col=0;col<4;col++){const x1=x+col*step,y1=y+r*step,y2=y1+step,own=s.v[r][col];c.strokeStyle=own===HUMAN?'#ffe17a':own===AI?'#9a7cff':'rgba(255,255,255,.12)';c.lineWidth=own?Math.max(5,step*.09):3;c.beginPath();c.moveTo(x1,y1);c.lineTo(x1,y2);c.stroke();this.layout.edges.push({axis:'v',r,c:col,x:x1,y:(y1+y2)/2});}
      for(let r=0;r<4;r++)for(let col=0;col<4;col++){const px=x+col*step,py=y+r*step;c.shadowColor='#fff2b0';c.shadowBlur=8;c.fillStyle='#fff6cf';c.beginPath();c.arc(px,py,Math.max(5,step*.075),0,Math.PI*2);c.fill();c.shadowBlur=0;this.layout.points.push({x:px,y:py});}
      this._drawSmallScore(`${s.scores.human}  PADDOCKS  ${s.scores.ai}`,x,y-30);
    }

    _drawMorris(){
      const c=this.ctx,size=Math.min(this.W-50,this.H-195),x=(this.W-size)/2,y=104,scale=size/6;this.layout.cell=scale;this.layout.points=MILL_POINTS.map(([r,col])=>({x:x+col*scale,y:y+r*scale}));
      c.fillStyle='rgba(227,171,92,.18)';rounded(c,x-18,y-18,size+36,size+36,18);c.fill();c.strokeStyle='rgba(255,221,151,.7)';c.lineWidth=Math.max(2,size*.009);for(const[a,b]of MILL_EDGES){const p=this.layout.points[a],q=this.layout.points[b];c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
      const legal=this._isHumanTurn()?morrisMoves(this.state,HUMAN):[];for(let i=0;i<24;i++){const p=this.layout.points[i],v=this.state.board[i];c.fillStyle='rgba(20,15,45,.9)';c.beginPath();c.arc(p.x,p.y,Math.max(4,scale*.09),0,Math.PI*2);c.fill();if(v)this._stone(p.x,p.y,scale*.21,v,'');else if(legal.some(m=>m.to===i||m.remove===i)){c.fillStyle=this.state.removeBy===HUMAN?'rgba(255,95,117,.75)':'rgba(88,255,202,.65)';c.beginPath();c.arc(p.x,p.y,scale*.075,0,Math.PI*2);c.fill();}}
      if(this.selected!=null){const p=this.layout.points[this.selected];c.strokeStyle='#63ffd3';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,scale*.28,0,Math.PI*2);c.stroke();}
      const hp=countPieces(this.state.board,HUMAN),ap=countPieces(this.state.board,AI);this._drawSmallScore(`${hp} +${9-this.state.placed.human}  -  ${ap} +${9-this.state.placed.ai}`,x,y-30);
    }

    _drawHex(){
      const c=this.ctx,n=9,availableW=this.W-38,availableH=this.H-195,step=Math.min(availableW/(n+(n-1)*.5),availableH/(n*.88)),radius=step*.55,totalW=step*((n-1)+(n-1)*.5)+radius*2,totalH=step*.86*(n-1)+radius*2,x=(this.W-totalW)/2+radius,y=103+radius;this.layout.hexes=[];
      c.fillStyle='rgba(255,226,156,.11)';rounded(c,x-radius-14,y-radius-14,totalW+28,totalH+28,20);c.fill();for(let r=0;r<n;r++)for(let col=0;col<n;col++){const cx=x+(col+r*.5)*step,cy=y+r*step*.86,cell=idx(r,col,n);this.layout.hexes.push({x:cx,y:cy,r:radius,cell});this._hexPath(cx,cy,radius);c.fillStyle=(r+col)%2?'rgba(244,195,110,.62)':'rgba(255,225,156,.72)';c.fill();c.strokeStyle='rgba(77,45,59,.7)';c.lineWidth=1;c.stroke();const v=this.state.board[cell];if(v)this._stone(cx,cy,radius*.68,v);}
      c.fillStyle='#ffe17a';c.font='900 9px Outfit';c.textAlign='center';c.fillText('YOUR SHORES  <---------------->',this.W/2,y-radius-19);c.save();c.translate(x-radius-18,y+totalH/2-radius);c.rotate(-Math.PI/2);c.fillStyle='#aa92ff';c.fillText('MOON SHORES  <---------------->',0,0);c.restore();
    }
    _hexPath(x,y,r){const c=this.ctx;c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}

    _drawFleet(){
      const c=this.ctx,s=this.state,g=this._boardGrid(8,8,105,150);this.layout.grid=g;this._frame(g,'#65c7da','#155271');const sea=c.createLinearGradient(g.x,g.y,g.x,g.y+g.h);sea.addColorStop(0,'#2a9fc6');sea.addColorStop(1,'#0d456d');c.fillStyle=sea;c.fillRect(g.x,g.y,g.w,g.h);
      c.strokeStyle='rgba(215,251,255,.26)';c.lineWidth=1;for(let i=0;i<=8;i++){c.beginPath();c.moveTo(g.x+i*g.cellW,g.y);c.lineTo(g.x+i*g.cellW,g.y+g.h);c.stroke();c.beginPath();c.moveTo(g.x,g.y+i*g.cellH);c.lineTo(g.x+g.w,g.y+i*g.cellH);c.stroke();}
      const sunkCells=new Set(s.enemyShips.filter(ship=>ship.hits.length===ship.cells.length).flatMap(ship=>ship.cells));for(let i=0;i<64;i++){const[r,col]=rc(i,8),x=g.x+(col+.5)*g.cellW,y=g.y+(r+.5)*g.cellH,shot=s.humanShots[i];if(sunkCells.has(i)){c.fillStyle='rgba(43,25,43,.58)';rounded(c,x-g.cellW*.4,y-g.cellH*.28,g.cellW*.8,g.cellH*.56,g.cellH*.2);c.fill();}if(shot===1){c.fillStyle='rgba(225,250,255,.72)';c.beginPath();c.arc(x,y,Math.max(2,g.cell*.07),0,Math.PI*2);c.fill();}else if(shot===2){c.strokeStyle='#ffca62';c.lineWidth=Math.max(3,g.cell*.09);c.beginPath();c.moveTo(x-g.cell*.18,y-g.cell*.18);c.lineTo(x+g.cell*.18,y+g.cell*.18);c.moveTo(x+g.cell*.18,y-g.cell*.18);c.lineTo(x-g.cell*.18,y+g.cell*.18);c.stroke();c.fillStyle='rgba(255,92,91,.35)';c.beginPath();c.arc(x,y,g.cell*.32,0,Math.PI*2);c.fill();}if(this.hintMove?.cell===i){c.strokeStyle='#69ffd1';c.lineWidth=4;c.shadowColor='#69ffd1';c.shadowBlur=14;c.strokeRect(g.x+col*g.cellW+4,g.y+r*g.cellH+4,g.cellW-8,g.cellH-8);c.shadowBlur=0;}}
      c.fillStyle='#d9fbff';c.font='900 10px Outfit';c.textAlign='center';c.fillText('RIVAL WATERS - TAP TO FIRE',this.W/2,g.y-14);
      const baseY=g.y+g.h+18,mini=Math.min(68,this.H-baseY-54),miniX=18,miniCell=mini/8;c.fillStyle='rgba(7,37,65,.82)';c.fillRect(miniX,baseY,mini,mini);for(let i=0;i<64;i++){const[r,col]=rc(i,8),mx=miniX+col*miniCell,my=baseY+r*miniCell;if(s.humanGrid[i]){c.fillStyle='rgba(91,225,208,.65)';c.fillRect(mx+1,my+1,miniCell-2,miniCell-2);}if(s.aiShots[i]===1){c.fillStyle='#dffaff';c.beginPath();c.arc(mx+miniCell/2,my+miniCell/2,1.5,0,Math.PI*2);c.fill();}else if(s.aiShots[i]===2){c.fillStyle='#ff736d';c.beginPath();c.arc(mx+miniCell/2,my+miniCell/2,Math.max(2,miniCell*.25),0,Math.PI*2);c.fill();}}c.strokeStyle='rgba(207,249,255,.28)';c.lineWidth=.7;for(let i=0;i<=8;i++){c.beginPath();c.moveTo(miniX+i*miniCell,baseY);c.lineTo(miniX+i*miniCell,baseY+mini);c.stroke();c.beginPath();c.moveTo(miniX,baseY+i*miniCell);c.lineTo(miniX+mini,baseY+i*miniCell);c.stroke();}
      const shipsX=miniX+mini+14,shipsW=this.W-shipsX-14,gap=4,shipW=(shipsW-gap*3)/4;for(let i=0;i<s.enemyShips.length;i++){const ship=s.enemyShips[i],sx=shipsX+i*(shipW+gap),sunk=ship.hits.length===ship.cells.length;c.fillStyle=sunk?'rgba(255,111,105,.25)':'rgba(91,225,208,.18)';rounded(c,sx,baseY+8,shipW,28,9);c.fill();c.strokeStyle=sunk?'#ff716b':'#68e5d4';c.lineWidth=1;c.stroke();c.fillStyle='#fff';c.font='800 9px Outfit';c.fillText(sunk?'SUNK':`${ship.hits.length}/${ship.length}`,sx+shipW/2,baseY+22);}
      const ownAlive=s.humanShips.filter(ship=>ship.hits.length<ship.cells.length).length;c.fillStyle='rgba(230,247,255,.72)';c.font='700 9px Outfit';c.fillText(`YOUR WATERS ${ownAlive}/4`,miniX+mini/2,baseY+mini+12);c.fillText('RIVAL SHIPS',shipsX+shipsW/2,baseY+49);
    }

    _drawCode(){
      const c=this.ctx,s=this.state,W=this.W,H=this.H,margin=18,top=94,rowH=Math.max(28,Math.min(40,(H-285)/Math.max(6,s.maxGuesses))),historyH=rowH*Math.min(7,s.maxGuesses);c.fillStyle='rgba(15,13,43,.62)';rounded(c,margin,top,W-margin*2,historyH+16,16);c.fill();
      const shown=s.guesses.slice(-7);for(let row=0;row<7;row++){const guess=shown[row],y=top+12+row*rowH+rowH/2;c.fillStyle='rgba(255,255,255,.035)';rounded(c,margin+7,y-rowH*.4,W-margin*2-14,rowH*.8,8);c.fill();c.fillStyle='rgba(255,255,255,.27)';c.font='700 9px Outfit';c.textAlign='right';c.fillText(String(Math.max(1,s.guesses.length-shown.length+row+1)),margin+23,y);
        for(let i=0;i<4;i++){const x=margin+42+i*Math.min(34,(W-145)/4);if(guess)this._crystal(x,y,Math.min(11,rowH*.28),guess.colors[i]);else{c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;c.beginPath();c.arc(x,y,Math.min(9,rowH*.24),0,Math.PI*2);c.stroke();}}
        if(guess){const clueX=W-margin-48;c.fillStyle='#ffe681';c.font='900 11px Outfit';c.textAlign='left';c.fillText(`E ${guess.exact}`,clueX,y-6);c.fillStyle='#cbbdff';c.fillText(`C ${guess.color}`,clueX,y+7);}}
      const draftY=Math.min(H-138,top+historyH+38),slotGap=Math.min(40,(W-130)/4),startX=(W-(slotGap*3))/2-30;this.layout.draft=[];c.fillStyle='rgba(255,255,255,.7)';c.font='800 9px Outfit';c.textAlign='center';c.fillText('YOUR CRYSTAL CODE',W/2,draftY-24);for(let i=0;i<4;i++){const x=startX+i*slotGap,r=15;this.layout.draft.push({x,y:draftY,r,slot:i});if(s.draft[i]!=null)this._crystal(x,draftY,r,s.draft[i]);else{c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.arc(x,draftY,r,0,Math.PI*2);c.stroke();}}
      const action={x:W-92,y:draftY-17,w:78,h:34};this.layout.action=action;this._button(action,'SUBMIT',s.draft.every(v=>v!=null)?'#ffd05a':'#817996');
      const paletteY=H-76,gap=Math.min(44,(W-34)/6),px0=(W-gap*5)/2;this.layout.palette=[];for(let color=0;color<6;color++){const x=px0+color*gap,r=Math.min(15,gap*.33);this.layout.palette.push({x,y:paletteY,r,color});this._crystal(x,paletteY,r,color);}
      if(s.winner){c.fillStyle='rgba(7,8,27,.88)';rounded(c,16,H*.35,W-32,90,18);c.fill();c.fillStyle='#fff3c3';c.font='900 13px Outfit';c.textAlign='center';c.fillText('THE SECRET CODE',W/2,H*.35+22);for(let i=0;i<4;i++)this._crystal(W/2-54+i*36,H*.35+57,14,s.code[i]);}
    }
    _crystal(x,y,r,color){const c=this.ctx,col=CODE_COLORS[color];c.save();c.shadowColor=col;c.shadowBlur=r*.75;const g=c.createRadialGradient(x-r*.3,y-r*.35,1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.25,col);g.addColorStop(1,'#241b48');c.fillStyle=g;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.82,y-r*.25);c.lineTo(x+r*.58,y+r*.72);c.lineTo(x,y+r);c.lineTo(x-r*.58,y+r*.72);c.lineTo(x-r*.82,y-r*.25);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1;c.stroke();c.restore();}

    _drawSnakes(){
      const c=this.ctx,s=this.state,g=this._boardGrid(10,10,96,104);this.layout.grid=g;this._frame(g,'#bde98a','#398267');for(let n=1;n<=100;n++){const pos=this._snakeCell(n),x=g.x+pos.c*g.cellW,y=g.y+pos.r*g.cellH;c.fillStyle=(pos.r+pos.c)%2?'rgba(255,233,164,.85)':'rgba(146,220,170,.88)';c.fillRect(x,y,g.cellW,g.cellH);c.fillStyle='rgba(37,51,65,.55)';c.font=`700 ${Math.max(6,g.cell*.2)}px Outfit`;c.textAlign='left';c.fillText(String(n),x+2,y+Math.max(7,g.cell*.2));}
      for(const[from,to]of Object.entries(LADDERS))this._drawTransport(g,+from,to,'#ffd45e',false);for(const[from,to]of Object.entries(SNAKES))this._drawTransport(g,+from,to,'#8d54c9',true);
      const h=this._snakeCenter(g,s.positions.human),a=this._snakeCenter(g,s.positions.ai);this._stone(h.x-g.cell*.11,h.y,g.cell*.2,HUMAN);this._stone(a.x+g.cell*.11,a.y,g.cell*.2,AI);const action={x:this.W-94,y:this.H-67,w:82,h:36};this.layout.action=action;this._button(action,'ROLL','#ffd05a');this._drawSmallScore(`${s.positions.human}  -  ${s.positions.ai}`,g.x,g.y-13);
    }
    _snakeCell(n){const zero=n-1,rowFromBottom=Math.floor(zero/10),offset=zero%10,c=rowFromBottom%2?9-offset:offset;return{r:9-rowFromBottom,c};}
    _snakeCenter(g,n){const p=this._snakeCell(n);return{x:g.x+(p.c+.5)*g.cellW,y:g.y+(p.r+.5)*g.cellH};}
    _drawTransport(g,from,to,color,wavy){const c=this.ctx,a=this._snakeCenter(g,from),b=this._snakeCenter(g,to);c.save();c.strokeStyle=color;c.lineWidth=Math.max(2,g.cell*.1);c.globalAlpha=.72;c.beginPath();c.moveTo(a.x,a.y);if(wavy){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;c.quadraticCurveTo(mx+g.cell*.7,my,a.x*.0+b.x,b.y);}else c.lineTo(b.x,b.y);c.stroke();c.globalAlpha=1;if(!wavy){c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1;for(let t=.18;t<.9;t+=.18){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;c.beginPath();c.moveTo(x-g.cell*.15,y);c.lineTo(x+g.cell*.15,y);c.stroke();}}c.restore();}

    _drawBackgammon(){
      const c=this.ctx,s=this.state,top=106,bh=Math.max(170,this.H-216),x=13,w=this.W-26,cell=w/12;this.layout.board={x,y:top,w,h:bh};this.layout.cell=cell;this.layout.off={x:this.W-79,y:this.H-66,w:67,h:34};this._frame(this.layout.board,'#c9895a','#5b3040');const wood=c.createLinearGradient(x,top,x+w,top+bh);wood.addColorStop(0,'#8e4e47');wood.addColorStop(.5,'#d79760');wood.addColorStop(1,'#673643');c.fillStyle=wood;c.fillRect(x,top,w,bh);
      for(let col=0;col<12;col++){const px=x+col*cell,alt=col%2===0;c.fillStyle=alt?'rgba(255,224,148,.82)':'rgba(78,38,72,.75)';c.beginPath();c.moveTo(px,top);c.lineTo(px+cell,top);c.lineTo(px+cell/2,top+bh*.43);c.closePath();c.fill();c.fillStyle=!alt?'rgba(255,224,148,.82)':'rgba(78,38,72,.75)';c.beginPath();c.moveTo(px,top+bh);c.lineTo(px+cell,top+bh);c.lineTo(px+cell/2,top+bh*.57);c.closePath();c.fill();}
      c.fillStyle='rgba(35,18,43,.75)';c.fillRect(x+w/2-cell*.16,top,cell*.32,bh);c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=2;c.strokeRect(x+w/2-cell*.16,top,cell*.32,bh);
      for(let point=0;point<24;point++){const value=s.points[point];if(!value)continue;const bottom=point<12,col=bottom?point:23-point,dir=bottom?-1:1,base=bottom?top+bh-cell*.34:top+cell*.34;const shown=Math.min(5,Math.abs(value));for(let k=0;k<shown;k++)this._stone(x+(col+.5)*cell,base+dir*k*cell*.58,cell*.28,owner(value));if(Math.abs(value)>5){c.fillStyle='#fff';c.font='900 9px Outfit';c.textAlign='center';c.fillText(Math.abs(value),x+(col+.5)*cell,base+dir*4*cell*.58+3);}}
      if(this.selected!=null&&this.selected!=='bar'){const bottom=this.selected<12,col=bottom?this.selected:23-this.selected;c.strokeStyle='#62ffd0';c.lineWidth=3;c.strokeRect(x+col*cell+2,bottom?top+bh/2:top+2,cell-4,bh/2-4);}
      c.fillStyle='rgba(15,10,33,.82)';rounded(c,this.W/2-42,top+bh/2-18,84,36,12);c.fill();c.fillStyle='#fff2c1';c.font='900 10px Outfit';c.textAlign='center';c.fillText(`BAR ${s.bar.human} / ${s.bar.ai}`,this.W/2,top+bh/2);if(s.dice.length){for(let i=0;i<s.dice.length;i++)this._die(this.W/2+(i-(s.dice.length-1)/2)*31,top+bh/2+38,s.dice[i],13);}
      const action={x:this.W-91,y:this.H-66,w:79,h:34};this.layout.action=action;if(!s.dice.length)this._button(action,'ROLL','#ffd05a');else this._button(this.layout.off,'BEAR OFF','#62d8bd');this._drawSmallScore(`${s.off.human} OFF - ${s.off.ai} OFF`,x,top-14);
    }
    _die(x,y,n,r){const c=this.ctx;c.fillStyle='#fff6d5';rounded(c,x-r,y-r,r*2,r*2,5);c.fill();c.fillStyle='#322344';const pts={1:[[0,0]],2:[[-.45,-.45],[.45,.45]],3:[[-.45,-.45],[0,0],[.45,.45]],4:[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]],5:[[-.45,-.45],[.45,-.45],[0,0],[-.45,.45],[.45,.45]],6:[[-.45,-.5],[.45,-.5],[-.45,0],[.45,0],[-.45,.5],[.45,.5]]};for(const[dx,dy]of pts[n]||pts[1]){c.beginPath();c.arc(x+dx*r,y+dy*r,Math.max(1.7,r*.13),0,Math.PI*2);c.fill();}}

    _drawLudo(){
      const c=this.ctx,s=this.state,size=Math.min(this.W-32,this.H-200),cell=size/11,x=(this.W-size)/2,y=99,colors=['#ffd55d','#8d74f2','#52d8bd','#ff758d'];this.layout.tokens=[];const route=this._ludoRoute();c.fillStyle='rgba(255,255,255,.08)';rounded(c,x-12,y-12,size+24,size+24,18);c.fill();
      for(let i=0;i<40;i++){const q=route[i],cx=x+(q.c+.5)*cell,cy=y+(q.r+.5)*cell;c.fillStyle=LUDO_SAFE.has(i)?'rgba(255,238,161,.75)':'rgba(255,255,255,.24)';rounded(c,cx-cell*.43,cy-cell*.43,cell*.86,cell*.86,cell*.16);c.fill();c.strokeStyle='rgba(255,255,255,.18)';c.stroke();if(LUDO_SAFE.has(i)){c.fillStyle='#fff7c7';c.font=`900 ${cell*.3}px Outfit`;c.textAlign='center';c.fillText('*',cx,cy+cell*.12);}}
      c.fillStyle='rgba(255,255,255,.1)';c.beginPath();c.arc(x+size/2,y+size/2,cell*1.25,0,Math.PI*2);c.fill();for(let p=0;p<4;p++){const start=route[LUDO_START[p]],sx=x+(start.c+.5)*cell,sy=y+(start.r+.5)*cell;c.strokeStyle=colors[p];c.lineWidth=3;c.beginPath();c.arc(sx,sy,cell*.46,0,Math.PI*2);c.stroke();for(let k=1;k<=5;k++){const t=k/6,cx=sx+(x+size/2-sx)*t,cy=sy+(y+size/2-sy)*t;c.fillStyle=colors[p]+'55';c.beginPath();c.arc(cx,cy,cell*.29,0,Math.PI*2);c.fill();}}
      for(let p=0;p<4;p++)for(let token=0;token<2;token++){const progress=s.players[p].pawns[token],pos=this._ludoTokenPoint(p,token,progress,route,x,y,cell,size),r=cell*.27;this._coloredPawn(pos.x,pos.y,r,colors[p],p===0);this.layout.tokens.push({player:p,token,x:pos.x,y:pos.y,r});}
      if(s.die!=null)this._die(this.W/2,this.H-62,s.die,15);const action={x:this.W-91,y:this.H-67,w:79,h:36};this.layout.action=action;if(s.current===0&&s.die==null)this._button(action,'ROLL','#ffd05a');this._drawSmallScore(`YOU ${s.players[0].pawns.filter(v=>v===44).length}/2  -  AI BEST ${Math.max(...s.players.slice(1).map(p=>p.pawns.filter(v=>v===44).length))}/2`,x,y-14);
    }
    _ludoRoute(){const out=[];for(let i=0;i<10;i++)out.push({r:0,c:i});for(let i=0;i<10;i++)out.push({r:i,c:10});for(let i=0;i<10;i++)out.push({r:10,c:10-i});for(let i=0;i<10;i++)out.push({r:10-i,c:0});return out;}
    _ludoTokenPoint(player,token,progress,route,x,y,cell,size){if(progress<0){const corners=[[2.2,2.2],[8.8,2.2],[8.8,8.8],[2.2,8.8]],q=corners[player];return{x:x+(q[0]+(token? .35:-.35))*cell,y:y+q[1]*cell};}if(progress<40){const q=route[(progress+LUDO_START[player])%40];return{x:x+(q.c+.5)*cell+(token?cell*.09:-cell*.09),y:y+(q.r+.5)*cell};}const q=route[LUDO_START[player]],sx=x+(q.c+.5)*cell,sy=y+(q.r+.5)*cell,t=(progress-39)/6;return{x:sx+(x+size/2-sx)*t+(token?cell*.07:-cell*.07),y:sy+(y+size/2-sy)*t};}
    _coloredPawn(x,y,r,color,human){const c=this.ctx;c.save();c.shadowColor=color;c.shadowBlur=r;c.fillStyle=color;c.beginPath();c.arc(x,y-r*.35,r*.55,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-r*.72,y+r*.7);c.quadraticCurveTo(x-r*.45,y-r*.05,x,y-r*.05);c.quadraticCurveTo(x+r*.45,y-r*.05,x+r*.72,y+r*.7);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle=human?'#fff7cf':'rgba(255,255,255,.65)';c.lineWidth=2;c.stroke();c.restore();}
  };
}
