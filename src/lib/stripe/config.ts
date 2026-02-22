export const STRIPE_PRICES = {
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
  },
  standard: {
    monthlyUses: Infinity,
  },
  professional: {
    monthlyUses: Infinity,
  },
} as const
