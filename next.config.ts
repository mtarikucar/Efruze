import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy directives. We allow only what the app actually uses:
 * - res.cloudinary.com — product images and GLB models
 * - ajax.googleapis.com — <model-viewer> CDN script
 * - paytr.com — PayTR payment iframe
 *
 * 'unsafe-inline' on style-src is required by Tailwind v4's CSS-in-JS layer.
 * 'unsafe-eval' is required by next/font and model-viewer's runtime.
 * In dev, Turbopack's HMR needs additional allowances — relax further.
 */
function buildCsp() {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://images.unsplash.com",
    ],
    "media-src": ["'self'", "blob:", "https://res.cloudinary.com"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://ajax.googleapis.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://api.cloudinary.com",
    ],
    "frame-src": ["'self'", "https://www.paytr.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
  };
  // Dev tooling (Turbopack HMR, WS) needs broader connect/worker permissions.
  if (!isProd) {
    directives["connect-src"].push("ws://localhost:*", "http://localhost:*");
    directives["script-src"].push("'unsafe-eval'");
  }
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: buildCsp() },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    // Admin-uploaded photos live behind /uploads and can be swapped in place;
    // a short TTL means a replaced image refreshes within a minute instead of
    // Next 16's 4h default.
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // The PayTR iframe itself needs to embed at paytr.com, but our /checkout/paytr/*
      // pages embed PayTR — frame-src already permits that. Webhook route is API-only.
      {
        source: "/api/webhooks/(.*)",
        headers: [
          // Webhooks come from third parties; loosen frame-ancestors so they don't
          // get blocked by a stricter CSP applied to HTML routes.
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
  },
};

export default withNextIntl(nextConfig);
