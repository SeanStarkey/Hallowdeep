# Hallowdeep TODO

## Gameplay

- Add more monsters with `ability` values wired through `abilityDefinitions`.
- Add ranged weapons for the character.
- Add ranged or area abilities for late-depth monsters.
- Add themed dungeon features such as locked doors, coffins, altars, traps, and shrines.
- Add a proper inventory screen with item choices instead of auto-equipping only stronger gear.
- Add consumables beyond pumpkin tonics, such as holy water, salt circles, and lantern oil.
- Add boss floors every few depths with unique monsters and score bonuses.
- Add a win condition or final depth instead of endless descent.
- Add more attributes to the character.
- Add a crafting ability.
- Add a light source, making the spotlight different sizes based on what you have.
- Add a quest system.
- Add unidentified items that drop with unknown names and reveal on use or examination.
- Add level-up choices: offer the player two or three minor perks instead of automatic stat increments.
- Add cursed items with hidden penalties, removable only by a specific consumable.
- Add secret rooms reachable through hidden passages or breakable walls.
- Add a flee mechanic to escape combat at the cost of a parting attack from the monster.
- Add monster turn telegraphing to show intended movement before the monster acts.
- Add difficulty modes (e.g., Normal, Cursed, Nightmare) that adjust monster scaling or player HP at run start.

## Balance

- Tune monster spawn counts for the larger scrolling maps.
- Tune poison, dread, curse, and charge frequency after playtesting.
- Add score bonuses for depth reached, boss kills, rare gear, and unused tonics.
- Add difficulty ramp notes per depth so new monsters can be slotted cleanly.

## UI

- Improve mobile controls with diagonal movement or tap-to-move.
- Add a full Chronicle scroll or log viewer so older entries are not lost when the panel fills.
- Add keyboard rebinding stored in localStorage for non-QWERTY layouts and personal preference.
- Add a first-run contextual hint (checked in localStorage) explaining movement and the goal.
- Prompt user to change their name if it is the default at game start.

## Persistence And Replayability

- Add mid-run save to localStorage so closing the tab does not lose an active run.
- Add a run history (graveyard) in localStorage showing the last N runs with depth, score, cause of death, and gear.
- Add personal best tracking in localStorage, separate from the shared leaderboard.
- Add seed-based runs so players can enter a seed string for a deterministic dungeon.
- Add a daily seed: one shared seed per day giving every player the same dungeon.

## Art And Audio

- Replace code-drawn sprites with a cohesive pixel-art sprite sheet.
- Add tile variation for floors and walls.
- Add simple idle animations for player and monsters.
- Add sound effects for attacks, pickups, stairs, and monster abilities.
- Add background ambience with a mute toggle.

## Persistence And Deployment

- Add a health check endpoint for the score server.
- Add basic rate limiting or validation hardening for score submissions.
- Add a score submission auth token (env-var shared secret) checked on POST and DELETE to prevent casual manipulation.
- Add backup instructions for `data/high-scores.json`.
- Add deployment notes for updating NGINX and restarting the Node service.
- Add security headers to server responses: Content-Security-Policy, X-Content-Type-Options, and X-Frame-Options.
- Add a PWA manifest and minimal service worker for offline caching and home screen installation.

## Code Quality

- Add lightweight tests for score sorting, item scaling, and ability hooks.
- Add a debug mode for spawning specific monsters/items during balancing.
- Remove unused monster `glyph` fields if sprite rendering fully replaces glyphs.
