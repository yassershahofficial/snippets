# snippets

A self-hosted, SEO-ready blog built code-first using Astro for fast static HTML, Payload CMS 3 + MongoDB for structured content and an isolated Docker Compose stack for local and VPS deploys.

## Quick start (recommended)

1. Copy env files:

```bash
cp .env.example .env
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env
```

2. Install workspace deps (host tooling / optional local runs):

```bash
pnpm install
```

3. Start the isolated stack:

```bash
docker compose up --build
```

4. Open:
   - CMS admin: http://localhost:3000/admin (create first user)
   - Public site: http://localhost:4321

## Smoke checklist

1. In admin (http://localhost:3000/admin), create first user if prompted.
2. Create an **Author** (name + slug).
3. Create a **Tag** (name + slug).
4. Create a **Post**: layout `essay`, attach author/tag, write body, **Publish**.
5. Refresh http://localhost:4321 — the post title should appear.
6. Open `/posts/<slug>` — title + body HTML should render; view source for essay `BlogPosting` JSON-LD.
7. Optional: `/authors/<slug>` and `/tags/<slug>` stub pages.
8. Open `/sitemap.xml` — home, published posts, authors, and tags should appear.
9. Open `/robots.txt` — crawlers allowed; `Sitemap:` points at this site’s sitemap.

If a newly published post does not appear, hard-refresh the browser. Post/author/tag routes fetch live from Payload in foundation mode (`prerender = false`) so restarts are not required for new slugs.

## Local hybrid (optional)

Run Mongo + CMS in Docker, Astro on the host:

```bash
docker compose up mongo cms
pnpm dev:web
```

Use `PAYLOAD_URL=http://localhost:3000` in `apps/web/.env`.

## Project layout

```text
apps/cms   Payload 3 (Authors, Tags, Badges, Posts — essay/showcase/snippet)
apps/web   Astro hybrid shell + Tailwind
docker-compose.yml   snippets_* network/volumes (isolated)
```

## Production (GHCR, minimal VPS files)

Images build from `apps/*/Dockerfile` and publish via `.github/workflows/ghcr.yml`. On the server you only need the `deploy/` folder (compose + `.env` + optional Caddyfile) — not a full clone.

- New / clean VPS: [documentations/prod_new_vps.md](documentations/prod_new_vps.md)
- Existing VPS (other projects): [documentations/prod_existing_vps.md](documentations/prod_existing_vps.md)

Local `docker compose` continues to use `Dockerfile.dev` (hot reload). Production images use `pnpm build` / `pnpm start` (CMS) and Astro `node ./dist/server/entry.mjs` (web).

## Out of scope (foundation)

Essay visual polish, author/tag JSON-LD, prerender + publish webhook.
