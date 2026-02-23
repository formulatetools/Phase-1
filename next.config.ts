import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry org and project are read from SENTRY_ORG and SENTRY_PROJECT env vars
  // Source map uploads use SENTRY_AUTH_TOKEN (build-time only)
  silent: !process.env.CI,

  // Disable source map upload if no auth token (avoids build errors)
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
