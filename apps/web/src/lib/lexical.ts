import katex from 'katex'
import { resolveFormulaLatex } from './formulaMath'
import { HIGHLIGHT_STATE_KEY, HIGHLIGHT_STATE_VALUE } from './textStateConfig'

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
  $?: Record<string, string>
}

type UploadDoc = {
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

export type TocItem = {
  id: string
  text: string
  depth: 2 | 3
}

export type LexicalHtmlOptions = {
  /** Wrap code blocks for copy UI. Defaults to true. */
  codeCopyable?: boolean
}

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4
const IS_SUBSCRIPT = 1 << 5
const IS_SUPERSCRIPT = 1 << 6

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
    return url.replace(/^http:\/\/cms(?::\d+)?/i, 'http://localhost:3000')
  }
  const origin = getPublicPayloadOrigin()
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || 'section'
}

class HeadingIdAllocator {
  private seen = new Map<string, number>()

  next(text: string): string {
    const base = slugifyHeading(text)
    const count = this.seen.get(base) ?? 0
    this.seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }
}

function extractPlainText(node: LexicalNode | null | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (node.type === 'block' && node.fields?.blockType === 'formula') {
    return typeof node.fields.latex === 'string' ? node.fields.latex : ''
  }
  if (!node.children?.length) return ''
  return node.children.map(extractPlainText).join(' ')
}

function hasHighlight(node: LexicalNode): boolean {
  return node.$?.[HIGHLIGHT_STATE_KEY] === HIGHLIGHT_STATE_VALUE
}

function renderText(node: LexicalNode): string {
  let text = escapeHtml(node.text ?? '')
  const format = node.format ?? 0
  if (format & IS_CODE) text = `<code>${text}</code>`
  if (format & IS_BOLD) text = `<strong>${text}</strong>`
  if (format & IS_ITALIC) text = `<em>${text}</em>`
  if (format & IS_UNDERLINE) text = `<u>${text}</u>`
  if (format & IS_STRIKETHROUGH) text = `<s>${text}</s>`
  if (format & IS_SUBSCRIPT) text = `<sub>${text}</sub>`
  if (format & IS_SUPERSCRIPT) text = `<sup>${text}</sup>`
  if (hasHighlight(node)) text = `<mark class="text-highlight">${text}</mark>`
  return text
}

function renderChildren(
  nodes: LexicalNode[] | undefined,
  ctx: RenderContext,
): string {
  if (!nodes?.length) return ''
  return nodes.map((n) => renderNode(n, ctx)).join('')
}

type RenderContext = {
  ids: HeadingIdAllocator
  options: LexicalHtmlOptions
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

function renderCodeBlockFromParts(
  code: string,
  language: string,
  options: LexicalHtmlOptions,
): string {
  const lang = language.trim().toLowerCase()
  const langAttr = lang ? ` data-language="${escapeHtml(lang)}"` : ''
  const classAttr = lang ? ` class="language-${escapeHtml(lang)}"` : ''
  const pre = `<pre${langAttr}><code${classAttr}>${escapeHtml(code)}</code></pre>`

  if (options.codeCopyable === false) return pre

  const langLabel = lang
    ? `<span class="code-block__lang">${escapeHtml(lang)}</span>`
    : '<span class="code-block__lang">code</span>'

  return `<div class="code-block" data-code-block>${langLabel}${pre}</div>`
}

function renderCodeBlock(node: LexicalNode, options: LexicalHtmlOptions): string {
  const code = (node.children ?? []).map((child) => child.text ?? '').join('')
  const language = typeof node.language === 'string' ? node.language : ''
  return renderCodeBlockFromParts(code, language, options)
}

function renderFormulaBlock(node: LexicalNode): string {
  const fields = node.fields
  if (!fields || typeof fields !== 'object') return ''
  const expression = typeof fields.latex === 'string' ? fields.latex.trim() : ''
  if (!expression) return ''
  const mode = typeof fields.mode === 'string' ? fields.mode : null
  const latex = resolveFormulaLatex(expression, mode)

  try {
    const rendered = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
      strict: 'ignore',
    })
    return `<div class="formula-block" data-formula-block role="math" aria-label="${escapeHtml(expression)}">${rendered}</div>`
  } catch {
    return `<pre class="formula-block formula-block--fallback"><code>${escapeHtml(expression)}</code></pre>`
  }
}

function renderPayloadBlock(node: LexicalNode, options: LexicalHtmlOptions): string {
  const fields = node.fields
  if (!fields || typeof fields !== 'object') return ''

  switch (fields.blockType) {
    case 'Code': {
      const code = typeof fields.code === 'string' ? fields.code : ''
      const language = typeof fields.language === 'string' ? fields.language : ''
      return renderCodeBlockFromParts(code, language, options)
    }
    case 'formula':
      return renderFormulaBlock(node)
    default:
      return ''
  }
}

function renderNode(node: LexicalNode, ctx: RenderContext): string {
  switch (node.type) {
    case 'root':
      return renderChildren(node.children, ctx)
    case 'paragraph':
      return `<p>${renderChildren(node.children, ctx)}</p>`
    case 'heading': {
      const tag = ['h1', 'h2', 'h3', 'h4'].includes(node.tag ?? '') ? (node.tag as string) : 'h2'
      const text = extractPlainText(node).replace(/\s+/g, ' ').trim()
      if (tag === 'h2' || tag === 'h3') {
        const id = ctx.ids.next(text || tag)
        return `<${tag} id="${escapeHtml(id)}">${renderChildren(node.children, ctx)}</${tag}>`
      }
      return `<${tag}>${renderChildren(node.children, ctx)}</${tag}>`
    }
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node.children, ctx)}</${tag}>`
    }
    case 'listitem':
      return `<li>${renderChildren(node.children, ctx)}</li>`
    case 'quote':
      return `<blockquote>${renderChildren(node.children, ctx)}</blockquote>`
    case 'link': {
      const url = typeof node.fields?.url === 'string' ? node.fields.url : '#'
      return `<a href="${escapeHtml(url)}">${renderChildren(node.children, ctx)}</a>`
    }
    case 'code':
      return renderCodeBlock(node, ctx.options)
    case 'block':
      return renderPayloadBlock(node, ctx.options)
    case 'upload':
      return renderUpload(node)
    case 'horizontalrule':
      return '<hr />'
    case 'text':
      return renderText(node)
    case 'linebreak':
      return '<br />'
    default:
      return renderChildren(node.children, ctx)
  }
}

function getRoot(body: unknown): LexicalNode | null {
  if (!body || typeof body !== 'object') return null
  return (body as { root?: LexicalNode }).root ?? null
}

export function lexicalToHtml(body: unknown, options: LexicalHtmlOptions = {}): string {
  const root = getRoot(body)
  if (!root) return ''
  return renderNode(root, { ids: new HeadingIdAllocator(), options })
}

/** Collect h2/h3 entries with the same id allocation as lexicalToHtml. */
export function extractTocFromLexical(body: unknown): TocItem[] {
  const root = getRoot(body)
  if (!root) return []

  const ids = new HeadingIdAllocator()
  const toc: TocItem[] = []

  function walk(node: LexicalNode) {
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      const text = extractPlainText(node).replace(/\s+/g, ' ').trim()
      const id = ids.next(text || node.tag)
      if (text) {
        toc.push({ id, text, depth: node.tag === 'h2' ? 2 : 3 })
      }
    }
    node.children?.forEach(walk)
  }

  walk(root)
  return toc
}

/** Plain text from Lexical body for card previews / hooks. */
export function lexicalToPlainText(body: unknown): string {
  const root = getRoot(body)
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
