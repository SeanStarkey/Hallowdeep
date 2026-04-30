# Hallowdeep Deployment

Hallowdeep now uses a shared high-score API. The browser reads and writes `/api/scores`, so the static files still work behind NGINX, but a small Node process must run beside it.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`. Scores are stored in `data/high-scores.json`.

## NGINX example

Serve the static game from this folder and proxy score requests to Node:

```nginx
server {
    listen 80;
    server_name example.com;

    root /Users/starkey/Dropbox/Sean/code/Hallowdeep;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Keep the Node server running with your preferred process manager, such as `systemd`, `pm2`, or a launch agent.
