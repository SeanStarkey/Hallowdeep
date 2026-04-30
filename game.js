const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const els = {
  heroName: document.querySelector("#hero-name"),
  portrait: document.querySelector(".portrait"),
  depth: document.querySelector("#depth"),
  level: document.querySelector("#level"),
  hp: document.querySelector("#hp"),
  xp: document.querySelector("#xp"),
  str: document.querySelector("#str"),
  agi: document.querySelector("#agi"),
  will: document.querySelector("#will"),
  light: document.querySelector("#light"),
  inventory: document.querySelector("#inventory-text"),
  weapon: document.querySelector("#weapon"),
  charm: document.querySelector("#charm"),
  examine: document.querySelector("#examine-text"),
  scores: document.querySelector("#high-scores"),
  clearScores: document.querySelector("#clear-scores"),
  log: document.querySelector("#log"),
  potion: document.querySelector("#drink-potion"),
  newGame: document.querySelector("#new-game")
};

const VIEW_W = 48;
const VIEW_H = 32;
const W = 96;
const H = 64;
const TILE = 20;
const FLOOR = ".";
const WALL = "#";
const STAIRS = ">";
const TONIC = "!";
const SCORE_API = "api/scores";
const PLAYER_NAME_KEY = "hallowdeep.playerName";
const MAX_SCORES = 10;

const emptyWeapon = { name: "Bare Hands", slot: "weapon", attack: 0, defense: 0, will: 0, light: 0, tier: 0 };
const emptyCharm = { name: "None", slot: "charm", attack: 0, defense: 0, will: 0, light: 0, tier: 0 };

const equipmentBook = [
  { name: "Rusty Dagger", slot: "weapon", attack: 1, defense: 0, will: 0, light: 0, minDepth: 1, tier: 1 },
  { name: "Graveyard Shovel", slot: "weapon", attack: 2, defense: 1, will: 0, light: 0, minDepth: 2, tier: 2 },
  { name: "Silver Hatchet", slot: "weapon", attack: 4, defense: 0, will: 0, light: 0, minDepth: 4, tier: 3 },
  { name: "Blessed Lantern Hook", slot: "weapon", attack: 5, defense: 0, will: 1, light: 1, minDepth: 6, tier: 4 },
  { name: "Garlic Braid", slot: "charm", attack: 0, defense: 1, will: 1, light: 0, minDepth: 1, tier: 1 },
  { name: "Moth-Eaten Cloak", slot: "charm", attack: 0, defense: 2, will: 0, light: 0, minDepth: 2, tier: 2 },
  { name: "Iron Ring", slot: "charm", attack: 0, defense: 2, will: 1, light: 0, minDepth: 3, tier: 3 },
  { name: "Saint Medal", slot: "charm", attack: 0, defense: 1, will: 2, light: 1, minDepth: 5, tier: 4 },
  { name: "Witchglass Lens", slot: "charm", attack: 0, defense: 0, will: 2, light: 2, minDepth: 7, tier: 5 }
];

const monsterBook = [
  { name: "Salem Shade", glyph: "S", hp: 7, atk: 2, xp: 4, minDepth: 1, color: "#9f8bd3" },
  { name: "Banshee", glyph: "B", hp: 8, atk: 3, xp: 5, minDepth: 1, color: "#b7d7d8" },
  { name: "Cursed Mummy", glyph: "M", hp: 11, atk: 4, xp: 7, minDepth: 2, color: "#c9b073" },
  { name: "Plague Doctor", glyph: "P", hp: 12, atk: 4, xp: 8, minDepth: 3, color: "#7f9f72" },
  { name: "Carpathian Vampire", glyph: "V", hp: 14, atk: 5, xp: 10, minDepth: 4, color: "#cf4f55" },
  { name: "Jersey Devil", glyph: "J", hp: 16, atk: 6, xp: 12, minDepth: 5, color: "#d65f49" },
  { name: "Headless Horseman", glyph: "H", hp: 18, atk: 7, xp: 14, minDepth: 6, color: "#d98635" },
  { name: "Wendigo", glyph: "W", hp: 22, atk: 8, xp: 18, minDepth: 8, color: "#d9d0ba" }
];

