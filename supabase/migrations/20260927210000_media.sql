-- Post images. Files are re-encoded on the server and written with the secret
-- key only, so there are no storage policies for signed-in users. Private
-- bucket holds every upload; the public bucket gets a copy while the post is
-- published. Paths are "<media id>.webp" and carry no user or post info.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('snippets-media-private', 'snippets-media-private', false, 2097152, array['image/webp']),
  ('snippets-media', 'snippets-media', true, 2097152, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table snippets.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references snippets.profiles (id) on delete cascade,
  -- Null while the upload waits for its new post to be created. Kept (not
  -- cascaded) when a post is deleted so the file can still be found and removed.
  post_id uuid references snippets.posts (id) on delete set null,
  bytes integer not null,
  width integer not null,
  height integer not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint media_bytes_range check (bytes between 1 and 2097152),
  constraint media_width_range check (width between 1 and 1280),
  constraint media_height_range check (height between 1 and 1600)
);

create index media_owner_idx on snippets.media (owner_id, created_at);
create index media_post_idx on snippets.media (post_id);

revoke all on table snippets.media from anon;
grant select, delete on table snippets.media to authenticated;
grant update (published) on table snippets.media to authenticated;
grant all on table snippets.media to service_role;

alter table snippets.media enable row level security;

create policy "Owners and admins read media"
  on snippets.media
  for select
  to authenticated
  using (owner_id = (select auth.uid()) or (select snippets.is_admin()));

create policy "Owners and admins update media"
  on snippets.media
  for update
  to authenticated
  using (
    (owner_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  )
  with check (
    (owner_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  );

create policy "Owners and admins delete media"
  on snippets.media
  for delete
  to authenticated
  using (
    (owner_id = (select auth.uid()) or (select snippets.is_admin()))
    and (select snippets.is_active_author())
  );

-- Records an upload after the quota checks. Authors: 5 images per post (and 5
-- unsaved uploads for a new post), 10 MB in total. The admin is unlimited, but
-- only in the admin's own posts, since media always belongs to the uploader.
create or replace function snippets.reserve_media(
  target_post uuid,
  file_bytes integer,
  file_width integer,
  file_height integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  post_owner uuid;
  used_bytes bigint;
  image_count integer;
  new_id uuid;
begin
  if uid is null or not snippets.is_active_author() then
    raise exception 'Not allowed to upload';
  end if;

  if target_post is not null then
    select author_id into post_owner from snippets.posts where id = target_post;
    if post_owner is distinct from uid then
      raise exception 'You can only add images to your own posts';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('snippets.media:' || uid::text, 0));

  if not snippets.is_admin() then
    if target_post is null then
      select count(*) into image_count
      from snippets.media where owner_id = uid and post_id is null;
    else
      select count(*) into image_count
      from snippets.media where post_id = target_post;
    end if;
    if image_count >= 5 then
      raise exception 'Image limit reached: 5 per post';
    end if;

    select coalesce(sum(bytes), 0) into used_bytes
    from snippets.media where owner_id = uid;
    if used_bytes + file_bytes > 10485760 then
      raise exception 'Storage limit reached: 10 MB';
    end if;
  end if;

  insert into snippets.media (owner_id, post_id, bytes, width, height)
  values (uid, target_post, file_bytes, file_width, file_height)
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function snippets.reserve_media(uuid, integer, integer, integer) from public, anon;
grant execute on function snippets.reserve_media(uuid, integer, integer, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
