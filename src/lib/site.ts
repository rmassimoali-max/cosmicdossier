export const SITE_URL = "https://www.cosmicdossier.com";

export function canonicalUrl(pathname: string): string {
  const cleanPathname = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return `${SITE_URL}${cleanPathname}`;
}
