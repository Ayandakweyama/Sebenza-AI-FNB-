import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use the new serverExternalPackages for Next.js 16
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer"],
  
  // Configure Turbopack for Next.js 16 (empty config uses defaults)
  turbopack: {},
  
  // Configure webpack to handle problematic dependencies (fallback for webpack builds)
  webpack: (config, { isServer }) => {
    // Only apply these changes for server-side builds
    if (isServer) {
      // Handle problematic modules
      config.externals = [
        ...(config.externals || []), 
        {
          'puppeteer-extra': 'commonjs puppeteer-extra',
          'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
          'puppeteer': 'commonjs puppeteer',
          'sharp': 'commonjs sharp',
        }
      ];
    }
    
    return config;
  },
  
  // Ignore TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Handle images — include S3 bucket domain for optimized image serving
  images: {
    domains: [
      'localhost',
      `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
    ],
    unoptimized: true,
  },
  
  // Railway-specific optimizations
  output: 'standalone',
};

export default nextConfig;
