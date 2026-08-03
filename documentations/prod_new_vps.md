# Production setup — clean / new VPS

Deploy **snippets** on a fresh Ubuntu server with Docker, UFW, and Caddy. The VPS only needs the small `deploy/` folder (compose + env + Caddyfile) — **not** the full git repo. App images come from **GHCR**.

## What ends up on the server

```text
/opt/snippets/          # or any path you prefer
  docker-compose.yml
  .env
  Caddyfile             # only if using the compose Caddy profile
```

No `apps/`, no `node_modules`, no source checkout required for day-to-day deploys.

## Architecture

| Piece | Role |
|--------|------|
| `snippets_web` | Astro (public site), loopback `:4321` |
| `snippets_cms` | Payload admin/API, loopback `:3000` |
| `snippets_mongo` | MongoDB, internal Docker network only |
| `snippets_caddy` | TLS + reverse proxy on `:80` / `:443` (compose profile) |

Network and volumes are prefixed `snippets_*` and isolated from other stacks.

Suggested DNS (replace with your domain):

- `snippets.example.com` → VPS public IP (site)
- `cms.snippets.example.com` → same IP (Payload admin)

---

## 0. Prerequisites (on your laptop / CI)

1. Push this repo to GitHub.
2. In the GitHub repo → **Settings → Secrets and variables → Actions → Variables**, set:
   - `PUBLIC_SITE_URL` = `https://snippets.example.com`
   - `PUBLIC_PAYLOAD_URL` = `https://cms.snippets.example.com`
3. Run the workflow **Build and push GHCR images** (push to `main` touching `apps/*`, or **Actions → Run workflow**).
4. Confirm packages exist under the repo’s **Packages** (GHCR), e.g.:
   - `ghcr.io/<owner>/<repo>/snippets-cms:latest`
   - `ghcr.io/<owner>/<repo>/snippets-web:latest`
5. If packages are private: create a GitHub PAT with `read:packages` (and SSO authorize if needed). You will use it on the VPS for `docker login`.

Image names are lowercase; match what the workflow printed.

---

## 1. Create the server and DNS

1. Provision Ubuntu 22.04/24.04 (or similar) with a public IPv4.
2. Point both DNS A records at that IP. Wait until they resolve:

```bash
curl -fsS https://1.1.1.1/dns-query?name=snippets.example.com&type=A -H 'accept: application/dns-json' | head -c 500; echo
# or simply:
getent hosts snippets.example.com cms.snippets.example.com
```

Caddy needs correct DNS before TLS certificates succeed.

---

## 2. First login and baseline packages

SSH as root (or a sudo user):

```bash
ssh root@YOUR_VPS_IP
```

Update and install essentials:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg ufw
```

Optional: create a deploy user and disable password root login later; not required for this guide.

---

## 3. Install Docker Engine + Compose plugin

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version
docker compose version
```

Add your user to the `docker` group if you are not root:

```bash
usermod -aG docker "$USER"
# log out and back in for the group to apply
```

---

## 4. Configure UFW

Allow SSH **before** enabling the firewall:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
# or: ufw allow 22/tcp

ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp

ufw --force enable
ufw status verbose
```

Do **not** open Mongo (`27017`) or the app ports (`3000`, `4321`) publicly. Compose binds apps to `127.0.0.1`; Caddy in Docker publishes only 80/443.

Verify from your laptop that SSH still works, then:

```bash
curl -I http://YOUR_VPS_IP || true
```

(Port 80 may not answer until Caddy is up.)

---

## 5. Copy deploy files to the VPS

From your **laptop** (repo root):

```bash
scp -r deploy root@YOUR_VPS_IP:/opt/snippets
```

Or on the VPS, create the dir and paste files manually:

```bash
mkdir -p /opt/snippets
# upload docker-compose.yml, .env.example → .env, Caddyfile
```

On the VPS:

```bash
cd /opt/snippets
cp .env.example .env
nano .env
```

Edit at least:

| Variable | Example |
|----------|---------|
| `CMS_IMAGE` | `ghcr.io/you/snippets/snippets-cms:latest` |
| `WEB_IMAGE` | `ghcr.io/you/snippets/snippets-web:latest` |
| `PAYLOAD_SECRET` | output of `openssl rand -hex 32` |
| `PUBLIC_SITE_URL` | `https://snippets.example.com` |
| `PAYLOAD_PUBLIC_SERVER_URL` | `https://cms.snippets.example.com` |
| `PUBLIC_PAYLOAD_URL` | same as CMS public URL |
| `CORS_ORIGINS` / `CSRF_ORIGINS` | `https://snippets.example.com` |

