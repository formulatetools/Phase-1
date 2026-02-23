"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            We&apos;ve been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #ddd",
              background: "#1a1a1a",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
