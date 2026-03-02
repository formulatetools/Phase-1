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
    maxClients: 3,
    maxActiveAssignments: 3,
    maxCustomWorksheets: 0,
    maxSupervisees: 0,
    maxSharedResourcesPerClient: 5,
    maxWorkspaceTemplates: 0,
  },
  starter: {
    monthlyUses: Infinity,
    maxClients: 8,
    maxActiveAssignments: 12,
    maxCustomWorksheets: 3,
    maxSupervisees: 0,
    maxSharedResourcesPerClient: Infinity,
    maxWorkspaceTemplates: 1,
  },
  standard: {
    monthlyUses: Infinity,
    maxClients: Infinity,
    maxActiveAssignments: Infinity,
    maxCustomWorksheets: 15,
    maxSupervisees: 4,
    maxSharedResourcesPerClient: Infinity,
    maxWorkspaceTemplates: 3,
  },
  professional: {
    monthlyUses: Infinity,
    maxClients: Infinity,
    maxActiveAssignments: Infinity,
    maxCustomWorksheets: Infinity,
    maxSupervisees: Infinity,
    maxSharedResourcesPerClient: Infinity,
    maxWorkspaceTemplates: Infinity,
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
    'Clean PDF export (minimal branding)',
    'Up to 8 clients with homework links',
    '3 custom worksheets',
    '3 AI worksheet generations per month',
    '1 workspace template',
    'Bookmark & favourite tools',
  ],
  standard: [
    'Everything in Starter',
    'Unlimited clients',
    'Up to 15 custom worksheets',
    'Fork & customise any tool',
    '10 AI worksheet generations per month',
    '3 workspace templates',
    'Supervision portal (up to 4 supervisees)',
  ],
  professional: [
    'Everything in Practice',
    'Unlimited custom worksheets',
    'Unlimited AI worksheet generations',
    'Unlimited workspace templates',
    'Unlimited supervisees',
  ],
}
