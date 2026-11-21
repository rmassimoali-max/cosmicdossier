import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://www.cosmicdossier.com";
const SITEMAP_PATH = "public/sitemap.xml";

const ARTICLE_FILES = [
  "src/lib/articles.ts",
  "src/lib/personalityArticles.ts",
  "src/lib/testArticles.ts",
  "src/lib/standaloneTestArticles.ts",
];

function getArticleSlugs(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const pattern = /slug: "([^"]+)"/g;
  const slugs = [];

  for (const match of source.matchAll(pattern)) {
    slugs.push(match[1]);
  }

  return slugs;
}

const articleSlugs = new Set();

for (const file of ARTICLE_FILES) {
  for (const slug of getArticleSlugs(file)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Invalid article slug: ${slug}`);
    }

    articleSlugs.add(slug);
  }
}

if (articleSlugs.size === 0) {
  throw new Error("No article slugs found. Sitemap not modified.");
}

const originalXml = fs.readFileSync(SITEMAP_PATH, "utf8");

const existingUrls = [...originalXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (existingUrls.length < 100) {
  throw new Error("Existing sitemap appears incomplete. Sitemap not modified.");
}

const staticUrls = existingUrls.filter((url) => !url.startsWith(`${SITE_URL}/articles/`));

const allUrls = new Set(staticUrls);

allUrls.add(`${SITE_URL}/articles`);

for (const slug of articleSlugs) {
  allUrls.add(`${SITE_URL}/articles/${slug}`);
}

if (allUrls.size < 100) {
  throw new Error("Generated sitemap unexpectedly small. Sitemap not modified.");
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...allUrls].sort().map((url) => `  <url><loc>${url}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(SITEMAP_PATH, xml, "utf8");

console.log(`Found ${articleSlugs.size} unique articles.`);
console.log(`Preserved ${staticUrls.length} non-article URLs.`);
console.log(`Generated ${allUrls.size} sitemap URLs.`);
