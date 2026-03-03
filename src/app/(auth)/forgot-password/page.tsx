import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { ForgotPasswordForm } from '@/components/ui/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Formulate account password.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Logo size="lg" />
          </Link>
          <p className="mt-3 text-sm text-primary-500">
            Reset your password
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary-100">
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-sm text-primary-500">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-primary-800 hover:text-primary-900 underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
