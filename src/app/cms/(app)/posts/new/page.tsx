import type { Metadata } from "next";
import Link from "next/link";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_BASE } from "@/lib/cms/paths";
import { listNextPostOptions } from "@/lib/cms/posts";
import { createPost } from "../actions";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireCmsProfile();
  const nextPostOptions = await listNextPostOptions(null);

  return (
    <section className="cms-section">
      <p className="cms-crumb">
        <Link href={CMS_BASE}>Posts</Link>
      </p>
      <h1>New post</h1>
      <p className="cms-lede">
        Start with the details. The post is saved as a draft only you can see.
      </p>
      <PostForm
        action={createPost}
        initialValues={{
          title: "",
          slug: "",
          description: "",
          tags: "",
          nextPostId: "",
        }}
        nextPostOptions={nextPostOptions}
        submitLabel="Create draft"
      />
    </section>
  );
}
