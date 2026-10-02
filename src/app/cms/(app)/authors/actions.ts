"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/cms/auth";
import { BAN_REASON_MAX } from "@/lib/cms/appeal-limits";
import { removeOwnerMedia, republishOwnerMedia } from "@/lib/cms/media";
import { CMS_APPEALS, CMS_AUTHORS, cmsRoute } from "@/lib/cms/paths";
import { isUuid } from "@/lib/cms/posts";
import type { BanContentAction } from "@/lib/supabase/database.types";

const CONTENT_ACTIONS: BanContentAction[] = ["hide", "unpublish", "delete"];

function refreshPublic() {
  revalidatePath("/", "layout");
}

export async function banAuthor(targetId: string, formData: FormData) {
  await requireAdmin();
  if (!isUuid(targetId)) redirect(`${CMS_AUTHORS}?error=missing`);

  const rawReason = formData.get("reason");
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";
  if (reason.length > BAN_REASON_MAX) redirect(`${CMS_AUTHORS}?error=reason`);

  const rawAction = formData.get("content");
  const content = CONTENT_ACTIONS.includes(rawAction as BanContentAction)
    ? (rawAction as BanContentAction)
    : "hide";

  const supabase = await createClient();
  const { error } = await supabase.rpc("ban_author", {
    target: targetId,
    reason: reason || null,
    content_action: content,
  });
  if (error) {
    console.error("banAuthor", error.message);
    redirect(`${CMS_AUTHORS}?error=ban`);
  }

  await removeOwnerMedia(targetId, content === "delete");
  refreshPublic();
  redirect(`${CMS_AUTHORS}?notice=banned-${content}`);
}

export async function unbanAuthor(targetId: string) {
  await requireAdmin();
  if (!isUuid(targetId)) redirect(`${CMS_AUTHORS}?error=missing`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("unban_author", { target: targetId });
  if (error) {
    console.error("unbanAuthor", error.message);
    redirect(`${CMS_AUTHORS}?error=unban`);
  }

  await republishOwnerMedia(targetId);
  refreshPublic();
  redirect(`${CMS_AUTHORS}?notice=unbanned`);
}

export async function decideAppeal(appealId: string, accept: boolean) {
  await requireAdmin();
  if (!isUuid(appealId)) redirect(`${CMS_APPEALS}?error=missing`);

  const supabase = await createClient();
  const { data: appeal } = await supabase.from("appeals").select("user_id").eq("id", appealId).maybeSingle();
  const { error } = await supabase.rpc("decide_appeal", { appeal: appealId, accept });
  if (error) {
    console.error("decideAppeal", error.message);
    redirect(`${CMS_APPEALS}?error=decided`);
  }

  if (accept) {
    if (appeal) await republishOwnerMedia(appeal.user_id);
    refreshPublic();
  }
  revalidatePath(cmsRoute(CMS_APPEALS));
  redirect(`${CMS_APPEALS}?notice=${accept ? "accepted" : "rejected"}`);
}
