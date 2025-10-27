import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/account-settings - Get account settings
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { accountSettings: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create default settings if they don't exist
    if (!user.accountSettings) {
      const settings = await prisma.accountSettings.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          pushNotifications: true,
          jobAlerts: true,
          weeklyReports: true,
          marketingEmails: false,
          profileVisibility: 'private',
          showEmail: false,
          showPhone: false,
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY'
        }
      });
      return NextResponse.json(settings);
    }

    return NextResponse.json(user.accountSettings);
  } catch (error) {
    console.error('Error fetching account settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/account-settings - Update account settings
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await prisma.accountSettings.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating account settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
