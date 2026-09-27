import Image from "next/image";
import Link from "next/link";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_BASE } from "@/lib/cms/paths";
import { signOut } from "../actions";

export default async function CmsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireCmsProfile();

  return (
    <>
      <header className="cms-header">
        <p className="cms-logo">
          <Link href={CMS_BASE}>Snippets</Link>
          <span className="cms-logo-tag">CMS</span>
        </p>
        <nav className="cms-header-nav" aria-label="Account">
          <Link href="/" className="cms-header-link">
            View site
          </Link>
          <span className="cms-user">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={28}
                height={28}
                className="cms-avatar"
              />
            ) : null}
            <span>{profile.username}</span>
            {profile.role === "admin" ? (
              <span className="cms-badge">Admin</span>
            ) : null}
          </span>
          <form action={signOut}>
            <button type="submit" className="cms-button cms-button-quiet">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main className="cms-main">{children}</main>
    </>
  );
}
