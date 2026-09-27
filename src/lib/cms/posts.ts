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
  "id" | "slug" | "title" | "status" | "type" | "featured" | "updated_at" | "author_id"
> & { author: { username: string } | null };

export type CmsPost = PostRow & { author: { username: string } | null };

export type NextPostOption = Pick<PostRow, "id" | "title">;

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
      "id, slug, title, status, type, featured, updated_at, author_id, author:profiles(username)",
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

export async function listNextPostOptions(
  excludeId: string | null,
): Promise<NextPostOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) {
    console.error("listNextPostOptions", error.message);
    return [];
  }
  return data ?? [];
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
