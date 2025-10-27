import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test the database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to database', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
