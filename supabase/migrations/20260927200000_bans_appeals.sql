-- Bans and appeals. A banned author can sign in, sign out and appeal, nothing
-- else. Their posts are hidden from readers until they are unbanned.

alter table snippets.profiles
  add column banned_at timestamptz,
  add column ban_reason text,
  add constraint profiles_ban_reason_length
    check (ban_reason is null or char_length(ban_reason) between 1 and 500);

-- Signed in, has a profile, not banned.
create or replace function snippets.is_active_author()
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
      and banned_at is null
  );
$$;

create or replace function snippets.is_banned()
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
      and banned_at is not null
  );
$$;

-- Readers can't see banned_at, so visibility is decided here.
create or replace function snippets.author_is_visible(author uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from snippets.profiles
    where id = author
      and banned_at is not null
  );
$$;

revoke execute on function snippets.is_active_author() from public, anon;
revoke execute on function snippets.is_banned() from public, anon;
revoke execute on function snippets.author_is_visible(uuid) from public;
grant execute on function snippets.is_active_author() to authenticated, service_role;
grant execute on function snippets.is_banned() to authenticated, service_role;
grant execute on function snippets.author_is_visible(uuid) to anon, authenticated, service_role;

-- Posts --------------------------------------------------------------------------

drop policy "Published posts are publicly readable" on snippets.posts;
create policy "Published posts are publicly readable"
  on snippets.posts
  for select
  to anon, authenticated
  using (status = 'published' and (select snippets.author_is_visible(author_id)));

drop policy "Authors create own posts" on snippets.posts;
create policy "Authors create own posts"
  on snippets.posts
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (select snippets.is_active_author())
  );

drop policy "Authors update own posts, admins update any" on snippets.posts;
create policy "Authors update own posts, admins update any"
  on snippets.posts
  for update
  to authenticated
  using (
    (author_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  )
  with check (
    (author_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  );

drop policy "Authors delete own posts, admins delete any" on snippets.posts;
create policy "Authors delete own posts, admins delete any"
  on snippets.posts
  for delete
  to authenticated
  using (
    (author_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  );

-- Profiles: banned users can't rename themselves ----------------------------------

drop policy "Users update own profile, admins update any" on snippets.profiles;
create policy "Users update own profile, admins update any"
  on snippets.profiles
  for update
  to authenticated
  using (
    (id = (select auth.uid()) and (select snippets.is_active_author()))
    or (select snippets.is_admin())
  )
  with check (
    (id = (select auth.uid()) and (select snippets.is_active_author()))
    or (select snippets.is_admin())
  );

-- Review thread: banned users take no part ----------------------------------------

create or replace function snippets.can_access_thread(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select snippets.is_active_author() and exists (
    select 1
    from snippets.posts p
    where p.id = target
      and (p.author_id = (select auth.uid()) or snippets.is_admin())
  );
$$;

drop policy "Senders delete own messages" on snippets.post_messages;
create policy "Senders delete own messages"
  on snippets.post_messages
  for delete
  to authenticated
  using (
    sender_id = (select auth.uid())
    and (select snippets.is_active_author())
  );

-- Appeals ---------------------------------------------------------------------------

create table snippets.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references snippets.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint appeals_message_length check (char_length(btrim(message)) between 1 and 1000),
  constraint appeals_status_check check (status in ('pending', 'accepted', 'rejected'))
);

create unique index appeals_one_pending_idx
  on snippets.appeals (user_id)
  where status = 'pending';

create index appeals_status_created_idx on snippets.appeals (status, created_at desc);

create or replace function snippets.appeals_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.message := btrim(new.message);
  new.status := 'pending';
  new.decided_at := null;
  new.created_at := now();
  return new;
end;
$$;

create trigger appeals_guard
  before insert on snippets.appeals
  for each row
  execute function snippets.appeals_guard();

revoke all on table snippets.appeals from anon;
grant select, insert on table snippets.appeals to authenticated;
grant all on table snippets.appeals to service_role;

alter table snippets.appeals enable row level security;

create policy "Users read own appeals, admins read all"
  on snippets.appeals
  for select
  to authenticated
  using (user_id = (select auth.uid()) or (select snippets.is_admin()));

create policy "Banned users appeal for themselves"
  on snippets.appeals
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and (select snippets.is_banned()));

-- Admin functions --------------------------------------------------------------------

create or replace function snippets.ban_author(
  target uuid,
  reason text default null,
  content_action text default 'hide'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  clean_reason text := nullif(btrim(coalesce(reason, '')), '');
begin
  if not snippets.is_admin() then
    raise exception 'Only admins can ban authors';
  end if;
  if target = (select auth.uid()) then
    raise exception 'You can''t ban yourself';
  end if;
  if content_action not in ('hide', 'unpublish', 'delete') then
    raise exception 'Unknown content action';
  end if;
  if char_length(clean_reason) > 500 then
    raise exception 'Keep the reason under 500 characters';
  end if;

  select role into target_role from snippets.profiles where id = target for update;
  if not found then
    raise exception 'No such author';
  end if;
  if target_role = 'admin' then
    raise exception 'Admins can''t be banned';
  end if;

  update snippets.profiles
  set banned_at = coalesce(banned_at, now()), ban_reason = clean_reason
  where id = target;

  if content_action = 'unpublish' then
    update snippets.posts set status = 'draft' where author_id = target and status <> 'draft';
  elsif content_action = 'delete' then
    delete from snippets.posts where author_id = target;
  end if;
end;
$$;

create or replace function snippets.unban_author(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not snippets.is_admin() then
    raise exception 'Only admins can unban authors';
  end if;

  update snippets.profiles set banned_at = null, ban_reason = null where id = target;
  if not found then
    raise exception 'No such author';
  end if;

  update snippets.appeals
  set status = 'accepted', decided_at = now()
  where user_id = target and status = 'pending';
end;
$$;

create or replace function snippets.decide_appeal(appeal uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appellant uuid;
begin
  if not snippets.is_admin() then
    raise exception 'Only admins can decide appeals';
  end if;

  update snippets.appeals
  set status = case when accept then 'accepted' else 'rejected' end, decided_at = now()
  where id = appeal and status = 'pending'
  returning user_id into appellant;

  if appellant is null then
    raise exception 'This appeal was already decided';
  end if;

  if accept then
    update snippets.profiles set banned_at = null, ban_reason = null where id = appellant;
  end if;
end;
$$;

revoke execute on function snippets.ban_author(uuid, text, text) from public, anon;
revoke execute on function snippets.unban_author(uuid) from public, anon;
revoke execute on function snippets.decide_appeal(uuid, boolean) from public, anon;
grant execute on function snippets.ban_author(uuid, text, text) to authenticated, service_role;
grant execute on function snippets.unban_author(uuid) to authenticated, service_role;
grant execute on function snippets.decide_appeal(uuid, boolean) to authenticated, service_role;

notify pgrst, 'reload schema';
