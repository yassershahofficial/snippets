import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["snippets"]["Tables"]["profiles"]["Row"];

export type AuthorSummary = Pick<
  ProfileRow,
  "id" | "username" | "google_name" | "role" | "created_at" | "banned_at" | "ban_reason"
> & {
  posts: number;
  published: number;
  images: number;
  imageBytes: number;
};

/** Admin only: every CMS profile with post counts, banned first, then newest. */
export async function listAuthors(): Promise<AuthorSummary[]> {
  const supabase = await createClient();
  const [profiles, posts, media] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, google_name, role, created_at, banned_at, ban_reason")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("posts").select("author_id, status").limit(10000),
    supabase.from("media").select("owner_id, bytes").limit(20000),
  ]);
  if (profiles.error) {
    console.error("listAuthors", profiles.error.message);
    return [];
  }
  if (posts.error) console.error("listAuthors posts", posts.error.message);
  if (media.error) console.error("listAuthors media", media.error.message);

  const storage = new Map<string, { images: number; imageBytes: number }>();
  for (const row of media.data ?? []) {
    const s = storage.get(row.owner_id) ?? { images: 0, imageBytes: 0 };
    s.images += 1;
    s.imageBytes += row.bytes;
    storage.set(row.owner_id, s);
  }

  const counts = new Map<string, { posts: number; published: number }>();
  for (const post of posts.data ?? []) {
    if (!post.author_id) continue;
    const c = counts.get(post.author_id) ?? { posts: 0, published: 0 };
    c.posts += 1;
    if (post.status === "published") c.published += 1;
    counts.set(post.author_id, c);
  }

  return (profiles.data ?? [])
    .map((p) => ({
      ...p,
      ...(counts.get(p.id) ?? { posts: 0, published: 0 }),
      ...(storage.get(p.id) ?? { images: 0, imageBytes: 0 }),
    }))
    .sort((a, b) => Number(Boolean(b.banned_at)) - Number(Boolean(a.banned_at)));
}
