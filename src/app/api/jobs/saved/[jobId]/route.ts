import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to get user from request (supports both session and token)
async function getUserFromRequest(request: NextRequest) {
  try {
    // First try to get user from session (cookies)
    const { userId } = await auth();
    if (userId) {
      console.log('✅ Got user from session:', userId);
      return userId;
    }

    // If no session, try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Checking auth header:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔐 Extracted token, attempting verification...');
      
      try {
        // Use getAuth with the request to verify the token
        const { userId: tokenUserId } = getAuth(request);
        if (tokenUserId) {
          console.log('✅ Got user from token:', tokenUserId);
          return tokenUserId;
        }
      } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError);
      }
    }

    console.log('❌ No valid authentication found');
    return null;
  } catch (error) {
    console.error('❌ Error getting user from request:', error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const clerkId = await getUserFromRequest(request);
    
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

    // Find the saved job first to get the correct relationship
    const savedJob = await prisma.savedJob.findFirst({
      where: {
        userId: user.id,
        job: {
          id: jobId
        }
      }
    });

    if (!savedJob) {
      return NextResponse.json({ error: 'Saved job not found' }, { status: 404 });
    }

    // Delete the saved job
    await prisma.savedJob.delete({
      where: {
        id: savedJob.id
      }
    });

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
