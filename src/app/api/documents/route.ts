import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/documents - Get user documents
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, fileName, fileSize, mimeType, fileUrl, description, tags, isPrimary } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If setting as primary, unset other primary documents of same type
    if (isPrimary) {
      await prisma.document.updateMany({
        where: {
          userId: user.id,
          type,
          isPrimary: true
        },
        data: { isPrimary: false }
      });
    }

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        name,
        type,
        fileName,
        fileSize,
        mimeType,
        fileUrl,
        description,
        tags: tags || [],
        isPrimary: isPrimary || false
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
