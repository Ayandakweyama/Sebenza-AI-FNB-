import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const history = await prisma.atsAnalysisHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { atsQualityScore, jobMatchScore, jobDescription, analysis } = body ?? {};

    if (typeof atsQualityScore !== 'number' || !analysis) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const created = await prisma.atsAnalysisHistory.create({
      data: {
        userId: user.id,
        atsQualityScore,
        jobMatchScore: typeof jobMatchScore === 'number' ? jobMatchScore : null,
        jobDescription: typeof jobDescription === 'string' ? jobDescription : null,
        analysis
      }
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
