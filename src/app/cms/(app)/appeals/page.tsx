import type { Metadata } from "next";
import { requireAdmin } from "@/lib/cms/auth";
import { listAppeals, type AppealWithAuthor } from "@/lib/cms/appeals";
import { decideAppeal } from "../authors/actions";

export const metadata: Metadata = { title: "Appeals" };

const NOTICES: Record<string, string> = {
  accepted: "Appeal accepted. The ban is lifted.",
  rejected: "Appeal declined. The author can send another one.",
};

const ERRORS: Record<string, string> = {
  missing: "That appeal no longer exists.",
  decided: "That appeal was already decided.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppealsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] : null;
  const { pending, decided } = await listAppeals();

  return (
    <section className="cms-section">
      <h1>Appeals</h1>
      <p className="cms-lede">
        Banned authors can send one appeal at a time. Accepting lifts the ban.
      </p>

      {notice ? <p className="cms-flash" role="status">{notice}</p> : null}
      {error ? <p className="cms-notice" role="alert">{error}</p> : null}

      <h2 className="cms-subhead">Waiting ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="cms-empty">No appeals waiting.</p>
      ) : (
        <ul className="cms-post-list">
          {pending.map((appeal) => (
            <AppealRow key={appeal.id} appeal={appeal} />
          ))}
        </ul>
      )}

      {decided.length > 0 ? (
        <>
          <h2 className="cms-subhead">Recently decided</h2>
          <ul className="cms-post-list">
            {decided.map((appeal) => (
              <AppealRow key={appeal.id} appeal={appeal} />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function AppealRow({ appeal }: { appeal: AppealWithAuthor }) {
  const pending = appeal.status === "pending";
  return (
    <li>
      <p className="cms-author-name">
        {appeal.author?.username ?? "Deleted account"}
        {appeal.author ? (
          <span className="cms-author-google">{appeal.author.google_name}</span>
        ) : null}
      </p>
      <p className="cms-post-meta">
        {pending ? null : (
          <span className="cms-status">
            {appeal.status === "accepted" ? "Accepted" : "Declined"}
          </span>
        )}
        <span>Sent {formatDate(appeal.created_at)}</span>
        {appeal.decided_at ? <span>Decided {formatDate(appeal.decided_at)}</span> : null}
      </p>
      {pending && appeal.author?.ban_reason ? (
        <p className="cms-author-reason">Ban reason: {appeal.author.ban_reason}</p>
      ) : null}
      <p className="cms-appeal-message">{appeal.message}</p>
      {pending ? (
        <div className="cms-author-actions">
          <form action={decideAppeal.bind(null, appeal.id, true)}>
            <button type="submit" className="cms-button">
              Accept and lift ban
            </button>
          </form>
          <form action={decideAppeal.bind(null, appeal.id, false)}>
            <button type="submit" className="cms-button cms-button-quiet">
              Decline
            </button>
          </form>
        </div>
      ) : null}
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
