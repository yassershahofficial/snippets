"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CMS_AUTH_CALLBACK, CMS_LOGIN, safeCmsNext } from "@/lib/cms/paths";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeCmsNext(String(formData.get("next") ?? ""));
  const callback = new URL(CMS_AUTH_CALLBACK, await requestOrigin());
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      // Google otherwise reuses its signed-in account silently, so signing out
      // here could never switch accounts.
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    if (error) console.error("signInWithOAuth", error.message);
    redirect(`${CMS_LOGIN}?error=oauth`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  // Local scope: end this browser's session only. Auth is shared with other
  // apps and devices.
  await supabase.auth.signOut({ scope: "local" });
  redirect(CMS_LOGIN);
}
