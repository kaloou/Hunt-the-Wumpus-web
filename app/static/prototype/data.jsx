/* ============================================================
   data.jsx — constants, map generator, seeds, scoring,
   leaderboard, log lines, adjacency helpers.
   Exposes everything on `window` for cross-script use.
============================================================ */

const ROW = 6;
const COL = 8;

// Tile paths
const CAVE   = 1;
const ULDR   = 3;   // "\"  — Upper-Left ↔ Down-Right
const URDL   = 4;   // "/"  — Upper-Right ↔ Down-Left
const PIT    = 6;

// Effects / entities
const BLOOD  = "blood";
const SLIME  = "slime";
const WUMPUS = "W";
const BAT    = "B";
const PLAYER = "P";

// Directions: [dy, dx]
const DIR = {
  up:    [-1, 0],
  down:  [ 1, 0],
  left:  [ 0,-1],
  right: [ 0, 1],
};
const DIR_NAMES = ["up","right","down","left"];
const DIR_ARROWS = { up: "↑", down: "↓", left: "←", right: "→" };

const LEVELS = {
  easy:   { label: "Easy",   bats: 1, corridors: [8, 14],  multiplier: 1.0 },
  normal: { label: "Normal", bats: 2, corridors: [16, 20], multiplier: 1.5 },
  hard:   { label: "Hard",   bats: 2, corridors: [24, 28], multiplier: 2.0 },
};

/* -----------------------------------------------------------
   Seeded PRNG (mulberry32) — deterministic per seed
----------------------------------------------------------- */
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rnd(rng, n) { return Math.floor(rng() * n); }
function pickAndRemove(arr, rng) {
  const i = rnd(rng, arr.length);
  return arr.splice(i, 1)[0];
}

/* -----------------------------------------------------------
   Map generation — port of map_generator.py (simplified)
----------------------------------------------------------- */
function newCell() {
  return { path: 0, effects: [], entities: [], seen: false };
}
function makeGrid() {
  return Array.from({length: ROW}, () =>
    Array.from({length: COL}, () => newCell())
  );
}

function generateMap(seed, difficulty) {
  const rng = mulberry32(seed);
  const lv = LEVELS[difficulty];
  const nbCorridors = lv.corridors[0] + rnd(rng, lv.corridors[1] - lv.corridors[0] + 1);
  const nbCaves = ROW * COL - nbCorridors;
  const nbBats = lv.bats;
  const nbPits = 2;

  const grid = makeGrid();

  // Bag of cells: 1 = cave, 2 = tunnel
  const bag = [];
  for (let i = 0; i < nbCaves; i++) bag.push(CAVE);
  for (let i = 0; i < nbCorridors; i++) bag.push(2); // tunnel placeholder

  // Fill grid
  for (let y = 0; y < ROW; y++) {
    for (let x = 0; x < COL; x++) {
      const cell = pickAndRemove(bag, rng);
      if (cell === CAVE) grid[y][x].path = CAVE;
      else grid[y][x].path = rng() < 0.5 ? ULDR : URDL;
    }
  }

  // Helper to pick random cave
  function randomCave(predicate) {
    const candidates = [];
    for (let y = 0; y < ROW; y++) {
      for (let x = 0; x < COL; x++) {
        if (grid[y][x].path === CAVE && predicate(y, x, grid[y][x])) {
          candidates.push([y, x]);
        }
      }
    }
    if (!candidates.length) return null;
    return candidates[rnd(rng, candidates.length)];
  }

  // Place pits
  const pits = [];
  for (let i = 0; i < nbPits; i++) {
    const p = randomCave((y, x, c) => c.path === CAVE);
    if (p) { grid[p[0]][p[1]].path = PIT; pits.push(p); }
  }

  // Place wumpus
  let wumpus = randomCave((y, x, c) => c.entities.length === 0);
  if (!wumpus) wumpus = [0, 0];
  grid[wumpus[0]][wumpus[1]].entities.push(WUMPUS);

  // Place bats
  const bats = [];
  let safety = 200;
  while (bats.length < nbBats && safety-- > 0) {
    const b = randomCave((y, x, c) =>
      c.entities.length === 0
    );
    if (!b) break;
    grid[b[0]][b[1]].entities.push(BAT);
    bats.push(b);
  }

  // Place slime adjacent to pits (one ring of caves)
  for (const p of pits) {
    for (const dirName of DIR_NAMES) {
      const [dy, dx] = DIR[dirName];
      const target = nextCave(grid, p[0], p[1], dy, dx);
      if (target) {
        const [ty, tx] = target.cell;
        if (grid[ty][tx].path === CAVE && !grid[ty][tx].effects.includes(SLIME)) {
          grid[ty][tx].effects.push(SLIME);
        }
      }
    }
  }
  // Place blood adjacent to wumpus
  for (const dirName of DIR_NAMES) {
    const [dy, dx] = DIR[dirName];
    const target = nextCave(grid, wumpus[0], wumpus[1], dy, dx);
    if (target) {
      const [ty, tx] = target.cell;
      if (grid[ty][tx].path === CAVE && !grid[ty][tx].effects.includes(BLOOD)) {
        grid[ty][tx].effects.push(BLOOD);
      }
    }
  }

  // Place player on a safe cave
  let player = randomCave((y, x, c) =>
    c.entities.length === 0 &&
    c.effects.length === 0 &&
    c.path === CAVE
  );
  if (!player) player = [0, 0];
  grid[player[0]][player[1]].seen = true;

  // Mark caves of the player's starting visible tile via revealAround
  revealFrom(grid, player[0], player[1]);

  return {
    seed,
    difficulty,
    grid,
    player,
    wumpus,
    bats,
    pits,
    nbCorridors,
  };
}

