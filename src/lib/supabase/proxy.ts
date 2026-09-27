import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { CMS_LOGIN, isCmsPath, isPublicCmsPath } from "@/lib/cms/paths";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database, "snippets">(
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: "snippets" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Refresh the auth session. Do not place logic between createServerClient
  // and getClaims().
  const { data } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  if (!isCmsPath(pathname)) {
    return supabaseResponse;
  }

  if (!data?.claims && !isPublicCmsPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = CMS_LOGIN;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    const redirect = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirect;
  }

  supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  return supabaseResponse;
}
