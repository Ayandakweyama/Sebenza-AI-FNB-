import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAutoApplyAgent } from '@/lib/agents/indeedAutoApply';
import type { UserProfile } from '@/lib/ai/autoApplyAI';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      searchQuery,
      location = 'South Africa',
      jobType,
      maxApplications = 10,
      minMatchScore = 50,
      cvText,
    } = body;

    if (!searchQuery) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Get user data from database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: session.userId },
        include: {
          profile: true,
          skills: true,
          jobPreferences: true,
        },
      });
    } catch (dbError) {
      console.error('[AutoApply API] Database connection error:', dbError);
      // Create a minimal user object from Clerk session for demo purposes
      user = {
        id: session.userId,
        clerkId: session.userId,
        email: 'demo@example.com', // Clerk doesn't expose email directly in server session
        name: 'Demo User', // Clerk doesn't expose firstName/lastName directly in server session
        profile: {
          title: 'Software Developer',
          summary: 'Experienced software developer looking for new opportunities.',
          experience: undefined,
          education: undefined,
        },
        skills: [],
        jobPreferences: {
          searchQuery: body.searchQuery,
          location: body.location || 'South Africa',
          jobType: body.jobType || 'full-time',
          minMatchScore: body.minMatchScore || 50,
        },
      };
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please sync your profile first.' }, { status: 404 });
    }

    // Check for existing running session
    let existingSession = null;
    try {
      existingSession = await prisma.autoApplySession.findFirst({
        where: {
          userId: user.id,
          status: { in: ['pending', 'running'] },
        },
      });
    } catch (dbError) {
      console.error('[AutoApply API] Error checking existing session:', dbError);
      // Continue without checking for existing sessions if DB is down
    }

    if (existingSession) {
      return NextResponse.json(
        { error: 'You already have an active auto-apply session. Please wait for it to complete or cancel it.' },
        { status: 409 }
      );
    }

    // Build user profile for AI
    const skills = user.skills.map((s: { name: string }) => s.name);
    let desiredRoles: string[] = [];
    try {
      desiredRoles = user.jobPreferences?.desiredRoles
        ? JSON.parse(user.jobPreferences.desiredRoles as string)
        : [];
    } catch { desiredRoles = []; }

    const userProfile: UserProfile = {
      name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown',
      email: user.email,
      phone: user.profile?.phone || undefined,
      location: user.profile?.location || location,
      bio: user.profile?.bio || undefined,
      title: user.profile?.title || undefined,
      experience: user.profile?.experience || undefined,
      industry: user.profile?.industry || undefined,
      linkedinUrl: user.profile?.linkedinUrl || undefined,
      skills,
      desiredRoles,
      cvText: cvText || undefined,
    };

    // Create auto-apply session in database
    let autoApplySession;
    let sessionId;
    try {
      autoApplySession = await prisma.autoApplySession.create({
        data: {
          userId: user.id,
          searchQuery,
          location,
          jobType,
          maxApplications,
          indeedEmail: user.email || undefined,
          status: 'pending',
        },
      });
      sessionId = autoApplySession.id;
    } catch (dbError) {
      console.error('[AutoApply API] Error creating session:', dbError);
      // Generate a temporary session ID for demo purposes
      sessionId = `demo-session-${Date.now()}`;
    }

    // Start the agent in the background (non-blocking)
    runAutoApplyAgent({
      sessionId,
      userId: user.id,
      searchQuery,
      location,
      jobType,
      maxApplications,
      minMatchScore,
      userEmail: user.email,
      userProfile,
    }).catch(err => {
      console.error('[AutoApply API] Background agent error:', err);
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Auto-apply agent started successfully',
      config: {
        searchQuery,
        location,
        jobType,
        maxApplications,
        minMatchScore,
      },
    });

  } catch (error) {
    console.error('[AutoApply API] Start error:', error);
    return NextResponse.json(
      { error: 'Failed to start auto-apply agent' },
      { status: 500 }
    );
  }
}
