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
