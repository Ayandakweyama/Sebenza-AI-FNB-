import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
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
    const jobs = user.savedJobs.map(savedJob => ({
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
    const { userId: clerkId } = await auth();
    
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
