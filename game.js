const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const minimapCanvas = document.querySelector("#minimap");
const minimapCtx = minimapCanvas.getContext("2d");
const minimapSection = document.querySelector("#minimap-section");

const els = {
  heroName: document.querySelector("#hero-name"),
  portrait: document.querySelector(".portrait"),
  version: document.querySelector("#version"),
  depth: document.querySelector("#depth"),
  level: document.querySelector("#level"),
  hp: document.querySelector("#hp"),
  xp: document.querySelector("#xp"),
  score: document.querySelector("#score"),
  statuses: document.querySelector("#statuses"),
  str: document.querySelector("#str"),
  agi: document.querySelector("#agi"),
  will: document.querySelector("#will"),
  light: document.querySelector("#light"),
  inventory: document.querySelector("#inventory-text"),
  weapon: document.querySelector("#weapon"),
  charm: document.querySelector("#charm"),
  examine: document.querySelector("#examine-text"),
  scores: document.querySelector("#high-scores"),
  log: document.querySelector("#log"),
  potion: document.querySelector("#drink-potion"),
  waitActions: document.querySelectorAll("[data-wait]"),
  helpOpen: document.querySelector("#help-open"),
  helpClose: document.querySelector("#help-close"),
  helpModal: document.querySelector("#help-modal"),
  roadmapOpen: document.querySelector("#roadmap-open"),
  roadmapClose: document.querySelector("#roadmap-close"),
  roadmapModal: document.querySelector("#roadmap-modal"),
  roadmapContent: document.querySelector("#roadmap-content"),
  deathModal: document.querySelector("#death-modal"),
  deathContent: document.querySelector("#death-content"),
  deathClose: document.querySelector("#death-close"),
  deathReview: document.querySelector("#death-review"),
  deathNewRun: document.querySelector("#death-new-run"),
  levelupModal: document.querySelector("#levelup-modal"),
  levelupContent: document.querySelector("#levelup-content"),
  newGame: document.querySelector("#new-game")
};

const VIEW_W = 48;
const VIEW_H = 32;
let W = 96;
let H = 64;
const TILE = 20;
const FLOOR = ".";
const WALL = "#";
const STAIRS = ">";
const TONIC = "!";
const VERSION = "2026.05.08.04";
const SCORE_API = "api/scores";
const PLAYER_NAME_KEY = "hallowdeep.playerName";
const MAX_SCORES = 10;
const BOSS_FLOOR_INTERVAL = 5;
const BOSS_SCORE_BONUS = 250;

const {
  bossBook,
  emptyCharm,
  emptyWeapon,
  equipmentBook,
  monsterBook,
  spritePalettes,
  spritePatterns
} = window.HallowdeepData;

const fallbackBossBook = [
  {
    name: "Grinmaw, the Candle King",
    hp: 42,
    atk: 8,
    xp: 32,
    minDepth: 5,
    color: "#f0a23a",
    ability: "ignite",
    sprite: "lantern"
  }
];

const PERKS = [
  { id: "ironConstitution", name: "Iron Constitution", desc: "+15 max HP. Restore to full." },
  { id: "ruthlessStrike",   name: "Ruthless Strike",   desc: "+3 STR (attack power)." },
  { id: "shadowstep",       name: "Shadowstep",        desc: "+3 AGI (defense)." },
  { id: "ironWill",         name: "Iron Will",         desc: "+3 WILL (spirit and potion potency)." },
  { id: "lanternKeeper",    name: "Lantern Keeper",    desc: "+3 light radius." },
  { id: "tonicCache",       name: "Tonic Cache",       desc: "Gain 2 pumpkin tonics." },
  { id: "warriorsBlood",    name: "Warrior's Blood",   desc: "+8 max HP and +1 STR." },
  { id: "wardenEye",        name: "Warden's Eye",      desc: "+2 WILL and +2 light." },
  { id: "combatant",        name: "Combatant",         desc: "+2 STR and +2 AGI." },
  { id: "alchemist",        name: "Alchemist",         desc: "+1 tonic and +2 WILL." }
];

let state;
let playerName = loadPlayerName();
let highScores = [];
let scoreStatus = "Loading shared scores...";
let examineText = "Nothing examined.";
let camera = { x: 0, y: 0 };
let particles = [];
let particleAnimId = null;

let debugMode = new URLSearchParams(location.search).has("debug");
let godMode = false;

