# Hallowdeep TODO

## Gameplay

- Add more monsters with `ability` values wired through `abilityDefinitions`.
- Add ranged weapons for the character.
- Add ranged or area abilities for late-depth monsters.
- Add themed dungeon features such as locked doors, coffins, altars, traps, and shrines.
- Add special room encounter types such as treasure rooms, ambush rooms, ritual rooms, flooded crypts, and candle mazes.
- Add consumables beyond pumpkin tonics, such as holy water, salt circles, and lantern oil.
- Add a win condition or final depth instead of endless descent.
- Add more derived stats, resistances, or secondary attributes to the character.
- Add a crafting ability.
- Add a light source, making the spotlight different sizes based on what you have.
- Add a quest system.
- Add unidentified items that drop with unknown names and reveal on use or examination.
- Add cursed items with hidden penalties, removable only by a specific consumable.
- Add secret rooms reachable through hidden passages or breakable walls.
- Add a flee mechanic to escape combat at the cost of a parting attack from the monster.
- Add monster turn telegraphing to show intended movement before the monster acts.
- Add threat preview hints for nearby danger, such as suspicious sounds, visible attack ranges, or boss proximity warnings.
- Add difficulty modes (e.g., Normal, Cursed, Nightmare) that adjust monster scaling or player HP at run start.
- Add run-start omens or modifiers, such as Blood Moon, Thin Veil, Candle Blessing, or Starless Night.
- Add a healing source (fountain) that spawns randomly once on boss levels. It disappears after used.
- Add a compass item that allows you to locate things, like the exit, better items and the boss.
- Add boss floor buildup on preceding or current floors, such as themed warnings, environmental clues, and altered monster mixes.

## Balance

- Tune monster spawn counts for the larger scrolling maps.
- Tune poison, dread, curse, and charge frequency after playtesting.
- Add score bonuses for rare gear and unused tonics.
- Add score categories for alternate accomplishments, such as deepest run, most bosses, no-tonic runs, and difficulty-specific runs.
- Add difficulty ramp notes per depth so new monsters can be slotted cleanly.

## UI

- Improve mobile controls with diagonal movement or tap-to-move.
- Add click/tap pathing or cautious auto-explore for moving across known safe tiles until interrupted.
- Add a full Chronicle scroll or log viewer so older entries are not lost when the panel fills.
- Add keyboard rebinding stored in localStorage for non-QWERTY layouts and personal preference.
- Add a first-run contextual hint (checked in localStorage) explaining movement and the goal.
- Prompt user to change their name if it is the default at game start.
- Expand death recaps with turns survived, damage dealt/taken, best item found, killer ability, and status at death.

## Persistence And Replayability

- Add personal best tracking and highlighted best categories in localStorage, separate from the shared leaderboard.
- Add seed-based runs so players can enter a seed string for a deterministic dungeon.
- Add a daily seed: one shared seed per day giving every player the same dungeon.
- Add local achievements or unlocks for milestones such as first boss kill, depth 10, no-tonic runs, and defeating every monster type.
- Add optional score filters or views for personal bests, shared scores, daily runs, and challenge categories.

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
- Add security headers to server responses: Content-Security-Policy, X-Content-Type-Options, and X-Frame-Options.
- Add a PWA manifest and minimal service worker for offline caching and home screen installation.

## Code Quality

- Add lightweight tests for score sorting, item scaling, and ability hooks.
- Expand debug mode with controls for spawning specific monsters/items during balancing.
- Remove unused monster `glyph` fields if sprite rendering fully replaces glyphs.
- Add monster behavior tags such as cowardly, patrol, guard, summoner, pack, territorial, and sleeper.
