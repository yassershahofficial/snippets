# Production setup — existing VPS (other projects already running)

Run **snippets** beside other apps without sharing their Docker networks, volumes, or databases. The VPS only needs the small `deploy/` folder plus a snippet in your **existing** reverse proxy (usually Caddy). App images come from **GHCR** — no full codebase clone.

## Goals / isolation rules

- Own Compose project name: `snippets`
- Own network: `snippets_net` (do **not** attach to other projects’ networks)
- Own volumes: `snippets_mongo_data`, `snippets_media`
- Own container names: `snippets_*`
- Publish app ports only on **127.0.0.1**, using **free** host ports if `3000` / `4321` are taken
- Do **not** start the compose `caddy` profile if something else already owns `:80` / `:443`
- Mongo stays internal (no host publish)

## What ends up on the server

```text
/opt/snippets/                 # or ~/stacks/snippets, etc.
  docker-compose.yml
  .env
```

Plus a few lines in your **host** Caddy (or nginx) config — see `deploy/Caddyfile.host.example`.

---

## 0. Prerequisites (laptop / GitHub)

Same as a new VPS:

1. Repo on GitHub; Actions workflow has published:
   - `ghcr.io/<owner>/<repo>/snippets-cms:latest`
   - `ghcr.io/<owner>/<repo>/snippets-web:latest`
2. Repository Actions variables set before building web images:
   - `PUBLIC_SITE_URL` = `https://snippets.example.com`
   - `PUBLIC_PAYLOAD_URL` = `https://cms.snippets.example.com`
3. PAT with `read:packages` if GHCR packages are private.
4. DNS A/AAAA for site + CMS hostnames already pointing at **this** VPS (or ready to point).

---

## 1. Inventory the existing server (do this first)

SSH in and note what is already bound:

```bash
ss -tlnp | grep -E ':80|:443|:3000|:4321|:27017' || true
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Networks}}'
ufw status verbose
```

Decide:

| Question | Action |
|----------|--------|
| Is host Caddy/nginx already on 80/443? | **Yes** → use host proxy + `Caddyfile.host.example`. **No** → you may use `docker compose --profile caddy` (see `prod_new_vps.md`) |
| Are `3000` or `4321` already used on localhost? | Pick free ports, e.g. `13000` / `14321`, set in `.env` |
| Is UFW active? | Add/allow only what you still need; don’t wipe unrelated rules |

Pick free loopback ports:

```bash
ss -tlnp | grep '127.0.0.1' || true
# example free choice:
# CMS_HOST_PORT=13000
# WEB_HOST_PORT=14321
```

---

## 2. Confirm Docker is available

```bash
docker --version
docker compose version
```

If Docker is missing, install without breaking other stacks (official convenience script is fine on a machine that already uses Docker elsewhere — skip if Docker is already present):

```bash
curl -fsSL https://get.docker.com | sh
```

Do **not** recreate shared networks or rename other projects’ containers.

---

## 3. UFW — additive only

Do not reset UFW if other services depend on current rules.

If UFW is inactive and you want it on:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
```

If UFW is already active:

```bash
# only add missing rules
ufw status
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw reload
ufw status verbose
```

Still **do not** open `3000`, `4321`, or `27017` publicly. Host Caddy will talk to `127.0.0.1:<your ports>`.

Quick reachability check (from laptop):

```bash
curl -I --max-time 5 http://YOUR_VPS_IP || true
```

---

## 4. Install only the deploy bundle

From your laptop (repo root):

```bash
scp deploy/docker-compose.yml deploy/.env.example root@YOUR_VPS_IP:/opt/snippets/
# optional reference for host Caddy:
scp deploy/Caddyfile.host.example root@YOUR_VPS_IP:/opt/snippets/
```

On the VPS:

```bash
mkdir -p /opt/snippets
cd /opt/snippets
cp .env.example .env
nano .env
```

Configure:

```env
CMS_IMAGE=ghcr.io/OWNER/REPO/snippets-cms:latest
WEB_IMAGE=ghcr.io/OWNER/REPO/snippets-web:latest

# Avoid collisions with other local apps
CMS_HOST_PORT=13000
WEB_HOST_PORT=14321

