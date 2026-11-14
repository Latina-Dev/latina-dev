/** @type {import('next').NextConfig} */
const nextConfig = {
  // /profile reads member profiles and owner files at request time, and the MCP server at /mcp
  // reads member profiles, resources and ERGs, so ship them with those functions
  outputFileTracingIncludes: {
    "/profile": ["./data/members/**", "./data/owners/**"],
    "/mcp": ["./data/members/**", "./data/resources/**", "./data/ergs/**"],
  },
  // engjobsearch.com was the job search guide's old home (the hire-me repo). Once the domain is
  // added to this Vercel project, every request there lands on the guide. The old site used
  // docsify hash links, which browsers carry through the redirect; /job-search maps them.
  async redirects() {
    return ["engjobsearch.com", "www.engjobsearch.com"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host", value: host }],
      destination: "https://latina.dev/job-search",
      permanent: true,
    }));
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  org: "fvcproductions",
  project: "latina-dev",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
