import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use the new serverExternalPackages instead of experimental.serverComponentsExternalPackages
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer"],
  
  // Configure webpack to handle problematic dependencies
  webpack: (config, { isServer, dev }) => {
    // Only apply these changes for server-side builds
    if (isServer) {
      // Exclude node_modules from being processed by babel-loader
      const rule = config.module.rules.find(
        (rule: { test?: RegExp }) => rule.test && rule.test.toString().includes('tsx')
      ) as { loader?: string; include?: any; exclude?: any } | undefined;
      
      if (rule?.loader === 'next-babel-loader') {
        rule.include = [];
        rule.exclude = /node_modules/;
      }
      
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
      
      // Ignore specific warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules[\\/]puppeteer-extra/ },
        { module: /node_modules[\\/]puppeteer-extra-plugin-stealth/ },
        { module: /node_modules[\\/]puppeteer/ },
        { module: /node_modules[\\/]sharp/ },
      ];
    }
    
    return config;
  },
  
  // Disable type checking during build (can help with some module resolution issues)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,
};

export default nextConfig;
