-- Review thread: short messages between a post's author and the admin while
-- the post is not live. Publishing deletes the whole thread.

create table snippets.post_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references snippets.posts (id) on delete cascade,
  sender_id uuid not null references snippets.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint post_messages_body_length
    check (char_length(btrim(body)) between 1 and 1000)
);

create index post_messages_post_idx on snippets.post_messages (post_id, created_at);
create index post_messages_sender_idx on snippets.post_messages (sender_id);

create table snippets.post_thread_reads (
  post_id uuid not null references snippets.posts (id) on delete cascade,
  user_id uuid not null references snippets.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_thread_reads_user_idx on snippets.post_thread_reads (user_id);

-- Only the post's author and the admin take part in its thread.
create or replace function snippets.can_access_thread(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from snippets.posts p
    where p.id = target
      and (p.author_id = (select auth.uid()) or snippets.is_admin())
  );
$$;

revoke execute on function snippets.can_access_thread(uuid) from public, anon;
grant execute on function snippets.can_access_thread(uuid) to authenticated, service_role;

create or replace function snippets.post_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.post_id::text, 0));

  if exists (
    select 1 from snippets.posts where id = new.post_id and status = 'published'
  ) then
    raise exception 'Live posts have no review thread';
  end if;

  if (select count(*) from snippets.post_messages where post_id = new.post_id) >= 50 then
    raise exception 'This thread is full (50 messages)';
  end if;

  new.body := btrim(new.body);
  new.created_at := now();
  return new;
end;
$$;

create trigger post_messages_guard
  before insert on snippets.post_messages
  for each row
  execute function snippets.post_messages_guard();

create or replace function snippets.clear_thread_on_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from snippets.post_messages where post_id = new.id;
  delete from snippets.post_thread_reads where post_id = new.id;
  return null;
end;
$$;

create trigger posts_clear_thread_on_publish
  after update of status on snippets.posts
  for each row
  when (new.status = 'published' and old.status is distinct from 'published')
  execute function snippets.clear_thread_on_publish();

-- Posts with a message from someone else newer than the caller's last visit.
create or replace function snippets.unread_thread_posts()
returns setof uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct m.post_id
  from snippets.post_messages m
  left join snippets.post_thread_reads r
    on r.post_id = m.post_id and r.user_id = (select auth.uid())
  where m.sender_id <> (select auth.uid())
    and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz);
$$;

revoke execute on function snippets.unread_thread_posts() from public, anon;
grant execute on function snippets.unread_thread_posts() to authenticated, service_role;

-- Grants and RLS --------------------------------------------------------------

revoke all on table snippets.post_messages from anon;
revoke all on table snippets.post_thread_reads from anon;
grant select, insert, delete on table snippets.post_messages to authenticated;
grant select, insert, update on table snippets.post_thread_reads to authenticated;
grant all on table snippets.post_messages to service_role;
grant all on table snippets.post_thread_reads to service_role;

alter table snippets.post_messages enable row level security;
alter table snippets.post_thread_reads enable row level security;

create policy "Thread members read messages"
  on snippets.post_messages
  for select
  to authenticated
  using ((select snippets.can_access_thread(post_id)));

create policy "Thread members send messages as themselves"
  on snippets.post_messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select snippets.can_access_thread(post_id))
  );

create policy "Senders delete own messages"
  on snippets.post_messages
  for delete
  to authenticated
  using (sender_id = (select auth.uid()));

create policy "Users read own thread visits"
  on snippets.post_thread_reads
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users record own thread visits"
  on snippets.post_thread_reads
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select snippets.can_access_thread(post_id))
  );

create policy "Users update own thread visits"
  on snippets.post_thread_reads
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
