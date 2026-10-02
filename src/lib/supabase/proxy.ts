import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  CMS_HOST,
  CMS_LOGIN,
  CMS_ROUTE,
  isCmsRoutePath,
  isPublicCmsPath,
} from "@/lib/cms/paths";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  let authHeaders: Record<string, string> = {};

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
          authHeaders = headers;
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
  const onCmsHost =
    CMS_HOST !== null && request.headers.get("host")?.toLowerCase() === CMS_HOST;

  // Only auth cookies and their headers may be copied: the next() response
  // also carries internal headers that would break a redirect or rewrite.
  const withAuth = (response: NextResponse) => {
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    Object.entries(authHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };

  if (!onCmsHost) {
    if (!isCmsRoutePath(pathname)) return supabaseResponse;

    if (CMS_HOST) {
      const target = new URL(`${request.nextUrl.protocol}//${CMS_HOST}`);
      target.pathname = pathname.slice(CMS_ROUTE.length) || "/";
      target.search = search;
      return NextResponse.redirect(target);
    }
  } else if (isCmsRoutePath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.slice(CMS_ROUTE.length) || "/";
    return withAuth(NextResponse.redirect(target));
  }

  if (!data?.claims && !isPublicCmsPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = CMS_LOGIN;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return withAuth(NextResponse.redirect(loginUrl));
  }

  if (onCmsHost) {
    const target = request.nextUrl.clone();
    target.pathname = pathname === "/" ? CMS_ROUTE : `${CMS_ROUTE}${pathname}`;
    return withAuth(NextResponse.rewrite(target, { request }));
  }

  supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  return supabaseResponse;
}
