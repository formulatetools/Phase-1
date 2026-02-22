import { PricingTable } from '@/components/marketing/pricing-table'

export const metadata = {
  title: 'Pricing — Formulate',
  description: 'Professional CBT tools starting free. Unlimited access from £7.99/month.',
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900">
          Professional tools at a fraction of the cost
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-500">
          Get started free with 5 tools per month. Upgrade for unlimited access
          to every worksheet in the library.
        </p>
      </div>

      <div className="mt-12">
        <PricingTable />
      </div>
    </main>
  )
}
