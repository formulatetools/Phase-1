import Link from 'next/link'
import { AuthForm } from '@/components/ui/auth-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary-900">
            Formulate
          </Link>
          <p className="mt-2 text-sm text-primary-500">
            Sign in to your account
          </p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Authentication failed. Please try again.
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-primary-100">
          <AuthForm mode="login" redirectTo={params.redirect} />
        </div>

        <p className="mt-6 text-center text-sm text-primary-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-accent-600 hover:text-accent-700"
          >
            Create free account
          </Link>
        </p>
      </div>
    </main>
  )
}
