import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser, getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limit';
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
        
        const { userId: tokenUserId } = getAuth(authRequest as RequestLike);
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

export async function GET(request: NextRequest) {
  // Apply lenient rate limiting for read operations
  const rateLimitResult = await rateLimiters.read.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    console.log('🚀 GET /api/jobs/alerts - Request received');
    console.log('🔐 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      console.log('❌ GET /api/jobs/alerts - No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ GET /api/jobs/alerts - User authenticated:', clerkId);

    // Get user with job alerts from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        jobAlerts: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform alerts to match expected format
    const alerts = user.jobAlerts.map((alert: any) => ({
      id: alert.id,
      name: alert.name,
      keywords: alert.keywords,
      location: alert.location,
      frequency: alert.frequency,
      isActive: alert.isActive,
      createdDate: alert.createdAt.toISOString(),
      lastSent: alert.lastSent?.toISOString() || 'Never',
      newMatches: alert.newMatches
    }));

    return NextResponse.json({
      success: true,
      alerts
    });

  } catch (error) {
    console.error('Error fetching job alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply standard rate limiting for create operations
  const rateLimitResult = await rateLimiters.api.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    const clerkId = await getUserFromRequest(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertData = await request.json();

    if (!alertData.name || !alertData.keywords) {
      return NextResponse.json({ 
        error: 'Alert name and keywords are required' 
      }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new alert in database
    const newAlert = await prisma.jobAlert.create({
      data: {
        userId: user.id,
        name: alertData.name,
        keywords: alertData.keywords,
        location: alertData.location || 'Any location',
        frequency: alertData.frequency || 'weekly',
        isActive: alertData.isActive !== false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job alert created successfully',
      alert: {
        id: newAlert.id,
        name: newAlert.name,
        keywords: newAlert.keywords,
        location: newAlert.location,
        frequency: newAlert.frequency,
        isActive: newAlert.isActive,
        createdDate: newAlert.createdAt.toISOString(),
        lastSent: newAlert.lastSent?.toISOString() || 'Never',
        newMatches: newAlert.newMatches
      }
    });

  } catch (error) {
    console.error('Error creating job alert:', error);
    return NextResponse.json(
      { error: 'Failed to create job alert' },
      { status: 500 }
    );
  }
}
