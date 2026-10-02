"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_HOME, cmsRoute } from "@/lib/cms/paths";
import { validateUsername } from "@/lib/cms/username";

export type UsernameState = {
  value: string;
  error?: string;
  message?: string;
};

export async function updateUsername(
  _prev: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const profile = await requireCmsProfile();
  const raw = String(formData.get("username") ?? "");
  const { value, error } = validateUsername(raw);
  if (!value) return { value: raw, error };

  if (value === profile.username) {
    return { value, message: "That's already your username." };
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ username: value })
    .eq("id", profile.id);

  if (dbError) {
    if (dbError.code === "23505") {
      return {
        value,
        error: "That name is taken. Names count as the same regardless of capitals or spaces.",
      };
    }
    if (dbError.message.includes("profiles_username_format")) {
      return { value, error: "Use letters, numbers and single spaces only." };
    }
    console.error("updateUsername", dbError.message);
    return { value, error: "Something went wrong. Please try again." };
  }

  revalidatePath(cmsRoute(CMS_HOME), "layout");
  return { value, message: "Username updated." };
}
