import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/assets/js/boardgames.js', import.meta.url), 'utf8');
const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const {
  AI, HUMAN, BOARD_VARIANTS, BOARD_VARIANT_IDS, applyRuleMove, checkLineWinner,
  chooseAIMove, createInitialState, createSeededRandom, evaluateTerminal,
  legalMovesFor, resolveBoardVariant, scoreCodeGuess,
} = mod;

const sameMove = (a, b) => ['cell','col','from','to','capture','pit','axis','r','c','remove','place','token','pass','roll']
  .every(key => a[key] === b[key] || (a[key] == null && b[key] == null));

assert.equal(BOARD_VARIANT_IDS.length, 16);
assert.equal(new Set(BOARD_VARIANT_IDS).size, 16);
for (const id of BOARD_VARIANT_IDS) {
  assert.ok(BOARD_VARIANTS[id].instructions.length > 30, `${id} has instructions`);
  const a = createInitialState(id, 1234);
  const b = createInitialState(id, 1234);
  assert.deepEqual(a, b, `${id} setup is seeded`);
  assert.equal(a.id, id);
}
assert.equal(resolveBoardVariant({ slug: 'crownlight-chess' }).id, 'chess');
assert.equal(resolveBoardVariant({ boardVariant: 'battleship' }).id, 'treasure-fleet');
assert.equal(createSeededRandom(99)(), createSeededRandom(99)());

// Line games.
assert.equal(checkLineWinner([1,1,1,0,0,0,0,0,0], 3, 3, 3), HUMAN);
let s = createInitialState('tic-tac-toe');
s = applyRuleMove(s, s.id, { cell: 0 });
assert.equal(s.board[0], HUMAN);
assert.equal(s.turn, AI);
s = { ...createInitialState('tic-tac-toe'), board: [1,1,0,-1,-1,0,0,0,0], turn: HUMAN };
s = applyRuleMove(s, s.id, { cell: 2 });
assert.equal(s.winner, HUMAN);

s = createInitialState('connect-four');
for (const col of [0,1,0,1,0,1,0]) s = applyRuleMove(s, s.id, { col });
assert.equal(s.winner, HUMAN);

s = createInitialState('gomoku');
s.board.splice(0, 5, 1,1,1,1,0); s.turn = HUMAN;
s = applyRuleMove(s, s.id, { cell: 4 });
assert.equal(s.winner, HUMAN);

s = createInitialState('hex');
for (let c = 0; c < 8; c++) s.board[c] = HUMAN;
s.turn = HUMAN;
s = applyRuleMove(s, s.id, { cell: 8 });
assert.equal(s.winner, HUMAN);

// Capture/movement games.
s = createInitialState('reversi');
assert.equal(legalMovesFor(s).length, 4);
const rev = legalMovesFor(s)[0];
const beforeMoon = s.board.filter(v => v === AI).length;
s = applyRuleMove(s, s.id, rev);
assert.ok(s.board.filter(v => v === AI).length < beforeMoon);

s = createInitialState('chess');
assert.equal(legalMovesFor(s).length, 20);
s = applyRuleMove(s, s.id, { from: 52, to: 36 });
assert.equal(s.board[36], 'P');
assert.equal(s.board[52], '');
// Fool's mate exercises check legality and checkmate rather than king capture.
s = createInitialState('chess');
for (const move of [{from:53,to:45},{from:12,to:28},{from:54,to:38},{from:3,to:39}]) s = applyRuleMove(s, s.id, move);
assert.equal(s.winner, AI);

s = createInitialState('checkers');
s.board = Array(64).fill(0); s.board[42] = HUMAN; s.board[33] = AI; s.board[17] = AI;
let moves = legalMovesFor(s);
assert.equal(moves.length, 1);
assert.equal(moves[0].capture, 33);
s = applyRuleMove(s, s.id, moves[0]);
assert.equal(s.board[24], HUMAN);
assert.equal(s.board[33], 0);
assert.equal(s.forcedFrom, 24);
assert.equal(s.turn, HUMAN);
s = applyRuleMove(s, s.id, legalMovesFor(s)[0]);
assert.equal(s.board[10], HUMAN);
assert.equal(s.board[17], 0);
assert.equal(s.turn, AI);

s = createInitialState('nine-mens-morris');
s.board[0] = HUMAN; s.board[1] = HUMAN; s.placed.human = 2;
s = applyRuleMove(s, s.id, { to: 2, place: true });
assert.equal(s.removeBy, HUMAN);

// Sowing and edge-chain rules.
s = createInitialState('mancala');
s = applyRuleMove(s, s.id, { pit: 2 });
assert.equal(s.turn, HUMAN, 'own-store landing grants another turn');
assert.equal(s.pits.reduce((a, b) => a + b, 0), 48);

