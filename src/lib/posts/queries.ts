import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { mapPublicAuthor, type PublicAuthor } from "./author";

export type PostRow = Database["snippets"]["Tables"]["posts"]["Row"];

export type PostListItem = Pick<
  PostRow,
  "id" | "slug" | "title" | "description" | "published_at" | "featured"
> & {
  author: PublicAuthor | null;
};

export type PublishedPost = PostRow & {
  author: PublicAuthor | null;
};

const LIST_COLUMNS =
  "id, slug, title, description, published_at, featured, author:profiles!posts_author_id_fkey(username, avatar_url)" as const;

const DETAIL_COLUMNS =
  "*, author:profiles!posts_author_id_fkey(username, avatar_url)" as const;

type ListRow = Omit<PostListItem, "author"> & { author: unknown };
type DetailRow = PostRow & { author: unknown };

function mapListItem(row: ListRow): PostListItem {
  const { author, ...post } = row;
  return { ...post, author: mapPublicAuthor(author) };
}

function mapDetail(row: DetailRow): PublishedPost {
  const { author, ...post } = row;
  return { ...post, author: mapPublicAuthor(author) };
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PublishedPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedPostBySlug", error.message);
    return null;
  }

  return data ? mapDetail(data as DetailRow) : null;
}

/** Every published post for the archive, newest first. */
export async function listPublishedPosts(): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) {
    console.error("listPublishedPosts", error.message);
    return [];
  }

  return (data as ListRow[] | null)?.map(mapListItem) ?? [];
}

/** Published posts by public username, newest first (About / future author page). */
export async function listPublishedPostsByUsername(
  username: string,
): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    console.error("listPublishedPostsByUsername profile", profileError.message);
    return [];
  }
  if (!profile) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .eq("author_id", profile.id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) {
    console.error("listPublishedPostsByUsername", error.message);
    return [];
  }

  return (data as ListRow[] | null)?.map(mapListItem) ?? [];
}

/** Published slugs for the sitemap, most recently updated first. */
export async function listSitemapPosts(): Promise<
  Pick<PostRow, "slug" | "updated_at">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("listSitemapPosts", error.message);
    return [];
  }

  return data ?? [];
}

/** The post the author picked as "read next", if it is published. */
export async function getNextPost(
  post: Pick<PostRow, "id" | "next_post_id">,
): Promise<PostListItem | null> {
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

  return data ? mapListItem(data as ListRow) : null;
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
  if (featured.data) return mapListItem(featured.data as ListRow);

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

  return newest.data ? mapListItem(newest.data as ListRow) : null;
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

  return (data as ListRow[] | null)?.map(mapListItem) ?? [];
}
