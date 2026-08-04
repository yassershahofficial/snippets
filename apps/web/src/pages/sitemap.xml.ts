import type { APIRoute } from 'astro'
import { getAllAuthors, getAllTags, getPublishedPosts } from '../lib/payload'

function siteOrigin(): string {
  return (import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '')
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toLastmod(iso?: string | null): string | undefined {
  if (!iso) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function urlEntry(loc: string, lastmod?: string): string {
  const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`]
  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`)
  lines.push(`  </url>`)
  return lines.join('\n')
}

export const GET: APIRoute = async () => {
  const origin = siteOrigin()

  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = []
  let authors: Awaited<ReturnType<typeof getAllAuthors>> = []
  let tags: Awaited<ReturnType<typeof getAllTags>> = []

  try {
    ;[posts, authors, tags] = await Promise.all([
      getPublishedPosts(),
      getAllAuthors(),
      getAllTags(),
    ])
  } catch {
    // Still emit home so crawlers get a valid document during CMS outages.
  }

  const entries: string[] = [urlEntry(`${origin}/`)]

  for (const post of posts) {
    if (post.seo?.noIndex) continue
    const lastmod = toLastmod(post.updatedAt || post.publishedAt)
    entries.push(urlEntry(`${origin}/posts/${post.slug}`, lastmod))
  }

  for (const author of authors) {
    entries.push(urlEntry(`${origin}/authors/${author.slug}`, toLastmod(author.updatedAt)))
  }

  for (const tag of tags) {
    entries.push(urlEntry(`${origin}/tags/${tag.slug}`, toLastmod(tag.updatedAt)))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
