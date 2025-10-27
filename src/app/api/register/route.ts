import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
    const evt = wh.verify(JSON.stringify(payload), {
      'svix-id': request.headers.get('svix-id') || '',
      'svix-timestamp': request.headers.get('svix-timestamp') || '',
      'svix-signature': request.headers.get('svix-signature') || '',
    }) as WebhookEvent;

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === 'user.created') {
      const { id, first_name, last_name, email_addresses, created_at } = evt.data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name} ${last_name}`.trim();

      // Store additional user data in your database
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {},
        create: {
          name,
          email,
          clerkId: id,
          createdAt: new Date(created_at * 1000),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
