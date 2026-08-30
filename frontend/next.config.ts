import type { NextConfig } from "next";

const BUILD_ID = Date.now().toString();

const isDev = process.env.NODE_ENV === 'development';
const WORKER = isDev ? "http://10.0.0.103:8787" : "https://crimson-api.leandro-reyes1025.workers.dev";
const AD_SCRIPTS = "https://static.cloudflareinsights.com https://*.effectivecpmnetwork.com https://*.highperformanceformat.com https://*.adsterra.com";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${WORKER} https:`,
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src 'self' https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Permitir acceder desde el celular a Next.js (IP local)
  allowedDevOrigins: ['10.0.0.103'],
  env: {
    NEXT_PUBLIC_API_URL: isDev ? "http://10.0.0.103:8787" : "https://crimson-api.leandro-reyes1025.workers.dev",
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
