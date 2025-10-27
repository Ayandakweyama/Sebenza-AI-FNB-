import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const jobCount = await prisma.job.count();
    const applicationCount = await prisma.application.count();
    
    return NextResponse.json({
      success: true,
      counts: {
        users: userCount,
        companies: companyCount,
        jobs: jobCount,
        applications: applicationCount
      },
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
