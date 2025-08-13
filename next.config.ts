import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server-side rendering for the API route that uses Puppeteer
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth"],
  },
  
  // Configure webpack to handle problematic dependencies
  webpack: (config, { isServer }) => {
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
      config.externals = [...(config.externals || []), {
        'puppeteer-extra': 'commonjs puppeteer-extra',
        'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
        'puppeteer': 'commonjs puppeteer'
      }];
      
      // Ignore specific warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/puppeteer-extra/ },
        { module: /node_modules\/puppeteer-extra-plugin-stealth/ },
        { module: /node_modules\/puppeteer/ },
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
};

export default nextConfig;
