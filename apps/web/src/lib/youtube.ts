/** Extract a YouTube video ID from common watch/share/embed URLs. */
export function youtubeVideoId(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null

  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  const allowed = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'youtube-nocookie.com'])
  if (!allowed.has(host)) return null

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && /^[\w-]{11}$/.test(id) ? id : null
  }

  if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
    const id = url.pathname.split('/').filter(Boolean)[1]
    return id && /^[\w-]{11}$/.test(id) ? id : null
  }

  const v = url.searchParams.get('v')
  return v && /^[\w-]{11}$/.test(v) ? v : null
}

export function youtubeEmbedUrl(raw: string | null | undefined): string | null {
  const id = youtubeVideoId(raw)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
