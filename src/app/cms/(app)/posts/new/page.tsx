import type { Metadata } from "next";
import Link from "next/link";
import { requireCmsProfile } from "@/lib/cms/auth";
import { scheduleMediaCleanup } from "@/lib/cms/media";
import { CMS_BASE } from "@/lib/cms/paths";
import { EMPTY_POST_VALUES } from "@/lib/cms/post-form";
import { listNextPostOptions, listTagOptions } from "@/lib/cms/posts";
import { createPost } from "../actions";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const profile = await requireCmsProfile();
  const [nextPostOptions, tagOptions] = await Promise.all([
    listNextPostOptions(null),
    listTagOptions(profile),
    scheduleMediaCleanup(profile.id),
  ]);

  return (
    <section className="cms-section">
      <p className="cms-crumb">
        <Link href={CMS_BASE}>Posts</Link>
      </p>
      <h1>New post</h1>
      <p className="cms-lede">
        The post is saved as a draft only you can see.
      </p>
      <PostForm
        action={createPost}
        initialValues={EMPTY_POST_VALUES}
        nextPostOptions={nextPostOptions}
        tagOptions={tagOptions}
        submitLabel="Create draft"
      />
    </section>
  );
}