/* -----------------------------------------------------------
   Adjacency — walk through tunnels until next CAVE or PIT.
   Returns {cell: [y,x], path: [[y,x], ...]} or null.
----------------------------------------------------------- */
function deflect(pathType, dy, dx) {
  if (pathType === ULDR) {
    // \  :  UP↔LEFT, DOWN↔RIGHT
    if (dy === -1) return [0, -1];
    if (dy === 1)  return [0, 1];
    if (dx === -1) return [-1, 0];
    if (dx === 1)  return [1, 0];
  }
  if (pathType === URDL) {
    // /  :  UP↔RIGHT, DOWN↔LEFT
    if (dy === -1) return [0, 1];
    if (dy === 1)  return [0, -1];
    if (dx === -1) return [1, 0];
    if (dx === 1)  return [-1, 0];
  }
  return [dy, dx];
}

function nextCave(grid, y, x, dy, dx) {
  const path = [];
  let cy = y, cx = x;
  for (let step = 0; step < 50; step++) {
    cy = (cy + dy + ROW) % ROW;
    cx = (cx + dx + COL) % COL;
    if (cy === y && cx === x) return null; // looped
    const cell = grid[cy][cx];
    if (cell.path === CAVE || cell.path === PIT) {
      return { cell: [cy, cx], path };
    }
    path.push([cy, cx]);
    [dy, dx] = deflect(cell.path, dy, dx);
  }
  return null;
}

/* Reveal current cave + all 4 neighbor caves (and intervening tunnels) */
function revealFrom(grid, y, x) {
  grid[y][x].seen = true;
  for (const dirName of DIR_NAMES) {
    const [dy, dx] = DIR[dirName];
    const target = nextCave(grid, y, x, dy, dx);
    if (target) {
      const [ty, tx] = target.cell;
      grid[ty][tx].seen = true;
      // Reveal tunnel pieces on the way
      for (const [py, px] of target.path) grid[py][px].seen = true;
    }
  }
}

/* -----------------------------------------------------------
   Arrow flight — through one cave (easy), 2 (normal), 3 (hard).
   Returns { path: [{y,x,path}...], hit: "wumpus"|"wall"|null, lastCave }
----------------------------------------------------------- */
function fireArrow(grid, fromY, fromX, dirName, difficulty) {
  const maxCaves = difficulty === "easy" ? 1 : difficulty === "normal" ? 2 : 3;
  const [startDy, startDx] = DIR[dirName];
  let dy = startDy, dx = startDx;
  let y = fromY, x = fromX;
  const path = [];
  let cavesPassed = 0;
  let hit = null;
  let lastCave = null;

  for (let step = 0; step < 80; step++) {
    const ny = (y + dy + ROW) % ROW;
    const nx = (x + dx + COL) % COL;
    if (ny === fromY && nx === fromX && step > 0) {
      hit = "wall"; break;
    }
    const cell = grid[ny][nx];
    path.push({ y: ny, x: nx, path: cell.path });
    if (cell.path === CAVE || cell.path === PIT) {
      lastCave = [ny, nx];
      cavesPassed++;
      if (cell.entities.includes(WUMPUS)) { hit = "wumpus"; break; }
      if (cavesPassed >= maxCaves) { hit = "end"; break; }
    } else {
      [dy, dx] = deflect(cell.path, dy, dx);
    }
    y = ny; x = nx;
  }
  return { path, hit, lastCave };
}

