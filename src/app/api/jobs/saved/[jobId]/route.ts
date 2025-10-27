import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the saved job
    const deletedSavedJob = await prisma.savedJob.deleteMany({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (deletedSavedJob.count === 0) {
      return NextResponse.json({ error: 'Saved job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job unsaved successfully'
    });

  } catch (error) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      { error: 'Failed to unsave job' },
      { status: 500 }
    );
  }
}
