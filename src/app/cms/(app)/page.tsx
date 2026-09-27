import type { Metadata } from "next";
import Link from "next/link";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_BASE } from "@/lib/cms/paths";
import { POST_ERROR_MESSAGES, type PostErrorCode } from "@/lib/cms/post-form";
import {
  STATUS_FILTERS,
  STATUS_LABELS,
  cmsNewPostPath,
  cmsPostPath,
  listCmsPosts,
  type StatusFilter,
} from "@/lib/cms/posts";

export const metadata: Metadata = { title: "Posts" };

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  in_review: "In review",
  draft: "Drafts",
  published: "Published",
};

const NOTICES: Record<string, string> = {
  deleted: "Post deleted.",
  returned: "Post returned to its author as a draft.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CmsPostsPage({ searchParams }: Props) {
  const profile = await requireCmsProfile();
  const params = await searchParams;
  const filter = STATUS_FILTERS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : null;
  const error =
    typeof params.error === "string" && params.error in POST_ERROR_MESSAGES
      ? POST_ERROR_MESSAGES[params.error as PostErrorCode]
      : null;

  const posts = await listCmsPosts(profile, filter);
  const isAdmin = profile.role === "admin";

  return (
    <section className="cms-section">
      <div className="cms-section-head">
        <h1>Posts</h1>
        <Link href={cmsNewPostPath()} className="cms-button cms-button-link">
          New post
        </Link>
      </div>
      <p className="cms-lede">
        {isAdmin
          ? "Your posts, plus everything authors have submitted or published."
          : "Write drafts and submit them for review. The admin publishes them."}
      </p>

      {notice ? <p className="cms-flash" role="status">{notice}</p> : null}
      {error ? <p className="cms-notice" role="alert">{error}</p> : null}

      <nav className="cms-filters" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? CMS_BASE : `${CMS_BASE}?status=${f}`}
            aria-current={f === filter ? "page" : undefined}
          >
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="cms-empty">
          {filter === "all"
            ? "No posts yet. Start one with New post."
            : `Nothing in ${FILTER_LABELS[filter].toLowerCase()} right now.`}
        </p>
      ) : (
        <ul className="cms-post-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={cmsPostPath(post.id)} className="cms-post-title">
                {post.title}
              </Link>
              <p className="cms-post-meta">
                <span className={`cms-status cms-status-${post.status}`}>
                  {STATUS_LABELS[post.status]}
                </span>
                {post.featured ? <span className="cms-status">Featured</span> : null}
                <span>{post.type}</span>
                {isAdmin && post.author_id !== profile.id && post.author ? (
                  <span>by {post.author.username}</span>
                ) : null}
                <span>Updated {formatDate(post.updated_at)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
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
