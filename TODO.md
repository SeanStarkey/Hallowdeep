# Hallowdeep TODO

## Priority 1: Groundwork

- Split `game.js` into smaller script files (map generation, combat, rendering, persistence, UI wiring) without adding build tooling.

## Priority 2: Combat Depth

- Add monster pathfinding (short BFS within detection radius) so monsters can chase around corners instead of stalling on walls; prerequisite for pack, patrol, and ambush behavior.
- Add a flee mechanic to escape combat at the cost of a parting attack from the monster.
- Add monster turn telegraphing to show intended movement before the monster acts.
- Add threat preview hints for nearby danger, such as suspicious sounds, visible attack ranges, or boss proximity warnings.
- Add ranged weapons for the character.
- Add monster behavior tags such as cowardly, patrol, guard, summoner, pack, territorial, and sleeper.

## Priority 3: Light As A Resource

- Add a lantern equipment slot next to weapon and charm; the equipped light source sets the spotlight radius.
- Add lantern oil as a consumable that refuels or brightens the lantern.
- Surface the existing light trade-off in the UI: monster detection scales with hero light, so a bright lantern reveals more but draws monsters from farther away. Let players choose dim (stealth) or bright (vision).

## Priority 4: Item Depth

- Extend gear progression past depth 7, via deeper-tier equipment or scaling item affixes (e.g., "Silver Hatchet of Embers"); the best non-relic item is minDepth 7 while the final boss sits at depth 20.
- Add consumables beyond pumpkin tonics with distinct tactical roles: holy water as a throwable, salt circles as a defensive zone, lantern oil as fuel. Avoid more healing variants.
- Add unidentified items that drop with unknown names and reveal on use or examination; pairs with affixes, which give identification something to hide.
- Add cursed items with hidden penalties, removable only by a specific consumable.
- Add build-defining perks beyond flat stat bumps, such as lifesteal on kill, thorns retaliation, a free tonic per boss kill, and a once-per-floor death save.

## Priority 5: Boss Fights

- Add a boss phase change at half HP via a new ability hook (e.g. `onHalfHealth`): the Candle King ignites nearby tiles, Mother Hush summons shades, and so on.
- Add boss floor buildup on preceding or current floors, such as themed warnings, environmental clues, and altered monster mixes.
- Add a healing source (fountain) that spawns randomly once on boss levels. It disappears after used.
- Add ranged or area abilities for late-depth monsters.

## Priority 6: Replayability

- Add a daily seed: one shared seed per day giving every player the same dungeon.
- Add seed-based runs so players can enter a seed string for a deterministic dungeon.
- Add personal best tracking and highlighted best categories in localStorage, separate from the shared leaderboard.
- Add local achievements or unlocks for milestones such as first boss kill, depth 10, no-tonic runs, and defeating every monster type.
- Add optional score filters or views for personal bests, shared scores, daily runs, and challenge categories.
- Add score categories for alternate accomplishments, such as deepest run, most bosses, no-tonic runs, and difficulty-specific runs.
- Add ghost markers on daily seeds showing where previous attempts (yours or top players) died.

## Priority 7: Feel And Polish

- Add hit feedback such as brief screen shake and sprite flash on damage, with a reduce-motion toggle.
- Replace code-drawn sprites with a cohesive pixel-art sprite sheet.
- Add tile variation for floors and walls.
- Add simple idle animations for player and monsters.
- Add sound effects for attacks, pickups, stairs, and monster abilities.
- Add background ambience with a mute toggle.

## Backlog

- Add more monsters with `ability` values wired through `abilityDefinitions`.
- Add elite monster variants with stat-modifying prefixes such as Swift, Venomous, Hulking, and Spectral, optionally granting a second ability.
- Add themed dungeon features such as locked doors, coffins, altars, traps, and shrines.
- Add special room encounter types such as treasure rooms, ambush rooms, ritual rooms, flooded crypts, and candle mazes.
- Add secret rooms reachable through hidden passages or breakable walls.
- Add run-start omens or modifiers, such as Blood Moon, Thin Veil, Candle Blessing, or Starless Night.
- Add branching stairs: occasionally offer a normal exit and a cursed exit that skips a depth but raises spawn danger.
- Add a compass item that allows you to locate things, like the exit, better items and the boss.
- Add more derived stats, resistances, or secondary attributes to the character.
- Improve mobile controls with diagonal movement or tap-to-move.
- Add a full Chronicle scroll or log viewer so older entries are not lost when the panel fills.
- Add keyboard rebinding stored in localStorage for non-QWERTY layouts and personal preference.
- Add a first-run contextual hint (checked in localStorage) explaining movement and the goal.

## Deferred

- Crafting: wants inventory depth the 4-slot bag deliberately avoids and pulls against the short-run permadeath loop; revisit only if a clear use emerges.
- Quest system: same concern as crafting; run-scoped micro-goals could return later as achievements or floor events instead.
- Difficulty modes (Normal, Cursed, Nightmare): do run-start omens first; they provide similar variety with more flavor and will show what a difficulty mode should actually change.

## Balance

- Tune monster spawn counts for the larger scrolling maps.
- Tune poison, dread, curse, and charge frequency after playtesting.
- Add score bonuses for rare gear and unused tonics.
- Add difficulty ramp notes per depth so new monsters can be slotted cleanly.

## Server And Deployment

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
- Add an explicit save migration policy for `SAVE_VERSION`: migrate or discard old active-run saves with a log message, and consider the same for run history.
