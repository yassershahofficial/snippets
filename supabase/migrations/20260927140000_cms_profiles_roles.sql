-- CMS foundation: author profiles, roles, review workflow, content model.
-- auth.users is shared with other apps: profiles are created by the CMS
-- sign-in callback, never by a trigger on auth.users.

-- Profiles ------------------------------------------------------------------

create table snippets.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null default 'author',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'author')),
  constraint profiles_display_name_length
    check (char_length(btrim(display_name)) between 1 and 80)
);

create trigger profiles_set_updated_at
  before update on snippets.profiles
  for each row
  execute function snippets.set_updated_at();

create or replace function snippets.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from snippets.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function snippets.is_admin() from public, anon;
grant execute on function snippets.is_admin() to authenticated, service_role;

-- Only signed-in callers are guarded; migrations and service_role bypass.
create or replace function snippets.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and not snippets.is_admin() then
    if tg_op = 'INSERT' and new.role <> 'author' then
      raise exception 'New profiles must have the author role';
    end if;
    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before insert or update on snippets.profiles
  for each row
  execute function snippets.profiles_guard();

-- Posts: author, type, tags, next post, review status -------------------------

alter table snippets.posts
  add column author_id uuid references snippets.profiles (id) on delete set null,
  add column type text not null default 'article',
  add column tags text[] not null default '{}',
  add column next_post_id uuid references snippets.posts (id) on delete set null;

alter table snippets.posts drop constraint posts_status_check;

alter table snippets.posts
  add constraint posts_status_check
    check (status in ('draft', 'in_review', 'published')),
  add constraint posts_type_check
    check (type in ('code', 'article', 'opinion')),
  add constraint posts_tags_limit
    check (cardinality(tags) <= 10),
  add constraint posts_next_post_not_self
    check (next_post_id is null or next_post_id <> id),
  add constraint posts_published_has_date
    check (status <> 'published' or published_at is not null),
  add constraint posts_featured_is_published
    check (not featured or status = 'published');

create unique index posts_single_featured_idx
  on snippets.posts ((true))
  where featured;

create index posts_author_id_idx on snippets.posts (author_id);
create index posts_next_post_id_idx on snippets.posts (next_post_id);
create index posts_tags_idx on snippets.posts using gin (tags);

-- Publishing and featuring are admin only. An author editing a published post
-- sends it back to review. Leaving published always clears featured.
create or replace function snippets.posts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  caller_is_admin boolean := snippets.is_admin();
begin
  if (select auth.role()) = 'authenticated' and not caller_is_admin then
    if tg_op = 'INSERT' then
      if new.status = 'published' then
        raise exception 'Only admins can publish';
      end if;
      if new.featured then
        raise exception 'Only admins can feature posts';
      end if;
      if new.published_at is not null then
        raise exception 'Only admins can set the publish date';
      end if;
    else
      if new.author_id is distinct from old.author_id then
        raise exception 'Only admins can change the author';
      end if;
      if new.featured is distinct from old.featured then
        raise exception 'Only admins can feature posts';
      end if;
      if new.published_at is distinct from old.published_at then
        raise exception 'Only admins can set the publish date';
      end if;
      if new.status = 'published' and old.status <> 'published' then
        raise exception 'Only admins can publish';
      end if;
      if old.status = 'published' and new.status = 'published' and (
        new.slug is distinct from old.slug
        or new.title is distinct from old.title
        or new.description is distinct from old.description
        or new.body is distinct from old.body
        or new.type is distinct from old.type
        or new.tags is distinct from old.tags
        or new.next_post_id is distinct from old.next_post_id
      ) then
        new.status := 'in_review';
      end if;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.status <> 'published' then
    new.featured := false;
  end if;

  return new;
end;
$$;

create trigger posts_guard
  before insert or update on snippets.posts
  for each row
  execute function snippets.posts_guard();

-- Grants ----------------------------------------------------------------------

revoke insert, update, delete on table snippets.posts from anon;

grant select on table snippets.profiles to anon;
grant select, insert, update on table snippets.profiles to authenticated;
grant all on table snippets.profiles to service_role;

-- RLS: profiles -----------------------------------------------------------------

alter table snippets.profiles enable row level security;

create policy "Authors of published posts are publicly readable"
  on snippets.profiles
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from snippets.posts p
      where p.author_id = profiles.id
        and p.status = 'published'
    )
  );

create policy "Users read own profile"
  on snippets.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Admins read all profiles"
  on snippets.profiles
  for select
  to authenticated
  using ((select snippets.is_admin()));

create policy "Users create own profile"
  on snippets.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users update own profile, admins update any"
  on snippets.profiles
  for update
  to authenticated
  using (id = (select auth.uid()) or (select snippets.is_admin()))
  with check (id = (select auth.uid()) or (select snippets.is_admin()));

-- RLS: posts ------------------------------------------------------------------

create policy "Authors read own posts"
  on snippets.posts
  for select
  to authenticated
  using (author_id = (select auth.uid()));

create policy "Admins read all posts"
  on snippets.posts
  for select
  to authenticated
  using ((select snippets.is_admin()));

create policy "Authors create own posts"
  on snippets.posts
  for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Authors update own posts, admins update any"
  on snippets.posts
  for update
  to authenticated
  using (author_id = (select auth.uid()) or (select snippets.is_admin()))
  with check (author_id = (select auth.uid()) or (select snippets.is_admin()));

create policy "Authors delete own posts, admins delete any"
  on snippets.posts
  for delete
  to authenticated
  using (author_id = (select auth.uid()) or (select snippets.is_admin()));

-- The admin profile is seeded outside version control: see
-- supabase/seed.admin.local.sql (gitignored).

notify pgrst, 'reload schema';
