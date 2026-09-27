import type { Metadata } from "next";
import { requireCmsProfile } from "@/lib/cms/auth";
import { UsernameForm } from "./username-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await requireCmsProfile();

  return (
    <section className="cms-section cms-narrow">
      <h1>Profile</h1>
      <p className="cms-lede">
        Readers see your username and Google photo on your posts.
      </p>

      <UsernameForm username={profile.username} />

      <dl className="cms-facts">
        <div>
          <dt>Google name</dt>
          <dd>{profile.google_name}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{profile.role === "admin" ? "Admin" : "Author"}</dd>
        </div>
      </dl>
      <p className="cms-muted">
        Your Google name and photo update from your Google account each time
        you sign in.
      </p>
    </section>
  );
}
