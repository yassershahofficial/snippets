import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { CMS_LOGIN } from "./paths";

type ProfileRow = Database["snippets"]["Tables"]["profiles"]["Row"];

export type CmsProfile = Pick<
  ProfileRow,
  "id" | "username" | "google_name" | "avatar_url" | "role"
>;

export type CmsSession = {
  userId: string | null;
  /** Null when signed out, or signed in without a Google identity. */
  profile: CmsProfile | null;
};

const PROFILE_COLUMNS = "id, username, google_name, avatar_url, role" as const;

/** Verified session + CMS profile, read once per request. */
export const getCmsSession = cache(async (): Promise<CmsSession> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  if (!userId) return { userId: null, profile: null };

  const existing = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (existing.data) return { userId, profile: existing.data };

  const synced = await supabase.rpc("sync_profile");
  if (synced.error || !synced.data) {
    if (synced.error) console.error("sync_profile", synced.error.message);
    return { userId, profile: null };
  }

  const { id, username, google_name, avatar_url, role } = synced.data;
  return { userId, profile: { id, username, google_name, avatar_url, role } };
});

/** Use at the top of every CMS page and Server Action. */
export async function requireCmsProfile(): Promise<CmsProfile> {
  const { profile } = await getCmsSession();
  if (!profile) redirect(CMS_LOGIN);
  return profile;
}