let state;
let playerName = loadPlayerName();
let highScores = [];
let scoreStatus = "Loading shared scores...";
let examineText = "Nothing examined.";
let camera = { x: 0, y: 0 };

function rand(max) {
  return Math.floor(Math.random() * max);
}

function chance(n) {
  return Math.random() < n;
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function key(x, y) {
  return `${x},${y}`;
}

function loadPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || "Rowan Ash";
}

function cleanPlayerName(name) {
  const cleaned = name.trim().replace(/\s+/g, " ").slice(0, 18);
  return cleaned || "Nameless";
}

function setPlayerName(name) {
  playerName = cleanPlayerName(name);
  localStorage.setItem(PLAYER_NAME_KEY, playerName);
  els.heroName.value = playerName;
  els.portrait.textContent = playerName[0].toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function gearBonus(hero, stat) {
  return hero.equipment.weapon[stat] + hero.equipment.charm[stat];
}

function heroAttackValue(hero) {
  return hero.str + gearBonus(hero, "attack");
}

function heroWill(hero) {
  return hero.will + gearBonus(hero, "will");
}

function heroDefense(hero) {
  return Math.floor(heroWill(hero) / 3) + gearBonus(hero, "defense");
}

function heroLight(hero) {
  return hero.light + gearBonus(hero, "light");
}

function itemPower(item) {
  return item.attack * 3 + item.defense * 2 + item.will * 2 + item.light * 2 + item.tier;
}

function itemStats(item) {
  const stats = [];
  if (item.attack) stats.push(`+${item.attack} attack`);
  if (item.defense) stats.push(`+${item.defense} defense`);
  if (item.will) stats.push(`+${item.will} will`);
  if (item.light) stats.push(`+${item.light} lantern`);
  return stats.join(", ") || "no bonus";
}

function makeHero() {
  return {
    x: 2,
    y: 2,
    level: 1,
    xp: 0,
    nextXp: 12,
    hp: 24,
    maxHp: 24,
    str: 6,
    agi: 5,
    will: 4,
    light: 7,
    equipment: {
      weapon: { ...emptyWeapon },
      charm: { ...emptyCharm }
    },
    potions: 2,
    kills: 0,
    totalXp: 0
  };
}

function makeMap() {
  const map = Array.from({ length: H }, () => Array.from({ length: W }, () => WALL));
  const rooms = [];

  for (let i = 0; i < 190; i++) {
    const rw = 6 + rand(10);
    const rh = 4 + rand(8);
    const rx = 1 + rand(W - rw - 2);
    const ry = 1 + rand(H - rh - 2);
    const room = { x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) };

    if (rooms.some((r) => rx <= r.x + r.w && rx + rw >= r.x && ry <= r.y + r.h && ry + rh >= r.y)) {
      continue;
    }

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        map[y][x] = FLOOR;
      }
    }

    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      const firstHorizontal = chance(0.5);
      digCorridor(map, prev.cx, prev.cy, room.cx, room.cy, firstHorizontal);
    }

    rooms.push(room);
  }

  return { map, rooms };
}

function digCorridor(map, x1, y1, x2, y2, firstHorizontal) {
  const carveH = () => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) map[y1][x] = FLOOR;
  };
  const carveV = () => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) map[y][x2] = FLOOR;
  };

  if (firstHorizontal) {
    carveH();
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) map[y][x2] = FLOOR;
  } else {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) map[y][x1] = FLOOR;
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) map[y2][x] = FLOOR;
  }
}

function roomPoint(room) {
  return {
    x: room.x + 1 + rand(Math.max(1, room.w - 2)),
    y: room.y + 1 + rand(Math.max(1, room.h - 2))
  };
}

function updateCamera() {
  camera.x = Math.max(0, Math.min(W - VIEW_W, state.hero.x - Math.floor(VIEW_W / 2)));
  camera.y = Math.max(0, Math.min(H - VIEW_H, state.hero.y - Math.floor(VIEW_H / 2)));
}

function toScreenX(x) {
  return (x - camera.x) * TILE;
}

function toScreenY(y) {
  return (y - camera.y) * TILE;
}

function inViewport(x, y) {
  return x >= camera.x && y >= camera.y && x < camera.x + VIEW_W && y < camera.y + VIEW_H;
}

