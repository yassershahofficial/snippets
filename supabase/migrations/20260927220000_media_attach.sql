-- Links the caller's temporary uploads (made on the New post page) to the post
-- once it exists. Only the post's author can attach, and only their own files.
create or replace function snippets.attach_media(target_post uuid, media_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  attached integer;
begin
  if uid is null or not snippets.is_active_author() then
    raise exception 'Not allowed to attach images';
  end if;

  if not exists (select 1 from snippets.posts where id = target_post and author_id = uid) then
    raise exception 'You can only add images to your own posts';
  end if;

  update snippets.media
  set post_id = target_post
  where id = any (media_ids)
    and owner_id = uid
    and post_id is null;
  get diagnostics attached = row_count;
  return attached;
end;
$$;

revoke execute on function snippets.attach_media(uuid, uuid[]) from public, anon;
grant execute on function snippets.attach_media(uuid, uuid[]) to authenticated, service_role;

notify pgrst, 'reload schema';
