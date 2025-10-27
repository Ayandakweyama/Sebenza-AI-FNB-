import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = params;
    const updates = await request.json();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the alert in database
    const updatedAlert = await prisma.jobAlert.updateMany({
      where: {
        id: alertId,
        userId: user.id
      },
      data: updates
    });

    if (updatedAlert.count === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Fetch the updated alert
    const alert = await prisma.jobAlert.findUnique({
      where: { id: alertId }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
      alert: alert ? {
        id: alert.id,
        name: alert.name,
        keywords: alert.keywords,
        location: alert.location,
        frequency: alert.frequency,
        isActive: alert.isActive,
        createdDate: alert.createdAt.toISOString(),
        lastSent: alert.lastSent?.toISOString() || 'Never',
        newMatches: alert.newMatches
      } : null
    });

  } catch (error) {
    console.error('Error updating job alert:', error);
    return NextResponse.json(
      { error: 'Failed to update job alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = params;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the alert from database
    const deletedAlert = await prisma.jobAlert.deleteMany({
      where: {
        id: alertId,
        userId: user.id
      }
    });

    if (deletedAlert.count === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete job alert' },
      { status: 500 }
    );
  }
}