Edit `Caddyfile` hostnames to match DNS (same names as in `.env`).

Generate secret:

```bash
openssl rand -hex 32
```

---

## 6. Log in to GHCR and pull images

```bash
cd /opt/snippets

# Private packages: use a PAT with read:packages
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

docker compose pull
```

Public packages may not need login; private packages will fail pull without it.

---

## 7. Start the stack (with Caddy)

```bash
cd /opt/snippets
docker compose --profile caddy up -d
docker compose ps
docker compose logs -f --tail=100
```

Expected containers: `snippets_mongo`, `snippets_cms`, `snippets_web`, `snippets_caddy`.

Health checks from the VPS:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4321/
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/admin
```

From your laptop (after TLS is issued — can take a minute):

```bash
curl -I https://snippets.example.com
curl -I https://cms.snippets.example.com/admin
```

If TLS fails: confirm DNS, UFW 80/443, and `docker compose logs caddy`.

---

## 8. First CMS user and smoke test

1. Open `https://cms.snippets.example.com/admin` and create the first admin user.
2. Create an Author, Tag, and published Post (layout `essay`).
3. Open `https://snippets.example.com` and confirm the post appears.
4. Open `/posts/<slug>` and confirm body/media load (media URLs should use the public CMS host).

---

## 9. Day-2 updates (no full clone)

After CI pushes new images:

```bash
cd /opt/snippets
docker compose pull
docker compose --profile caddy up -d
docker image prune -f
```

Pin a SHA tag in `.env` instead of `:latest` if you want controlled rollbacks:

```env
CMS_IMAGE=ghcr.io/you/snippets/snippets-cms:abcdef123...
WEB_IMAGE=ghcr.io/you/snippets/snippets-web:abcdef123...
```

---

## 10. Backups (minimal)

Persist volumes: `snippets_mongo_data`, `snippets_media`.

Example one-off Mongo dump:

```bash
docker exec snippets_mongo mongodump --archive=/tmp/snippets.archive
docker cp snippets_mongo:/tmp/snippets.archive ./snippets-$(date +%F).archive
```

Copy `/opt/snippets/.env` somewhere safe offline. Media lives in the Docker volume `snippets_media`.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `pull access denied` | `docker login ghcr.io`; package visibility; image name lowercase |
| Caddy TLS errors | DNS A records; ports 80/443 free and allowed in UFW |
| CORS / admin login issues | `CORS_ORIGINS` / `CSRF_ORIGINS` / `PAYLOAD_PUBLIC_SERVER_URL` match HTTPS hostnames |
| Site can’t reach CMS | `PAYLOAD_URL` inside compose is `http://cms:3000` (already set); browser media needs `PUBLIC_PAYLOAD_URL` baked at **image build** time — rebuild GHCR images if you change public CMS URL |
| Port already allocated | Change `CMS_HOST_PORT` / `WEB_HOST_PORT` in `.env` (loopback only) |

---

## Security reminders

- Mongo is not published; keep it that way.
- App ports are on `127.0.0.1` only; public traffic goes through Caddy.
- Rotate `PAYLOAD_SECRET` only with a planned re-login of CMS users.
- Prefer a least-privilege GHCR PAT on the server; do not commit `.env` or PATs.
