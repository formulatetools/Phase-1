export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID!,
  },
  standard: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STANDARD_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_STANDARD_ANNUAL_PRICE_ID!,
  },
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
    annual: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID!,
  },
} as const

export const TIER_LIMITS = {
  free: {
    monthlyUses: 5,
    maxClients: 2,
    maxActiveAssignments: 3,
    maxCustomWorksheets: 0,
  },
  starter: {
    monthlyUses: Infinity,
    maxClients: 0,
    maxActiveAssignments: 0,
    maxCustomWorksheets: 0,
  },
  standard: {
    monthlyUses: Infinity,
    maxClients: Infinity,
    maxActiveAssignments: Infinity,
    maxCustomWorksheets: 3,
  },
  professional: {
    monthlyUses: Infinity,
    maxClients: Infinity,
    maxActiveAssignments: Infinity,
    maxCustomWorksheets: 20,
  },
} as const

// Display labels: internal DB names → user-facing names
export const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  standard: 'Practice',
  professional: 'Specialist',
}

// Pricing amounts (used for savings calculations and display)
export const TIER_PRICES = {
  starter: { monthly: 4.99, annual: 47.90 },
  standard: { monthly: 9.99, annual: 95.90 },
  professional: { monthly: 19.99, annual: 191.90 },
} as const

// Feature lists per tier (used on success page and pricing table)
export const TIER_FEATURES: Record<string, string[]> = {
  starter: [
    'Unlimited worksheet access',
    'Clean PDF export (no branding)',
    'Bookmark & favourite tools',
  ],
  standard: [
    'Everything in Starter',
    'Client management dashboard',
    'Share worksheets with clients',
    'Custom worksheet builder',
    'Fork & customise any tool',
  ],
  professional: [
    'Everything in Practice',
    'CPD video training content',
    'Early access to new features',
    'AI-assisted formulation (coming soon)',
    'Psychometric tracking (coming soon)',
  ],
}
