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

export async function listPendingAppeals(): Promise<AppealWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appeals")
    .select("*, author:profiles!appeals_user_id_fkey(username, google_name, ban_reason)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) console.error("listPendingAppeals", error.message);
  return data ?? [];
}

const RECENT_DECISIONS = 30;

type DecisionAuthor = { username: string; google_name: string } | null;
type Ban = Database["snippets"]["Tables"]["bans"]["Row"];

type DecisionDetail =
  | { kind: "ban"; reason: string | null; contentAction: Ban["content_action"]; active: boolean }
  | { kind: "unban" }
  | { kind: "appeal"; status: Appeal["status"]; message: string; sentAt: string };

/** One entry in the admin's history. `banCount` is every ban of that author, the latest included. */
export type Decision = { id: string; at: string; author: DecisionAuthor; banCount: number } & DecisionDetail;

type DecisionDraft = { id: string; at: string; author: DecisionAuthor; userId: string } & DecisionDetail;

/** Bans, bans the admin lifted, and decided appeals, newest first. */
export async function listDecisions(): Promise<Decision[]> {
  const supabase = await createClient();
  const author = "author:profiles!bans_user_id_fkey(username, google_name)";
  const [bans, lifts, appeals] = await Promise.all([
    supabase
      .from("bans")
      .select(`id, user_id, reason, content_action, banned_at, lifted_at, ${author}`)
      .order("banned_at", { ascending: false })
      .limit(RECENT_DECISIONS),
    supabase
      .from("bans")
      .select(`id, user_id, lifted_at, ${author}`)
      .eq("lifted_by", "admin")
      .order("lifted_at", { ascending: false })
      .limit(RECENT_DECISIONS),
    supabase
      .from("appeals")
      .select("id, user_id, message, status, created_at, decided_at, author:profiles!appeals_user_id_fkey(username, google_name)")
      .neq("status", "pending")
      .order("decided_at", { ascending: false })
      .limit(RECENT_DECISIONS),
  ]);
  if (bans.error) console.error("listDecisions bans", bans.error.message);
  if (lifts.error) console.error("listDecisions lifts", lifts.error.message);
  if (appeals.error) console.error("listDecisions appeals", appeals.error.message);

  const drafts: DecisionDraft[] = [
    ...(bans.data ?? []).map((ban) => ({
      kind: "ban" as const,
      id: `ban-${ban.id}`,
      userId: ban.user_id,
      at: ban.banned_at,
      author: ban.author,
      reason: ban.reason,
      contentAction: ban.content_action,
      active: ban.lifted_at === null,
    })),
    ...(lifts.data ?? []).flatMap((ban) =>
      ban.lifted_at
        ? [{ kind: "unban" as const, id: `unban-${ban.id}`, userId: ban.user_id, at: ban.lifted_at, author: ban.author }]
        : [],
    ),
    ...(appeals.data ?? []).flatMap((appeal) =>
      appeal.decided_at
        ? [
            {
              kind: "appeal" as const,
              id: `appeal-${appeal.id}`,
              userId: appeal.user_id,
              at: appeal.decided_at,
              author: appeal.author,
              status: appeal.status,
              message: appeal.message,
              sentAt: appeal.created_at,
            },
          ]
        : [],
    ),
  ];
  const recent = drafts
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, RECENT_DECISIONS);

  const userIds = [...new Set(recent.map((d) => d.userId))];
  const counts = new Map<string, number>();
  if (userIds.length > 0) {
    const { data, error } = await supabase.from("bans").select("user_id").in("user_id", userIds);
    if (error) console.error("listDecisions counts", error.message);
    for (const row of data ?? []) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return recent.map(({ userId, ...draft }) => ({ ...draft, banCount: counts.get(userId) ?? 0 }));
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
