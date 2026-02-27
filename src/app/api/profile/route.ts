import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Helper function to get user from request
async function getUserFromRequest(_request: NextRequest) {
  try {
    const { userId } = await auth();
    return userId || null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: true,
        accountSettings: true,
        jobPreferences: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        },
        skills: {
          orderBy: { category: 'asc' }
        },
        careerJourney: {
          include: {
            milestones: {
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        assessments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.profile || {},
      user: { email: user.email, name: user.name },
      accountSettings: user.accountSettings || null,
      jobPreferences: user.jobPreferences || null,
      skills: user.skills || [],
      documents: user.documents || [],
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const clerkId = await getUserFromRequest(request);

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, jobPreferences } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Start a transaction to update both profile and job preferences
    const result = await prisma.$transaction(async (tx) => {
      let updatedProfile = null;
      let updatedJobPreferences = null;

      // Update profile if provided
      if (profile) {
        // Extract fields that don't belong in userProfile
        const { skills, education, workExperience, ...profileDataWithoutExtras } = profile;
        
        updatedProfile = await tx.userProfile.upsert({
          where: { userId: user.id },
          update: profileDataWithoutExtras,
          create: {
            userId: user.id,
            ...profileDataWithoutExtras
          }
        });
        
        // Note: Education and work experience would need separate models in the schema
        // For now, we're just storing the core profile data
      }

      // Update job preferences if provided
      if (jobPreferences) {
        // Remove languages from jobPreferences as it's not a field in the schema
        const { languages, ...jobPrefsWithoutLanguages } = jobPreferences;
        
        // Ensure skills is an array
        if (jobPrefsWithoutLanguages.skills && !Array.isArray(jobPrefsWithoutLanguages.skills)) {
          jobPrefsWithoutLanguages.skills = [];
        }
        
        updatedJobPreferences = await tx.jobPreferences.upsert({
          where: { userId: user.id },
          update: jobPrefsWithoutLanguages,
          create: {
            userId: user.id,
            ...jobPrefsWithoutLanguages
          }
        });
      }

      return { profile: updatedProfile, jobPreferences: updatedJobPreferences };
    });

    return NextResponse.json({ 
      success: true,
      profile: result.profile,
      jobPreferences: result.jobPreferences 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
