import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limit';

const VALID_STATUSES = ['APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const;
type ApplicationStatus = typeof VALID_STATUSES[number];

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiters.read.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the application
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: user.id
      },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        jobId: application.jobId,
        job: {
          id: application.job.id,
          title: application.job.title,
          company: application.job.company?.name || 'Unknown Company',
          location: application.job.location || 'Remote',
          type: application.job.type,
          salary: application.job.salary,
          description: application.job.description
        },
        status: application.status.toLowerCase(),
        appliedDate: application.appliedAt.toISOString(),
        notes: application.notes,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
        interviewDate: application.interviewDate?.toISOString(),
        interviewType: application.interviewType
      }
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiters.api.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = params;
    const updates = await request.json();

    // Validate status if provided
    if (updates.status) {
      const upperStatus = updates.status.toUpperCase();
      if (!VALID_STATUSES.includes(upperStatus as ApplicationStatus)) {
        return NextResponse.json(
          { 
            error: 'Invalid status',
            message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
          },
          { status: 400 }
        );
      }
      updates.status = upperStatus;
    }

    // Validate interview date if provided
    if (updates.interviewDate) {
      const interviewDate = new Date(updates.interviewDate);
      if (isNaN(interviewDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid interview date format' },
          { status: 400 }
        );
      }
      updates.interviewDate = interviewDate;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the application
    const updatedApplication = await prisma.application.updateMany({
      where: {
        id: applicationId,
        userId: user.id
      },
      data: updates
    });

    if (updatedApplication.count === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fetch the updated application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      application: application ? {
        id: application.id,
        jobId: application.jobId,
        job: {
          id: application.job.id,
          title: application.job.title,
          company: application.job.company?.name || 'Unknown Company',
          location: application.job.location,
          type: application.job.type,
          salary: application.job.salary,
          description: application.job.description
        },
        status: application.status.toLowerCase(),
        appliedDate: application.appliedAt.toISOString(),
        notes: application.notes,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
        interviewDate: application.interviewDate?.toISOString(),
        interviewType: application.interviewType
      } : null
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiters.api.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the application (withdraw)
    const deletedApplication = await prisma.application.deleteMany({
      where: {
        id: applicationId,
        userId: user.id
      }
    });

    if (deletedApplication.count === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    );
  }
}
