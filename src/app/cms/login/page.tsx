import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCmsSession } from "@/lib/cms/auth";
import { safeCmsNext } from "@/lib/cms/paths";
import { signInWithGoogle, signOut } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled. Try again whenever you're ready.",
  oauth: "Google sign-in didn't finish. Please try again.",
  profile:
    "You're signed in, but your author profile couldn't be set up. Please try again.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CmsLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeCmsNext(typeof params.next === "string" ? params.next : null);
  const error =
    typeof params.error === "string" ? (ERRORS[params.error] ?? null) : null;

  const { userId, profile } = await getCmsSession();
  if (profile) redirect(next);

  return (
    <main className="cms-auth">
      <p className="cms-logo">
        <Link href="/">Snippets</Link>
      </p>
      <h1>Write for Snippets</h1>
      <p className="cms-lede">
        Sign in with Google to write drafts and submit them for review.
      </p>

      {error ? (
        <p className="cms-notice" role="alert">
          {error}
        </p>
      ) : null}

      {userId ? (
        <>
          <p className="cms-notice" role="alert">
            This account can&apos;t open the CMS. Only Google sign-in is
            accepted. Sign out, then continue with Google.
          </p>
          <form action={signOut}>
            <button type="submit" className="cms-button">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="cms-button">
            Continue with Google
          </button>
        </form>
      )}

      <p className="cms-back">
        <Link href="/">Back to reading</Link>
      </p>
    </main>
  );
}
