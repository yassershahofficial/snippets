-- Ban history: one row per ban, kept after the ban is lifted so the admin can
-- see past bans and how many times an author was banned.

create table snippets.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references snippets.profiles (id) on delete cascade,
  reason text,
  -- Null only for bans recorded before this table existed.
  content_action text,
  banned_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by text,
  constraint bans_content_action_check check (content_action in ('hide', 'unpublish', 'delete')),
  constraint bans_lifted_by_check check (lifted_by in ('admin', 'appeal')),
  constraint bans_lifted_pair check ((lifted_at is null) = (lifted_by is null))
);

create unique index bans_one_active_idx on snippets.bans (user_id) where lifted_at is null;
create index bans_user_banned_idx on snippets.bans (user_id, banned_at desc);
create index bans_banned_idx on snippets.bans (banned_at desc);
create index bans_lifted_idx on snippets.bans (lifted_at desc) where lifted_at is not null;

revoke all on table snippets.bans from anon;
grant select on table snippets.bans to authenticated;
grant all on table snippets.bans to service_role;

alter table snippets.bans enable row level security;

create policy "Admins read ban history"
  on snippets.bans
  for select
  to authenticated
  using ((select snippets.is_admin()));

-- Authors banned right now.
insert into snippets.bans (user_id, reason, banned_at)
select id, ban_reason, banned_at from snippets.profiles where banned_at is not null;

-- Functions: same checks as before, plus the history row ------------------------------

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

  update snippets.bans
  set reason = clean_reason, content_action = ban_author.content_action
  where user_id = target and lifted_at is null;
  if not found then
    insert into snippets.bans (user_id, reason, content_action)
    values (target, clean_reason, ban_author.content_action);
  end if;

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

  update snippets.bans
  set lifted_at = now(), lifted_by = 'admin'
  where user_id = target and lifted_at is null;

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
    update snippets.bans
    set lifted_at = now(), lifted_by = 'appeal'
    where user_id = appellant and lifted_at is null;
  end if;
end;
$$;

notify pgrst, 'reload schema';
