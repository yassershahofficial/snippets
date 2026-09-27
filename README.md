# Snippets

Next.js (App Router) + TypeScript + Tailwind + Supabase. Product direction: `GOAL_1.md` (local only; markdown is gitignored except this README).

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with the shared Supabase project URL and publishable key (same project as EverythingOS). Set `SNIPPETS_EDITOR_EMAILS` to your Google email when you add CMS auth later.

Required env vars:

- `NEXT_PUBLIC_SNIPPETS_SUPABASE_URL`
- `NEXT_PUBLIC_SNIPPETS_SUPABASE_PUBLISHABLE_KEY`
- `SNIPPETS_EDITOR_EMAILS` (comma-separated; for CMS allowlist later)

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Local Next.js server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm supabase` | Supabase CLI |
| `pnpm supabase:types` | Regenerate DB types (`snippets` schema) |

## What is set up

- App Router + Tailwind
- Supabase clients: `src/lib/supabase/{client,server,proxy}.ts` (`db.schema` = `snippets`)
- Session refresh: `src/proxy.ts`
- Types stub: `src/lib/supabase/database.types.ts` (regenerate after tables exist)
- Local CLI: `supabase/config.toml` exposes `snippets`
- Migration: `supabase/migrations/20260923100000_create_snippets_schema.sql` (schema + hosted Data API expose)

## Supabase notes

- App data must live in schema `snippets` only. See `.cursor/rules/shared-supabase-schema.mdc`.
- Hosted PostgREST: migration sets `pgrst.db_schemas` to include `snippets` alongside `everythingos`. Apply the migration before Data API calls against this schema.
- Google OAuth for CMS is not wired yet; enable the provider in the Supabase dashboard when you build auth.

## Not in this setup

- Reader / CMS UI
- Posts table and CRUD
- SEO (`sitemap`, `robots`, JSON-LD)
- Vercel project / custom domains

## Vercel (later)

Create a dedicated Vercel project for this repo. Do not reuse another app's project. One project can later serve both reader and CMS hostnames.
