import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_BASE } from "@/lib/cms/paths";
import {
  POST_ERROR_MESSAGES,
  postToFormValues,
  type PostErrorCode,
} from "@/lib/cms/post-form";
import {
  STATUS_LABELS,
  cmsPostPath,
  getCmsPost,
  listNextPostOptions,
} from "@/lib/cms/posts";
import { postHref } from "@/lib/posts/format";
import { parsePostBody } from "@/lib/posts/parse-body";
import {
  deletePost,
  publishPost,
  setFeatured,
  submitForReview,
  updatePost,
  withdrawToDraft,
} from "../actions";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Edit post" };

const NOTICES: Record<string, string> = {
  created: "Draft created. Only you can see it until you submit it for review.",
  submitted: "Submitted for review. The admin will publish it or send it back.",
  draft: "Moved back to draft.",
  published: "Published. It's live on the site now.",
  featured: "Featured on the home page.",
  unfeatured: "No longer featured.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPostPage({ params, searchParams }: Props) {
  const profile = await requireCmsProfile();
  const { id } = await params;
  const post = await getCmsPost(profile, id);
  if (!post) notFound();

  const query = await searchParams;
  const notice = typeof query.notice === "string" ? NOTICES[query.notice] : null;
  const error =
    typeof query.error === "string" && query.error in POST_ERROR_MESSAGES
      ? POST_ERROR_MESSAGES[query.error as PostErrorCode]
      : null;

  const nextPostOptions = await listNextPostOptions(post.id);
  const isAdmin = profile.role === "admin";
  const isOwner = post.author_id === profile.id;
  const blocks = parsePostBody(post.body)?.content.length ?? 0;

  const liveEditNote =
    post.status === "published" && !isAdmin
      ? "This post is live. Saving changes sends it back to review until the admin approves them."
      : undefined;

  return (
    <section className="cms-section">
      <p className="cms-crumb">
        <Link href={CMS_BASE}>Posts</Link>
      </p>
      <h1>{post.title}</h1>

      {notice ? <p className="cms-flash" role="status">{notice}</p> : null}
      {error ? <p className="cms-notice" role="alert">{error}</p> : null}

      <div className="cms-editor">
        <PostForm
          action={updatePost.bind(null, post.id)}
          initialValues={postToFormValues(post)}
          nextPostOptions={nextPostOptions}
          submitLabel="Save changes"
          note={liveEditNote}
        />

        <aside className="cms-panel" aria-label="Post status">
          <dl className="cms-panel-facts">
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`cms-status cms-status-${post.status}`}>
                  {STATUS_LABELS[post.status]}
                </span>
                {post.featured ? <span className="cms-status">Featured</span> : null}
              </dd>
            </div>
            <div>
              <dt>Author</dt>
              <dd>{isOwner ? "You" : (post.author?.username ?? "Unknown")}</dd>
            </div>
            {post.published_at ? (
              <div>
                <dt>First published</dt>
                <dd>{formatDate(post.published_at)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Body</dt>
              <dd>
                {blocks === 0
                  ? "Empty. The body editor is the next piece of the CMS."
                  : `${blocks} block${blocks === 1 ? "" : "s"}. Body editing comes with the editor.`}
              </dd>
            </div>
          </dl>

          <div className="cms-panel-actions">
            <Link href={`${cmsPostPath(post.id)}/preview`} className="cms-button cms-button-quiet cms-button-link">
              Preview
            </Link>
            {post.status === "published" ? (
              <Link href={postHref(post.slug)} className="cms-button cms-button-quiet cms-button-link">
                View live
              </Link>
            ) : null}

            {post.status === "draft" ? (
              <form action={submitForReview.bind(null, post.id)}>
                <button type="submit" className="cms-button">
                  Submit for review
                </button>
              </form>
            ) : null}

            {isAdmin && post.status !== "published" ? (
              <form action={publishPost.bind(null, post.id)}>
                <button type="submit" className="cms-button">
                  Publish
                </button>
              </form>
            ) : null}

            {isAdmin && post.status === "published" ? (
              <form action={setFeatured.bind(null, post.id, !post.featured)}>
                <button type="submit" className="cms-button cms-button-quiet">
                  {post.featured ? "Remove from featured" : "Feature on home page"}
                </button>
              </form>
            ) : null}

            {post.status !== "draft" ? (
              <form action={withdrawToDraft.bind(null, post.id)}>
                <button type="submit" className="cms-button cms-button-quiet">
                  {post.status === "published"
                    ? "Unpublish"
                    : isOwner
                      ? "Withdraw to draft"
                      : "Return to author"}
                </button>
              </form>
            ) : null}
          </div>

          <details className="cms-danger">
            <summary>Delete post</summary>
            <p>This permanently removes the post. It can&apos;t be undone.</p>
            <form action={deletePost.bind(null, post.id)}>
              <button type="submit" className="cms-button cms-button-danger">
                Delete permanently
              </button>
            </form>
          </details>
        </aside>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
