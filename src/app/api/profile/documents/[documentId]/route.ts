import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// GET /api/profile/documents/[documentId] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
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

    const resolvedParams = await params;
    const documentId = resolvedParams.documentId;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile/documents/[documentId]/primary - Set document as primary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
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

    const resolvedParams = await params;
    const documentId = resolvedParams.documentId;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // First, unset all other documents as primary for this user
    await prisma.document.updateMany({
      where: {
        userId: user.id,
        isPrimary: true
      },
      data: { isPrimary: false }
    });

    // Then set the specified document as primary
    const document = await prisma.document.update({
      where: {
        id: documentId,
        userId: user.id // Ensure user can only modify their own documents
      },
      data: { isPrimary: true }
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error setting primary document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/profile/documents/[documentId] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    console.log('DELETE request params promise:', params);

    const { userId: clerkId } = await auth();
    console.log('DELETE auth result, clerkId:', clerkId);

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    console.log('DELETE user lookup result:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.documentId;
    console.log('DELETE documentId:', documentId);

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if document exists first
    const existingDoc = await prisma.document.findUnique({
      where: {
        id: documentId,
        userId: user.id
      }
    });
    console.log('DELETE existing document check:', existingDoc);

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Try to delete the file from disk
    if (existingDoc.fileUrl && existingDoc.fileUrl.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', existingDoc.fileUrl);
        await unlink(filePath);
      } catch (fsErr) {
        console.warn('Could not delete file from disk:', fsErr);
      }
    }

    // Delete the document (only if it belongs to the user)
    const document = await prisma.document.delete({
      where: {
        id: documentId,
        userId: user.id
      }
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error deleting document:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
