/**
 * CMS pages live in the /cms route folder. When NEXT_PUBLIC_CMS_HOST is set,
 * the proxy serves them from the root of that host instead, so links drop the
 * /cms prefix. Keep every CMS URL built from here.
 */
export const CMS_ROUTE = "/cms";
export const CMS_HOST = process.env.NEXT_PUBLIC_CMS_HOST?.trim().toLowerCase() || null;

/** Link prefix: empty on the CMS host, /cms otherwise. */
export const CMS_BASE = CMS_HOST ? "" : CMS_ROUTE;
export const CMS_HOME = CMS_BASE || "/";
export const CMS_LOGIN = `${CMS_BASE}/login`;
export const CMS_AUTH_CALLBACK = `${CMS_BASE}/auth/callback`;
export const CMS_PROFILE = `${CMS_BASE}/profile`;
export const CMS_BANNED = `${CMS_BASE}/banned`;
export const CMS_AUTHORS = `${CMS_BASE}/authors`;
export const CMS_APPEALS = `${CMS_BASE}/appeals`;
export const CMS_MEDIA = `${CMS_BASE}/media`;

/** The CMS host must be `cms.` + the public site host. */
const SITE_HOST = CMS_HOST?.replace(/^cms\./, "") ?? null;

/** Link to a public page. Absolute when the CMS runs on its own host. */
export function siteHref(path: string): string {
  return SITE_HOST ? `//${SITE_HOST}${path}` : path;
}

export function isCmsRoutePath(pathname: string): boolean {
  return pathname === CMS_ROUTE || pathname.startsWith(`${CMS_ROUTE}/`);
}

/** Route file path for a CMS link. revalidatePath needs this, not the link. */
export function cmsRoute(href: string): string {
  if (!CMS_HOST) return href;
  return href === "/" ? CMS_ROUTE : `${CMS_ROUTE}${href}`;
}

export function isCmsPath(pathname: string): boolean {
  if (!CMS_BASE) return pathname.startsWith("/");
  return pathname === CMS_BASE || pathname.startsWith(`${CMS_BASE}/`);
}

/** CMS routes reachable without a session. */
export function isPublicCmsPath(pathname: string): boolean {
  return (
    pathname === CMS_LOGIN ||
    pathname.startsWith(`${CMS_BASE}/auth/`)
  );
}

/**
 * Post-login destination. Only same-site CMS pages are allowed, so a crafted
 * `next` value cannot bounce the user to another site.
 */
export function safeCmsNext(next: string | null | undefined): string {
  if (!next) return CMS_HOME;
  if (next.includes("//") || next.includes("\\")) return CMS_HOME;

  const pathname = next.split(/[?#]/, 1)[0];
  if (!isCmsPath(pathname) || isPublicCmsPath(pathname)) return CMS_HOME;

  return next;
}