const abilityDefinitions = {
  blink: {
    name: "Blink",
    description: "May vanish to a nearby tile after being struck.",
    onHeroHitMonster(monster) {
      if (!chance(0.35)) return;
      const spots = nearbyOpenTiles(monster.x, monster.y, 4);
      if (!spots.length) return;
      const spot = spots[rand(spots.length)];
      monster.x = spot.x;
      monster.y = spot.y;
      addLog(`${monster.name} flickers away.`);
    }
  },
  scream: {
    name: "Scream",
    description: "Hits can rattle your will for a few turns.",
    onMonsterHitHero(monster, hero) {
      if (!chance(0.45)) return;
      addStatus(hero, "dread", 4);
      addLog(`${monster.name}'s scream chills your nerve.`, "danger");
    }
  },
  curse: {
    name: "Curse",
    description: "Hits can weaken your attack for a few turns.",
    onMonsterHitHero(monster, hero) {
      if (!chance(0.4)) return;
      addStatus(hero, "curse", 4);
      addLog(`${monster.name}'s curse weighs on your arms.`, "danger");
    }
  },
  poison: {
    name: "Poison",
    description: "Hits can poison you for ongoing damage.",
    onMonsterHitHero(monster, hero) {
      if (!chance(0.45)) return;
      addStatus(hero, "poison", 5);
      addLog(`${monster.name} infects the wound.`, "danger");
    }
  },
  drain: {
    name: "Drain",
    description: "Heals when it damages you.",
    onMonsterHitHero(monster, hero, damage) {
      const healed = Math.min(monster.maxHp - monster.hp, Math.max(1, Math.floor(damage / 2)));
      if (healed <= 0) return;
      monster.hp += healed;
      addLog(`${monster.name} drinks in ${healed} HP.`, "danger");
    }
  },
  hunter: {
    name: "Hunter",
    description: "Senses you from farther away.",
    detectionBonus: 8
  },
  charge: {
    name: "Charge",
    description: "Can rush in a straight line when it sees you.",
    beforeMove(monster, hero) {
      if (!chance(0.45)) return false;
      const dx = Math.sign(hero.x - monster.x);
      const dy = Math.sign(hero.y - monster.y);
      if (monster.x !== hero.x && monster.y !== hero.y) return false;
      if (distance(monster, hero) < 3 || distance(monster, hero) > 7) return false;
      const step = monster.x === hero.x ? { x: 0, y: dy } : { x: dx, y: 0 };
      return moveMonsterSteps(monster, step, 2, `${monster.name} charges through the dark.`);
    }
  },
  ravenous: {
    name: "Ravenous",
    description: "Deals extra damage when you are badly wounded.",
    modifyDamage(monster, hero, damage) {
      if (hero.hp > hero.maxHp * 0.4) return damage;
      return damage + 3;
    }
  },
  ignite: {
    name: "Ignite",
    description: "Hits can set you ablaze for ongoing damage.",
    onMonsterHitHero(monster, hero) {
      if (!chance(0.4)) return;
      addStatus(hero, "burning", 4);
      addLog(`${monster.name} sets you alight.`, "danger");
    }
  },
  nimble: {
    name: "Nimble",
    description: "Has a chance to slip aside and halve incoming damage.",
    onHeroHitMonster(monster, attacker, damage) {
      if (!chance(0.35)) return;
      monster.hp += Math.floor(damage / 2);
      addLog(`The ${monster.name} twists away, lessening the blow.`);
    }
  },
  haunt: {
    name: "Haunt",
    description: "Hits can shatter both nerve and will at once.",
    onMonsterHitHero(monster, hero) {
      if (!chance(0.4)) return;
      addStatus(hero, "dread", 3);
      addStatus(hero, "curse", 3);
      addLog(`${monster.name}'s hollow gaze unravels you.`, "danger");
    }
  },
  revive: {
    name: "Revive",
    description: "Rises from death once with renewed power.",
    onKilled(monster) {
      if (monster.revived) return false;
      monster.revived = true;
      monster.hp = Math.floor(monster.maxHp * 0.4);
      addLog(`The ${monster.name} refuses death and rises again!`, "danger");
      return true;
    }
  }
};

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
  const cursePenalty = hero.statuses.curse > 0 ? 2 : 0;
  return Math.max(1, hero.str + gearBonus(hero, "attack") - cursePenalty);
}

function heroWill(hero) {
  const dreadPenalty = hero.statuses.dread > 0 ? 2 : 0;
  return Math.max(1, hero.will + gearBonus(hero, "will") - dreadPenalty);
}

function heroDefense(hero) {
  return Math.floor(hero.agi / 3) + gearBonus(hero, "defense");
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

function abilityFor(monster) {
  return abilityDefinitions[monster.ability] || null;
}

function abilityText(monster) {
  const ability = abilityFor(monster);
  return ability ? `${ability.name}: ${ability.description}` : "No special ability.";
}

function isBossDepth(depth) {
  return depth > 0 && depth % BOSS_FLOOR_INTERVAL === 0;
}

function addStatus(hero, status, turns) {
  hero.statuses[status] = Math.max(hero.statuses[status] || 0, turns);
}

function statusText(hero) {
  const labels = [];
  if (hero.statuses.poison > 0) labels.push(`poison ${hero.statuses.poison}`);
  if (hero.statuses.burning > 0) labels.push(`burning ${hero.statuses.burning}`);
  if (hero.statuses.dread > 0) labels.push(`dread ${hero.statuses.dread}`);
  if (hero.statuses.curse > 0) labels.push(`curse ${hero.statuses.curse}`);
  return labels.length ? labels.join(", ") : "clear";
}

function statusBadges(hero) {
  const statuses = [
    { key: "poison", label: "Poison" },
    { key: "burning", label: "Burning" },
    { key: "dread", label: "Dread" },
    { key: "curse", label: "Curse" }
  ];
  const active = statuses.filter((status) => hero.statuses[status.key] > 0);

  if (!active.length) {
    return '<span class="status-badge clear">Clear</span>';
  }

  return active
    .map(
      (status) =>
        `<span class="status-badge ${status.key}"><b>${status.label}</b><small>${hero.statuses[status.key]}</small></span>`
    )
    .join("");
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
    statuses: {
      poison: 0,
      dread: 0,
      curse: 0,
      burning: 0
    },
    equipment: {
      weapon: { ...emptyWeapon },
      charm: { ...emptyCharm }
    },
    potions: 2,
    kills: 0,
    bossKills: 0,
    totalXp: 0
  };
}

