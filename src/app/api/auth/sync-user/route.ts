import { NextResponse, type NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[sync-user] Starting user sync process');
    
    // Get the current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      console.warn('[sync-user] No user found in session');
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'No user session found',
          details: 'Make sure you are signed in and the session is valid.'
        },
        { status: 401 }
      );
    }

    console.log(`[sync-user] Syncing user ${user.id}`);
    
    // Check if user exists in the database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: {
        profile: true,
        accountSettings: true,
        jobPreferences: true
      }
    });

    // Prepare user data
    const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || '';
    const userData = {
      email: primaryEmail,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      imageUrl: user.imageUrl || null,
    };

    if (!dbUser) {
      // Create new user if not exists
      console.log(`[sync-user] Creating new user for ${user.id}`);
      
      try {
        dbUser = await prisma.user.create({
          data: {
            clerkId: user.id,
            email: userData.email,
            name: userData.name,
            profile: {
              create: {
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                avatar: user.imageUrl || null,
              },
            },
            accountSettings: {
              create: {},
            },
            jobPreferences: {
              create: {},
            },
          },
          include: {
            profile: true,
            accountSettings: true,
            jobPreferences: true,
          },
        });
        
        console.log(`[sync-user] Created new user: ${dbUser.id}`);
      } catch (error) {
        console.error('[sync-user] Error creating user:', error);
        return NextResponse.json(
          { 
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      // Update existing user
      console.log(`[sync-user] Updating user ${dbUser.id}`);
      
      try {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            email: userData.email,
            name: userData.name,
            profile: dbUser.profile ? {
              update: {
                firstName: user.firstName || dbUser.profile.firstName,
                lastName: user.lastName || dbUser.profile.lastName,
                avatar: user.imageUrl || dbUser.profile.avatar,
              },
            } : {
              create: {
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                avatar: user.imageUrl || null,
              },
            },
          },
          include: {
            profile: true,
            accountSettings: true,
            jobPreferences: true,
          },
        });
        
        console.log(`[sync-user] Updated user: ${dbUser.id}`);
      } catch (error) {
        console.error('[sync-user] Error updating user:', error);
        return NextResponse.json(
          { 
            error: 'Failed to update user',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        profile: dbUser.profile,
      },
    });

  } catch (error) {
    console.error('[sync-user] Unexpected error:', error);
    
    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: 'Database Error',
          code: error.code,
          message: error.message,
          meta: error.meta,
          details: 'A database error occurred while processing your request.'
        },
        { status: 500 }
      );
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: errorMessage,
        details: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}
