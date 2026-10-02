import type { MetadataRoute } from "next";
import { postHref } from "@/lib/posts/format";
import { listSitemapPosts } from "@/lib/posts/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const posts = await listSitemapPosts();
  const newest = posts[0]?.updated_at;

  return [
    { url: `${base}/`, lastModified: newest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/posts`, lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
    ...posts.map((post) => ({
      url: `${base}${postHref(post.slug)}`,
      lastModified: post.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
