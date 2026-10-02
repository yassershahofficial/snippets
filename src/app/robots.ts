import type { MetadataRoute } from "next";
import { CMS_ROUTE } from "@/lib/cms/paths";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: CMS_ROUTE },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
