import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://tapvinci.vercel.app'
  return {
    rules: [
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'Claude-SearchBot',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot',
          'facebookexternalhit',
          'Twitterbot',
        ],
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/auth/', '/login/', '/c/'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider', 'meta-externalagent'],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/auth/', '/login/', '/c/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}