import "server-only";
import { createStorageAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_PRIVATE_BUCKET, MEDIA_PUBLIC_BUCKET, mediaPath } from "@/lib/media/limits";
import { collectMediaIds } from "@/lib/posts/media-refs";

const STALE_AFTER_MS = 60 * 60 * 1000;
const SIGNED_URL_SECONDS = 60 * 60;

type MediaRef = { id: string; published: boolean };

/** Removes files from both buckets, then their rows. Rows go only if the files did. */
export async function deleteMedia(items: MediaRef[]): Promise<void> {
  if (items.length === 0) return;
  const storage = createStorageAdmin();
  const paths = items.map((m) => mediaPath(m.id));

  const priv = await storage.from(MEDIA_PRIVATE_BUCKET).remove(paths);
  if (priv.error) {
    console.error("deleteMedia private", priv.error.message);
    return;
  }
  const publicPaths = items.filter((m) => m.published).map((m) => mediaPath(m.id));
  if (publicPaths.length > 0) {
    const pub = await storage.from(MEDIA_PUBLIC_BUCKET).remove(publicPaths);
    if (pub.error) console.error("deleteMedia public", pub.error.message);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("media")
    .delete()
    .in(
      "id",
      items.map((m) => m.id),
    );
  if (error) console.error("deleteMedia rows", error.message);
}

/**
 * Lazy cleanup instead of a scheduled job: drops this author's uploads older
 * than an hour that were never attached to a post, or that their post's saved
 * body no longer uses. Runs on upload and when an editor opens.
 */
export async function cleanupStaleMedia(userId: string): Promise<void> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { data: rows, error } = await supabase
    .from("media")
    .select("id, post_id, published")
    .eq("owner_id", userId)
    .lt("created_at", cutoff)
    .limit(500);
  if (error) {
    console.error("cleanupStaleMedia", error.message);
    return;
  }
  if (!rows || rows.length === 0) return;

  const postIds = [...new Set(rows.map((r) => r.post_id).filter((id): id is string => !!id))];
  const used = new Set<string>();
  if (postIds.length > 0) {
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, body")
      .in("id", postIds);
    if (postsError) {
      console.error("cleanupStaleMedia posts", postsError.message);
      return;
    }
    for (const post of posts ?? []) {
      for (const id of collectMediaIds(post.body)) used.add(id);
    }
  }

  await deleteMedia(rows.filter((r) => !r.post_id || !used.has(r.id)));
}

/** Short-lived URLs for private files, keyed by media id. */
export async function signMediaUrls(ids: Iterable<string>): Promise<Record<string, string>> {
  const list = [...new Set(ids)];
  if (list.length === 0) return {};
  const storage = createStorageAdmin();
  const { data, error } = await storage
    .from(MEDIA_PRIVATE_BUCKET)
    .createSignedUrls(list.map(mediaPath), SIGNED_URL_SECONDS);
  if (error) {
    console.error("signMediaUrls", error.message);
    return {};
  }
  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) urls[item.path.replace(/\.webp$/, "")] = item.signedUrl;
  }
  return urls;
}