function monsterForDepth(depth) {
  const candidates = monsterBook.filter((monster) => monster.minDepth <= depth);
  const nearby = candidates.filter((monster) => monster.minDepth >= depth - 2);
  const pool = nearby.length && chance(0.75) ? nearby : candidates;
  return pool[rand(pool.length)];
}

function scaleMonster(base, depth) {
  const extraDepth = Math.max(0, depth - base.minDepth);
  const hp = base.hp + extraDepth * 2;
  return {
    ...base,
    hp,
    maxHp: hp,
    atk: base.atk + Math.floor(extraDepth / 2),
    xp: base.xp + extraDepth * 2
  };
}

function equipmentForDepth(depth) {
  const candidates = equipmentBook.filter((item) => item.minDepth <= depth);
  const nearby = candidates.filter((item) => item.minDepth >= depth - 3);
  const pool = nearby.length && chance(0.8) ? nearby : candidates;
  return { ...pool[rand(pool.length)] };
}


function placeLevel(depth, hero) {
  const { map, rooms } = makeMap();
  const start = rooms[0] || { x: 1, y: 1, w: 5, h: 5, cx: 2, cy: 2 };
  hero.x = start.cx;
  hero.y = start.cy;

  const stairsRoom = rooms[rooms.length - 1] || start;
  const stairs = roomPoint(stairsRoom);
  map[stairs.y][stairs.x] = STAIRS;

  const monsters = [];
  const occupied = new Set([key(hero.x, hero.y), key(stairs.x, stairs.y)]);
  const monsterCount = Math.min(18 + depth * 3, 40);

  for (let i = 0; i < monsterCount; i++) {
    const room = rooms[1 + rand(Math.max(1, rooms.length - 1))] || start;
    const p = roomPoint(room);
    const k = key(p.x, p.y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    const base = scaleMonster(monsterForDepth(depth), depth);
    monsters.push({
      ...base,
      x: p.x,
      y: p.y
    });
  }

  const tonics = [];
  for (let i = 0; i < 6; i++) {
    const room = rooms[rand(rooms.length)] || start;
    const p = roomPoint(room);
    const k = key(p.x, p.y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    tonics.push(p);
  }

  const equipment = [];
  const equipmentCount = 2 + (chance(0.55) ? 1 : 0);
  for (let i = 0; i < equipmentCount; i++) {
    const room = rooms[rand(rooms.length)] || start;
    const p = roomPoint(room);
    const k = key(p.x, p.y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    equipment.push({ ...equipmentForDepth(depth), x: p.x, y: p.y });
  }

  state.map = map;
  state.rooms = rooms;
  state.monsters = monsters;
  state.tonics = tonics;
  state.equipment = equipment;
  state.depth = depth;
}

async function loadScores() {
  try {
    const response = await fetch(SCORE_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Score API returned ${response.status}`);
    const data = await response.json();
    highScores = Array.isArray(data.scores) ? data.scores.slice(0, MAX_SCORES) : [];
    scoreStatus = highScores.length ? "" : "No fallen adventurers yet.";
  } catch {
    highScores = [];
    scoreStatus = "Shared scores unavailable.";
  }
  renderUi();
}


function scoreRun() {
  const hero = state.hero;
  return hero.totalXp + hero.kills * 10 + (state.depth - 1) * 75 + (hero.level - 1) * 50;
}

async function recordScore() {
  if (state.scored) return;
  state.scored = true;
  const hero = state.hero;
  setPlayerName(els.heroName.value);
  const score = {
    name: playerName,
    score: scoreRun(),
    depth: state.depth,
    level: hero.level,
    kills: hero.kills
  };

  try {
    const response = await fetch(SCORE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(score)
    });
    if (!response.ok) throw new Error(`Score API returned ${response.status}`);
    const data = await response.json();
    highScores = Array.isArray(data.scores) ? data.scores.slice(0, MAX_SCORES) : [];
    scoreStatus = highScores.length ? "" : "No fallen adventurers yet.";
    addLog(`Score recorded: ${score.score}.`, "good");
  } catch {
    scoreStatus = "Could not save shared score.";
    addLog("The shared scorebook could not be reached.", "danger");
  }
  renderUi();
}

async function clearScores() {
  try {
    const response = await fetch(SCORE_API, { method: "DELETE", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Score API returned ${response.status}`);
    highScores = [];
    scoreStatus = "No fallen adventurers yet.";
  } catch {
    scoreStatus = "Could not clear shared scores.";
  }
  renderUi();
}

function newGame() {
  state = {
    hero: makeHero(),
    map: [],
    rooms: [],
    monsters: [],
    tonics: [],
    equipment: [],
    depth: 1,
    log: [],
    over: false,
    scored: false
  };
  placeLevel(1, state.hero);
  addLog("You descend beneath the pumpkin fields.");
  render();
}

function addLog(text, tone = "") {
  state.log.unshift({ text, tone });
  state.log = state.log.slice(0, 8);
}

function blocked(x, y) {
  return x < 0 || y < 0 || x >= W || y >= H || state.map[y][x] === WALL;
}

function monsterAt(x, y) {
  return state.monsters.find((m) => m.x === x && m.y === y);
}

function tonicAt(x, y) {
  return state.tonics.findIndex((p) => p.x === x && p.y === y);
}

function equipmentAt(x, y) {
  return state.equipment.findIndex((item) => item.x === x && item.y === y);
}

function describeTile(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return "Beyond the map.";
  if (!visible(x, y)) return "Unseen darkness. Move closer to examine it.";
  if (x === state.hero.x && y === state.hero.y) {
    return `${playerName}: HP ${state.hero.hp}/${state.hero.maxHp}, attack ${heroAttackValue(state.hero)}, defense ${heroDefense(state.hero)}, lantern ${heroLight(state.hero)}.`;
  }

  const monster = monsterAt(x, y);
  if (monster) {
    return `${monster.name}: HP ${Math.max(0, monster.hp)}/${monster.maxHp}, attack ${monster.atk}, worth ${monster.xp} XP.`;
  }

  const equipmentIndex = equipmentAt(x, y);
  if (equipmentIndex >= 0) {
    const item = state.equipment[equipmentIndex];
    return `${item.name}: ${item.slot}, ${itemStats(item)}.`;
  }

  if (tonicAt(x, y) >= 0) return "Pumpkin tonic: restores health when carried and used.";
  if (state.map[y][x] === STAIRS) return "Stairs: descend to the next dungeon level.";
  if (state.map[y][x] === WALL) return "Cold stone wall.";
  return "Dungeon floor: quiet for the moment.";
}

function examineTile(x, y) {
  examineText = describeTile(x, y);
  renderUi();
}

function canvasTile(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: camera.x + Math.floor((event.clientX - rect.left) * scaleX / TILE),
    y: camera.y + Math.floor((event.clientY - rect.top) * scaleY / TILE)
  };
}

function moveHero(dx, dy) {
  if (state.over) return;
  const hero = state.hero;
  const nx = hero.x + dx;
  const ny = hero.y + dy;
  if (blocked(nx, ny)) {
    addLog("Cold stone blocks the way.");
    render();
    return;
  }

  const target = monsterAt(nx, ny);
  if (target) {
    attack(hero, target);
  } else {
    hero.x = nx;
    hero.y = ny;
    collectOrDescend();
  }

  if (!state.over) {
    monsterTurn();
  }
  render();
}

function attack(attacker, defender) {
  const heroAttack = attacker === state.hero;
  const roll = 1 + rand(6);
  const attackPower = heroAttack ? heroAttackValue(attacker) : attacker.atk;
  const defensePower = heroAttack ? 0 : heroDefense(defender);
  const damage = Math.max(1, roll + attackPower - defensePower);
  defender.hp -= damage;

  if (heroAttack) {
    addLog(`You strike the ${defender.name} for ${damage}.`);
    if (defender.hp <= 0) {
      state.monsters = state.monsters.filter((m) => m !== defender);
      state.hero.kills += 1;
      gainXp(defender.xp);
      addLog(`${defender.name} falls into dust.`, "good");
    }
  } else {
    addLog(`${attacker.name} wounds you for ${damage}.`, "danger");
    if (defender.hp <= 0) {
      defender.hp = 0;
      state.over = true;
      recordScore();
      addLog("Your lantern gutters out. The run is over.", "danger");
    }
  }
}

function gainXp(amount) {
  const hero = state.hero;
  hero.xp += amount;
  hero.totalXp += amount;
  while (hero.xp >= hero.nextXp) {
    hero.xp -= hero.nextXp;
    hero.level += 1;
    hero.nextXp = Math.floor(hero.nextXp * 1.45);
    hero.maxHp += 5;
    hero.hp = hero.maxHp;
    hero.str += hero.level % 2 === 0 ? 1 : 0;
    hero.agi += hero.level % 2 === 1 ? 1 : 0;
    hero.will += 1;
    addLog(`Level ${hero.level}: your nerve hardens.`, "good");
  }
}

function equipItem(hero, item) {
  const current = hero.equipment[item.slot];
  if (itemPower(item) > itemPower(current)) {
    hero.equipment[item.slot] = item;
    addLog(`Equipped ${item.name}.`, "good");
  } else {
    addLog(`Left ${item.name} behind.`);
  }
}

function collectOrDescend() {
  const hero = state.hero;
  const tonicIndex = tonicAt(hero.x, hero.y);
  if (tonicIndex >= 0) {
    state.tonics.splice(tonicIndex, 1);
    hero.potions += 1;
    addLog("You pocket a pumpkin tonic.", "good");
  }

  const equipmentIndex = equipmentAt(hero.x, hero.y);
  if (equipmentIndex >= 0) {
    const item = state.equipment.splice(equipmentIndex, 1)[0];
    equipItem(hero, item);
  }

  if (state.map[hero.y][hero.x] === STAIRS) {
    addLog("You take the stairs into deeper dark.");
    placeLevel(state.depth + 1, hero);
  }
}

function monsterTurn() {
  const hero = state.hero;
  const order = [...state.monsters].sort((a, b) => distance(a, hero) - distance(b, hero));

  for (const monster of order) {
    if (distance(monster, hero) === 1) {
      attack(monster, hero);
      if (state.over) return;
      continue;
    }

    if (distance(monster, hero) > heroLight(hero) + 3) continue;

    const options = [
      { x: monster.x + Math.sign(hero.x - monster.x), y: monster.y },
      { x: monster.x, y: monster.y + Math.sign(hero.y - monster.y) }
    ].sort(() => Math.random() - 0.5);

    for (const next of options) {
      if (!blocked(next.x, next.y) && !monsterAt(next.x, next.y) && !(next.x === hero.x && next.y === hero.y)) {
        monster.x = next.x;
        monster.y = next.y;
        break;
      }
    }
  }
}

function drinkPotion() {
  if (state.over) return;
  const hero = state.hero;
  if (hero.potions <= 0) {
    addLog("No pumpkin tonics remain.");
    render();
    return;
  }
  hero.potions -= 1;
  const heal = 10 + heroWill(hero);
  hero.hp = Math.min(hero.maxHp, hero.hp + heal);
  addLog(`The tonic restores ${heal} HP.`, "good");
  monsterTurn();
  render();
}

function visible(x, y) {
  const hero = state.hero;
  const dx = x - hero.x;
  const dy = y - hero.y;
  return Math.sqrt(dx * dx + dy * dy) <= heroLight(hero);
}

function drawTile(x, y, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(toScreenX(x), toScreenY(y), TILE, TILE);
}

function drawGlyph(glyph, x, y, color, size = 16) {
  if (!inViewport(x, y)) return;
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, toScreenX(x) + TILE / 2, toScreenY(y) + TILE / 2 + 1);
}

function renderMap() {
  updateCamera();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = camera.y; y < camera.y + VIEW_H; y++) {
    for (let x = camera.x; x < camera.x + VIEW_W; x++) {
      const seen = visible(x, y);
      const tile = state.map[y][x];
      const base = tile === WALL ? "#3f3a2d" : "#20271f";
      drawTile(x, y, seen ? base : "#080908");
      if (seen && tile === WALL) {
        ctx.fillStyle = "#6c6047";
        ctx.fillRect(toScreenX(x) + 2, toScreenY(y) + 2, TILE - 4, TILE - 4);
      }
      if (seen && tile === STAIRS) drawGlyph(">", x, y, "#9f8bd3", 17);
    }
  }

  for (const tonic of state.tonics) {
    if (inViewport(tonic.x, tonic.y) && visible(tonic.x, tonic.y)) drawGlyph("!", tonic.x, tonic.y, "#9fd37f", 17);
  }

  for (const item of state.equipment) {
    if (inViewport(item.x, item.y) && visible(item.x, item.y)) drawGlyph("*", item.x, item.y, "#d9d0ba", 18);
  }

  for (const monster of state.monsters) {
    if (inViewport(monster.x, monster.y) && visible(monster.x, monster.y)) drawGlyph(monster.glyph, monster.x, monster.y, monster.color);
  }

  drawGlyph("@", state.hero.x, state.hero.y, "#e2b04f", 18);

  const gradient = ctx.createRadialGradient(
    toScreenX(state.hero.x) + TILE / 2,
    toScreenY(state.hero.y) + TILE / 2,
    TILE * 2,
    toScreenX(state.hero.x) + TILE / 2,
    toScreenY(state.hero.y) + TILE / 2,
    TILE * (heroLight(state.hero) + 2)
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.over) {
    ctx.fillStyle = "rgba(10, 10, 8, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f4ecd8";
    ctx.font = "700 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("The Hallowdeep Claims You", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "700 16px ui-sans-serif, system-ui";
    ctx.fillText("Press New Run to try again", canvas.width / 2, canvas.height / 2 + 28);
  }
}

