-- Field rules for posts written in the CMS. Drafts may be incomplete; anything
-- submitted for review or published needs a description and a body.

create or replace function snippets.valid_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    bool_and(t ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(t) <= 30),
    true
  )
  from unnest(tags) as t;
$$;

alter table snippets.posts
  add constraint posts_slug_format check (
    char_length(slug) <= 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  add constraint posts_title_length
    check (char_length(btrim(title)) between 1 and 160),
  add constraint posts_description_length
    check (char_length(description) <= 300),
  add constraint posts_description_required
    check (status = 'draft' or char_length(btrim(description)) > 0),
  add constraint posts_body_required
    check (
      status = 'draft'
      or (
        jsonb_typeof(body -> 'content') = 'array'
        and jsonb_array_length(body -> 'content') > 0
      )
    ),
  add constraint posts_tags_format check (snippets.valid_tags(tags));
