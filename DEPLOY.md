# Hallowdeep Deployment

Hallowdeep is intended to be deployed under the main site root at:

```text
/var/www/seanstarkey.dev/public/Hallowdeep
```

That makes the game available at:

```text
https://seanstarkey.dev/Hallowdeep/
```

The static game files can be served by NGINX, but the shared high-score list needs the Node server in `server.js`. Scores are stored in:

```text
/var/www/seanstarkey.dev/public/Hallowdeep/data/high-scores.json
```

## Run The Score Server

From the game directory:

```bash
cd /var/www/seanstarkey.dev/public/Hallowdeep
npm start
```

By default, the Node server listens on port `3000`.

Keep it running with your preferred process manager, such as `systemd` or `pm2`.

## Copy Files Into Place

From your working copy, run:

```bash
npm run deploy
```

The deploy script copies the project to:

```text
/var/www/seanstarkey.dev/public/Hallowdeep
```

It preserves the server's existing `data/high-scores.json` file so deployments do not erase the shared leaderboard.

If the target directory needs a specific owner, pass it with `HALLOWDEEP_DEPLOY_OWNER`:

```bash
HALLOWDEEP_DEPLOY_OWNER=www-data:www-data npm run deploy
```

If you need to deploy somewhere else temporarily, override `HALLOWDEEP_DEPLOY_DIR`:

```bash
HALLOWDEEP_DEPLOY_DIR=/tmp/Hallowdeep npm run deploy
```

## NGINX Example

Add these locations inside the existing `seanstarkey.dev` server block:

```nginx
location /Hallowdeep/api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /Hallowdeep/ {
    alias /var/www/seanstarkey.dev/public/Hallowdeep/;
    try_files $uri $uri/ /Hallowdeep/index.html;
}
```

## API Path

The browser calls the score API with a relative URL:

```js
const SCORE_API = "api/scores";
```

That makes score requests resolve to `/Hallowdeep/api/scores` when the game is hosted under `/Hallowdeep/`.
