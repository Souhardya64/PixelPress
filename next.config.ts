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
  allowedDevOrigins: ['*'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
