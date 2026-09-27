import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsProfile } from "@/lib/cms/auth";
import { STATUS_LABELS, cmsPostPath, getCmsPost } from "@/lib/cms/posts";
import { formatPostMeta } from "@/lib/posts/format";
import { parsePostBody } from "@/lib/posts/parse-body";
import { PostBodyView } from "@/lib/posts/render";
import "@/app/posts/[slug]/post.css";

export const metadata: Metadata = { title: "Preview" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PreviewPostPage({ params }: Props) {
  const profile = await requireCmsProfile();
  const { id } = await params;
  const post = await getCmsPost(profile, id);
  if (!post) notFound();

  const body = parsePostBody(post.body);
  const published = formatPostMeta(post.published_at);

  return (
    <>
      <p className="cms-preview-bar">
        Preview of a {STATUS_LABELS[post.status].toLowerCase()} post
        {post.status === "published" ? "" : ". Readers can't see it yet"}.{" "}
        <Link href={cmsPostPath(post.id)}>
          {post.author_id === profile.id ? "Back to editing" : "Back to review"}
        </Link>
      </p>
      <article className="post">
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          {post.description ? (
            <p className="post-description">{post.description}</p>
          ) : null}
          {published ? <p className="post-meta">{published}</p> : null}
        </header>

        {body && body.content.length > 0 ? (
          <PostBodyView body={body} skipTitleDescription />
        ) : (
          <p className="post-empty">This post has no content yet.</p>
        )}
      </article>
    </>
  );
}
