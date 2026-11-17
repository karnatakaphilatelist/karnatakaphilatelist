import type { Metadata } from "next";
import { LEARN_OG_IMAGE as OG_IMAGE } from "@/lib/learn-articles";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/learn/ArticleView";
import { ARTICLES, getArticle } from "@/lib/learn-articles";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const path = `/learn/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: path,
      siteName: "Philatrail",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function LearnArticlePage({
  params,
}: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return <ArticleView article={article} />;
}
