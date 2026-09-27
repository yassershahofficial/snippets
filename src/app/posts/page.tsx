import type { Metadata } from "next";
import Link from "next/link";
import { formatPostMeta, postHref } from "@/lib/posts/format";
import { listPublishedPosts } from "@/lib/posts/queries";
import { ArchiveFilter, type ArchiveEntry } from "./archive-filter";
import "./archive.css";

export const metadata: Metadata = {
  title: "All posts · Snippets",
  description: "Every post on Snippets, newest first.",
};

export default async function ArchivePage() {
  const posts = await listPublishedPosts();
  const entries: ArchiveEntry[] = posts.map((post) => ({
    id: post.id,
    href: postHref(post.slug),
    title: post.title,
    description: post.description ?? "",
    date: formatPostMeta(post.published_at),
    year: post.published_at ? new Date(post.published_at).getUTCFullYear() : null,
  }));

  return (
    <main className="archive">
      <p className="archive-logo">
        <Link href="/">Snippets</Link>
      </p>

      <header className="archive-header">
        <h1 className="archive-title">All posts</h1>
      </header>

      {entries.length > 0 ? (
        <ArchiveFilter entries={entries} />
      ) : (
        <p className="archive-empty">No published posts yet.</p>
      )}

      <p className="archive-back">
        <Link href="/">← Back home</Link>
      </p>
    </main>
  );
}
