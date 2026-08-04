import type { APIRoute } from 'astro'

function siteOrigin(): string {
  return (import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/$/, '')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function robotsBody(origin: string): string {
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${origin}/sitemap.xml
`
}

export const GET: APIRoute = async ({ request }) => {
  const origin = siteOrigin()
  const body = robotsBody(origin)

  // Top-level browser navigations send Sec-Fetch-Dest: document; crawlers usually do not.
  // Serve a tiny HTML shell so dark-mode browsers don't show white-on-white plain text.
  const isBrowserDocument = request.headers.get('sec-fetch-dest') === 'document'

  if (isBrowserDocument) {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>robots.txt</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 1.25rem;
      background: #ffffff;
      color: #161616;
      font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #0d1117; color: #f3f1ec; }
    }
    pre { margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body><pre>${escapeHtml(body.trimEnd())}</pre></body>
</html>
`
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
