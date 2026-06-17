window.HallowdeepData = window.HallowdeepData || {};

window.HallowdeepData.emptyWeapon = {
  name: "Bare Hands",
  slot: "weapon",
  attack: 0,
  defense: 0,
  will: 0,
  light: 0,
  tier: 0
};

window.HallowdeepData.emptyCharm = {
  name: "None",
  slot: "charm",
  attack: 0,
  defense: 0,
  will: 0,
  light: 0,
  tier: 0
};

window.HallowdeepData.equipmentBook = [
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

window.HallowdeepData.bossRelicBook = [
  {
    id: "candleKingsWick",
    name: "Candle King's Wick",
    slot: "charm",
    attack: 0,
    defense: 1,
    will: 1,
    light: 2,
    minDepth: 5,
    tier: 6,
    relic: true,
    effectText: "Burning deals 1 less damage each turn.",
    burningDamageReduction: 1
  },
  {
    id: "motherHushVeil",
    name: "Mother Hush's Veil",
    slot: "charm",
    attack: 0,
    defense: 2,
    will: 3,
    light: 1,
    minDepth: 10,
    tier: 7,
    relic: true,
    effectText: "Dread lasts 2 fewer turns.",
    statusResist: { dread: 2 }
  },
  {
    id: "hollowSaintReliquary",
    name: "Hollow Saint's Reliquary",
    slot: "charm",
    attack: 0,
    defense: 1,
    will: 2,
    light: 2,
    minDepth: 15,
    tier: 8,
    relic: true,
    effectText: "Once per run, a lethal blow restores you to 40% HP and clears statuses.",
    deathSave: true,
    deathSaveHeal: 0.4,
    clearStatusesOnDeathSave: true
  },
  {
    id: "oldHungersFang",
    name: "Old Hunger's Fang",
    slot: "weapon",
    attack: 8,
    defense: 1,
    will: 0,
    light: 0,
    minDepth: 20,
    tier: 9,
    relic: true,
    effectText: "Heal 4 HP whenever you kill a monster.",
    healOnKill: 4
  }
];
