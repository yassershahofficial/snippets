export type PayloadListResponse<T> = {
  docs: T[]
  totalDocs: number
}

export type Media = {
  id: string
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

export type Author = {
  id: string
  name: string
  slug: string
  bio?: string | null
  credentials?: string | null
  jobTitle?: string | null
  organization?: string | null
  sameAs?: { url: string }[] | null
  avatar?: Media | string | null
}

export type Tag = {
  id: string
  name: string
  slug: string
  description?: string | null
}

export type Post = {
  id: string
  title: string
  slug: string
  layout: 'essay' | 'showcase' | 'snippet'
  body: unknown
  readingTime?: number | null
  publishedAt?: string | null
  updatedAt?: string
  authors?: (Author | string)[] | null
  tags?: (Tag | string)[] | null
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    canonical?: string | null
    ogImage?: Media | string | null
    noIndex?: boolean | null
  } | null
}

function getPayloadUrl(): string {
  return (
    process.env.PAYLOAD_URL ||
    import.meta.env.PAYLOAD_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

async function payloadFetch<T>(path: string): Promise<T> {
  const url = `${getPayloadUrl()}${path}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Payload request failed (${response.status}): ${url}`)
  }

  return response.json() as Promise<T>
}

export async function getPublishedPosts(): Promise<Post[]> {
  const data = await payloadFetch<PayloadListResponse<Post>>(
    '/api/posts?where[_status][equals]=published&depth=1&limit=100&sort=-publishedAt',
  )
  return data.docs
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const data = await payloadFetch<PayloadListResponse<Post>>(
    `/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published&depth=2&limit=1`,
  )
  return data.docs[0] ?? null
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const data = await payloadFetch<PayloadListResponse<Author>>(
    `/api/authors?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1`,
  )
  return data.docs[0] ?? null
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const data = await payloadFetch<PayloadListResponse<Tag>>(
    `/api/tags?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
  )
  return data.docs[0] ?? null
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const data = await payloadFetch<PayloadListResponse<Post>>(
    `/api/posts?where[authors][contains]=${encodeURIComponent(authorId)}&where[_status][equals]=published&depth=1&limit=50&sort=-publishedAt`,
  )
  return data.docs
}

export async function getPostsByTag(tagId: string): Promise<Post[]> {
  const data = await payloadFetch<PayloadListResponse<Post>>(
    `/api/posts?where[tags][contains]=${encodeURIComponent(tagId)}&where[_status][equals]=published&depth=1&limit=50&sort=-publishedAt`,
  )
  return data.docs
}

export async function getAllAuthors(): Promise<Author[]> {
  const data = await payloadFetch<PayloadListResponse<Author>>('/api/authors?limit=100')
  return data.docs
}

export async function getAllTags(): Promise<Tag[]> {
  const data = await payloadFetch<PayloadListResponse<Tag>>('/api/tags?limit=100')
  return data.docs
}
