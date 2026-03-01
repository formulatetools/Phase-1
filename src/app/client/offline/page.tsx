import { LogoIcon } from '@/components/ui/logo'

export const metadata = {
  title: 'Offline — Formulate',
  robots: 'noindex, nofollow',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <LogoIcon size={24} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-primary-800">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-primary-500">
          Connect to the internet to view your homework.
        </p>
      </div>
    </div>
  )
}