function renderUi() {
  const hero = state.hero;
  els.depth.textContent = state.depth;
  els.level.textContent = hero.level;
  els.hp.textContent = `${hero.hp}/${hero.maxHp}`;
  els.xp.textContent = `${hero.xp}/${hero.nextXp}`;
  els.str.textContent = `${hero.str} (+${gearBonus(hero, "attack")} atk)`;
  els.agi.textContent = hero.agi;
  els.will.textContent = `${heroWill(hero)} (+${gearBonus(hero, "defense")} def)`;
  els.light.textContent = `${heroLight(hero)}`;
  els.inventory.textContent = `${hero.potions} pumpkin tonic${hero.potions === 1 ? "" : "s"}`;
  els.examine.textContent = examineText;
  els.weapon.textContent = hero.equipment.weapon.name;
  els.charm.textContent = hero.equipment.charm.name;
  els.scores.innerHTML = highScores.length
    ? highScores
        .map(
          (score) =>
            `<li><div class="score-row"><strong>${escapeHtml(score.name || "Nameless")}: ${score.score}</strong><span>D${score.depth} L${score.level} K${score.kills} - ${score.date}</span></div></li>`
        )
        .join("")
    : `<li class="empty">${scoreStatus}</li>`;
  els.log.innerHTML = state.log
    .map((entry) => `<li class="${entry.tone}">${entry.text}</li>`)
    .join("");
}

function render() {
  renderMap();
  renderUi();
}

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;

  const dirs = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    k: [0, -1],
    j: [0, 1],
    h: [-1, 0],
    l: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0]
  };

  if (event.key.toLowerCase() === "x") {
    event.preventDefault();
    examineTile(state.hero.x, state.hero.y);
    return;
  }

  if (event.key === " " || event.key.toLowerCase() === "p") {
    event.preventDefault();
    drinkPotion();
    return;
  }

  const dir = dirs[event.key];
  if (dir) {
    event.preventDefault();
    moveHero(dir[0], dir[1]);
  }
});

canvas.addEventListener("mousemove", (event) => {
  const tile = canvasTile(event);
  examineTile(tile.x, tile.y);
});

canvas.addEventListener("click", (event) => {
  const tile = canvasTile(event);
  examineTile(tile.x, tile.y);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    moveHero(dx, dy);
  });
});

els.heroName.addEventListener("change", () => setPlayerName(els.heroName.value));
els.heroName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.heroName.blur();
});
els.potion.addEventListener("click", drinkPotion);
els.clearScores.addEventListener("click", clearScores);
els.newGame.addEventListener("click", newGame);

setPlayerName(playerName);
newGame();
loadScores();
