export type PublicAuthor = {
  username: string;
  avatar_url: string | null;
};

/** Normalize a profiles embed from PostgREST into a public byline author. */
export function mapPublicAuthor(raw: unknown): PublicAuthor | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as { username?: unknown; avatar_url?: unknown };
  if (typeof row.username !== "string" || !row.username.trim()) return null;
  return {
    username: row.username.trim(),
    avatar_url: typeof row.avatar_url === "string" && row.avatar_url ? row.avatar_url : null,
  };
}
