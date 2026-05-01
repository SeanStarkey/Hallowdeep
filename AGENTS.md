# AGENTS.md

## Project Overview

Hallowdeep is a browser-based Halloween roguelike. The game is mostly static HTML, CSS, and JavaScript, with a small Node.js server for static file serving and the shared high-score API.

Core files:

- `index.html` contains the game UI shell.
- `styles.css` contains layout and visual styling.
- `game.js` contains game state, rendering, controls, combat, monsters, scoring, and client-side behavior.
- `monsters.js`, `items.js`, and `sprites.js` contain game data and rendering helpers.
- `server.js` serves static files and implements `/api/scores`.
- `data/high-scores.json` stores leaderboard data.
- `TODO.md` is both the roadmap and in-game roadmap content.
- `deploy/` contains personal deployment scripts and notes.

## Run And Verify

- Use Node.js 18 or newer.
- Start the app with `npm start`.
- Open `http://localhost:3000`.
- Use `PORT=4000 npm start` if port 3000 is busy.
- There are currently no npm dependencies and no automated test script.
- For browser-facing changes, verify manually in a browser after starting the server.

## Coding Conventions

- Keep the project dependency-free unless a new dependency is clearly justified.
- Prefer plain JavaScript, HTML, and CSS that match the existing style.
- Keep gameplay logic deterministic and easy to inspect where practical.
- Keep changes scoped; avoid broad refactors while adding a feature or fixing a bug.
- Preserve the static-file nature of the game unless the task explicitly calls for tooling.
- Use ASCII text unless editing content that already uses non-ASCII characters.

## Gameplay And UI Guidance

- Respect the turn-based roguelike feel: movement, combat, scoring, and progression changes should be understandable to a player from the event log and visible state.
- Keep mobile and keyboard play working when changing controls.
- Avoid UI text overlap on small screens; verify responsive behavior when changing layout.
- If changing sprite, monster, item, or ability behavior, check related data in `monsters.js`, `items.js`, `sprites.js`, and `game.js`.

## High-Score API Notes

- The score API lives in `server.js` under `/api/scores`.
- `data/high-scores.json` is local mutable data. Do not overwrite real scores casually.
- Preserve the existing API methods unless intentionally changing the contract:
  - `GET /api/scores`
  - `POST /api/scores`
  - `DELETE /api/scores`

## Git And Collaboration

- Do not revert unrelated changes.
- Read nearby code before editing, and follow existing patterns.
- Summarize changed behavior and verification steps when finishing work.
- If tests cannot be run because none exist, say so and describe the manual check used instead.
- When Codex makes code changes and is asked to create a git commit, include `Co-authored-by: Codex <codex@openai.com>` in the commit message.
- Do not add the Codex co-author trailer for commits that only contain user-authored work or by other AIs.
