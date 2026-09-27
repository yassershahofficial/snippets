import type { Metadata } from "next";
import { requireCmsProfile } from "@/lib/cms/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CmsDashboardPage() {
  const profile = await requireCmsProfile();
  const isAdmin = profile.role === "admin";

  return (
    <section className="cms-section">
      <h1>Hello, {profile.username}</h1>
      <p className="cms-lede">
        {isAdmin
          ? "You review, publish and feature posts."
          : "Write drafts and submit them for review. An admin publishes them."}
      </p>

      <dl className="cms-facts">
        <div>
          <dt>Username</dt>
          <dd>{profile.username}</dd>
        </div>
        <div>
          <dt>Google name</dt>
          <dd>{profile.google_name}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{isAdmin ? "Admin" : "Author"}</dd>
        </div>
      </dl>

      <p className="cms-muted">Posts and the editor arrive in the next step.</p>
    </section>
  );
}
