import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleView } from "@/components/learn/ArticleView";
import { LearnHub } from "@/components/learn/LearnHub";
import { BOOKLET_OUTLETS } from "@/lib/booklet";
import { ARTICLES, getArticle } from "@/lib/learn-articles";

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

afterEach(cleanup);

describe("learn articles", () => {
  it("each has a unique slug, a source to check and a next step", () => {
    const slugs = new Set(ARTICLES.map((article) => article.slug));
    expect(slugs.size).toBe(ARTICLES.length);
    for (const article of ARTICLES) {
      expect(article.sources.length).toBeGreaterThan(0);
      for (const source of article.sources)
        expect(source.url).toMatch(/^https:\/\//);
      expect(article.next.href).toMatch(/^\//);
    }
  });

  it("next steps point at real articles or the map", () => {
    for (const article of ARTICLES) {
      const href = article.next.href;
      if (href.startsWith("/learn/"))
        expect(getArticle(href.replace("/learn/", ""))).toBeDefined();
      else expect(href).toBe("/explore");
    }
  });

  it("never uses words the copy brief rules out", () => {
    const text = JSON.stringify(ARTICLES).toLowerCase();
    for (const banned of [
      "official partner",
      "endorsed",
      "authorised",
      "authorized by",
    ])
      expect(text).not.toContain(banned);
  });
});

describe("LearnHub", () => {
  it("links to every article", () => {
    render(<LearnHub />);
    for (const article of ARTICLES) {
      const link = screen
        .getAllByRole("link")
        .find((a) => a.getAttribute("href") === `/learn/${article.slug}`);
      expect(link).toBeDefined();
    }
  });
});

describe("ArticleView", () => {
  it("shows the outlets with phone and email on the booklet article", () => {
    render(<ArticleView article={getArticle("get-the-booklet")!} />);
    for (const outlet of BOOKLET_OUTLETS) {
      expect(
        screen
          .getByRole("link", { name: `Email ${outlet.name}` })
          .getAttribute("href")
      ).toBe(`mailto:${outlet.email}`);
    }
  });

  it("can be shared and says it is independent", () => {
    render(<ArticleView article={getArticle("what-is-philately")!} />);
    expect(
      screen.getByRole("button", { name: "Share this article" })
    ).toBeTruthy();
    expect(screen.getByText(/independent project/i)).toBeTruthy();
  });
});
