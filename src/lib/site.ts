export const SITE_URL = "https://www.cosmicdossier.com";

/**
 * Build the canonical URL for a page from its pathname only.
 * Drops any query string (?r=..., ?utm_source=...) and hash, and removes
 * the trailing slash except for the homepage.
 */
export function canonicalUrl(pathname: string): string {
  const clean = (pathname.split("?")[0] ?? "").split("#")[0] ?? "";
  const trimmed = clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
  return `${SITE_URL}${trimmed === "/" ? "/" : trimmed}`;
}
