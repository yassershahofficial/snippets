-- Posts table for the public reader and future CMS.

create table snippets.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  status text not null default 'draft',
  title text not null,
  description text not null,
  body jsonb not null,
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_status_check check (status in ('draft', 'published')),
  constraint posts_slug_unique unique (slug)
);

create index posts_status_published_at_idx
  on snippets.posts (status, published_at desc nulls last);

create index posts_featured_published_idx
  on snippets.posts (featured)
  where featured = true and status = 'published';

create or replace function snippets.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on snippets.posts
  for each row
  execute function snippets.set_updated_at();

grant select, insert, update, delete on table snippets.posts to anon, authenticated, service_role;

alter table snippets.posts enable row level security;

create policy "Published posts are publicly readable"
  on snippets.posts
  for select
  to anon, authenticated
  using (status = 'published');

notify pgrst, 'reload schema';
