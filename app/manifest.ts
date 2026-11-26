import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TapVinci',
    short_name: 'TapVinci',
    description: 'Premium NFC Digital Business Cards',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#D4AF37',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}