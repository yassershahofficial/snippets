"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCmsProfile, type CmsProfile } from "@/lib/cms/auth";
import { CMS_BASE } from "@/lib/cms/paths";
import { cmsPostPath, getCmsPost, type CmsPost } from "@/lib/cms/posts";
import {
  POST_ERROR_MESSAGES,
  describePostError,
  postErrorState,
  readPostForm,
  validatePostForm,
  type PostErrorCode,
  type PostFormState,
} from "@/lib/cms/post-form";
import type { PostStatus } from "@/lib/supabase/database.types";

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const profile = await requireCmsProfile();
  const values = readPostForm(formData);
  const { data, errors } = validatePostForm(values, null);
  if (!data) return { values, errors };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("posts")
    .insert({ ...data, author_id: profile.id, status: "draft" })
    .select("id")
    .single();

  if (error) return postErrorState(values, error);
  redirect(`${cmsPostPath(created.id)}?notice=created`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const profile = await requireCmsProfile();
  const values = readPostForm(formData);
  const post = await getCmsPost(profile, id);
  if (!post) return { values, message: POST_ERROR_MESSAGES.missing };

  const { data, errors } = validatePostForm(values, id);
  if (!data) return { values, errors };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("posts")
    .update(data)
    .eq("id", id)
    .select("status")
    .single();

  if (error) return postErrorState(values, error);

  revalidatePath(cmsPostPath(id));
  const sentBack = post.status === "published" && updated.status === "in_review";
  return {
    values,
    ok: true,
    message: sentBack
      ? "Saved. The post was live, so it went back to review until the admin approves it."
      : "Saved.",
  };
}

type Loaded = { profile: CmsProfile; post: CmsPost };

async function loadForAction(id: string): Promise<Loaded> {
  const profile = await requireCmsProfile();
  const post = await getCmsPost(profile, id);
  if (!post) redirect(`${CMS_BASE}?error=missing`);
  return { profile, post };
}

function fail(id: string, code: PostErrorCode): never {
  redirect(`${cmsPostPath(id)}?error=${code}`);
}

async function setStatus(id: string, post: CmsPost, status: PostStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ status }).eq("id", post.id);
  if (error) fail(id, describePostError(error).code);
  revalidatePath(cmsPostPath(id));
}

export async function submitForReview(id: string) {
  const { post } = await loadForAction(id);
  if (post.status !== "draft") fail(id, "unknown");
  await setStatus(id, post, "in_review");
  redirect(`${cmsPostPath(id)}?notice=submitted`);
}

export async function withdrawToDraft(id: string) {
  const { profile, post } = await loadForAction(id);
  if (post.status === "draft") fail(id, "unknown");
  await setStatus(id, post, "draft");

  if (post.author_id !== profile.id) {
    redirect(`${CMS_BASE}?notice=returned`);
  }
  redirect(`${cmsPostPath(id)}?notice=draft`);
}

export async function publishPost(id: string) {
  const { profile, post } = await loadForAction(id);
  if (profile.role !== "admin") fail(id, "admin");
  if (post.status === "published") fail(id, "unknown");
  await setStatus(id, post, "published");
  redirect(`${cmsPostPath(id)}?notice=published`);
}

export async function setFeatured(id: string, featured: boolean) {
  const { profile, post } = await loadForAction(id);
  if (profile.role !== "admin") fail(id, "admin");
  if (featured && post.status !== "published") fail(id, "unknown");

  const supabase = await createClient();
  if (featured) {
    const clear = await supabase
      .from("posts")
      .update({ featured: false })
      .eq("featured", true)
      .neq("id", id);
    if (clear.error) fail(id, describePostError(clear.error).code);
  }

  const { error } = await supabase.from("posts").update({ featured }).eq("id", id);
  if (error) fail(id, describePostError(error).code);

  revalidatePath(cmsPostPath(id));
  redirect(`${cmsPostPath(id)}?notice=${featured ? "featured" : "unfeatured"}`);
}

export async function deletePost(id: string) {
  const { post } = await loadForAction(id);
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) fail(id, describePostError(error).code);
  redirect(`${CMS_BASE}?notice=deleted`);
}
