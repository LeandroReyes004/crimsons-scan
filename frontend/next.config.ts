import type { NextConfig } from "next";

const BUILD_ID = Date.now().toString();

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://scancrimson.com https://crimson-api.leandro-reyes1025.workers.dev https://picsum.photos",
  "connect-src 'self' https://crimson-api.leandro-reyes1025.workers.dev",
  "font-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: "https://crimson-api.leandro-reyes1025.workers.dev",
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "crimson-api.leandro-reyes1025.workers.dev", pathname: "/**" },
      { protocol: "https", hostname: "scancrimson.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy",   value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
