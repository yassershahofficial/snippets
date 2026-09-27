"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedInProfile } from "@/lib/cms/auth";
import { APPEAL_MAX } from "@/lib/cms/appeal-limits";
import { CMS_BANNED } from "@/lib/cms/paths";

export type AppealState = { message: string; error?: string };

export async function submitAppeal(
  _prev: AppealState,
  formData: FormData,
): Promise<AppealState> {
  const profile = await requireSignedInProfile();
  const raw = formData.get("message");
  const message = typeof raw === "string" ? raw.trim() : "";

  if (!profile.banned_at) return { message, error: "Your account isn't banned." };
  if (!message) return { message, error: "Tell the admin why the ban should be lifted." };
  if (message.length > APPEAL_MAX) {
    return { message, error: `Keep your appeal under ${APPEAL_MAX} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("appeals")
    .insert({ user_id: profile.id, message });

  if (error) {
    if (error.code === "23505") {
      return { message, error: "You already have an appeal waiting for the admin." };
    }
    console.error("submitAppeal", error.code, error.message);
    return { message, error: "Couldn't send your appeal. Please try again." };
  }

  revalidatePath(CMS_BANNED);
  return { message: "" };
}
