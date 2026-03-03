import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { ResetPasswordForm } from '@/components/ui/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Formulate account.',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Logo size="lg" />
          </Link>
          <p className="mt-3 text-sm text-primary-500">
            Set a new password
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary-100">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  )
}
