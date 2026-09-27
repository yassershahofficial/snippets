/**
 * CMS routes live under /cms for now. Keep every CMS URL built from here so the
 * later move to its own subdomain only touches this file and the proxy.
 */
export const CMS_BASE = "/cms";
export const CMS_LOGIN = `${CMS_BASE}/login`;
export const CMS_AUTH_CALLBACK = `${CMS_BASE}/auth/callback`;
export const CMS_PROFILE = `${CMS_BASE}/profile`;

export function isCmsPath(pathname: string): boolean {
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
  if (!next) return CMS_BASE;
  if (next.includes("//") || next.includes("\\")) return CMS_BASE;

  const pathname = next.split(/[?#]/, 1)[0];
  if (!isCmsPath(pathname) || isPublicCmsPath(pathname)) return CMS_BASE;

  return next;
}
