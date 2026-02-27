import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle server-only packages that shouldn't be bundled for the client
  serverExternalPackages: ['puppeteer', 'sharp'],

  // Increase body size limit for screenshot uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
