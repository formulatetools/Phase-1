import { NextResponse } from 'next/server'

// Stripe webhook handler — to be built in Step 5
export async function POST() {
  return NextResponse.json({ received: true })
}
