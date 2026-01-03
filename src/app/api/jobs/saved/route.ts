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

// Type for saved job with relationships
type SavedJobWithJob = {
  job: {
    id: string;
    title: string;
    location?: string;
    type?: string;
    salary?: string;
    description?: string;
    postedAt: Date;
    company?: {
      name: string;
    } | null;
  };
  savedAt: Date;
};

export async function GET(request: NextRequest) {
  try {
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        savedJobs: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          },
          orderBy: {
            savedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform saved jobs to match expected format
    const jobs = user.savedJobs.map((savedJob: SavedJobWithJob) => ({
      id: savedJob.job.id,
      title: savedJob.job.title,
      company: savedJob.job.company?.name || 'Unknown Company',
      location: savedJob.job.location || 'Remote',
      type: savedJob.job.type,
      salary: savedJob.job.salary,
      description: savedJob.job.description,
      postedDate: savedJob.job.postedAt.toISOString(),
      isSaved: true,
      savedDate: savedJob.savedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      jobs
    });

  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job } = await request.json();

    if (!job) {
      return NextResponse.json({ error: 'Job data is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if job exists in database, if not create it
    let dbJob = await prisma.job.findUnique({
      where: { id: job.id }
    });

    if (!dbJob) {
      // Create company if it doesn't exist
      let company = null;
      if (job.company) {
        company = await prisma.company.findFirst({
          where: { name: job.company }
        });
        
        if (!company) {
          company = await prisma.company.create({
            data: {
              name: job.company,
              location: job.location
            }
          });
        }
      }

      // Create the job
      dbJob = await prisma.job.create({
        data: {
          id: job.id,
          title: job.title,
          description: job.description || '',
          companyId: company?.id,
          location: job.location,
          type: job.type || 'full-time',
          salary: job.salary,
          postedAt: job.postedDate ? new Date(job.postedDate) : new Date()
        }
      });
    }

    // Check if already saved
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: dbJob.id
        }
      }
    });

    if (existingSave) {
      return NextResponse.json({
        success: true,
        message: 'Job already saved',
        job: {
          ...job,
          isSaved: true,
          savedDate: existingSave.savedAt.toISOString()
        }
      });
    }

    // Save the job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId: dbJob.id
      },
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
      message: 'Job saved successfully',
      job: {
        id: savedJob.job.id,
        title: savedJob.job.title,
        company: savedJob.job.company?.name || job.company,
        location: savedJob.job.location,
        type: savedJob.job.type,
        salary: savedJob.job.salary,
        description: savedJob.job.description,
        isSaved: true,
        savedDate: savedJob.savedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Failed to save job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the job ID from the URL
    const url = new URL(request.url);
    const jobId = url.pathname.split('/').pop();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find and delete the saved job
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
