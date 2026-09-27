import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSignedInProfile } from "@/lib/cms/auth";
import { getLatestAppeal } from "@/lib/cms/appeals";
import { CMS_BASE } from "@/lib/cms/paths";
import { signOut } from "../actions";
import { AppealForm } from "./appeal-form";

export const metadata: Metadata = { title: "Account banned" };

export default async function BannedPage() {
  const profile = await requireSignedInProfile();
  if (!profile.banned_at) redirect(CMS_BASE);

  const appeal = await getLatestAppeal(profile.id);
  const pending = appeal?.status === "pending";
  const declined = appeal?.status === "rejected";

  return (
    <main className="cms-auth cms-banned">
      <p className="cms-logo">
        <Link href="/">Snippets</Link>
      </p>
      <h1>Your author account is banned</h1>
      <p className="cms-lede">
        Since {formatDate(profile.banned_at)} you can&apos;t write, edit or reply in the CMS,
        and your posts are hidden from readers. They come back if the ban is lifted.
      </p>

      {profile.ban_reason ? (
        <div className="cms-banned-reason">
          <p className="cms-banned-label">Reason from the admin</p>
          <p>{profile.ban_reason}</p>
        </div>
      ) : null}

      {pending ? (
        <p className="cms-flash" role="status">
          Your appeal from {formatDate(appeal.created_at)} is waiting for the admin. You&apos;ll
          get access back here if it&apos;s accepted.
        </p>
      ) : (
        <>
          {declined && appeal.decided_at ? (
            <p className="cms-notice">
              Your last appeal was declined on {formatDate(appeal.decided_at)}. You can send
              another one.
            </p>
          ) : null}
          <AppealForm />
        </>
      )}

      <form action={signOut}>
        <button type="submit" className="cms-button cms-button-quiet">
          Sign out
        </button>
      </form>
    </main>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
