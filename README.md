# Hallowdeep

Hallowdeep is a browser-based Halloween roguelike with procedural dungeon floors, turn-based combat, character progression, themed monsters, equipment pickups, pumpkin tonics, and a shared high-score board.

The game is mostly static HTML, CSS, and JavaScript. A small Node.js server serves the files and provides the high-score API.

You can access the game to try at https://www.seanstarkey.dev/Hallowdeep

## Features

- Procedural dungeon maps with rooms, corridors, stairs, items, and monsters.
- Turn-based movement and combat on a canvas-rendered board.
- Scaling monsters with special abilities such as blink, dread, curse, poison, drain, and charge.
- Hero stats, equipment, status conditions, inventory, event log, and tile examine panel.
- Local/mobile controls plus keyboard play.
- Shared high-score storage through `/api/scores`.
- In-game roadmap loaded from `TODO.md`.

## Requirements

- Node.js 18 or newer.

No npm dependencies are currently required.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

You can also choose another port:

```bash
PORT=4000 npm start
```

## Project Structure

```text
index.html              Game UI shell
styles.css              Layout and visual styles
game.js                 Game state, rendering, controls, monsters, scoring
server.js               Static file server and high-score API
data/high-scores.json   Shared leaderboard data
TODO.md                 Roadmap shown inside the game
deploy/                 Personal deployment scripts and notes
promo/                  Promo rendering helpers
```

## High Scores

Scores are stored in `data/high-scores.json`. The server creates the file if it does not exist.

The high-score API supports:

- `GET /api/scores`
- `POST /api/scores`
- `DELETE /api/scores`

## Deployment

Deployment notes for the current personal hosting setup live in [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## License

No license has been specified yet.
