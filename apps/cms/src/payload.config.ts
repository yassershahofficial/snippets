import { mongooseAdapter } from '@payloadcms/db-mongodb'
import {
  BlocksFeature,
  CodeBlock,
  FixedToolbarFeature,
  lexicalEditor,
  TextStateFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { config as loadEnv } from 'dotenv'

import { FormulaBlock } from './blocks/Formula'
import { Authors } from './collections/Authors'
import { Badges } from './collections/Badges'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { textStateConfig } from './fields/textStateConfig'

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4321')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const csrfOrigins = (process.env.CSRF_ORIGINS || process.env.CORS_ORIGINS || 'http://localhost:4321')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Authors, Tags, Badges, Posts],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      TextStateFeature({
        state: textStateConfig,
      }),
      BlocksFeature({
        blocks: [
          CodeBlock({
            defaultLanguage: 'bash',
            languages: {
              bash: 'Bash',
              plaintext: 'Plain Text',
              js: 'JavaScript',
              ts: 'TypeScript',
              tsx: 'TSX',
              jsx: 'JSX',
              python: 'Python',
              go: 'Go',
              rust: 'Rust',
              sql: 'SQL',
              yaml: 'YAML',
              json: 'JSON',
              html: 'HTML',
              css: 'CSS',
              dockerfile: 'Dockerfile',
              caddy: 'Caddyfile',
            },
          }),
          FormulaBlock,
        ],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  cors: corsOrigins,
  csrf: csrfOrigins,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  // i18n-ready later via localized fields; no Payload locales in foundation.
  sharp,
})
