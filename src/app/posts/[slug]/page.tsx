import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/author-byline";
import { parsePostBody } from "@/lib/posts/parse-body";
import { getNextPost, getPublishedPostBySlug } from "@/lib/posts/queries";
import { PostBodyView } from "@/lib/posts/render";
import { bodyHeadingIds, buildPostToc } from "@/lib/posts/toc";
import { PostToc } from "./post-toc";
import "./post.css";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatPublishedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: "Not found · Snippets" };
  }
  return {
    title: `${post.title} · Snippets`,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const body = parsePostBody(post.body);
  const published = formatPublishedAt(post.published_at);
  const next = await getNextPost(post);
  const toc = buildPostToc(post.title, body);
  const titleId = toc[0]?.level === 1 ? toc[0].id : undefined;
  const headingIds = body ? bodyHeadingIds(post.title, body) : [];
  const showToc = toc.length > 1;

  return (
    <div className="post-page">
      <header className="post-site-header">
        <p className="post-site-logo">
          <Link href="/">Snippets</Link>
        </p>
        <Link className="post-site-about" href="/about">
          About
        </Link>
      </header>

      <div className="post-layout">
        <main className="post">
          <header className="post-header">
            <h1 id={titleId} className="post-title">
              {post.title}
            </h1>
            <p className="post-description">{post.description}</p>
            <div className="post-meta-row">
              {published ? <p className="post-meta">{published}</p> : <span />}
              <AuthorByline author={post.author} />
            </div>
          </header>

          {showToc ? <PostToc entries={toc} /> : null}

          {body ? (
            <PostBodyView body={body} skipTitleDescription headingIds={headingIds} />
          ) : (
            <p className="post-empty">This post has no content yet.</p>
          )}

          {next ? (
            <nav className="post-next" aria-labelledby="post-next-label">
              <p id="post-next-label" className="post-next-label">
                Read next
              </p>
              <Link href={`/posts/${next.slug}`} className="post-next-link">
                <span className="post-next-title">{next.title}</span>
                {next.description ? (
                  <span className="post-next-description">{next.description}</span>
                ) : null}
              </Link>
            </nav>
          ) : null}

          <p className="post-back">
            <Link href="/">← Back home</Link>
            <Link href="/posts">All posts</Link>
          </p>
        </main>
      </div>
    </div>
  );
}
