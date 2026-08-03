import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      <div className="content">
        <h1>snippets CMS</h1>
        <p>
          {user && 'email' in user
            ? `Signed in as ${user.email}`
            : 'Headless Payload admin for the snippets blog.'}
        </p>
        <div className="links">
          <a className="admin" href={payloadConfig.routes.admin}>
            Open admin
          </a>
          <a className="docs" href="http://localhost:4321">
            Public site (Astro)
          </a>
        </div>
      </div>
    </div>
  )
}
