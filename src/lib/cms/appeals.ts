import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Appeal = Database["snippets"]["Tables"]["appeals"]["Row"];

export async function getLatestAppeal(userId: string): Promise<Appeal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appeals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error("getLatestAppeal", error.message);
  return data ?? null;
}

export type AppealWithAuthor = Appeal & {
  author: { username: string; google_name: string; ban_reason: string | null } | null;
};

export async function listAppeals(): Promise<{
  pending: AppealWithAuthor[];
  decided: AppealWithAuthor[];
}> {
  const supabase = await createClient();
  const columns = "*, author:profiles!appeals_user_id_fkey(username, google_name, ban_reason)";
  const [pending, decided] = await Promise.all([
    supabase
      .from("appeals")
      .select(columns)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("appeals")
      .select(columns)
      .neq("status", "pending")
      .order("decided_at", { ascending: false })
      .limit(20),
  ]);
  if (pending.error) console.error("listAppeals pending", pending.error.message);
  if (decided.error) console.error("listAppeals decided", decided.error.message);
  return { pending: pending.data ?? [], decided: decided.data ?? [] };
}

export async function countPendingAppeals(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("appeals")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) console.error("countPendingAppeals", error.message);
  return count ?? 0;
}
