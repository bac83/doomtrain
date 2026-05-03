// =====================================================
// Levels — registry + active-level globals
// =====================================================
//
// Holds all maps and exposes the *currently active* level via mutable
// globals MAP / MAP_W / MAP_H / PLAYER_START. Other modules (renderer,
// entities, player) read these globals as before — they don't know
// they're switching.
//
// loadLevel(idx) swaps in a different map. Call before Player.reset()
// and Entities.spawn() to start that level fresh.

const Levels = [
  {
    id: 'e1m1',
    name: 'DEPENDENCY INJECTION DUNGEON',
    map: MAP_E1M1,
    playerStart: PLAYER_START_E1M1,
    winOn: 'nick',
  },
  {
    id: 'e1m2',
    name: 'REFACTOR RUINS',
    map: MAP_E1M2,
    playerStart: PLAYER_START_E1M2,
    winOn: 'nick',
  },
  {
    id: 'e1m3',
    name: 'THE LEGACY CODEBASE',
    map: MAP_E1M3,
    playerStart: PLAYER_START_E1M3,
    winOn: 'bossDead',
  },
];

let currentLevelIndex = 0;

// Mutable globals consumed by other modules.
let MAP, MAP_W, MAP_H, PLAYER_START;

// Bumps on any map mutation (level load, door open). Read by minimap cache.
let mapVersion = 0;

function loadLevel(idx) {
  if (idx < 0 || idx >= Levels.length) return false;
  currentLevelIndex = idx;
  const lvl = Levels[idx];
  // Copy the source array so door-opening / map mutation doesn't affect the registry.
  MAP = lvl.map.slice();
  MAP_W = MAP[0].length;
  MAP_H = MAP.length;
  PLAYER_START = lvl.playerStart;
  mapVersion++;
  return true;
}

function hasNextLevel() {
  return currentLevelIndex + 1 < Levels.length;
}

function nextLevelIndex() {
  return currentLevelIndex + 1;
}

function getCurrentLevel() {
  return Levels[currentLevelIndex];
}

function mapAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return '1';
  return MAP[y][x];
}

function isWall(x, y) {
  const c = mapAt(x, y);
  return c === '1' || c === '2' || c === 'E' || c === 'D';
}

function openDoor(x, y) {
  if (y < 0 || y >= MAP_H) return false;
  const row = MAP[y];
  if (x < 0 || x >= row.length) return false;
  if (row[x] !== 'D') return false;
  MAP[y] = row.slice(0, x) + '.' + row.slice(x + 1);
  mapVersion++;
  return true;
}

// Boot with first level so module-init code (Player IIFE) sees valid PLAYER_START.
loadLevel(0);
