import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

function extractLexicalText(node: LexicalNode | null | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map(extractLexicalText).join(' ')
}

function estimateReadingTimeMinutes(body: unknown): number {
  const root =
    body && typeof body === 'object' && 'root' in (body as object)
      ? ((body as { root?: LexicalNode }).root ?? null)
      : null
  const text = extractLexicalText(root)
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

const setReadingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  return {
    ...data,
    readingTime: estimateReadingTimeMinutes(data.body),
  }
}

const stampPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  if (!data) return data

  const nextStatus = data._status ?? originalDoc?._status
  const wasPublished = originalDoc?._status === 'published'

  if (nextStatus === 'published' && (operation === 'create' || !wasPublished) && !data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date().toISOString(),
    }
  }

  return data
}

/** Payload condition args: (data, siblingData, ctx) — not ({ siblingData }). */
const isShowcase = (data: Partial<{ layout?: string }>, siblingData?: Partial<{ layout?: string }>) =>
  (data?.layout ?? siblingData?.layout) === 'showcase'

const isSnippet = (data: Partial<{ layout?: string }>, siblingData?: Partial<{ layout?: string }>) =>
  (data?.layout ?? siblingData?.layout) === 'snippet'

const BODY_SHORTCUTS =
  'Shortcuts: Bold Ctrl/Cmd+B · Italic Ctrl/Cmd+I · Underline Ctrl/Cmd+U · Highlight via toolbar Text State → Highlight (no shortcut) · Code block via / → Code (or Blocks toolbar)'

const showcaseFields: Field[] = [
  {
    name: 'heroMedia',
    type: 'group',
    admin: {
      condition: isShowcase,
      description: 'Optional YouTube embed or product image/GIF. Omit to skip the hero.',
    },
    fields: [
      {
        name: 'type',
        type: 'select',
        options: [
          { label: 'YouTube', value: 'youtube' },
          { label: 'Image / GIF', value: 'image' },
        ],
        admin: {
          description: 'Leave empty if this showcase has no hero media.',
        },
      },
      {
        name: 'youtubeUrl',
        type: 'text',
        admin: {
          condition: (_data, siblingData: Partial<{ type?: string }>) => siblingData?.type === 'youtube',
          description: 'Full YouTube watch or share URL.',
        },
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        admin: {
          condition: (_data, siblingData: Partial<{ type?: string }>) => siblingData?.type === 'image',
        },
      },
    ],
  },
  {
    name: 'ctaLinks',
    type: 'array',
    labels: {
      singular: 'CTA link',
      plural: 'CTA links',
    },
    admin: {
      condition: isShowcase,
      description: 'Flexible links (GitHub, live demo, docs, …). Order is display order.',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
      },
      {
        name: 'url',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    name: 'badges',
    type: 'relationship',
    relationTo: 'badges',
    hasMany: true,
    admin: {
      condition: isShowcase,
      description: 'Select tech badges (with logos) or create new ones in the Badges collection.',
    },
  },
]

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'layout', 'slug', '_status', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        _status: {
          equals: 'published',
        },
      }
    },
  },
  hooks: {
    beforeChange: [setReadingTime, stampPublishedAt],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: 'essay',
      options: [
        { label: 'Intellectual Essay', value: 'essay' },
        { label: 'Project Showcase', value: 'showcase' },
        { label: 'Code Snippet Library', value: 'snippet' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Essay, showcase, and snippet layouts are available.',
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Estimated minutes; computed on save.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        condition: isSnippet,
        description: 'One-line summary for cards, meta, and JSON-LD. Optional.',
      },
    },
    ...showcaseFields,
    {
      name: 'body',
      type: 'richText',
      required: true,
      admin: {
        description: BODY_SHORTCUTS,
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
        },
        {
          name: 'canonical',
          type: 'text',
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
