import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limit';

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
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const alerts = user.jobAlerts.map(alert => ({
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
    const { userId: clerkId } = await auth();
    
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
