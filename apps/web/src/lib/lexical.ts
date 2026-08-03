type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  format?: number
  language?: string
  listType?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  value?: unknown
  relationTo?: string
}

type UploadDoc = {
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_CODE = 1 << 4

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Browser-facing Payload origin (not the Docker-internal cms hostname). */
function getPublicPayloadOrigin(): string {
  const fromEnv =
    process.env.PUBLIC_PAYLOAD_URL ||
    import.meta.env.PUBLIC_PAYLOAD_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    import.meta.env.PAYLOAD_PUBLIC_SERVER_URL

  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '')
  }

  const internal =
    process.env.PAYLOAD_URL || import.meta.env.PAYLOAD_URL || 'http://localhost:3000'

  return String(internal)
    .replace(/\/$/, '')
    .replace(/^http:\/\/cms(?::\d+)?/i, 'http://localhost:3000')
}

export function absolutizeMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) {
    // Rewrite docker-internal host if it ever appears in stored URLs
    return url.replace(/^http:\/\/cms(?::\d+)?/i, 'http://localhost:3000')
  }
  const origin = getPublicPayloadOrigin()
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

function renderText(node: LexicalNode): string {
  let text = escapeHtml(node.text ?? '')
  const format = node.format ?? 0
  if (format & IS_CODE) text = `<code>${text}</code>`
  if (format & IS_BOLD) text = `<strong>${text}</strong>`
  if (format & IS_ITALIC) text = `<em>${text}</em>`
  return text
}

function renderChildren(nodes: LexicalNode[] | undefined): string {
  if (!nodes?.length) return ''
  return nodes.map(renderNode).join('')
}

function renderUpload(node: LexicalNode): string {
  if (!node.value || typeof node.value !== 'object') return ''
  const doc = node.value as UploadDoc
  const url = absolutizeMediaUrl(doc.url)
  if (!url) return ''

  const fieldAlt = typeof node.fields?.alt === 'string' ? node.fields.alt : ''
  const alt = escapeHtml(fieldAlt || doc.alt || doc.filename || '')
  const mime = doc.mimeType ?? ''

  if (mime && !mime.startsWith('image/')) {
    const label = escapeHtml(doc.filename || 'Download file')
    return `<p><a href="${escapeHtml(url)}" rel="noopener noreferrer">${label}</a></p>`
  }

  const width = doc.width ? ` width="${escapeHtml(String(doc.width))}"` : ''
  const height = doc.height ? ` height="${escapeHtml(String(doc.height))}"` : ''
  const img = `<img src="${escapeHtml(url)}" alt="${alt}"${width}${height} loading="lazy" decoding="async" />`
  return alt
    ? `<figure class="prose-figure">${img}<figcaption>${alt}</figcaption></figure>`
    : `<figure class="prose-figure">${img}</figure>`
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'root':
      return renderChildren(node.children)
    case 'paragraph':
      return `<p>${renderChildren(node.children)}</p>`
    case 'heading': {
      const tag = ['h1', 'h2', 'h3', 'h4'].includes(node.tag ?? '') ? (node.tag as string) : 'h2'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }
    case 'listitem':
      return `<li>${renderChildren(node.children)}</li>`
    case 'quote':
      return `<blockquote>${renderChildren(node.children)}</blockquote>`
    case 'link': {
      const url = typeof node.fields?.url === 'string' ? node.fields.url : '#'
      return `<a href="${escapeHtml(url)}">${renderChildren(node.children)}</a>`
    }
    case 'code': {
      const code = (node.children ?? []).map((child) => child.text ?? '').join('')
      return `<pre><code>${escapeHtml(code)}</code></pre>`
    }
    case 'upload':
      return renderUpload(node)
    case 'horizontalrule':
      return '<hr />'
    case 'text':
      return renderText(node)
    case 'linebreak':
      return '<br />'
    default:
      return renderChildren(node.children)
  }
}

export function lexicalToHtml(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const root = (body as { root?: LexicalNode }).root
  if (!root) return ''
  return renderNode(root)
}

function extractPlainText(node: LexicalNode | null | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (!node.children?.length) return ''
  return node.children.map(extractPlainText).join(' ')
}

/** Plain text from Lexical body for card previews / hooks. */
export function lexicalToPlainText(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const root = (body as { root?: LexicalNode }).root
  if (!root) return ''
  return extractPlainText(root).replace(/\s+/g, ' ').trim()
}

/** Short teaser ending with an ellipsis when truncated. */
export function excerptText(text: string, maxLength = 140): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= maxLength) return cleaned
  const sliced = cleaned.slice(0, maxLength).replace(/\s+\S*$/, '').trimEnd()
  return `${sliced}...`
}
