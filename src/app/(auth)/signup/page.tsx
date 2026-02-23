import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { AuthForm } from '@/components/ui/auth-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Sign up free for access to professional CBT worksheets and clinical tools.',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  const referralCode = params.ref || null

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

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-light px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-sm text-brand-text">
              Referred by a friend? You&apos;ll get <strong>50% off</strong> your first month!
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-primary-100">
          <AuthForm mode="signup" referralCode={referralCode} />
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
