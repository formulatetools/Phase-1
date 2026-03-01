import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/hw/',              // Client homework pages — private
          '/client/',          // Client portal — private
          '/clients/',         // Therapist client data
          '/supervision/',     // Supervision data
          '/admin/',           // Admin panel
          '/api/',             // API routes
          '/dashboard/',       // Authenticated dashboard
          '/settings/',        // Account settings
          '/auth/',            // Auth callbacks
          '/checkout/',        // Checkout flow
          '/my-tools/',        // Custom tools (authenticated)
          '/reviews/',         // Worksheet reviews (authenticated)
          '/content/',         // Content authoring (authenticated)
          '/referrals/',       // Referral dashboard
          '/feature-requests/',// Feature requests
          '/blog/write/',      // Blog authoring
        ],
      },
    ],
    sitemap: 'https://formulatetools.co.uk/sitemap.xml',
  }
}
