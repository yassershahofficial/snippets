import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatPostMeta, postHref } from "@/lib/posts/format";
import { listPublishedPostsByUsername } from "@/lib/posts/queries";
import {
  ArchiveFilter,
  type ArchiveEntry,
} from "@/app/posts/archive-filter";
import "@/app/posts/archive.css";
import "./about.css";

export const metadata: Metadata = {
  title: "About · Snippets",
  description:
    "Slicing Cucumber writes on Snippets: an engineer trying to understand how things work.",
};

/**
 * Hardcoded stand-in for the future `/authors/[username]` page.
 * Identity is fixed here; the article list is live published posts.
 */
const ABOUT_AUTHOR = {
  username: "Slicing Cucumber",
  avatarUrl:
    "https://lh3.googleusercontent.com/a/ACg8ocIxZnseFX4qJ1xZjRXBR7KG_qsPPe-T5txxTgWWBIvGhpTd9z1U=s200-c",
  bio: "An engineer trying to understand how things work. I ask a lot of questions, keep my opinions provisional, and like challenging ideas.",
} as const;

export default async function AboutPage() {
  const posts = await listPublishedPostsByUsername(ABOUT_AUTHOR.username);
  const entries: ArchiveEntry[] = posts.map((post) => ({
    id: post.id,
    href: postHref(post.slug),
    title: post.title,
    description: post.description ?? "",
    date: formatPostMeta(post.published_at),
    year: post.published_at
      ? new Date(post.published_at).getUTCFullYear()
      : null,
  }));

  return (
    <div className="about">
      <header className="about-site-header">
        <p className="about-logo">
          <Link href="/">Snippets</Link>
        </p>
        <Link className="about-nav-about" href="/about" aria-current="page">
          About
        </Link>
      </header>

      <section className="about-profile" aria-label="Author">
        <Image
          src={ABOUT_AUTHOR.avatarUrl}
          alt=""
          width={112}
          height={112}
          className="about-avatar"
          priority
        />
        <h1 className="about-name">{ABOUT_AUTHOR.username}</h1>
        <p className="about-bio">{ABOUT_AUTHOR.bio}</p>
      </section>

      <section className="about-articles" aria-label="Articles">
        {entries.length > 0 ? (
          <div className="archive about-articles-filter">
            <ArchiveFilter entries={entries} groupYears={false} />
          </div>
        ) : (
          <p className="about-empty">No published articles yet.</p>
        )}
      </section>
    </div>
  );
}