/* -----------------------------------------------------------
   Scoring — 1000 − moves×10 − seconds, × multiplier, clamped 0+
----------------------------------------------------------- */
function computeScore({ moves, seconds, difficulty }) {
  const base = 1000 - moves * 10 - seconds;
  const m = LEVELS[difficulty].multiplier;
  return Math.max(0, Math.round(base * m));
}

/* -----------------------------------------------------------
   Activity-log copy bank — mix of system + flavor
----------------------------------------------------------- */
const LOG_FLAVOR = {
  smellWumpus: [
    "A musk like rot drifts from somewhere close.",
    "Your throat tightens. The Wumpus is near.",
    "Something old breathes in the dark.",
  ],
  draft: [
    "Cold air whispers up through stone.",
    "A pit yawns somewhere just beyond your boots.",
  ],
  squeak: [
    "Leather wings rasp against the ceiling.",
    "Something is squeaking. Not your boots.",
  ],
  bat: [
    "Claws lock around your shoulders. The torch spins.",
    "The bat lifts you. The world becomes wing and wind.",
  ],
  arrow: [
    "The shaft hisses into the dark.",
    "Your arrow finds only stone.",
  ],
  hit: [
    "A roar. Then silence. The Wumpus is dead.",
    "Bowstring sings. Something heavy falls.",
  ],
  pit: [
    "The floor was a lie. You fall.",
  ],
  devoured: [
    "Teeth like cave-mouths. You do not finish your scream.",
  ],
};

function pickFlavor(rng, key) {
  const arr = LOG_FLAVOR[key];
  if (!arr) return null;
  return arr[Math.floor(rng() * arr.length)];
}

/* -----------------------------------------------------------
   Leaderboard — 20 entries, "cave_diver_07" pinned at #4
----------------------------------------------------------- */
const LEADERBOARD = [
  { rank: 1,  name: "bat_whisperer",  score: 1342, time: "07:11", moves: 18, level: "hard",   when: "2d" },
  { rank: 2,  name: "echo_dweller",   score: 1298, time: "08:02", moves: 22, level: "hard",   when: "5d" },
  { rank: 3,  name: "lampless",       score: 1181, time: "06:54", moves: 24, level: "normal", when: "1d" },
  { rank: 4,  name: "cave_diver_07",  score:  840, time: "09:24", moves: 22, level: "normal", when: "now", you: true },
  { rank: 5,  name: "tarwick",        score:  788, time: "10:30", moves: 28, level: "easy",   when: "3d" },
  { rank: 6,  name: "moss_lump",      score:  662, time: "11:08", moves: 30, level: "normal", when: "6d" },
  { rank: 7,  name: "wax_drip",       score:  544, time: "12:55", moves: 35, level: "easy",   when: "4d" },
  { rank: 8,  name: "kobold",         score:  521, time: "14:01", moves: 38, level: "normal", when: "1w" },
  { rank: 9,  name: "stalagmite_jim", score:  498, time: "13:22", moves: 41, level: "easy",   when: "2w" },
  { rank: 10, name: "rope_eater",     score:  455, time: "15:48", moves: 44, level: "hard",   when: "1w" },
  { rank: 11, name: "blackvein",      score:  422, time: "16:30", moves: 47, level: "normal", when: "3d" },
  { rank: 12, name: "geode",          score:  388, time: "17:11", moves: 49, level: "easy",   when: "4d" },
  { rank: 13, name: "lichen_07",      score:  351, time: "18:09", moves: 52, level: "easy",   when: "5d" },
  { rank: 14, name: "draft",          score:  320, time: "19:21", moves: 55, level: "normal", when: "1w" },
  { rank: 15, name: "anhydrite",      score:  290, time: "20:02", moves: 58, level: "easy",   when: "2w" },
  { rank: 16, name: "marlowe",        score:  264, time: "21:45", moves: 61, level: "hard",   when: "3w" },
  { rank: 17, name: "candlewick",     score:  240, time: "22:18", moves: 65, level: "normal", when: "1m" },
  { rank: 18, name: "tinroof",        score:  211, time: "23:50", moves: 68, level: "easy",   when: "1m" },
  { rank: 19, name: "shaft_06",       score:  188, time: "24:33", moves: 71, level: "easy",   when: "1m" },
  { rank: 20, name: "sallow",         score:  155, time: "25:48", moves: 75, level: "normal", when: "2m" },
];

/* expose */
Object.assign(window, {
  ROW, COL, CAVE, ULDR, URDL, PIT,
  BLOOD, SLIME, WUMPUS, BAT, PLAYER,
  DIR, DIR_NAMES, DIR_ARROWS, LEVELS,
  mulberry32, rnd,
  generateMap, nextCave, revealFrom, fireArrow, deflect,
  computeScore, pickFlavor, LOG_FLAVOR,
  LEADERBOARD,
});
