import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/hw/',        // Client homework pages — private
          '/clients/',   // Therapist client data
          '/admin/',     // Admin panel
          '/api/',       // API routes
          '/dashboard/', // Authenticated dashboard
          '/settings/',  // Account settings
          '/auth/',      // Auth callbacks
        ],
      },
    ],
    sitemap: 'https://formulatetools.co.uk/sitemap.xml',
  }
}
