import { describe, expect, test } from "bun:test";
import { articles } from "./articles";
import { STANDALONE_TEST_ARTICLES } from "./standaloneTestArticles";
import { TEST_ARTICLES } from "./testArticles";
import { canonicalUrl } from "./site";

describe("Dark Triad article registry SEO", () => {
  test("the primary article is registered exactly once across article registries", () => {
    const all = [...articles, ...STANDALONE_TEST_ARTICLES];
    const matches = all.filter((article) => article.slug === "understanding-the-dark-triad");
    expect(matches).toHaveLength(1);
  });

  test("the redundant test-article registry entry is removed", () => {
    expect(
      TEST_ARTICLES.filter((article) => article.slug === "understanding-the-dark-triad"),
    ).toHaveLength(0);
  });

  test("the retained article has unique descriptive SEO metadata", () => {
    const article = STANDALONE_TEST_ARTICLES.find(
      (item) => item.slug === "understanding-the-dark-triad",
    );
    expect(article?.title).toBe("The Dark Triad: Traits, Research and Meaning");
    expect(article?.excerpt).toContain("Machiavellianism");
    expect(article?.excerpt).toContain("diagnosis");
  });

  test("the canonical URL uses the production www host", () => {
    expect(canonicalUrl("/articles/understanding-the-dark-triad")).toBe(
      "https://www.cosmicdossier.com/articles/understanding-the-dark-triad",
    );
  });

  test("the retained article distinguishes dimensions and clinical distinctions", () => {
    const article = STANDALONE_TEST_ARTICLES.find(
      (item) => item.slug === "understanding-the-dark-triad",
    );
    const text = article?.content.join("\n") ?? "";
    expect(text).toContain("narcissistic personality disorder");
    expect(text).toContain("not a clinical instrument");
  });
});
