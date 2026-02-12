# AWS Configuration for Sebenza AI

This folder contains AWS policy and configuration files for the S3 + RDS setup.

## Files

| File | Purpose | Where to Apply |
|------|---------|----------------|
| `iam-policy.json` | IAM policy for the app's AWS user | IAM → Users → sebenza-ai-app → Permissions |
| `s3-bucket-policy.json` | Bucket policy to deny public access & enforce TLS | S3 → sebenza-ai-documents → Permissions → Bucket Policy |
| `s3-cors.json` | CORS rules for browser-to-S3 uploads | S3 → sebenza-ai-documents → Permissions → CORS |

## Setup Steps

### 1. Create IAM User
```bash
aws iam create-user --user-name sebenza-ai-app
aws iam put-user-policy --user-name sebenza-ai-app --policy-name SebenzaS3Access --policy-document file://aws/iam-policy.json
aws iam create-access-key --user-name sebenza-ai-app
```
Save the `AccessKeyId` and `SecretAccessKey` — add them to your environment variables.

### 2. Create S3 Bucket
```bash
aws s3api create-bucket --bucket sebenza-ai-documents --region af-south-1 --create-bucket-configuration LocationConstraint=af-south-1

# Block all public access
aws s3api put-public-access-block --bucket sebenza-ai-documents --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Apply bucket policy
aws s3api put-bucket-policy --bucket sebenza-ai-documents --policy file://aws/s3-bucket-policy.json

# Apply CORS
aws s3api put-bucket-cors --bucket sebenza-ai-documents --cors-configuration file://aws/s3-cors.json

# Enable versioning
aws s3api put-bucket-versioning --bucket sebenza-ai-documents --versioning-configuration Status=Enabled

# Enable default encryption
aws s3api put-bucket-encryption --bucket sebenza-ai-documents --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### 3. Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier sebenza-ai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username sebenza_admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --storage-encrypted \
  --region af-south-1
```

### 4. Set Environment Variables

Add these to your Vercel/Railway deployment:

```
DATABASE_URL=postgresql://sebenza_admin:PASSWORD@your-rds-endpoint:5432/sebenza_ai?sslmode=require&connection_limit=5
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=sebenza-ai-documents
```

### 5. Push Prisma Schema to RDS
```bash
npx prisma db push
```

## Security Notes

- **Replace `YOUR_AWS_ACCOUNT_ID`** in `s3-bucket-policy.json` with your actual AWS account ID
- **Add your production domain** to `AllowedOrigins` in `s3-cors.json`
- **Restrict RDS Security Group** to only allow connections from your deployment platform's IPs
- **Rotate credentials** periodically and never commit them to git
- All files in S3 are **private by default** — only accessible via presigned URLs (valid for 1 hour)
