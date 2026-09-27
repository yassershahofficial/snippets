import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  PostStatus,
} from "@/lib/supabase/database.types";
import type { CmsProfile } from "./auth";
import { CMS_BASE } from "./paths";

type PostRow = Database["snippets"]["Tables"]["posts"]["Row"];

export type CmsPostListItem = Pick<
  PostRow,
  "id" | "slug" | "title" | "status" | "featured" | "updated_at" | "author_id"
> & { author: { username: string } | null };

export type CmsPost = PostRow & { author: { username: string } | null };

export type NextPostOption = Pick<PostRow, "id" | "title" | "status" | "published_at">;

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
};

export const STATUS_FILTERS = ["all", "in_review", "draft", "published"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function cmsPostPath(id: string): string {
  return `${CMS_BASE}/posts/${id}`;
}

export function cmsNewPostPath(): string {
  return `${CMS_BASE}/posts/new`;
}

/**
 * Authors see their own posts. The admin also sees everyone else's posts once
 * they leave draft (other authors' drafts stay private in the UI).
 */
export async function listCmsPosts(
  profile: CmsProfile,
  filter: StatusFilter,
): Promise<CmsPostListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, slug, title, status, featured, updated_at, author_id, author:profiles(username)",
    )
    .order("updated_at", { ascending: false });

  query =
    profile.role === "admin"
      ? query.or(`author_id.eq.${profile.id},status.neq.draft`)
      : query.eq("author_id", profile.id);

  if (filter !== "all") query = query.eq("status", filter);

  const { data, error } = await query;
  if (error) {
    console.error("listCmsPosts", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCmsPost(
  profile: CmsProfile,
  id: string,
): Promise<CmsPost | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, author:profiles(username)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getCmsPost", error.message);
    return null;
  }
  if (!data) return null;

  const isOwner = data.author_id === profile.id;
  if (!isOwner && (profile.role !== "admin" || data.status === "draft")) {
    return null;
  }
  return data;
}

/** Published posts, plus the currently linked one even if it was unpublished. */
export async function listNextPostOptions(
  excludeId: string | null,
  selectedId: string | null = null,
): Promise<NextPostOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, title, status, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1000);
  query =
    selectedId && isUuid(selectedId)
      ? query.or(`status.eq.published,id.eq.${selectedId}`)
      : query.eq("status", "published");
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) {
    console.error("listNextPostOptions", error.message);
    return [];
  }
  return data ?? [];
}

export type TagOption = { tag: string; count: number };

/** Tags already used on published posts or on the caller's own posts, most used first. */
export async function listTagOptions(profile: CmsProfile): Promise<TagOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("tags")
    .or(`status.eq.published,author_id.eq.${profile.id}`)
    .limit(1000);
  if (error) {
    console.error("listTagOptions", error.message);
    return [];
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
