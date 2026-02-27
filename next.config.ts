import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // pdf-parse uses pdfjs-dist + @napi-rs/canvas (native) which don't bundle
  // correctly in serverless — keep them as external runtime requires
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
};

export default withSentryConfig(nextConfig, {
  // Sentry org and project are read from SENTRY_ORG and SENTRY_PROJECT env vars
  // Source map uploads use SENTRY_AUTH_TOKEN (build-time only)
  silent: !process.env.CI,

  // Disable source map upload if no auth token (avoids build errors)
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
