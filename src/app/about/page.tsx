import type { Metadata } from "next";
import Link from "next/link";
import "./about.css";

export const metadata: Metadata = {
  title: "About · Snippets",
  description: "About Snippets, a personal blog of short ideas.",
};

export default function AboutPage() {
  return (
    <main className="about">
      <p className="about-logo">
        <Link href="/">Snippets</Link>
      </p>
      <h1>About</h1>
      <p>
        Snippets is a personal blog about ideas worth keeping, lessons learned,
        and practical thoughts on productivity, creativity, and a better way to
        work.
      </p>
      <p className="about-back">
        <Link href="/">← Back home</Link>
      </p>
    </main>
  );
}
