-- Two names per profile:
-- google_name: mirrors the Google identity, refreshed on every CMS sign-in by
--   sync_profile(). Not writable through the API.
-- username: public handle, editable by its owner. Letters, digits and single
--   spaces, 3 to 30 chars. Unique ignoring case and spaces.

alter table snippets.profiles rename column display_name to google_name;
alter table snippets.profiles
  rename constraint profiles_display_name_length to profiles_google_name_length;

alter table snippets.profiles add column username text;

-- Internal: build a free username from any text. Not callable through the API.
create or replace function snippets.suggest_username(base text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned text;
  candidate text;
  n integer := 1;
begin
  cleaned := regexp_replace(coalesce(base, ''), '[^A-Za-z0-9 ]', '', 'g');
  cleaned := btrim(regexp_replace(cleaned, ' +', ' ', 'g'));
  cleaned := btrim(left(cleaned, 26));
  if char_length(cleaned) < 3 then
    cleaned := 'Author';
  end if;

  candidate := cleaned;
  while exists (
    select 1
    from snippets.profiles
    where lower(replace(username, ' ', '')) = lower(replace(candidate, ' ', ''))
  ) loop
    n := n + 1;
    candidate := cleaned || ' ' || n;
  end loop;

  return candidate;
end;
$$;

revoke execute on function snippets.suggest_username(text)
  from public, anon, authenticated;

update snippets.profiles
set username = snippets.suggest_username(google_name)
where username is null;

alter table snippets.profiles
  alter column username set not null,
  add constraint profiles_username_format check (
    char_length(username) between 3 and 30
    and username ~ '^[A-Za-z0-9]+( [A-Za-z0-9]+)*$'
  );

create unique index profiles_username_unique_idx
  on snippets.profiles (lower(replace(username, ' ', '')));

-- Called by the CMS after every Google sign-in. Creates the profile on first
-- sign-in and refreshes google_name / avatar_url from the Google identity
-- (auth.identities, which users cannot edit, unlike user_metadata).
create or replace function snippets.sync_profile()
returns snippets.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  g_name text;
  g_avatar text;
  result snippets.profiles;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select
    coalesce(
      nullif(btrim(i.identity_data ->> 'full_name'), ''),
      nullif(btrim(i.identity_data ->> 'name'), ''),
      'Google user'
    ),
    coalesce(i.identity_data ->> 'avatar_url', i.identity_data ->> 'picture')
  into g_name, g_avatar
  from auth.identities i
  where i.user_id = uid
    and i.provider = 'google'
  order by i.last_sign_in_at desc nulls last
  limit 1;

  if not found then
    raise exception 'A Google account is required';
  end if;

  g_name := left(g_name, 80);
  if g_avatar is not null
    and g_avatar !~ '^https://[a-z0-9-]+\.googleusercontent\.com/' then
    g_avatar := null;
  end if;

  insert into snippets.profiles (id, google_name, avatar_url, username)
  values (uid, g_name, g_avatar, snippets.suggest_username(g_name))
  on conflict (id) do update
    set google_name = excluded.google_name,
        avatar_url = excluded.avatar_url
  returning * into result;

  return result;
end;
$$;

revoke execute on function snippets.sync_profile() from public, anon;
grant execute on function snippets.sync_profile() to authenticated, service_role;

-- Profiles are created only by sync_profile(). Through the API, signed-in
-- users can change nothing but username. Anonymous readers see the public
-- columns only.
drop policy "Users create own profile" on snippets.profiles;

revoke insert, update on table snippets.profiles from authenticated;
grant update (username) on table snippets.profiles to authenticated;

revoke select on table snippets.profiles from anon;
grant select (id, username, avatar_url, created_at) on table snippets.profiles to anon;

notify pgrst, 'reload schema';
