import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { AuthForm } from '@/components/ui/auth-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Sign up free for access to professional CBT worksheets and clinical tools.',
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Logo size="lg" />
          </Link>
          <p className="mt-3 text-sm text-primary-500">
            Create your free account
          </p>
          <p className="mt-1 text-xs text-primary-400">
            Access 5 professional CBT tools per month, free
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary-100">
          <AuthForm mode="signup" />
        </div>

        <p className="mt-6 text-center text-sm text-primary-500">
          Already have an account?{' '}
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
