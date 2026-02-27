import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET /api/profile/documents - Get user documents
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile/documents - Upload new document
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, DOC, and DOCX files are allowed.' }, { status: 400 });
    }

    // Create user-specific upload directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', user.id);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename to avoid collisions
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Public URL path
    const fileUrl = `/uploads/${user.id}/${uniqueName}`;

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        name: file.name.split('.')[0],
        type: type || 'resume',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
        description: description || '',
        tags: [],
        isPrimary: false
      }
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
