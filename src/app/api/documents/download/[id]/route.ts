import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getDownloadUrl } from '@/lib/s3';

// GET /api/documents/download/[id] — Generate a presigned S3 download URL
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
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // fileUrl stores the S3 key — generate a temporary signed download URL
    const downloadUrl = await getDownloadUrl(document.fileUrl);

    return NextResponse.json({
      downloadUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
