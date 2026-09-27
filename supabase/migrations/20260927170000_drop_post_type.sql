-- Posts are one kind of thing. Tags carry any grouping.

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

alter table snippets.posts
  drop constraint posts_type_check,
  drop column type;

notify pgrst, 'reload schema';
