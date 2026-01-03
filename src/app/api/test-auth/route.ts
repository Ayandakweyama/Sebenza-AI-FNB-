import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    console.log('[test-auth] Checking authentication...');
    
    // Try to get auth, but handle errors gracefully
    let userId, user;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      user = await currentUser();
    } catch (error) {
      console.log('[test-auth] Auth error:', error);
      return NextResponse.json(
        { 
          error: 'Auth error',
          message: error instanceof Error ? error.message : 'Unknown auth error',
          note: 'This is expected if not signed in'
        },
        { status: 200 } // Return 200 instead of 401 for testing
      );
    }
    
    if (!userId || !user) {
      console.log('[test-auth] No user authenticated');
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          userId: userId || null,
          user: user || null,
          note: 'Please sign in to test authentication'
        },
        { status: 200 } // Return 200 instead of 401 for testing
      );
    }
    
    console.log('[test-auth] User authenticated:', userId);
    
    return NextResponse.json({
      success: true,
      userId,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName} ${user.lastName}`.trim(),
    });
  } catch (error) {
    console.error('[test-auth] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