s = createInitialState('dots-and-boxes');
s.h[0][0] = HUMAN; s.h[1][0] = AI; s.v[0][0] = HUMAN;
s = applyRuleMove(s, s.id, { axis: 'v', r: 0, c: 1 });
assert.equal(s.boxes[0][0], HUMAN);
assert.equal(s.scores.human, 1);
assert.equal(s.turn, HUMAN);
s = createInitialState('dots-and-boxes');
s.h[0][0]=s.h[1][0]=s.v[0][0]=HUMAN;
s.h[0][1]=s.h[1][1]=s.v[0][2]=AI;
s = applyRuleMove(s, s.id, { axis:'v', r:0, c:1 });
assert.equal(s.lastMove.boxes, 2, 'one edge may complete two boxes');
assert.equal(s.scores.human, 2);

s = createInitialState('nine-mens-morris');
s.placed = { human: 9, ai: 9 }; s.board = Array(24).fill(0); s.board[0]=s.board[1]=s.board[3]=HUMAN; s.board[4]=s.board[5]=s.board[6]=s.board[7]=AI;
assert.ok(legalMovesFor(s).some(m => m.from === 0 && m.to === 23), 'three lanterns may fly');

// Go capture, suicide protection and two-pass score.
s = createInitialState('go-9x9');
s.board[40] = AI; s.board[31] = HUMAN; s.board[39] = HUMAN; s.board[49] = HUMAN;
s = applyRuleMove(s, s.id, { cell: 41 });
assert.equal(s.board[40], 0);
assert.equal(s.captures.human, 1);
s = applyRuleMove(s, s.id, { pass: true });
s = applyRuleMove(s, s.id, { pass: true });
assert.ok(s.winner);
assert.ok(s.finalScore);
s = createInitialState('go-9x9');
s.board[31]=s.board[39]=s.board[41]=s.board[49]=AI;
assert.equal(legalMovesFor(s).some(m => m.cell === 40), false, 'suicide is illegal');

// Hidden-information games.
s = createInitialState('treasure-fleet', 88);
const target = s.enemyShips[0].cells[0];
s = applyRuleMove(s, s.id, { cell: target });
assert.equal(s.humanShots[target], 2);
assert.equal(s.enemyShips[0].hits.length, 1);
const shotSnapshot = structuredClone(s); s.turn = HUMAN;
assert.deepEqual(applyRuleMove(s, s.id, { cell: target }), s, 'repeat fleet shot is ignored');
assert.deepEqual(scoreCodeGuess([0,0,1,2], [0,1,0,2]), { exact: 2, color: 2 });
s = createInitialState('codebreaker', 7);
s.draft = s.code.slice();
s = applyRuleMove(s, s.id, { type: 'submit' });
s = applyRuleMove(s, s.id, { type: 'resolve' });
assert.equal(s.winner, HUMAN);

// Dice races.
s = createInitialState('snakes-and-ladders');
s = applyRuleMove(s, s.id, { roll: true, rollValue: 1 }, createSeededRandom(2));
assert.equal(s.positions.human, 23, 'square 2 ladder resolves once');

s = createInitialState('backgammon');
s = applyRuleMove(s, s.id, { roll: true }, createSeededRandom(3));
assert.equal(s.dice.length, 2);
moves = legalMovesFor(s).filter(m => !m.roll);
assert.ok(moves.length);
s = applyRuleMove(s, s.id, moves[0], createSeededRandom(3));
assert.equal(s.dice.length, 1);
s = createInitialState('backgammon');
s = applyRuleMove(s, s.id, { roll:true, dice:[6,6] }, createSeededRandom(3));
assert.deepEqual(s.dice, [6,6], 'rewarded lucky roll is deterministic');
s = createInitialState('backgammon');
s.points = Array(24).fill(0); s.bar = { human: 1, ai: 0 }; s.points[0] = AI; s.dice = [1];
s = applyRuleMove(s, s.id, { from:'bar', to:0, dieIndex:0, die:1 }, createSeededRandom(3));
assert.equal(s.points[0], HUMAN); assert.equal(s.bar.human, 0); assert.equal(s.bar.ai, 1);

s = createInitialState('cross-and-crown');
s = applyRuleMove(s, s.id, { roll: true, rollValue: 6 }, createSeededRandom(4));
assert.equal(s.die, 6);
s = applyRuleMove(s, s.id, legalMovesFor(s).find(m => m.token === 0), createSeededRandom(4));
assert.equal(s.players[0].pawns[0], 0);
assert.equal(s.current, 0, 'rolling six grants another turn');
s = createInitialState('cross-and-crown');
s.players[0].pawns[0]=0; s.players[1].pawns[0]=35; s.die=5;
s = applyRuleMove(s, s.id, { token:0, to:5 }, createSeededRandom(4));
assert.equal(s.players[1].pawns[0], -1, 'landing on an unsafe rival sends it home');

// AI always returns a legal action for representative initial AI states.
for (const id of BOARD_VARIANT_IDS.filter(id => id !== 'codebreaker')) {
  s = createInitialState(id, 101);
  if (id === 'cross-and-crown') { s.current = 1; s.turn = AI; }
  else s.turn = AI;
  const rng = createSeededRandom(202);
  const move = chooseAIMove(s, id, rng);
  assert.ok(move, `${id} AI returns a move`);
  const legal = legalMovesFor(s, id, AI);
  assert.ok(legal.some(candidate => sameMove(candidate, move)), `${id} AI move is legal`);
}