function makeMap() {
  const map = Array.from({ length: H }, () => Array.from({ length: W }, () => WALL));
  const rooms = [];

  const roomAttempts = Math.round(190 * (W * H) / (96 * 64));
  for (let i = 0; i < roomAttempts; i++) {
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

function bossForDepth(depth) {
  const bosses = Array.isArray(bossBook) && bossBook.length ? bossBook : fallbackBossBook;
  const candidates = bosses.filter((boss) => boss.minDepth <= depth);
  return candidates[candidates.length - 1] || bosses[0];
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

function scaleBoss(base, depth) {
  const extraDepth = Math.max(0, depth - base.minDepth);
  const hp = base.hp + extraDepth * 4;
  return {
    ...base,
    boss: true,
    hp,
    maxHp: hp,
    atk: base.atk + Math.floor(extraDepth / 2),
    xp: base.xp + extraDepth * 3,
    scoreBonus: BOSS_SCORE_BONUS + depth * 25
  };
}

function equipmentForDepth(depth) {
  const candidates = equipmentBook.filter((item) => item.minDepth <= depth);
  const nearby = candidates.filter((item) => item.minDepth >= depth - 3);
  const pool = nearby.length && chance(0.8) ? nearby : candidates;
  return { ...pool[rand(pool.length)] };
}


function placeLevel(depth, hero) {
  W = 80 + rand(81);
  H = 56 + rand(41);
  const { map, rooms } = makeMap();
  const start = rooms[0] || { x: 1, y: 1, w: 5, h: 5, cx: 2, cy: 2 };
  hero.x = start.cx;
  hero.y = start.cy;

  const stairsRoom = rooms[rooms.length - 1] || start;
  const stairs = roomPoint(stairsRoom);
  map[stairs.y][stairs.x] = STAIRS;

  const monsters = [];
  const occupied = new Set([key(hero.x, hero.y), key(stairs.x, stairs.y)]);
  const bossFloor = isBossDepth(depth);
  const monsterCount = bossFloor ? 0 : Math.min(18 + depth * 3, 40);

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

  if (bossFloor) {
    const bossRoom = rooms[Math.max(1, rooms.length - 2)] || stairsRoom;
    let p = roomPoint(bossRoom);
    for (let tries = 0; occupied.has(key(p.x, p.y)) && tries < 20; tries++) {
      p = roomPoint(bossRoom);
    }
    const boss = scaleBoss(bossForDepth(depth), depth);
    occupied.add(key(p.x, p.y));
    monsters.push({
      ...boss,
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
  state.bossFloor = bossFloor;
  state.visited = Array.from({ length: H }, () => new Uint8Array(W));

  if (bossFloor) {
    addLog("The stairs seal with cold fire. A lord of the deep is near.", "danger");
  }
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

function markdownToRoadmap(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;

  const inline = (value) =>
    escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>");

  for (const line of lines) {
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "") continue;
  }

  if (inList) html.push("</ul>");
  return html.join("");
}

async function loadRoadmap() {
  try {
    const response = await fetch("TODO.md", { headers: { Accept: "text/markdown,text/plain" } });
    if (!response.ok) throw new Error(`TODO fetch returned ${response.status}`);
    els.roadmapContent.innerHTML = markdownToRoadmap(await response.text());
  } catch {
    els.roadmapContent.textContent = "Roadmap unavailable.";
  }
}

function openRoadmap() {
  els.roadmapModal.classList.remove("hidden");
  loadRoadmap();
}

function closeRoadmap() {
  els.roadmapModal.classList.add("hidden");
}

function openHelp() {
  els.helpModal.classList.remove("hidden");
}

function closeHelp() {
  els.helpModal.classList.add("hidden");
}

function openDeathScreen() {
  els.deathContent.innerHTML = deathScreenHtml();
  els.deathModal.classList.remove("hidden");
}

function closeDeathScreen() {
  els.deathModal.classList.add("hidden");
}

function closeOpenDialogs() {
  closeRoadmap();
  closeHelp();
  closeDeathScreen();
}

function hasOpenDialog() {
  return !els.roadmapModal.classList.contains("hidden") ||
    !els.helpModal.classList.contains("hidden") ||
    !els.deathModal.classList.contains("hidden") ||
    !els.levelupModal.classList.contains("hidden");
}

function scoreRunFor(runState) {
  const hero = runState.hero;
  return hero.totalXp + hero.kills * 10 + (runState.depth - 1) * 75 + (hero.level - 1) * 50 + (runState.bossScoreBonus || 0);
}

function scoreRun() {
  return scoreRunFor(state);
}

async function recordScore(runState = state) {
  if (runState.scored) return;
  runState.scored = true;
  const hero = runState.hero;
  setPlayerName(els.heroName.value);
  const score = {
    name: playerName,
    score: scoreRunFor(runState),
    depth: runState.depth,
    level: hero.level,
    kills: hero.kills,
    bossKills: hero.bossKills
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
    if (state === runState) addLog(`Score recorded: ${score.score}.`, "good");
  } catch {
    scoreStatus = "Could not save shared score.";
    if (state === runState) addLog("The shared scorebook could not be reached.", "danger");
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

function killBreakdownHtml() {
  const kills = Object.entries(state.killCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (!kills.length) {
    return '<p class="death-empty">No monsters were slain.</p>';
  }

  return `<ol class="death-kills">${kills
    .map(([name, count]) => `<li><span>${escapeHtml(name)}</span><b>${count}</b></li>`)
    .join("")}</ol>`;
}

function deathScreenHtml() {
  const hero = state.hero;
  const score = scoreRun().toLocaleString();
  const weapon = hero.equipment.weapon;
  const charm = hero.equipment.charm;
  const cause = state.deathCause || "The dungeon finished the tale.";

  return `
    <div class="death-score">
      <span>Final Score</span>
      <strong>${score}</strong>
      <p>${escapeHtml(cause)}</p>
    </div>
    <div class="death-stats" aria-label="Run summary">
      <div><span>Depth</span><b>${state.depth}</b></div>
      <div><span>Level</span><b>${hero.level}</b></div>
      <div><span>Total Kills</span><b>${hero.kills}</b></div>
      <div><span>Boss Kills</span><b>${hero.bossKills}</b></div>
      <div><span>XP Earned</span><b>${hero.totalXp}</b></div>
      <div><span>Boss Bonus</span><b>${state.bossScoreBonus}</b></div>
    </div>
    <div class="death-loadout">
      <h3>Gear At Death</h3>
      <div><span>Weapon</span><b>${escapeHtml(weapon.name)}</b><small>${escapeHtml(itemStats(weapon))}</small></div>
      <div><span>Charm</span><b>${escapeHtml(charm.name)}</b><small>${escapeHtml(itemStats(charm))}</small></div>
    </div>
    <div class="death-breakdown">
      <h3>Kills By Monster</h3>
      ${killBreakdownHtml()}
    </div>
  `;
}

function endRun(cause) {
  if (state.over) return;
  state.over = true;
  state.deathCause = cause;
  recordScore(state);
  openDeathScreen();
}

function newGame() {
  closeDeathScreen();
  if (particleAnimId !== null) {
    cancelAnimationFrame(particleAnimId);
    particleAnimId = null;
  }
  particles = [];
  state = {
    hero: makeHero(),
    map: [],
    rooms: [],
    monsters: [],
    tonics: [],
    equipment: [],
    depth: 1,
    bossFloor: false,
    bossScoreBonus: 0,
    log: [],
    over: false,
    scored: false,
    deathCause: "",
    killCounts: {},
    levelUpQueue: []
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

function bossAlive() {
  return state.monsters.some((monster) => monster.boss);
}

function occupiedByMonster(x, y, except = null) {
  return state.monsters.some((monster) => monster !== except && monster.x === x && monster.y === y);
}

function openForMonster(x, y, monster) {
  return !blocked(x, y) && !occupiedByMonster(x, y, monster) && !(x === state.hero.x && y === state.hero.y);
}

function nearbyOpenTiles(x, y, radius) {
  const spots = [];
  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (Math.abs(xx - x) + Math.abs(yy - y) > radius) continue;
      if (openForMonster(xx, yy, null)) spots.push({ x: xx, y: yy });
    }
  }
  return spots;
}

function moveMonsterSteps(monster, step, steps, message) {
  let moved = false;
  for (let i = 0; i < steps; i++) {
    const next = { x: monster.x + step.x, y: monster.y + step.y };
    if (distance(next, state.hero) === 0) break;
    if (!openForMonster(next.x, next.y, monster)) break;
    monster.x = next.x;
    monster.y = next.y;
    moved = true;
    if (distance(monster, state.hero) === 1) break;
  }
  if (moved && message) addLog(message);
  return moved;
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
    return `${playerName}: HP ${state.hero.hp}/${state.hero.maxHp}, attack ${heroAttackValue(state.hero)}, defense ${heroDefense(state.hero)}, lantern ${heroLight(state.hero)}, status ${statusText(state.hero)}.`;
  }

  const monster = monsterAt(x, y);
  if (monster) {
    const reward = monster.boss ? `${monster.xp} XP and ${monster.scoreBonus} score bonus` : `${monster.xp} XP`;
    return `${monster.name}: HP ${Math.max(0, monster.hp)}/${monster.maxHp}, attack ${monster.atk}, worth ${reward}. ${abilityText(monster)}`;
  }

  const equipmentIndex = equipmentAt(x, y);
  if (equipmentIndex >= 0) {
    const item = state.equipment[equipmentIndex];
    return `${item.name}: ${item.slot}, ${itemStats(item)}.`;
  }

  if (tonicAt(x, y) >= 0) return "Pumpkin tonic: restores health when carried and used.";
  if (state.map[y][x] === STAIRS) {
    return state.bossFloor && bossAlive()
      ? "Sealed stairs: defeat this floor's boss to descend."
      : "Stairs: descend to the next dungeon level.";
  }
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

  spendHeroTurn();
}

function waitHero() {
  if (state.over) return;
  addLog("You hold your ground.");
  spendHeroTurn();
}

function spendHeroTurn() {
  if (!state.over) {
    tickHeroStatuses();
  }

  if (!state.over) {
    monsterTurn();
  }
  render();
}

function tickHeroStatuses() {
  const hero = state.hero;
  if (hero.statuses.poison > 0) {
    hero.hp = Math.max(0, hero.hp - 2);
    spawnDamageParticle(hero.x, hero.y, 2, true);
    addLog("Poison burns for 2 HP.", "danger");
    if (hero.hp <= 0) {
      endRun("Poison finished the run.");
      addLog("The poison finishes the run.", "danger");
    }
  }

  if (!state.over && hero.statuses.burning > 0) {
    hero.hp = Math.max(0, hero.hp - 1);
    spawnDamageParticle(hero.x, hero.y, 1, true);
    addLog("Flames scorch for 1 HP.", "danger");
    if (hero.hp <= 0) {
      endRun("Flames consumed the last of your strength.");
      addLog("The flames consume the last of your strength.", "danger");
    }
  }

  for (const status of Object.keys(hero.statuses)) {
    if (hero.statuses[status] > 0) hero.statuses[status] -= 1;
  }
}

function attack(attacker, defender) {
  const heroAttack = attacker === state.hero;
  const roll = 1 + rand(6);
  const attackPower = heroAttack ? heroAttackValue(attacker) : attacker.atk;
  const defensePower = heroAttack ? 0 : heroDefense(defender);
  const ability = heroAttack ? abilityFor(defender) : abilityFor(attacker);
  const baseDamage = Math.max(1, roll + attackPower - defensePower);
  const damage = !heroAttack && ability?.modifyDamage ? ability.modifyDamage(attacker, defender, baseDamage) : baseDamage;
  if (!heroAttack && godMode) return;
  defender.hp -= damage;

  if (heroAttack) {
    spawnDamageParticle(defender.x, defender.y, damage, false);
    addLog(`You strike the ${defender.name} for ${damage}.`);
    if (defender.hp <= 0) {
      if (ability?.onKilled?.(defender)) {
        // ability intercepted death (e.g. revive)
      } else {
        state.monsters = state.monsters.filter((m) => m !== defender);
        state.hero.kills += 1;
        if (defender.boss) {
          state.hero.bossKills += 1;
          state.bossScoreBonus += defender.scoreBonus;
        }
        state.killCounts[defender.name] = (state.killCounts[defender.name] || 0) + 1;
        gainXp(defender.xp);
        if (defender.boss) {
          addLog(`${defender.name} falls. The stairs burn open. +${defender.scoreBonus} score.`, "good");
        } else {
          addLog(`${defender.name} falls into dust.`, "good");
        }
      }
    } else if (ability?.onHeroHitMonster) {
      ability.onHeroHitMonster(defender, attacker, damage);
    }
  } else {
    spawnDamageParticle(defender.x, defender.y, damage, true);
    addLog(`${attacker.name} wounds you for ${damage}.`, "danger");
    if (ability?.onMonsterHitHero) {
      ability.onMonsterHitHero(attacker, defender, damage);
    }
    if (defender.hp <= 0) {
      defender.hp = 0;
      endRun(`${attacker.name} struck the final blow.`);
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
    addLog(`Level ${hero.level}! Choose your path.`, "good");
    state.levelUpQueue.push(hero.level);
  }
  if (state.levelUpQueue.length > 0) {
    openLevelUpModal();
  }
}

function pickThreePerks() {
  const pool = [...PERKS];
  const chosen = [];
  while (chosen.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(i, 1)[0]);
  }
  return chosen;
}

function openLevelUpModal() {
  const level = state.levelUpQueue[0];
  const perks = pickThreePerks();
  els.levelupContent.innerHTML = perks
    .map(
      (p) =>
        `<button class="perk-card" type="button" data-perk="${p.id}">
          <strong>${p.name}</strong>
          <p>${p.desc}</p>
        </button>`
    )
    .join("");
  els.levelupContent.querySelectorAll(".perk-card").forEach((btn) => {
    btn.addEventListener("click", () => applyPerk(btn.dataset.perk));
  });
  els.levelupModal.dataset.level = level;
  els.levelupModal.classList.remove("hidden");
  els.levelupContent.querySelector(".perk-card")?.focus();
}

function closeLevelUpModal() {
  els.levelupModal.classList.add("hidden");
}

function applyPerk(id) {
  const hero = state.hero;
  switch (id) {
    case "ironConstitution": hero.maxHp += 15; hero.hp = hero.maxHp; break;
    case "ruthlessStrike":   hero.str += 3; break;
    case "shadowstep":       hero.agi += 3; break;
    case "ironWill":         hero.will += 3; break;
    case "lanternKeeper":    hero.light += 3; break;
    case "tonicCache":       hero.potions += 2; break;
    case "warriorsBlood":    hero.maxHp += 8; hero.hp = Math.min(hero.hp + 8, hero.maxHp); hero.str += 1; break;
    case "wardenEye":        hero.will += 2; hero.light += 2; break;
    case "combatant":        hero.str += 2; hero.agi += 2; break;
    case "alchemist":        hero.potions += 1; hero.will += 2; break;
  }
  const perk = PERKS.find((p) => p.id === id);
  if (perk) addLog(`${perk.name}: ${perk.desc}`, "good");
  state.levelUpQueue.shift();
  closeLevelUpModal();
  if (state.levelUpQueue.length > 0) {
    openLevelUpModal();
  } else {
    render();
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
    if (state.bossFloor && bossAlive()) {
      addLog("The stairs refuse you while their master still lives.", "danger");
      return;
    }
    addLog("You take the stairs into deeper dark.");
    placeLevel(state.depth + 1, hero);
  }
}

function monsterTurn() {
  const hero = state.hero;
  const order = [...state.monsters].sort((a, b) => distance(a, hero) - distance(b, hero));

  for (const monster of order) {
    const ability = abilityFor(monster);
    if (distance(monster, hero) === 1) {
      attack(monster, hero);
      if (state.over) return;
      continue;
    }

    const detection = heroLight(hero) + 3 + (ability?.detectionBonus || 0);
    if (distance(monster, hero) > detection) continue;
    if (ability?.beforeMove?.(monster, hero)) {
      if (distance(monster, hero) === 1) {
        attack(monster, hero);
        if (state.over) return;
      }
      continue;
    }

    const options = [
      { x: monster.x + Math.sign(hero.x - monster.x), y: monster.y },
      { x: monster.x, y: monster.y + Math.sign(hero.y - monster.y) }
    ].sort(() => Math.random() - 0.5);

    for (const next of options) {
      if (openForMonster(next.x, next.y, monster)) {
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
  spawnHealParticle(hero.x, hero.y, heal);
  for (const status of Object.keys(hero.statuses)) {
    hero.statuses[status] = Math.max(0, hero.statuses[status] - 2);
  }
  addLog(`The tonic restores ${heal} HP.`, "good");
  tickHeroStatuses();
  if (!state.over) monsterTurn();
  render();
}

function visible(x, y) {
  const hero = state.hero;
  const dx = x - hero.x;
  const dy = y - hero.y;
  return Math.sqrt(dx * dx + dy * dy) <= heroLight(hero);
}

function spawnDamageParticle(x, y, amount, isHeroTarget) {
  particles.push({
    x, y,
    text: String(amount),
    textColor: isHeroTarget ? "#e05a5a" : "#f4ecd8",
    flashColor: isHeroTarget ? "#c82828" : "#dc8214",
    startTime: performance.now(),
    duration: 650
  });
  if (particleAnimId === null) {
    particleAnimId = requestAnimationFrame(stepParticles);
  }
}

function spawnHealParticle(x, y, amount) {
  particles.push({
    x, y,
    text: `+${amount}`,
    textColor: "#7de07d",
    flashColor: "#28b428",
    startTime: performance.now(),
    duration: 650
  });
  if (particleAnimId === null) {
    particleAnimId = requestAnimationFrame(stepParticles);
  }
}

function stepParticles() {
  const now = performance.now();
  particles = particles.filter(p => now - p.startTime < p.duration);
  renderMap();
  particleAnimId = particles.length > 0 ? requestAnimationFrame(stepParticles) : null;
}

function drawParticles(now) {
  if (!particles.length) return;
  ctx.save();
  ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of particles) {
    if (!inViewport(p.x, p.y)) continue;
    const t = Math.min(1, (now - p.startTime) / p.duration);
    const rise = t * TILE * 2;
    const cx = toScreenX(p.x) + TILE / 2;
    const cy = toScreenY(p.y) + TILE / 2 - rise;
    if (t < 0.4) {
      ctx.globalAlpha = (0.4 - t) / 0.4 * 0.55;
      ctx.fillStyle = p.flashColor;
      ctx.fillRect(toScreenX(p.x), toScreenY(p.y), TILE, TILE);
    }
    const alpha = 1 - t;
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = "#000";
    ctx.fillText(p.text, cx + 1, cy + 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.textColor;
    ctx.fillText(p.text, cx, cy);
  }
  ctx.restore();
}

function drawTile(x, y, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(toScreenX(x), toScreenY(y), TILE, TILE);
}

function drawSprite(sprite, x, y) {
  if (!inViewport(x, y)) return;
  const pattern = spritePatterns[sprite] || spritePatterns.gear;
  const palette = spritePalettes[sprite] || spritePalettes.gear;
  const pixel = 2;
  const width = Math.max(...pattern.map((row) => row.length)) * pixel;
  const height = pattern.length * pixel;
  const ox = toScreenX(x) + Math.floor((TILE - width) / 2);
  const oy = toScreenY(y) + Math.floor((TILE - height) / 2);

  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      const swatch = pattern[row][col];
      if (swatch === ".") continue;
      ctx.fillStyle = palette[swatch];
      ctx.fillRect(ox + col * pixel, oy + row * pixel, pixel, pixel);
    }
  }
}

function monsterSprite(monster) {
  if (monster.sprite) return monster.sprite;
  const sprites = {
    "Salem Shade": "shade",
    Banshee: "banshee",
    "Jack-o'-Lantern": "lantern",
    "Cursed Mummy": "mummy",
    "Plague Doctor": "plague",
    "Black Cat": "blackcat",
    "Carpathian Vampire": "vampire",
    "Jersey Devil": "devil",
    Scarecrow: "scarecrow",
    "Headless Horseman": "horseman",
    Lich: "lich",
    Wendigo: "wendigo"
  };
  return sprites[monster.name] || "shade";
}

function renderMap() {
  updateCamera();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = camera.y; y < camera.y + VIEW_H; y++) {
    for (let x = camera.x; x < camera.x + VIEW_W; x++) {
      const seen = visible(x, y);
      if (seen) state.visited[y][x] = 1;
      const tile = state.map[y][x];
      const base = tile === WALL ? "#3f3a2d" : "#20271f";
      drawTile(x, y, seen ? base : "#080908");
      if (seen && tile === WALL) {
        ctx.fillStyle = "#6c6047";
        ctx.fillRect(toScreenX(x) + 2, toScreenY(y) + 2, TILE - 4, TILE - 4);
      }
      if (seen && tile === STAIRS) drawSprite("stairs", x, y);
    }
  }

  for (const tonic of state.tonics) {
    if (inViewport(tonic.x, tonic.y) && visible(tonic.x, tonic.y)) drawSprite("tonic", tonic.x, tonic.y);
  }

  for (const item of state.equipment) {
    if (inViewport(item.x, item.y) && visible(item.x, item.y)) drawSprite("gear", item.x, item.y);
  }

  for (const monster of state.monsters) {
    if (inViewport(monster.x, monster.y) && visible(monster.x, monster.y)) {
      if (monster.boss) {
        ctx.strokeStyle = monster.color || "#f0a23a";
        ctx.lineWidth = 2;
        ctx.strokeRect(toScreenX(monster.x) + 2, toScreenY(monster.y) + 2, TILE - 4, TILE - 4);
      }
      drawSprite(monsterSprite(monster), monster.x, monster.y);
    }
  }

  drawSprite("hero", state.hero.x, state.hero.y);

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

  drawParticles(performance.now());

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

function renderMinimap() {
  if (!state.visited) return;
  const scale = 2;
  minimapCanvas.width = W * scale;
  minimapCanvas.height = H * scale;

  minimapCtx.fillStyle = "#0b0c0a";
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!state.visited[y][x]) continue;
      const tile = state.map[y][x];
      minimapCtx.fillStyle = tile === WALL ? "#4a4030" : tile === STAIRS ? "#e8a030" : "#1e2a1c";
      minimapCtx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  minimapCtx.strokeStyle = "rgba(255,255,255,0.2)";
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(camera.x * scale + 0.5, camera.y * scale + 0.5, VIEW_W * scale, VIEW_H * scale);

  minimapCtx.fillStyle = "#f4ecd8";
  minimapCtx.fillRect(state.hero.x * scale - 1, state.hero.y * scale - 1, 3, 3);
}

function renderUi() {
  const hero = state.hero;
  els.version.textContent = VERSION;
  els.depth.textContent = state.depth;
  els.level.textContent = hero.level;
  els.hp.textContent = `${hero.hp}/${hero.maxHp}`;
  els.xp.textContent = `${hero.xp}/${hero.nextXp}`;
  els.score.textContent = scoreRun().toLocaleString();
  els.statuses.innerHTML = statusBadges(hero);
  els.str.textContent = `${hero.str} (+${gearBonus(hero, "attack")} atk)`;
  els.agi.textContent = `${hero.agi} (+${gearBonus(hero, "defense")} def)`;
  els.will.textContent = heroWill(hero);
  els.light.textContent = `${heroLight(hero)}`;
  els.inventory.textContent = `${hero.potions} pumpkin tonic${hero.potions === 1 ? "" : "s"}`;
  els.examine.textContent = examineText;
  els.weapon.textContent = hero.equipment.weapon.name;
  els.charm.textContent = hero.equipment.charm.name;
  els.scores.innerHTML = highScores.length
    ? highScores
        .map(
          (score) =>
            `<li><div class="score-row"><strong>${escapeHtml(score.name || "Nameless")}: ${score.score}</strong><span>D${score.depth} L${score.level} K${score.kills} B${score.bossKills || 0} - ${score.date}</span></div></li>`
        )
        .join("")
    : `<li class="empty">${scoreStatus}</li>`;
  els.log.innerHTML = state.log
    .map((entry) => `<li class="${entry.tone}">${entry.text}</li>`)
    .join("");
}

function render() {
  renderMap();
  renderMinimap();
  renderUi();
}

// --- Debug panel ---

const debugPanel = document.querySelector("#debug-panel");
const dbgGodModeBtn = document.querySelector("#dbg-god-mode");

function applyDebugMode() {
  if (debugMode) {
    debugPanel.classList.remove("hidden");
  } else {
    debugPanel.classList.add("hidden");
    godMode = false;
    dbgGodModeBtn.classList.remove("active");
    dbgGodModeBtn.textContent = "God Mode: Off";
  }
}

function debugLevelUp() {
  if (state.over) return;
  gainXp(state.hero.nextXp - state.hero.xp);
  render();
}

function debugFullHeal() {
  if (state.over) return;
  state.hero.hp = state.hero.maxHp;
  addLog("[Debug] Full heal.", "good");
  render();
}

function debugAddTonics() {
  if (state.over) return;
  state.hero.potions += 5;
  addLog("[Debug] +5 tonics.", "good");
  render();
}

function debugKillAll() {
  if (state.over) return;
  const hero = state.hero;
  for (const monster of [...state.monsters]) {
    state.killCounts[monster.name] = (state.killCounts[monster.name] || 0) + 1;
    hero.kills += 1;
    if (monster.boss) {
      hero.bossKills += 1;
      state.bossScoreBonus += monster.scoreBonus;
    }
    gainXp(monster.xp);
  }
  state.monsters = [];
  addLog("[Debug] All monsters slain.", "good");
  render();
}

function debugRevealMap() {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (state.map[y][x] !== WALL) state.visited[y][x] = 1;
    }
  }
  addLog("[Debug] Map revealed.", "good");
  render();
}

function debugToggleGodMode() {
  godMode = !godMode;
  dbgGodModeBtn.classList.toggle("active", godMode);
  dbgGodModeBtn.textContent = `God Mode: ${godMode ? "On" : "Off"}`;
  addLog(`[Debug] God mode ${godMode ? "on" : "off"}.`, godMode ? "good" : "");
  render();
}

function debugNextDepth() {
  if (state.over) return;
  addLog("[Debug] Descending to next depth.");
  placeLevel(state.depth + 1, state.hero);
  render();
}

function debugSetDepth() {
  if (state.over) return;
  const input = document.querySelector("#dbg-depth-input");
  const depth = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));
  input.value = depth;
  addLog(`[Debug] Jumping to depth ${depth}.`);
  placeLevel(depth, state.hero);
  render();
}

document.querySelector("#dbg-level-up").addEventListener("click", debugLevelUp);
document.querySelector("#dbg-full-heal").addEventListener("click", debugFullHeal);
document.querySelector("#dbg-add-tonics").addEventListener("click", debugAddTonics);
document.querySelector("#dbg-kill-all").addEventListener("click", debugKillAll);
document.querySelector("#dbg-reveal").addEventListener("click", debugRevealMap);
dbgGodModeBtn.addEventListener("click", debugToggleGodMode);
document.querySelector("#dbg-next-depth").addEventListener("click", debugNextDepth);
document.querySelector("#dbg-set-depth").addEventListener("click", debugSetDepth);

applyDebugMode();

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;

  if (!els.levelupModal.classList.contains("hidden")) {
    const cards = els.levelupContent.querySelectorAll(".perk-card");
    if (event.key === "1" && cards[0]) { event.preventDefault(); cards[0].click(); return; }
    if (event.key === "2" && cards[1]) { event.preventDefault(); cards[1].click(); return; }
    if (event.key === "3" && cards[2]) { event.preventDefault(); cards[2].click(); return; }
    return;
  }

  if (event.key === "Escape" && hasOpenDialog()) {
    closeOpenDialogs();
    return;
  }

  if (hasOpenDialog()) return;

  if (event.key === "`") {
    event.preventDefault();
    debugMode = !debugMode;
    applyDebugMode();
    return;
  }

  if (event.key === "?") {
    event.preventDefault();
    openHelp();
    return;
  }

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

  if (event.key.toLowerCase() === "m") {
    event.preventDefault();
    minimapSection.classList.toggle("hidden");
    return;
  }

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

  if (event.key === "." || event.key.toLowerCase() === "r") {
    event.preventDefault();
    waitHero();
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
  button.addEventListener("touchstart", (event) => {
    event.preventDefault();
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    moveHero(dx, dy);
  }, { passive: false });
  button.addEventListener("click", () => {
    const [dx, dy] = button.dataset.move.split(",").map(Number);
    moveHero(dx, dy);
  });
});

els.heroName.addEventListener("change", () => setPlayerName(els.heroName.value));
els.heroName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.heroName.blur();
});
els.helpOpen.addEventListener("click", openHelp);
els.helpClose.addEventListener("click", closeHelp);
els.helpModal.addEventListener("click", (event) => {
  if (event.target === els.helpModal) closeHelp();
});
els.roadmapOpen.addEventListener("click", () => { closeHelp(); openRoadmap(); });
els.roadmapClose.addEventListener("click", closeRoadmap);
els.roadmapModal.addEventListener("click", (event) => {
  if (event.target === els.roadmapModal) closeRoadmap();
});
els.deathClose.addEventListener("click", closeDeathScreen);
els.deathReview.addEventListener("click", closeDeathScreen);
els.deathNewRun.addEventListener("click", newGame);
els.potion.addEventListener("click", drinkPotion);
els.waitActions.forEach((button) => button.addEventListener("click", waitHero));
els.newGame.addEventListener("click", newGame);

setPlayerName(playerName);
newGame();
loadScores();
