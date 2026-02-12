import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getUploadUrl } from '@/lib/s3';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/documents/upload-url — Generate a presigned S3 upload URL
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, documentType } = body;

    // Validate required fields
    if (!fileName || !fileSize || !mimeType || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileSize, mimeType, documentType' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = ['resume', 'cover_letter', 'portfolio', 'certificate'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate presigned upload URL
    const { uploadUrl, s3Key } = await getUploadUrl(
      user.id,
      documentType,
      fileName,
      mimeType
    );

    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn: 300, // 5 minutes
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
