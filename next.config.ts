import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jspdf', 'puppeteer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
      },
    ],
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Ignore build errors for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
