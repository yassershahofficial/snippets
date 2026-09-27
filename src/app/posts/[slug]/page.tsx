import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parsePostBody } from "@/lib/posts/parse-body";
import { getPublishedPostBySlug } from "@/lib/posts/queries";
import { PostBodyView } from "@/lib/posts/render";
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

  return (
    <main className="post">
      <p className="post-logo">
        <Link href="/">Snippets</Link>
      </p>

      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <p className="post-description">{post.description}</p>
        {published ? <p className="post-meta">{published}</p> : null}
      </header>

      {body ? (
        <PostBodyView body={body} skipTitleDescription />
      ) : (
        <p className="post-empty">This post has no content yet.</p>
      )}

      <p className="post-back">
        <Link href="/">← Back home</Link>
      </p>
    </main>
  );
}
