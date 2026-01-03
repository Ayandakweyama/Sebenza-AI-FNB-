import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser, getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import type { RequestLike } from '@clerk/nextjs/server';

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
        // Create a new request object with the token for verification
        const authRequest = new Request(request.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const { userId: tokenUserId } = getAuth(authRequest);
        if (tokenUserId) {
          console.log('✅ Got user from token:', tokenUserId);
          return tokenUserId;
        } else {
          console.log('❌ Token verification returned no userId');
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

    return NextResponse.json({ profile: user.profile || {} });
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
