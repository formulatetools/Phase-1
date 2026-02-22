import Link from 'next/link'
import { AuthForm } from '@/components/ui/auth-form'

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary-900">
            Formulate
          </Link>
          <p className="mt-2 text-sm text-primary-500">
            Create your free account
          </p>
          <p className="mt-1 text-xs text-primary-400">
            Access 5 professional CBT tools per month, free
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-primary-100">
          <AuthForm mode="signup" />
        </div>

        <p className="mt-6 text-center text-sm text-primary-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-accent-600 hover:text-accent-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
