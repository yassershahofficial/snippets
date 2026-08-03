import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
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
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'credentials',
      label: 'Credentials / expertise',
      type: 'textarea',
    },
    {
      name: 'jobTitle',
      type: 'text',
    },
    {
      name: 'organization',
      type: 'text',
    },
    {
      name: 'sameAs',
      type: 'array',
      labels: {
        singular: 'Profile URL',
        plural: 'sameAs URLs',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
