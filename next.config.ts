import type { NextConfig } from "next";

let ideavoTagger: string | undefined;
try {
  ideavoTagger = require.resolve("@ideavo/webpack-tagger");
} catch {
  ideavoTagger = undefined;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents:false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['null'],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "sonner", "jszip"],
  },
  turbopack: ideavoTagger
    ? {
        rules: {
          "*.{jsx,tsx}": {
            condition: { not: 'foreign' },
            loaders: [ideavoTagger],
          },
        },
      }
    : {},
} as NextConfig;

export default nextConfig;