// Short seeded playouts catch phase-transition errors (roll -> move, mill ->
// remove, jump chains, extra turns) beyond the forced fixtures above.
for (const id of BOARD_VARIANT_IDS) {
  const rng = createSeededRandom(707 + BOARD_VARIANT_IDS.indexOf(id));
  s = createInitialState(id, 909);
  for (let ply=0; ply<140 && !s.winner && !s.draw; ply++) {
    let move;
    if (id === 'codebreaker') {
      if (s.turn === AI) move = { type:'resolve' };
      else if (s.draft.some(v => v == null)) move = { type:'set', color:rng.int(6) };
      else move = { type:'submit' };
    } else {
      const aiTurn = id === 'cross-and-crown' ? s.current !== 0 : s.turn === AI;
      const legal = legalMovesFor(s, id, s.turn);
      assert.ok(legal.length, `${id} has a legal phase action at ply ${ply}`);
      move = aiTurn ? chooseAIMove(s, id, rng) : legal[rng.int(legal.length)];
    }
    const next = applyRuleMove(s, id, move, rng);
    assert.notEqual(next, s, `${id} accepted its chosen action at ply ${ply}`);
    s = next;
  }
}

assert.equal(evaluateTerminal({ winner: HUMAN, draw: false }).terminal, true);

// Canvas-class smoke: every variant renders at two responsive sizes and can
// execute a delayed AI turn without relying on browser-only drawing assets.
const gradient = () => ({ addColorStop() {} });
const fakeContext = () => new Proxy({
  createLinearGradient: gradient, createRadialGradient: gradient,
  measureText: text => ({ width: String(text).length * 6.5 }),
}, { get(target, prop) { if (prop in target) return target[prop]; return () => {}; } });
const fakeSound = { blip() {}, power() {}, hit() {}, over() {} };
class FakeBase {
  constructor(_mount, game, theme = {}, sound = fakeSound) {
    Object.assign(this, { game, theme, sound, W: 420, H: 620, ctx: fakeContext(), time: 0, score: 0, lives: 0,
      started: true, running: true, over: false, pointer: { x: 0, y: 0, tapped: false }, particles: [], floats: [], rings: [],
      comboEl: { textContent: '', style: {} } });
  }
  setScore(v) { this.score = v; }
  addScore(v) { this.score += v; }
  drawLives() {}
  applyShake() {}
  drawFx() {}
  ring() {}
  burst() {}
  confetti() {}
  flash() {}
  applyReward() { return true; }
  showOver() { this.over = true; }
}
const Arena = mod.createBoardArena(FakeBase);
for (const id of BOARD_VARIANT_IDS) {
  const arena = new Arena(null, { slug: `test-${id}`, title: BOARD_VARIANTS[id].title, boardVariant: id }, { primary: '#8a5cff', accent: '#ffd166' }, fakeSound);
  arena.reset(); arena.render();
  assert.ok(arena.layout && Object.keys(arena.layout).length, `${id} produced canvas layout`);
  const publicState = JSON.parse(arena.renderText());
  if (id === 'treasure-fleet') assert.equal('enemyGrid' in publicState, false);
  if (id === 'codebreaker') assert.equal('secret' in publicState, false);
  arena.W = 300; arena.H = 430; arena.render();
  if (id !== 'codebreaker') {
    if (id === 'cross-and-crown') { arena.state.current = 1; arena.state.turn = AI; }
    else arena.state.turn = AI;
    arena.update(1); arena.update(1); arena.render();
  }
}

let arena = new Arena(null, { slug:'tap-ttt', title:'Tap Trio', boardVariant:'tic-tac-toe' }, { primary:'#8a5cff', accent:'#ffd166' }, fakeSound);
arena.reset(); arena.render();
arena._handleTap(arena.layout.grid.x + arena.layout.grid.cellW / 2, arena.layout.grid.y + arena.layout.grid.cellH / 2);
assert.equal(arena.state.board[0], HUMAN, 'pointer hit maps to the visible grid cell');
arena.update(1); assert.equal(arena.aiThinking, true, 'AI exposes a visible thinking phase');
arena.update(1); assert.equal(arena.state.board.filter(v => v === AI).length, 1, 'AI replies after the delay');

arena = new Arena(null, { slug:'tap-code', title:'Tap Code', boardVariant:'codebreaker' }, { primary:'#8a5cff', accent:'#ffd166' }, fakeSound);
arena.reset(); arena.render();
for (let i=0;i<4;i++) arena._handleTap(arena.layout.palette[i].x, arena.layout.palette[i].y);
assert.ok(arena.state.draft.every(v => v != null));
arena._handleTap(arena.layout.action.x + 4, arena.layout.action.y + 4);
assert.equal(arena.state.turn, AI);
arena.update(1); arena.update(1);
assert.equal(arena.state.guesses.length, 1, 'code keeper returns feedback after thinking');
console.log(`boardgames smoke tests passed (${BOARD_VARIANT_IDS.length} variants)`);
