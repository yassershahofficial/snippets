import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { THREAD_MAX } from "./thread-limits";

export type ThreadMessage = Pick<
  Database["snippets"]["Tables"]["post_messages"]["Row"],
  "id" | "sender_id" | "body" | "created_at"
>;

export async function listThread(postId: string): Promise<ThreadMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_messages")
    .select("id, sender_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(THREAD_MAX);
  if (error) {
    console.error("listThread", error.message);
    return [];
  }
  return data ?? [];
}

/** Records this visit and returns the previous one, so new messages can be marked. */
export async function markThreadRead(postId: string, userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_thread_reads")
    .select("last_read_at")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("post_thread_reads")
    .upsert({ post_id: postId, user_id: userId, last_read_at: new Date().toISOString() });
  if (error) console.error("markThreadRead", error.message);

  return data?.last_read_at ?? null;
}

export async function listUnreadPostIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unread_thread_posts");
  if (error) {
    console.error("listUnreadPostIds", error.message);
    return new Set();
  }
  return new Set(data ?? []);
}
