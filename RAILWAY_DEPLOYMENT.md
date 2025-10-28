# Railway Deployment Guide for Sebenza AI

## 🚂 Railway Deployment Setup

Railway is an excellent platform for deploying Next.js applications with built-in database support and easy environment variable management.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Prepare your `.env` values

## 🚀 Deployment Steps

### 1. **Create Railway Project**

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `Sebenza-AI-FNB-` repository
5. Railway will automatically detect it's a Next.js project

### 2. **Configure Build Settings**

Railway should auto-detect your Next.js app, but verify these settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Install Command**: `npm install`
- **Node Version**: `20.x` (required for Next.js 16)

**Important**: The `.nvmrc` file in your project root specifies Node.js 20.9.0, which Railway will use automatically.

### 3. **Set Environment Variables**

In your Railway project dashboard, go to **Variables** tab and add:

```env
# Database
DATABASE_URL=file:./prisma/dev.db

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
GLM_API_KEY=your_glm_api_key

# Job Search APIs (Optional)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Application URL (Railway will provide this)
NEXT_PUBLIC_APP_URL=${{RAILWAY_STATIC_URL}}

# Email Service (Optional)
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_FROM=noreply@sebenza-ai.com

# Node Options for Railway
NODE_OPTIONS=--max-old-space-size=4096
```

### 4. **Database Setup Options**

#### Option A: SQLite (Simplest)
- Keep `DATABASE_URL=file:./prisma/dev.db`
- Railway's filesystem is ephemeral, so data will reset on deploys
- Good for testing/demo purposes

#### Option B: PostgreSQL (Recommended for Production)
1. In Railway dashboard, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a PostgreSQL instance
3. Copy the connection string to `DATABASE_URL`
4. Update your Prisma schema:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Change from sqlite
  url      = env("DATABASE_URL")
}
```

5. Run migration after deployment:
```bash
npx prisma migrate deploy
```

### 5. **Railway-Specific Configuration**

Create a `railway.json` file in your project root:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 6. **Update Package.json for Railway**

Add Railway-specific scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "railway:build": "npm run db:generate && npm run build",
    "railway:start": "npm run db:push && npm start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy"
  }
}
```

### 7. **Create Railway Dockerfile (Optional)**

If you want more control, create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

## 🔧 Railway-Specific Fixes

### 1. **Update Next.js Config for Railway**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer"],
  
  turbopack: {},
  
  webpack: (config, { isServer }) => {
    if (isServer) {
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
  
  typescript: {
    ignoreBuildErrors: true, // Temporary for deployment
  },
  
  reactStrictMode: true,
  
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Railway-specific optimizations
  output: 'standalone', // Optimize for Railway
};

export default nextConfig;
```

### 2. **Handle Railway's Dynamic URLs**

Update your Clerk configuration to handle Railway's dynamic URLs:

```typescript
// In your Clerk configuration
const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
};
```

## 🎯 Deployment Process

### 1. **Initial Deployment**
1. Push your code to GitHub
2. Connect Railway to your repository
3. Railway will automatically build and deploy
4. Monitor the build logs for any errors

### 2. **Post-Deployment Setup**
```bash
# If using PostgreSQL, run migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed
```

### 3. **Custom Domain (Optional)**
1. In Railway dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

## 🔍 Troubleshooting

### Common Issues:

1. **Node.js Version Error**:
   ```
   You are using Node.js 18.20.8. For Next.js, Node.js version ">=20.9.0" is required.
   ```
   **Solution**:
   - ✅ Check that `.nvmrc` file exists with `20.9.0`
   - ✅ Verify `railway.json` specifies Node 20
   - ✅ Ensure Railway project uses Node.js 20.x
   - ✅ Check Railway dashboard → Settings → Environment → Node Version

2. **Build Failures**:
   - Check Node.js version matches (`20.x`)
   - Ensure all environment variables are set
   - Review build logs for specific errors

3. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Run `npx prisma generate` before build
   - Check if migrations are needed

4. **Puppeteer Issues**:
   - Railway supports Puppeteer out of the box
   - If issues persist, add to `serverExternalPackages`

5. **Memory Issues**:
   - Increase Railway plan if needed
   - Add `NODE_OPTIONS=--max-old-space-size=4096`

### Debugging Commands:
```bash
# Check Railway logs
railway logs

# Connect to Railway shell
railway shell

# Run database commands
railway run npx prisma studio
```

## 💰 Railway Pricing

- **Hobby Plan**: $5/month - Good for development/small projects
- **Pro Plan**: $20/month - Better for production with more resources
- **Team Plan**: $100/month - For team collaboration

## 🚀 Advantages of Railway

✅ **Easy Setup** - Automatic Next.js detection
✅ **Built-in Database** - PostgreSQL, MySQL, Redis support
✅ **Environment Variables** - Easy management
✅ **Custom Domains** - Free SSL certificates
✅ **Logs & Monitoring** - Built-in observability
✅ **GitHub Integration** - Automatic deployments
✅ **Reasonable Pricing** - Competitive with other platforms

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Next.js Guide](https://docs.railway.app/guides/nextjs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)

---

**Railway provides a smooth deployment experience for your Sebenza AI application with excellent Next.js 16 support!** 🚂
