import type { Metadata } from "next";
import { requireAdmin } from "@/lib/cms/auth";
import {
  listDecisions,
  listPendingAppeals,
  type AppealWithAuthor,
  type Decision,
} from "@/lib/cms/appeals";
import type { BanContentAction } from "@/lib/supabase/database.types";
import { decideAppeal } from "../authors/actions";
import { LocalTime } from "../posts/local-time";

export const metadata: Metadata = { title: "Appeals" };

const NOTICES: Record<string, string> = {
  accepted: "Appeal accepted. The ban is lifted.",
  rejected: "Appeal declined. The author can send another one.",
};

const ERRORS: Record<string, string> = {
  missing: "That appeal no longer exists.",
  decided: "That appeal was already decided.",
};

const CONTENT_LABELS: Record<BanContentAction, string> = {
  hide: "Posts hidden",
  unpublish: "Posts unpublished",
  delete: "Posts deleted",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppealsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] : null;
  const [pending, decisions] = await Promise.all([listPendingAppeals(), listDecisions()]);

  return (
    <section className="cms-section">
      <h1>Appeals</h1>
      <p className="cms-lede">
        Banned authors can send one appeal at a time. Accepting lifts the ban. Recently
        decided lists bans, lifted bans and decided appeals, newest first.
      </p>

      {notice ? <p className="cms-flash" role="status">{notice}</p> : null}
      {error ? <p className="cms-notice" role="alert">{error}</p> : null}

      <h2 className="cms-subhead">Waiting ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="cms-empty">No appeals waiting.</p>
      ) : (
        <ul className="cms-post-list">
          {pending.map((appeal) => (
            <PendingAppealRow key={appeal.id} appeal={appeal} />
          ))}
        </ul>
      )}

      {decisions.length > 0 ? (
        <>
          <h2 className="cms-subhead">Recently decided</h2>
          <ul className="cms-post-list">
            {decisions.map((decision) => (
              <DecisionRow key={decision.id} decision={decision} />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function AuthorName({ author }: { author: { username: string; google_name: string } | null }) {
  return (
    <p className="cms-author-name">
      {author?.username ?? "Deleted account"}
      {author ? <span className="cms-author-google">{author.google_name}</span> : null}
    </p>
  );
}

function PendingAppealRow({ appeal }: { appeal: AppealWithAuthor }) {
  return (
    <li>
      <AuthorName author={appeal.author} />
      <p className="cms-post-meta">
        <span>Sent {formatDate(appeal.created_at)}</span>
      </p>
      {appeal.author?.ban_reason ? (
        <p className="cms-author-reason">Ban reason: {appeal.author.ban_reason}</p>
      ) : null}
      <p className="cms-appeal-message">{appeal.message}</p>
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
    </li>
  );
}

function DecisionRow({ decision }: { decision: Decision }) {
  const banCount =
    decision.banCount > 1 ? <span>Banned {decision.banCount} times</span> : null;

  if (decision.kind === "ban") {
    return (
      <li>
        <AuthorName author={decision.author} />
        <p className="cms-post-meta">
          <span className="cms-status cms-status-banned">Banned</span>
          <span>
            <LocalTime iso={decision.at} />
          </span>
          {decision.contentAction ? <span>{CONTENT_LABELS[decision.contentAction]}</span> : null}
          {decision.active ? <span>Still banned</span> : null}
          {banCount}
        </p>
        {decision.reason ? <p className="cms-author-reason">Reason: {decision.reason}</p> : null}
      </li>
    );
  }

  if (decision.kind === "unban") {
    return (
      <li>
        <AuthorName author={decision.author} />
        <p className="cms-post-meta">
          <span className="cms-status">Ban lifted</span>
          <span>
            <LocalTime iso={decision.at} />
          </span>
          {banCount}
        </p>
      </li>
    );
  }

  return (
    <li>
      <AuthorName author={decision.author} />
      <p className="cms-post-meta">
        <span className="cms-status">
          {decision.status === "accepted" ? "Appeal accepted" : "Appeal declined"}
        </span>
        <span>
          Sent <LocalTime iso={decision.sentAt} />
        </span>
        <span>
          Decided <LocalTime iso={decision.at} />
        </span>
        {banCount}
      </p>
      <p className="cms-appeal-message">{decision.message}</p>
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
