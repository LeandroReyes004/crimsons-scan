import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: "https://crimson-api.leandro-reyes1025.workers.dev",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "*.workers.dev", pathname: "/**" },
      { protocol: "https", hostname: "scancrimson.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