PUBLIC_SITE_URL=https://snippets.example.com
PAYLOAD_PUBLIC_SERVER_URL=https://cms.snippets.example.com
PUBLIC_PAYLOAD_URL=https://cms.snippets.example.com
CORS_ORIGINS=https://snippets.example.com
CSRF_ORIGINS=https://snippets.example.com
PAYLOAD_SECRET=paste-openssl-rand-hex-32-here
```

```bash
openssl rand -hex 32
```

Important: `CMS_HOST_PORT` / `WEB_HOST_PORT` must match what you put in the **host** Caddyfile.

---

## 5. GHCR login and start (without compose Caddy)

```bash
cd /opt/snippets
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

docker compose pull
docker compose up -d
# deliberately NOT: --profile caddy
```

Verify isolation:

```bash
docker network ls | grep snippets
docker volume ls | grep snippets
docker compose ps
docker inspect snippets_web --format '{{json .NetworkSettings.Networks}}'
```

You should see only `snippets_net` — not other projects’ networks.

Loopback checks (use your chosen ports):

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:14321/
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:13000/admin
```

---

## 6. Wire the existing reverse proxy

### Caddy (recommended)

Use `deploy/Caddyfile.host.example` as a template. Merge into your main Caddyfile (or `import` a file), adjusting ports:

```caddy
snippets.example.com {
	encode gzip
	reverse_proxy 127.0.0.1:14321
}

cms.snippets.example.com {
	encode gzip
	reverse_proxy 127.0.0.1:13000
}
```

Validate and reload **without** restarting unrelated containers:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
# or: caddy reload --config /etc/caddy/Caddyfile
```

### nginx (if that’s what you already use)

```nginx
server {
  listen 443 ssl http2;
  server_name snippets.example.com;
  # ssl_certificate ...;
  location / {
    proxy_pass http://127.0.0.1:14321;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 443 ssl http2;
  server_name cms.snippets.example.com;
  # ssl_certificate ...;
  location / {
    proxy_pass http://127.0.0.1:13000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
nginx -t && systemctl reload nginx
```

---

## 7. Public smoke tests

From your laptop:

```bash
curl -I https://snippets.example.com
curl -I https://cms.snippets.example.com/admin
```

Then create the first Payload admin user and a published essay post; confirm the public site lists it.

---

## 8. Updates without touching other projects

```bash
cd /opt/snippets
docker compose pull
docker compose up -d
docker image prune -f
```

Only `snippets_*` containers recreate. Other Compose projects are untouched as long as you stay in `/opt/snippets` and don’t run global `docker compose down` from another directory with a broad project.

Avoid:

```bash
# dangerous on a shared host if you’re in the wrong directory
docker compose down -v
docker network prune
docker volume prune
```

---

## 9. Port / collision cheatsheet

| Conflict | Fix |
|----------|-----|
| Host already has Caddy on 80/443 | Never use `--profile caddy` for snippets |
| `127.0.0.1:3000` taken | Set `CMS_HOST_PORT` to a free port; update host proxy |
| `127.0.0.1:4321` taken | Set `WEB_HOST_PORT`; update host proxy |
| Another Mongo on host `:27017` | Irrelevant — snippets Mongo is unpublished and named `snippets_mongo` |
| Accidental shared network | Recreate: `docker compose down` **in `/opt/snippets` only**, ensure compose file has `snippets_net`, then `up -d` again |

---

## 10. Backups (this project only)

```bash
docker exec snippets_mongo mongodump --archive=/tmp/snippets.archive
docker cp snippets_mongo:/tmp/snippets.archive /opt/snippets/backup-mongo-$(date +%F).archive
```

Back up `/opt/snippets/.env` and the `snippets_media` volume separately. Do not dump unrelated containers’ volumes.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `bind: address already in use` | Change `CMS_HOST_PORT` / `WEB_HOST_PORT`; ensure compose binds `127.0.0.1:...` |
| Site 502 from host Caddy | Wrong upstream port vs `.env`; containers not healthy (`docker compose logs`) |
| Other site broke after reload | Syntax error in shared Caddyfile — `caddy validate` before reload; keep snippets blocks separate |
| Images won’t pull | GHCR login / package permissions / wrong image path (must be lowercase) |
| Media URLs still localhost | Web image was built with wrong `PUBLIC_PAYLOAD_URL` — fix GitHub Actions variables and rebuild/push, then `docker compose pull` |

---

## Checklist before walking away

- [ ] `docker compose ps` shows only snippets services healthy
- [ ] `docker network inspect snippets_net` lists only snippets containers
- [ ] UFW still allows SSH; 80/443 open; app/DB ports not public
- [ ] Host proxy reloaded; HTTPS works for site + CMS
- [ ] Other projects’ `docker ps` entries unchanged and still responding
