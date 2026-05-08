# Hallowdeep Deployment

**These are instructions for deploying to my own personal site. They are probably not relavent to any other site.**

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

## Run The Score Server With systemd

Install the service file:

```bash
sudo cp /var/www/seanstarkey.dev/public/Hallowdeep/deploy/systemd/hallowdeep.service /etc/systemd/system/hallowdeep.service
```

Make sure `www-data` can write the score file:

```bash
sudo mkdir -p /var/www/seanstarkey.dev/public/Hallowdeep/data
sudo touch /var/www/seanstarkey.dev/public/Hallowdeep/data/high-scores.json
sudo chown -R www-data:www-data /var/www/seanstarkey.dev/public/Hallowdeep/data
sudo chmod 775 /var/www/seanstarkey.dev/public/Hallowdeep/data
sudo chmod 664 /var/www/seanstarkey.dev/public/Hallowdeep/data/high-scores.json
```

If `high-scores.json` is empty, initialize it:

```bash
echo '[]' | sudo tee /var/www/seanstarkey.dev/public/Hallowdeep/data/high-scores.json
sudo chown www-data:www-data /var/www/seanstarkey.dev/public/Hallowdeep/data/high-scores.json
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hallowdeep
sudo systemctl status hallowdeep
```

By default, the Node server listens on port `3000` as `www-data`.

After deploying changes to `server.js`, restart it:

```bash
sudo systemctl restart hallowdeep
```

Watch logs:

```bash
sudo journalctl -u hallowdeep -f
```

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

On the Linux server, the deployed `data` directory should remain owned by `www-data` so the score service can write to it.

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
    add_header Cache-Control "no-store" always;
}
```

## API Path

The browser calls the score API with a relative URL:

```js
const SCORE_API = "api/scores";
```

That makes score requests resolve to `/Hallowdeep/api/scores` when the game is hosted under `/Hallowdeep/`.
