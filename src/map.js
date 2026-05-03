// =====================================================
// Map E1M1 — "Dependency Injection Dungeon"
// =====================================================
//
// Tile legend:
//   '1' = standard wall (Course Shelf texture)
//   '2' = accent wall (Course Poster texture)
//   'E' = exit wall (Diploma texture) — visual only; touching Nick wins
//   'N' = bug spawn (becomes floor at runtime)
//   'C' = coffee pickup spawn (becomes floor at runtime)
//   'A' = ammo pickup spawn (becomes floor at runtime)
//   'X' = Nick Chapsas spawn (level goal)
//   '.' = empty floor

const MAP_E1M1 = [
  "1111111111111111111111",
  "1........1.....1.....1",
  "1........1.....1.....1",
  "1........2.....1.....1",
  "1........1.....1.....1",
  "1...1112212....1.....1",
  "1...1.....1....2.....1",
  "1...1.CN..1.........21",
  "1...1.....1....1.....1",
  "1...1112112....1.....1",
  "1..............1......",
  "1.....222222...1.....1",
  "1...........2..1.....1",
  "1.......N.N.2....A...1",
  "1...........2..1.....1",
  "1.....222122...1.....1",
  "1..............1.....1",
  "1.....N.A......1..C..1",
  "1..............1.....1",
  "1..............122122E",
  "1.............X......1",
  "1111111111111111111111"
];

const PLAYER_START_E1M1 = { x: 2.5, y: 2.5, dir: 0 };
