// =====================================================
// Map — level layout and tile lookup helpers
// =====================================================
//
// Tile legend:
//   '1' = standard gold wall
//   '2' = "course poster" accent wall (purple with gold trim)
//   'E' = exit marker wall (green) — currently visual only; touching Nick wins
//   'N' = bug spawn point (becomes floor at runtime)
//   'C' = coffee pickup spawn (becomes floor at runtime)
//   'X' = Nick Chapsas spawn (the goal)
//   '.' = empty floor
//
// To add a new level, copy this file as e.g. map_e1m2.js, swap the array,
// and update game.js to load it.

const MAP = [
  "1111111111111111111111",
  "1........1.....1.....1",
  "1.NNNN...1.....1.....1",
  "1........2.....1.....1",
  "1........1.....1.....1",
  "1...1112212....1.....1",
  "1...1.....1....2.....1",
  "1...1.C...1.........21",
  "1...1.....1....1.....1",
  "1...1112112....1.....1",
  "1..............1......",
  "1.....222222...1.....1",
  "1...........2..1.....1",
  "1...........2........1",
  "1...........2..1.....1",
  "1.....222122...1.....1",
  "1..............1.....1",
  "1.....N........1..C..1",
  "1..............1.....1",
  "1..............122122E",
  "1.............X......1",
  "1111111111111111111111"
];
const MAP_W = MAP[0].length;
const MAP_H = MAP.length;

// Player starting position (tile coords, will be centered as +0.5)
const PLAYER_START = { x: 2.5, y: 2.5, dir: 0 };

function mapAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return '1';
  return MAP[y][x];
}

function isWall(x, y) {
  const c = mapAt(x, y);
  return c === '1' || c === '2' || c === 'E';
}
