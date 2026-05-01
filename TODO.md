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

## Balance

- Tune monster spawn counts for the larger scrolling maps.
- Tune poison, dread, curse, and charge frequency after playtesting.
- Add score bonuses for depth reached, boss kills, rare gear, and unused tonics.
- Add difficulty ramp notes per depth so new monsters can be slotted cleanly.

## UI

- Add an on-screen control reference outside the game canvas or in a pause/help modal.
- Add a minimap or explored-area indicator for large scrolling floors.
- Add hit flashes, damage numbers, and death effects.
- Improve mobile controls with diagonal movement or tap-to-move.

## Art And Audio

- Replace code-drawn sprites with a cohesive pixel-art sprite sheet.
- Add tile variation for floors and walls.
- Add simple idle animations for player and monsters.
- Add sound effects for attacks, pickups, stairs, and monster abilities.
- Add background ambience with a mute toggle.

## Persistence And Deployment

- Add a health check endpoint for the score server.
- Add basic rate limiting or validation hardening for score submissions.
- Add backup instructions for `data/high-scores.json`.
- Add deployment notes for updating NGINX and restarting the Node service.

## Code Quality

- Add lightweight tests for score sorting, item scaling, and ability hooks.
- Add a debug mode for spawning specific monsters/items during balancing.
- Remove unused monster `glyph` fields if sprite rendering fully replaces glyphs.
