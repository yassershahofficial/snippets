"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCmsProfile } from "@/lib/cms/auth";
import { cmsPostPath, getCmsPost } from "@/lib/cms/posts";
import { MESSAGE_MAX } from "@/lib/cms/thread-limits";

export type SendMessageState = {
  body: string;
  error?: string;
  sentAt?: number;
};

export async function sendMessage(
  postId: string,
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const profile = await requireCmsProfile();
  const raw = formData.get("body");
  const body = typeof raw === "string" ? raw.trim() : "";

  if (!body) return { body, error: "Write a message first." };
  if (body.length > MESSAGE_MAX) {
    return { body, error: `Keep messages under ${MESSAGE_MAX} characters.` };
  }

  const post = await getCmsPost(profile, postId);
  if (!post) return { body, error: "This post no longer exists or you can't open it." };
  if (post.status === "published") {
    return { body, error: "Live posts have no review thread." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("post_messages")
    .insert({ post_id: postId, sender_id: profile.id, body });

  if (error) {
    if (error.message.includes("thread is full")) {
      return { body, error: "This thread is full (50 messages). Delete old ones to write more." };
    }
    console.error("sendMessage", error.code, error.message);
    return { body, error: "Couldn't send. Please try again." };
  }

  revalidatePath(cmsPostPath(postId));
  return { body: "", sentAt: Date.now() };
}

export async function deleteMessage(postId: string, messageId: string) {
  const profile = await requireCmsProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("post_messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", profile.id);
  if (error) console.error("deleteMessage", error.message);
  revalidatePath(cmsPostPath(postId));
}
