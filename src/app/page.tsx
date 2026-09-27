import Link from "next/link";
import { formatPostMeta, postHref } from "@/lib/posts/format";
import { getFeaturedPost, getLatestPosts } from "@/lib/posts/queries";
import { homeFontVariables } from "./fonts";
import { HomeIntroTitle } from "./home-intro-title";
import "./home.css";

export default async function HomePage() {
  const featured = await getFeaturedPost();
  const rail = await getLatestPosts(featured?.id ?? null, 3);

  return (
    <div className={`home ${homeFontVariables}`}>
      <header className="home-header">
        <p className="home-logo">Snippets</p>
        <Link className="home-about" href="/about">
          About
        </Link>
      </header>

      <section className="home-intro" aria-label="Introduction">
        <HomeIntroTitle />
        <p className="home-intro-deck">
          Snippets is a personal blog about ideas worth keeping, lessons learned,
          and practical thoughts on productivity, creativity, and a better way to
          work.
        </p>
      </section>

      <div className="home-split">
        <section className="home-featured" id="featured" aria-label="Featured">
          {featured ? (
            <>
              <p className="home-kicker">Featured</p>
              <h2 className="home-featured-title">
                <Link
                  className="home-featured-title-link"
                  href={postHref(featured.slug)}
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="home-featured-hook">{featured.description}</p>
              <div className="home-featured-foot">
                <p className="home-meta">
                  {formatPostMeta(featured.published_at)}
                </p>
                <Link
                  className="home-readmore"
                  href={postHref(featured.slug)}
                >
                  Read more →
                </Link>
              </div>
            </>
          ) : (
            <p className="home-empty">No published posts yet.</p>
          )}
        </section>

        <aside className="home-rail" aria-label="Latest posts">
          <p className="home-kicker home-rail-kicker">Latest</p>
          {rail.length > 0 ? (
            <ul className="home-rail-list">
              {rail.map((post) => (
                <li key={post.id}>
                  <Link
                    className="home-rail-item"
                    href={postHref(post.slug)}
                  >
                    <span className="home-rail-title">{post.title}</span>
                    <span className="home-meta">
                      {formatPostMeta(post.published_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-empty home-rail-empty">
              More posts will show up here.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
