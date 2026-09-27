import Image from "next/image";
import Link from "next/link";
import { requireCmsProfile } from "@/lib/cms/auth";
import { CMS_BASE, CMS_PROFILE } from "@/lib/cms/paths";
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
        <div className="cms-header-main">
          <p className="cms-logo">
            <Link href={CMS_BASE}>Snippets</Link>
            <span className="cms-logo-tag">CMS</span>
          </p>
          <nav className="cms-header-nav" aria-label="CMS">
            <Link href={CMS_BASE}>Posts</Link>
            <Link href="/">View site</Link>
          </nav>
        </div>
        <div className="cms-header-nav">
          <Link href={CMS_PROFILE} className="cms-user">
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
          </Link>
          {profile.role === "admin" ? <span className="cms-badge">Admin</span> : null}
          <form action={signOut}>
            <button type="submit" className="cms-button cms-button-quiet">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="cms-main">{children}</main>
    </>
  );
}
