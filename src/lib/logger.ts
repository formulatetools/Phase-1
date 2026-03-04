import * as Sentry from '@sentry/nextjs'

type LogContext = Record<string, unknown>

/**
 * Structured logger that wraps console output with Sentry reporting.
 *
 * - `error` → console.error + Sentry.captureException (unexpected breakage)
 * - `warn`  → console.warn  + Sentry.captureMessage   (handled/non-critical failure)
 * - `info`  → console.log   only                      (operational / debugging)
 */
export const logger = {
  /**
   * Log an unexpected error and report to Sentry.
   * Pass the Error object as the second arg for proper stack traces.
   */
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(message, error ?? '', context ?? '')

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { ...context, message },
      })
    } else if (error) {
      Sentry.captureException(new Error(message), {
        extra: { ...context, originalError: String(error) },
      })
    } else {
      Sentry.captureException(new Error(message), {
        extra: context,
      })
    }
  },

  /**
   * Log a handled/non-critical failure and report to Sentry as a warning.
   * Use for fire-and-forget failures (emails, referrals, cleanup steps).
   */
  warn(message: string, context?: LogContext) {
    console.warn(message, context ?? '')
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    })
  },

  /**
   * Informational log for debugging. Console only, no Sentry.
   */
  info(message: string, context?: LogContext) {
    console.log(message, context ?? '')
  },
}
