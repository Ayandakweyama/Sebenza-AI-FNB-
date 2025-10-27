import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/subscription - Get user subscription
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no active subscription, create a free one
    if (!subscription) {
      const freeSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planName: 'Free Plan',
          planType: 'free',
          status: 'active',
          amount: 0,
          currency: 'usd',
          interval: 'month'
        }
      });
      return NextResponse.json(freeSubscription);
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscription - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planType, planName, amount, currency, interval, stripeCustomerId, stripeSubscriptionId } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        status: 'active'
      },
      data: { 
        status: 'cancelled',
        currentPeriodEnd: new Date()
      }
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planName,
        planType,
        status: 'active',
        amount,
        currency: currency || 'usd',
        interval: interval || 'month',
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/subscription - Cancel subscription
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, action } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'cancel') {
      const subscription = await prisma.subscription.update({
        where: { 
          id: subscriptionId,
          userId: user.id
        },
        data: { 
          status: 'cancelled',
          currentPeriodEnd: new Date()
        }
      });

      return NextResponse.json(subscription);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
