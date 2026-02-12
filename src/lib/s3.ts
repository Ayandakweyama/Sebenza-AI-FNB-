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
 * Generate a presigned URL for uploading a file directly to S3.
 * The URL is valid for 5 minutes.
 */
export async function getUploadUrl(
  userId: string,
  documentType: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  // Sanitize filename: remove spaces and special chars
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const s3Key = `users/${userId}/${documentType}s/${Date.now()}-${sanitizedName}`;

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

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, s3Key };
}

/**
 * Generate a presigned URL for downloading a file from S3.
 * The URL is valid for 1 hour.
 */
export async function getDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Delete a file from S3 by its key.
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}
