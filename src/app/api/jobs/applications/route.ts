import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with applications from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        applications: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform applications to match expected format
    const applications = user.applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      job: {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company?.name || 'Unknown Company',
        location: app.job.location || 'Remote',
        type: app.job.type,
        salary: app.job.salary,
        description: app.job.description
      },
      status: app.status.toLowerCase(),
      appliedDate: app.appliedAt.toISOString(),
      notes: app.notes,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      interviewDate: app.interviewDate?.toISOString(),
      interviewType: app.interviewType
    }));

    return NextResponse.json({
      success: true,
      applications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
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

    const { job, notes, coverLetter, resumeUrl } = await request.json();

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

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: dbJob.id
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        message: 'You have already applied to this job',
        application: existingApplication
      }, { status: 400 });
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: dbJob.id,
        status: 'APPLIED',
        notes: notes || null,
        coverLetter: coverLetter || null,
        resumeUrl: resumeUrl || null
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
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        jobId: application.jobId,
        job: {
          id: application.job.id,
          title: application.job.title,
          company: application.job.company?.name || job.company,
          location: application.job.location,
          type: application.job.type,
          salary: application.job.salary,
          description: application.job.description
        },
        status: application.status.toLowerCase(),
        appliedDate: application.appliedAt.toISOString(),
        notes: application.notes,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl
      }
    });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
