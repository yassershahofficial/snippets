import "server-only";
import { after } from "next/server";
import { createStorageAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { MEDIA_PER_POST, MEDIA_PRIVATE_BUCKET, MEDIA_PUBLIC_BUCKET, mediaPath } from "@/lib/media/limits";
import { collectMediaIds } from "@/lib/posts/media-refs";

const STALE_AFTER_MS = 60 * 60 * 1000;
const SIGNED_URL_SECONDS = 60 * 60;

type Db = Awaited<ReturnType<typeof createClient>>;
type MediaRef = { id: string; published: boolean };

/** Removes files from both buckets, then their rows. Rows go only if the files did. */
export async function deleteMedia(items: MediaRef[], db?: Db): Promise<void> {
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

  const supabase = db ?? (await createClient());
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
export async function cleanupStaleMedia(userId: string, db?: Db): Promise<void> {
  const supabase = db ?? (await createClient());
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

  await deleteMedia(
    rows.filter((r) => !r.post_id || !used.has(r.id)),
    supabase,
  );
}

/**
 * Runs the cleanup after the page is sent. The client is made during render
 * because pages can't read cookies inside after().
 */
export async function scheduleMediaCleanup(userId: string): Promise<void> {
  const supabase = await createClient();
  after(() => cleanupStaleMedia(userId, supabase));
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

/**
 * Checks a body before saving: every image must be the author's own upload,
 * still on file, and either temporary or already on this post. Authors get at
 * most MEDIA_PER_POST images per post.
 */
export async function checkBodyMedia(
  body: Json,
  { ownerId, postId, isAdmin }: { ownerId: string; postId: string | null; isAdmin: boolean },
): Promise<string | null> {
  const ids = [...collectMediaIds(body)];
  if (ids.length === 0) return null;
  if (!isAdmin && ids.length > MEDIA_PER_POST) {
    return `A post can have at most ${MEDIA_PER_POST} images. Remove one and save again.`;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("media").select("id, owner_id, post_id").in("id", ids);
  if (error) {
    console.error("checkBodyMedia", error.message);
    return "The images couldn't be checked. Try saving again.";
  }
  const rows = new Map(data.map((row) => [row.id, row]));
  const usable = ids.every((id) => {
    const row = rows.get(id);
    return row && row.owner_id === ownerId && (row.post_id === null || row.post_id === postId);
  });
  return usable ? null : "An image in the body is no longer available. Remove it, add it again, then save.";
}

/** Copies files to the public bucket and marks them published. False if any copy failed. */
async function publishMedia(items: MediaRef[], db: Db): Promise<boolean> {
  const pending = items.filter((m) => !m.published);
  if (pending.length === 0) return true;
  const storage = createStorageAdmin();
  const done: string[] = [];
  for (const item of pending) {
    const path = mediaPath(item.id);
    const { error } = await storage
      .from(MEDIA_PRIVATE_BUCKET)
      .copy(path, path, { destinationBucket: MEDIA_PUBLIC_BUCKET });
    if (error && !/exists|duplicate/i.test(error.message)) {
      console.error("publishMedia copy", error.message);
      continue;
    }
    done.push(item.id);
  }
  if (done.length > 0) {
    const { error } = await db.from("media").update({ published: true }).in("id", done);
    if (error) console.error("publishMedia rows", error.message);
  }
  return done.length === pending.length;
}

/** Removes public copies and marks the files private again. */
async function unpublishMedia(items: MediaRef[], db: Db): Promise<void> {
  const live = items.filter((m) => m.published);
  if (live.length === 0) return;
  const storage = createStorageAdmin();
  const { error } = await storage.from(MEDIA_PUBLIC_BUCKET).remove(live.map((m) => mediaPath(m.id)));
  if (error) {
    console.error("unpublishMedia", error.message);
    return;
  }
  const rows = await db
    .from("media")
    .update({ published: false })
    .in(
      "id",
      live.map((m) => m.id),
    );
  if (rows.error) console.error("unpublishMedia rows", rows.error.message);
}

async function postMedia(db: Db, postId: string): Promise<MediaRef[]> {
  const { data, error } = await db.from("media").select("id, published").eq("post_id", postId);
  if (error) console.error("postMedia", error.message);
  return data ?? [];
}

/**
 * After a save: links temporary uploads, deletes uploads the body no longer
 * uses, and keeps public copies in step with whether the post is live.
 */
export async function syncPostMedia(postId: string, body: Json, live: boolean): Promise<void> {
  const supabase = await createClient();
  const used = collectMediaIds(body);
  if (used.size > 0) {
    const { error } = await supabase.rpc("attach_media", { target_post: postId, media_ids: [...used] });
    if (error) console.error("syncPostMedia attach", error.message);
  }
  const rows = await postMedia(supabase, postId);
  await deleteMedia(
    rows.filter((m) => !used.has(m.id)),
    supabase,
  );
  const kept = rows.filter((m) => used.has(m.id));
  if (live) await publishMedia(kept, supabase);
  else await unpublishMedia(kept, supabase);
}

/** Before a post goes live: public copies of the images its body uses. */
export async function publishPostMedia(postId: string, body: Json): Promise<boolean> {
  const supabase = await createClient();
  const used = collectMediaIds(body);
  const rows = await postMedia(supabase, postId);
  return publishMedia(
    rows.filter((m) => used.has(m.id)),
    supabase,
  );
}

/** When a post stops being live. */
export async function unpublishPostMedia(postId: string): Promise<void> {
  const supabase = await createClient();
  await unpublishMedia(await postMedia(supabase, postId), supabase);
}

/** Every file of a post, for removal once the post is deleted. */
export async function listPostMedia(postId: string): Promise<MediaRef[]> {
  return postMedia(await createClient(), postId);
}

async function ownerMedia(db: Db, ownerId: string): Promise<MediaRef[]> {
  const { data, error } = await db.from("media").select("id, published").eq("owner_id", ownerId);
  if (error) console.error("ownerMedia", error.message);
  return data ?? [];
}

/** Ban: public copies go (content "hide" or "unpublish"), or every file goes (content "delete"). */
export async function removeOwnerMedia(ownerId: string, deleteFiles: boolean): Promise<void> {
  const supabase = await createClient();
  const rows = await ownerMedia(supabase, ownerId);
  if (deleteFiles) await deleteMedia(rows, supabase);
  else await unpublishMedia(rows, supabase);
}

/** Unban: public copies again for the author's posts that are still published. */
export async function republishOwnerMedia(ownerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, body")
    .eq("author_id", ownerId)
    .eq("status", "published");
  if (error) {
    console.error("republishOwnerMedia", error.message);
    return;
  }
  for (const post of posts ?? []) {
    const used = collectMediaIds(post.body);
    if (used.size === 0) continue;
    const rows = await postMedia(supabase, post.id);
    await publishMedia(
      rows.filter((m) => used.has(m.id)),
      supabase,
    );
  }
}
