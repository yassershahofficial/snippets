import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

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
        description: 'Foundation ships essay fields only; showcase/snippet schemas come later.',
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
      name: 'body',
      type: 'richText',
      required: true,
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
