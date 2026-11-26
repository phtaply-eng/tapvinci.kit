import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = 'https://tapvinci.vercel.app'
const SITE_NAME = 'TapVinci'
const SITE_TITLE = 'TapVinci | NFC Digital Business Card Philippines - Tap. Connect. Remember.'
const SITE_DESCRIPTION =
  'Premium NFC digital business cards in the Philippines. Tap to share your profile, links and contact. Digital Only \u20b1399, Card + Digital \u20b1799. Pay via GCash or Maya. No monthly fee.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    'NFC business card Philippines',
    'digital business card Philippines',
    'TapVinci',
    'NFC card',
    'digital calling card',
    'tap to share profile',
  ],
  authors: [{ name: 'Shua Vallinas', url: SITE_URL }],
  creator: 'TapVinci',
  publisher: 'TapVinci',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: 'en_PH',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'TapVinci - NFC Digital Business Card Philippines',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: 'TapVinci',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: 'tapvinci@yahoo.com',
      founder: {
        '@type': 'Person',
        name: 'Shua Vallinas',
        jobTitle: 'Founder',
      },
      sameAs: [
        'https://facebook.com/shua.vallinas',
        'https://instagram.com/shuashushu',
        'https://www.tiktok.com/@shuashushu5',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'TapVinci',
      publisher: { '@id': `${SITE_URL}#organization` },
      inLanguage: 'en-PH',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: "My phone didn't open the page. What now?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Make sure NFC is switched on and the screen is unlocked. Tap or hold the front or back of the phone flat against the card, moving it slightly if nothing happens. Thick or metal cases can block the signal. If it still doesn\u2019t open, use the share link or QR code instead.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need an app to open it?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Most recent iPhones and Android phones can read NFC without an extra app. Some older phones may need a tag-reading setting switched on.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the card or chip need a battery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. It is passive and powered briefly by the phone when you tap, so there is nothing to charge or replace.',
          },
        },
        {
          '@type': 'Question',
          name: 'What if my phone has no NFC?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can still open the same page from the link or the QR code.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can the page be updated later?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The card stores a link to your page, not the page itself, so you can edit your details any time without rewriting the card.',
          },
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'TapVinci Digital Only',
      image: `${SITE_URL}/logo.png`,
      description: 'Digital landing page and profile. Share via link and QR code. No physical card.',
      brand: { '@type': 'Brand', name: 'TapVinci' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PHP',
        price: 399,
        availability: 'https://schema.org/InStock',
        url: SITE_URL,
      },
    },
    {
      '@type': 'Product',
      name: 'TapVinci Card + Digital',
      image: `${SITE_URL}/logo.png`,
      description: 'NFC card plus digital landing page and profile. Tap to share contact details and links.',
      brand: { '@type': 'Brand', name: 'TapVinci' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PHP',
        price: 799,
        availability: 'https://schema.org/InStock',
        url: SITE_URL,
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ overflowX: 'clip' }}>
      <body style={{ overflowX: 'clip', margin: 0 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}