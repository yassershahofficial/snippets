import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CMS_LOGIN, safeCmsNext } from "@/lib/cms/paths";

/** nextUrl.origin can be the internal host when the proxy rewrote the request. */
function publicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = publicOrigin(request);
  const code = searchParams.get("code");
  const next = safeCmsNext(searchParams.get("next"));

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`${CMS_LOGIN}?error=${reason}`, origin));

  if (!code) {
    return fail(searchParams.get("error") === "access_denied" ? "cancelled" : "oauth");
  }

  const supabase = await createClient();
  const exchange = await supabase.auth.exchangeCodeForSession(code);
  if (exchange.error) {
    console.error("exchangeCodeForSession", exchange.error.message);
    return fail("oauth");
  }

  const sync = await supabase.rpc("sync_profile");
  if (sync.error) {
    console.error("sync_profile", sync.error.message);
    return fail("profile");
  }

  return NextResponse.redirect(new URL(next, origin));
}
