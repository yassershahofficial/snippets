import type { Author, Badge, Post, Tag } from './payload'

type JsonLd = Record<string, unknown>

export function siteOrigin(): string {
  return (import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '')
}

function publisherOrganization(origin: string): JsonLd {
  return {
    '@type': 'Organization',
    name: 'SNIPPETS',
    url: origin,
  }
}

function isGithubUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return host === 'github.com' || host.endsWith('.github.com')
  } catch {
    return false
  }
}

function personNodes(authors: Author[], origin: string): JsonLd[] {
  return authors.map((author) => {
    const sameAs = (author.sameAs ?? []).map((entry) => entry.url).filter(Boolean)
    return {
      '@type': 'Person',
      name: author.name,
      url: `${origin}/authors/${author.slug}`,
      ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
      ...(author.organization ? { worksFor: { '@type': 'Organization', name: author.organization } } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    }
  })
}

function breadcrumbs(origin: string, pageUrl: string, title: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${origin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: pageUrl,
      },
    ],
  }
}

export function buildEssayJsonLd(input: {
  post: Post
  authors: Author[]
  tags: Tag[]
  pageUrl: string
  description?: string
  imageUrl?: string
}): JsonLd[] {
  const { post, authors, tags, pageUrl, description, imageUrl } = input
  const origin = siteOrigin()
  const authorsLd = personNodes(authors, origin)
  const tagNames = tags.map((t) => t.name).filter(Boolean)

  const blogPosting: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    publisher: publisherOrganization(origin),
    ...(description ? { description } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(authorsLd.length ? { author: authorsLd } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(tagNames.length ? { keywords: tagNames.join(', ') } : {}),
  }

  return [breadcrumbs(origin, pageUrl, post.title), blogPosting]
}

export function buildShowcaseJsonLd(input: {
  post: Post
  authors: Author[]
  badges: Badge[]
  pageUrl: string
  description?: string
}): JsonLd[] {
  const { post, authors, badges, pageUrl, description } = input
  const origin = siteOrigin()
  const ctaLinks = (post.ctaLinks ?? []).filter((link) => link?.label && link?.url)
  const github = ctaLinks.find((link) => isGithubUrl(link.url))
  const live = ctaLinks.find((link) => !isGithubUrl(link.url))
  const badgeNames = badges.map((b) => b.name).filter(Boolean)
  const authorsLd = personNodes(authors, origin)

  const techArticle: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    mainEntityOfPage: pageUrl,
    url: live?.url || pageUrl,
    ...(description ? { description } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(authorsLd.length ? { author: authorsLd } : {}),
    ...(badgeNames.length ? { keywords: badgeNames.join(', ') } : {}),
    ...(github ? { codeRepository: github.url } : {}),
  }

  const graph: JsonLd[] = [breadcrumbs(origin, pageUrl, post.title), techArticle]

  if (live) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: post.title,
      url: live.url,
      ...(description ? { description } : {}),
      ...(github ? { codeRepository: github.url } : {}),
      ...(badgeNames.length
        ? {
            applicationCategory: 'DeveloperApplication',
            keywords: badgeNames.join(', '),
          }
        : { applicationCategory: 'DeveloperApplication' }),
      ...(authorsLd.length ? { author: authorsLd } : {}),
    })
  }

  return graph
}

export function buildSnippetJsonLd(input: {
  post: Post
  authors: Author[]
  pageUrl: string
  description?: string
}): JsonLd[] {
  const { post, authors, pageUrl, description } = input
  const origin = siteOrigin()
  const authorsLd = personNodes(authors, origin)
  const summary = post.summary?.trim() || description

  const techArticle: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    ...(summary ? { description: summary } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(authorsLd.length ? { author: authorsLd } : {}),
  }

  return [breadcrumbs(origin, pageUrl, post.title), techArticle]
}

export function jsonLdScriptContent(nodes: JsonLd[]): string {
  return JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
}
