import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type PostRow = Database["snippets"]["Tables"]["posts"]["Row"];

export type PostListItem = Pick<
  PostRow,
  "id" | "slug" | "title" | "description" | "published_at" | "featured"
>;

const LIST_COLUMNS =
  "id, slug, title, description, published_at, featured" as const;

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedPostBySlug", error.message);
    return null;
  }

  return data;
}

/** The post the author picked as "read next", if it is published. */
export async function getNextPost(post: PostRow): Promise<PostListItem | null> {
  if (!post.next_post_id || post.next_post_id === post.id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("id", post.next_post_id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getNextPost", error.message);
    return null;
  }

  return data;
}

/** Featured published post, or newest published if none marked featured. */
export async function getFeaturedPost(): Promise<PostListItem | null> {
  const supabase = await createClient();

  const featured = await supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (featured.error) {
    console.error("getFeaturedPost", featured.error.message);
    return null;
  }
  if (featured.data) return featured.data;

  const newest = await supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (newest.error) {
    console.error("getFeaturedPost fallback", newest.error.message);
    return null;
  }

  return newest.data;
}

/** Latest published posts for the home rail, excluding the featured post. */
export async function getLatestPosts(
  excludeId: string | null,
  limit = 3,
): Promise<PostListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getLatestPosts", error.message);
    return [];
  }

  return data ?? [];
}
