import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    JSON.stringify({ 
      status: 503,
      message: 'This feature is temporarily disabled for deployment.' 
    }),
    { 
      status: 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      } 
    }
  );
}

export const dynamic = 'force-static';
export const revalidate = 0;
