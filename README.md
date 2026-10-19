# Snippets

Next.js (App Router) + TypeScript + Tailwind + Supabase. Product direction: `GOAL_1.md` (local only; markdown is gitignored except this README). Status notes: `CURRENT_STATUS.md`, `PRODUCT.md`, `DESIGN.md`.

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with the shared Supabase project URL and keys (same project as EverythingOS). Set `SNIPPETS_EDITOR_EMAILS` / profile allowlist as needed for CMS. Production CMS host uses `NEXT_PUBLIC_CMS_HOST`.

Required env vars (see `.env.example` for the full set):

- `NEXT_PUBLIC_SNIPPETS_SUPABASE_URL`
- `NEXT_PUBLIC_SNIPPETS_SUPABASE_PUBLISHABLE_KEY`
- `SNIPPETS_SUPABASE_SECRET_KEY` (media uploads and admin storage)
- `NEXT_PUBLIC_CMS_HOST` (optional locally; set in Production for the CMS subdomain)

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Local Next.js server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm supabase` | Supabase CLI |
| `pnpm supabase:types` | Regenerate DB types (`snippets` schema) |

## What is set up

- Public reader: home `/` (featured + byline), posts `/posts/[slug]` (byline + Contents), archive `/posts` (filter + descriptions), About author mock `/about` (profile + filtered article rows)
- CMS: Google sign-in, drafts / review / publish, Tiptap body editor (lists, images, YouTube), bans and appeals
- Supabase clients: `src/lib/supabase/{client,server,proxy,admin}.ts` (`db.schema` = `snippets`)
- Session refresh: `src/proxy.ts` (also CMS host routing when `NEXT_PUBLIC_CMS_HOST` is set)
- SEO: `robots.ts`, `sitemap.ts`; CMS routes `noindex`
- Media: private upload bucket, public copies on publish

## Supabase notes

- App data must live in schema `snippets` only. See `.cursor/rules/shared-supabase-schema.mdc`.
- Hosted PostgREST: migrations expose `snippets` alongside other app schemas.

## Vercel

Dedicated Vercel project for this repo. Reader and CMS hostnames can share one project (`NEXT_PUBLIC_CMS_HOST` switches CMS routing).
