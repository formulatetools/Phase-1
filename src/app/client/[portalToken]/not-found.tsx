import { LogoIcon } from '@/components/ui/logo'

export default function PortalNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <LogoIcon size={24} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-primary-800">
          This link is no longer active.
        </h1>
        <p className="mt-2 text-sm text-primary-500">
          Your therapist may have updated your workspace link. Please ask them
          for your new link.
        </p>
        <p className="mt-4 text-xs text-primary-400">
          If you think this is an error, contact your therapist directly.
        </p>
      </div>
    </div>
  )
}
