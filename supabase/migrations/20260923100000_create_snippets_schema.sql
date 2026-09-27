-- Create shared-project schema for this app. Tables come in later migrations.

create schema if not exists snippets;

grant usage on schema snippets to anon, authenticated, service_role;

-- Expose on hosted PostgREST with existing app schemas.
-- Extend this list when another app schema is added.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, everythingos, snippets';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
