# Sebenza AI → AWS Migration Guide

## 1. AWS Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL / RAILWAY                         │
│                     (Next.js 16 App Router)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  API Routes   │  │  Server      │  │  Middleware            │ │
│  │  /api/*       │  │  Components  │  │  (Clerk Auth)         │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘ │
│         │                  │                                     │
└─────────┼──────────────────┼─────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   AWS RDS        │  │   AWS S3         │  │   Clerk          │
│   (PostgreSQL)   │  │   (Documents)    │  │   (Auth)         │
│                  │  │                  │  │                  │
│  • Users         │  │  • CVs (PDF)     │  │  • Sign-in/up    │
│  • Profiles      │  │  • Cover Letters │  │  • Session mgmt  │
│  • Skills        │  │  • Portfolios    │  │  • Webhooks      │
│  • Applications  │  │  • Certificates  │  │                  │
│  • Chat History  │  │                  │  │                  │
│  • Job Alerts    │  │  Signed URLs     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### How It Fits Together

- **Prisma** continues to be the ORM — only the connection string changes (SQLite → PostgreSQL on RDS)
- **S3** replaces local/URL-based file storage — the `Document.fileUrl` field stores S3 keys instead of local paths
- **Clerk** remains unchanged — still linked via `clerkId`
- **API routes** stay the same — only the document upload/download routes get S3 logic
- **No Lambda needed** — Vercel/Railway serverless functions handle everything

---

## 2. Prisma Migration: SQLite → PostgreSQL (RDS)

### Step 1: Create RDS Instance

1. Go to **AWS Console → RDS → Create Database**
2. Choose **PostgreSQL 16**
3. Settings:
   - **DB Instance Class**: `db.t3.micro` (free tier) or `db.t3.small` (production)
   - **Storage**: 20 GB gp3
   - **Public Access**: Yes (for initial setup, restrict later via Security Groups)
   - **VPC Security Group**: Allow inbound on port `5432` from your deployment IP
4. Note your **endpoint**, **username**, **password**, and **database name**

### Step 2: Update `schema.prisma`

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"    // ← Changed from "sqlite"
  url      = env("DATABASE_URL")
}

// All models stay EXACTLY the same — no changes needed
// Prisma handles the SQLite → PostgreSQL type mapping automatically
// e.g., SQLite's TEXT → PostgreSQL's TEXT, INTEGER → INTEGER, etc.
```

**That's it.** Your 16 models (User, UserProfile, Skill, Document, etc.) require zero changes.

### Step 3: Update Environment Variables

```env
# .env (local development - can keep SQLite)
DATABASE_URL="file:./dev.db"

# .env.production (or Vercel/Railway env vars)
DATABASE_URL="postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/sebenza_ai?schema=public&sslmode=require"
```

### Step 4: Run Migration

```bash
# Generate new Prisma client for PostgreSQL
npx prisma generate

# Push schema to RDS (creates all tables)
npx prisma db push

# OR use formal migrations (recommended for production)
npx prisma migrate dev --name init_postgresql
npx prisma migrate deploy  # on production
```

### Step 5: Seed/Transfer Data (Optional)

If you have existing SQLite data to migrate:

```bash
# Export from SQLite
npx prisma db execute --file export.sql --schema prisma/schema.prisma

# Or use a script:
npx tsx prisma/migrate-data.ts
```

Example data migration script:

```typescript
// prisma/migrate-data.ts
import { PrismaClient as SqliteClient } from './generated/sqlite-client';
import { PrismaClient as PgClient } from '@prisma/client';

const sqlite = new SqliteClient();
const pg = new PgClient();

async function migrate() {
  // Migrate users
  const users = await sqlite.user.findMany({ include: { profile: true, skills: true } });
  
  for (const user of users) {
    await pg.user.create({
      data: {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        // ... all fields
      }
    });
  }
  
  console.log(`Migrated ${users.length} users`);
}

migrate().catch(console.error);
```

### Step 6: Update Package Scripts

```json
// package.json - no changes needed, existing scripts work:
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "railway:build": "npm run db:generate && npm run build",
    "railway:start": "npm run db:push && npm start"
  }
}
```

### What Changes in Your Code?

**Nothing.** Your `src/lib/prisma.ts` stays exactly the same:

```typescript
// src/lib/prisma.ts — NO CHANGES
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

All 30+ API routes continue working — Prisma abstracts the database engine.

---

## 3. S3 Document Storage Implementation

### Step 1: Install AWS SDK v3

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 2: Create S3 Bucket

1. **AWS Console → S3 → Create Bucket**
2. Settings:
   - **Name**: `sebenza-ai-documents`
   - **Region**: `af-south-1` (Cape Town) or `eu-west-1` (Ireland)
   - **Block all public access**: ✅ ON (all files accessed via signed URLs)
   - **Versioning**: Enable (protects against accidental deletes)
   - **Encryption**: SSE-S3 (default)

### Bucket Structure

```
sebenza-ai-documents/
├── users/
│   ├── {userId}/
│   │   ├── resumes/
│   │   │   ├── resume-2026-02-11.pdf
│   │   │   └── resume-latest.docx
│   │   ├── cover-letters/
│   │   │   └── cover-letter-google.pdf
│   │   ├── portfolios/
│   │   │   └── portfolio-v2.pdf
│   │   └── certificates/
│   │       └── aws-cert.pdf
```

### Step 3: Create S3 Client Library

```typescript
// src/lib/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generate a signed URL for uploading a file to S3
 */
