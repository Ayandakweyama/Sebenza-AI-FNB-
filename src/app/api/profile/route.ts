import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser, getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ensureDbUser } from '@/lib/auth/ensureDbUser';
import type { RequestLike } from '@clerk/nextjs/server';

function toJsonArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function toInt(value: any): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.round(value);
}

function pickUserProfileFields(input: any) {
  if (!input || typeof input !== 'object') return {};
  const allowed = [
    'firstName',
    'lastName',
    'phone',
    'location',
    'bio',
    'avatar',
    'linkedinUrl',
    'githubUrl',
    'websiteUrl',
    'title',
    'company',
    'experience',
    'industry',
  ] as const;

  const out: Record<string, any> = {};
  for (const key of allowed) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  return out;
}

function normalizeJobPreferences(input: any) {
  if (!input || typeof input !== 'object') return {};

  const desiredRoles = [...toJsonArray(input.desiredRoles)];
  if (!desiredRoles.length && typeof input.jobTitle === 'string' && input.jobTitle.trim()) {
    desiredRoles.push(input.jobTitle.trim());
  }

  const industries = toJsonArray(input.industries);
  const locations = toJsonArray(input.locations);

  const jobType = [...toJsonArray(input.jobType)];
  if (!jobType.length && Array.isArray(input.jobTypes)) jobType.push(...input.jobTypes);

  const remoteWork =
    typeof input.remoteWork === 'boolean'
      ? input.remoteWork
      : input.remotePreference === 'Remote' || input.remotePreference === 'remote';

  const salaryMin = toInt(input.salaryMin ?? input.salaryExpectation);
  const salaryMax = toInt(input.salaryMax);

  const skills = toJsonArray(input.skills);
  const keywords = toJsonArray(input.keywords);
  const companySize = toJsonArray(input.companySize);

  const out: Record<string, any> = {
    desiredRoles,
    industries,
    locations,
    remoteWork,
    salaryMin,
    salaryMax,
    salaryCurrency: input.salaryCurrency,
    careerLevel: input.careerLevel,
    jobType,
    companySize,
    skills,
    keywords,
  };

  Object.keys(out).forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });

  return out;
}

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

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: true,
        accountSettings: true,
        jobPreferences: true,
        profileSnapshot: true,
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
      await ensureDbUser(clerkId);
      user = await prisma.user.findUnique({
        where: { clerkId },
        include: {
          profile: true,
          accountSettings: true,
          jobPreferences: true,
          profileSnapshot: true,
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
    }

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name
      },
      profile: user.profile || {},
      jobPreferences: user.jobPreferences || {},
      skills: user.skills || [],
      profileSnapshot: user.profileSnapshot?.data || null
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
    const { profile, jobPreferences, profileSnapshot } = body;

    let user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      await ensureDbUser(clerkId);
      user = await prisma.user.findUnique({ where: { clerkId } });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Start a transaction to update both profile and job preferences
    const result = await prisma.$transaction(async (tx) => {
      let updatedProfile = null;
      let updatedJobPreferences = null;
      let updatedProfileSnapshot = null;

      // Update profile if provided
      if (profile) {
        const profileDataWithoutExtras = pickUserProfileFields(profile);
        
        updatedProfile = await tx.userProfile.upsert({
          where: { userId: user.id },
          update: profileDataWithoutExtras,
          create: {
            userId: user.id,
            ...profileDataWithoutExtras
          }
        });
      }

      // Update job preferences if provided
      if (jobPreferences) {
        const jobPrefsNormalized = normalizeJobPreferences(jobPreferences);
        updatedJobPreferences = await tx.jobPreferences.upsert({
          where: { userId: user.id },
          update: jobPrefsNormalized,
          create: {
            userId: user.id,
            ...jobPrefsNormalized
          }
        });
      }

      if (profileSnapshot) {
        updatedProfileSnapshot = await tx.profileSnapshot.upsert({
          where: { userId: user.id },
          update: { data: profileSnapshot },
          create: { userId: user.id, data: profileSnapshot }
        });
      }

      return {
        profile: updatedProfile,
        jobPreferences: updatedJobPreferences,
        profileSnapshot: updatedProfileSnapshot
      };
    });

    return NextResponse.json({ 
      success: true,
      profile: result.profile,
      jobPreferences: result.jobPreferences,
      profileSnapshot: result.profileSnapshot?.data || null
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
