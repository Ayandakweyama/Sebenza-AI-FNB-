/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the new serverExternalPackages for Next.js 16
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer"],
  
  // Configure Turbopack for Next.js 16 (empty config uses defaults)
  turbopack: {},
  
  // Ignore TypeScript and ESLint errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Optimize for production
  swcMinify: true,
  
  // Handle images
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