export async function getUploadUrl(
  userId: string,
  documentType: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const s3Key = `users/${userId}/${documentType}s/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    Metadata: {
      userId,
      documentType,
      originalFileName: fileName,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  return { uploadUrl, s3Key };
}

/**
 * Generate a signed URL for downloading a file from S3
 */
export async function getDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}
```

### Step 4: Create Upload API Route

```typescript
// src/app/api/documents/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getUploadUrl } from '@/lib/s3';

// POST /api/documents/upload-url — Generate signed upload URL
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileSize, mimeType, documentType } = await request.json();

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate signed upload URL
    const { uploadUrl, s3Key } = await getUploadUrl(user.id, documentType, fileName, mimeType);

    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 5: Create Download API Route

```typescript
// src/app/api/documents/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getDownloadUrl } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = getAuth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate signed download URL from S3 key stored in fileUrl
    const downloadUrl = await getDownloadUrl(document.fileUrl);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 6: Update Document POST Route

Update your existing `src/app/api/documents/route.ts` POST handler:

```typescript
// In the existing POST handler, the flow becomes:
// 1. Frontend calls /api/documents/upload-url → gets signed URL + s3Key
// 2. Frontend uploads file directly to S3 using signed URL
// 3. Frontend calls /api/documents (POST) with s3Key as fileUrl
// 4. Prisma stores the s3Key in Document.fileUrl

// The existing POST route needs NO changes — fileUrl just stores the S3 key now
// instead of a local path. The Document model stays the same.
```

### Step 7: Update Document DELETE Route

```typescript
// Add S3 deletion to your existing DELETE handler in src/app/api/documents/[id]/route.ts

import { deleteFromS3 } from '@/lib/s3';

// Inside the DELETE handler, before prisma.document.delete():
await deleteFromS3(document.fileUrl); // Delete from S3
await prisma.document.delete({ where: { id: params.id } }); // Delete from DB
```

### Step 8: Frontend Upload Example

```typescript
// Example: Upload a CV from the frontend

async function uploadDocument(file: File, documentType: string) {
  // Step 1: Get signed upload URL from your API
  const urlResponse = await fetch('/api/documents/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType, // 'resume', 'cover_letter', etc.
    }),
  });

  const { uploadUrl, s3Key } = await urlResponse.json();

  // Step 2: Upload file directly to S3 (browser → S3, bypasses your server)
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // Step 3: Save document metadata to your database
  const docResponse = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl: s3Key, // Store S3 key, not a URL
      isPrimary: true,
    }),
  });

  return docResponse.json();
}

// Usage:
// const fileInput = document.querySelector('input[type="file"]');
// await uploadDocument(fileInput.files[0], 'resume');
```

### Frontend Download Example

```typescript
async function downloadDocument(documentId: string) {
  const response = await fetch(`/api/documents/download/${documentId}`);
  const { downloadUrl } = await response.json();
  
  // Open signed URL in new tab (auto-downloads)
  window.open(downloadUrl, '_blank');
}
```

---

## 4. Security Considerations

### IAM Policy (Least Privilege)

Create a dedicated IAM user `sebenza-ai-app` with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DocumentAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sebenza-ai-documents/users/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::sebenza-ai-documents",
      "Condition": {
        "StringLike": {
          "s3:prefix": "users/*"
        }
      }
    }
  ]
}
```

### S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sebenza-ai-documents/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

### S3 CORS Configuration

Required for direct browser → S3 uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "https://sebenza-ai.up.railway.app",
      "https://your-domain.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### RDS Security

- **Security Group**: Only allow port `5432` from Vercel/Railway IPs
- **SSL**: Always use `?sslmode=require` in connection string
- **Credentials**: Store in environment variables, never in code
- **Backups**: Enable automated backups (7-day retention minimum)

### Environment Variables

```env
# AWS Credentials
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=sebenza-ai-documents

