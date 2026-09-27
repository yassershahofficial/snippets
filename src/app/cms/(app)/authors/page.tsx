import type { Metadata } from "next";
import { requireAdmin } from "@/lib/cms/auth";
import { BAN_REASON_MAX } from "@/lib/cms/appeal-limits";
import { listAuthors, type AuthorSummary } from "@/lib/cms/authors";
import { banAuthor, unbanAuthor } from "./actions";

export const metadata: Metadata = { title: "Authors" };

const NOTICES: Record<string, string> = {
  "banned-hide": "Author banned. Their posts are hidden until you unban them.",
  "banned-unpublish": "Author banned and all their posts moved back to draft.",
  "banned-delete": "Author banned and all their posts deleted.",
  unbanned: "Ban lifted. Their published posts are visible again.",
};

const ERRORS: Record<string, string> = {
  missing: "That author no longer exists.",
  reason: `Keep the reason under ${BAN_REASON_MAX} characters.`,
  ban: "Couldn't ban this author. Admins can't be banned.",
  unban: "Couldn't lift the ban. Please try again.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] : null;
  const authors = await listAuthors();
  const banned = authors.filter((a) => a.banned_at).length;

  return (
    <section className="cms-section">
      <h1>Authors</h1>
      <p className="cms-lede">
        {authors.length} {authors.length === 1 ? "account" : "accounts"}
        {banned > 0 ? `, ${banned} banned` : ""}. Banned authors can only sign in, sign out
        and appeal.
      </p>

      {notice ? <p className="cms-flash" role="status">{notice}</p> : null}
      {error ? <p className="cms-notice" role="alert">{error}</p> : null}

      <ul className="cms-post-list cms-author-list">
        {authors.map((author) => (
          <AuthorRow key={author.id} author={author} />
        ))}
      </ul>
    </section>
  );
}

function AuthorRow({ author }: { author: AuthorSummary }) {
  const isAdmin = author.role === "admin";
  const fieldId = (name: string) => `ban-${author.id}-${name}`;

  return (
    <li>
      <p className="cms-author-name">
        {author.username}
        <span className="cms-author-google">{author.google_name}</span>
      </p>
      <p className="cms-post-meta">
        {isAdmin ? <span className="cms-status">Admin</span> : null}
        {author.banned_at ? (
          <span className="cms-status cms-status-banned">
            Banned {formatDate(author.banned_at)}
          </span>
        ) : null}
        <span>
          {author.posts} {author.posts === 1 ? "post" : "posts"}, {author.published} published
        </span>
        <span>Joined {formatDate(author.created_at)}</span>
      </p>
      {author.ban_reason ? (
        <p className="cms-author-reason">Reason: {author.ban_reason}</p>
      ) : null}

      {isAdmin ? null : author.banned_at ? (
        <form action={unbanAuthor.bind(null, author.id)} className="cms-author-actions">
          <button type="submit" className="cms-button cms-button-quiet">
            Lift ban
          </button>
        </form>
      ) : (
        <details className="cms-ban">
          <summary>Ban author</summary>
          <form action={banAuthor.bind(null, author.id)} className="cms-form cms-ban-form">
            <div className="cms-field">
              <label htmlFor={fieldId("reason")}>Reason (optional, the author sees it)</label>
              <textarea
                id={fieldId("reason")}
                name="reason"
                rows={2}
                maxLength={BAN_REASON_MAX}
              />
            </div>
            <fieldset className="cms-ban-options">
              <legend>Their posts</legend>
              <label htmlFor={fieldId("hide")}>
                <input id={fieldId("hide")} type="radio" name="content" value="hide" defaultChecked />
                Hide while banned, restore on unban
              </label>
              <label htmlFor={fieldId("unpublish")}>
                <input id={fieldId("unpublish")} type="radio" name="content" value="unpublish" />
                Unpublish all (back to draft)
              </label>
              <label htmlFor={fieldId("delete")}>
                <input id={fieldId("delete")} type="radio" name="content" value="delete" />
                Delete all permanently
              </label>
            </fieldset>
            <button type="submit" className="cms-button cms-button-danger">
              Ban {author.username}
            </button>
          </form>
        </details>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