# Database (RDS PostgreSQL)
DATABASE_URL=postgresql://sebenza_admin:STRONG_PASSWORD@sebenza-db.xxxx.af-south-1.rds.amazonaws.com:5432/sebenza_ai?sslmode=require

# Existing (unchanged)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
```

---

## 5. Deployment Notes

### Vercel + AWS

1. **Add env vars** in Vercel Dashboard → Settings → Environment Variables
2. **RDS connectivity**: Vercel serverless functions connect from dynamic IPs. Options:
   - Use **RDS Proxy** for connection pooling (recommended)
   - Or allow `0.0.0.0/0` on port 5432 with strong password + SSL (simpler but less secure)
3. **Cold starts**: First request after idle may take ~2s to establish DB connection. Prisma handles reconnection automatically.
4. **Connection pooling**: Add `?connection_limit=5` to DATABASE_URL for serverless:
   ```
   DATABASE_URL="postgresql://...?sslmode=require&connection_limit=5"
   ```

### Railway + AWS

1. Railway can connect to RDS directly — add DATABASE_URL in Railway variables
2. Railway has static outbound IPs on paid plans — use those in RDS Security Group
3. Your existing `railway.json` and scripts work unchanged

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| RDS connection timeout from Vercel | Use RDS Proxy or increase Security Group CIDR |
| S3 CORS errors on upload | Add your deployment URL to S3 CORS AllowedOrigins |
| Prisma migration fails on RDS | Ensure `DATABASE_URL` uses `postgresql://` not `file:` |
| Large file uploads timeout | Signed URLs upload directly to S3, bypassing your server |
| SQLite-specific SQL in codebase | Prisma abstracts this — no raw SQL changes needed |
| Connection pool exhaustion | Add `connection_limit=5` for serverless environments |

---

## 6. Migration Checklist

### Phase 1: Database (Low Risk)
- [ ] Create RDS PostgreSQL instance
- [ ] Update `schema.prisma` provider to `postgresql`
- [ ] Set `DATABASE_URL` env var to RDS connection string
- [ ] Run `npx prisma db push` against RDS
- [ ] Verify all API routes work with PostgreSQL
- [ ] Migrate existing data if needed

### Phase 2: File Storage (Medium Risk)
- [ ] Create S3 bucket with proper policies
- [ ] Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- [ ] Create `src/lib/s3.ts` utility
- [ ] Create `/api/documents/upload-url` route
- [ ] Create `/api/documents/download/[id]` route
- [ ] Update document DELETE to also remove from S3
- [ ] Update frontend upload flows
- [ ] Configure S3 CORS

### Phase 3: Security Hardening
- [ ] Create dedicated IAM user with least-privilege policy
- [ ] Restrict RDS Security Group to deployment IPs
- [ ] Enable RDS automated backups
- [ ] Enable S3 versioning
- [ ] Rotate credentials and store in env vars only

---

## 7. Cost Estimate (Monthly)

| Service | Tier | Est. Cost |
|---------|------|-----------|
| **RDS PostgreSQL** | db.t3.micro (free tier eligible) | $0 – $15 |
| **S3 Storage** | 1 GB documents | ~$0.02 |
| **S3 Requests** | ~10K PUT/GET per month | ~$0.05 |
| **Data Transfer** | 5 GB out | ~$0.45 |
| **Total** | | **$0 – $16/month** |

Free tier covers RDS for 12 months. After that, `db.t3.micro` is ~$13/month.

---

## Summary of Changes to Existing Code

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Change `provider` from `"sqlite"` to `"postgresql"` |
| `.env` / env vars | Add AWS credentials + update `DATABASE_URL` |
| `src/lib/s3.ts` | **New file** — S3 client utilities |
| `src/app/api/documents/upload-url/route.ts` | **New file** — signed URL generation |
| `src/app/api/documents/download/[id]/route.ts` | **New file** — signed download URLs |
| `src/app/api/documents/[id]/route.ts` | Add S3 delete call in DELETE handler |
| `next.config.ts` | Add S3 bucket domain to `images.domains` (if serving images) |
| `package.json` | Add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |

**Everything else stays the same.** All 30+ API routes, all React components, all hooks, all contexts — zero changes.
