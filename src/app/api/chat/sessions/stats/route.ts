// GET /api/chat/sessions/stats - Get session statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // If requesting stats for a specific user, verify admin or self
    if (targetUserId && targetUserId !== user.id) {
      // For now, only allow users to see their own stats
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userIdToQuery = targetUserId || user.id;

    // Get comprehensive session statistics
    const [
      totalSessions,
      activeSessions,
      sessionsByType,
      recentSessions,
      averageSessionDuration,
      totalMessages
    ] = await Promise.all([
      // Total sessions count
      prisma.chatSession.count({
        where: { userId: userIdToQuery }
      }),

      // Active sessions (last activity within 24 hours)
      prisma.chatSession.count({
        where: {
          userId: userIdToQuery,
          lastMessageAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Sessions grouped by type
      prisma.chatSession.groupBy({
        by: ['type'],
        where: { userId: userIdToQuery },
        _count: { type: true }
      }),

      // Recent sessions (last 30 days)
      prisma.chatSession.findMany({
        where: {
          userId: userIdToQuery,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          lastMessageAt: true,
          messageCount: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Average session duration (rough estimate based on message frequency)
      prisma.chatSession.aggregate({
        where: { userId: userIdToQuery },
        _avg: {
          messageCount: true
        }
      }),

      // Total messages across all sessions
      prisma.chatMessage.count({
        where: {
          session: {
            userId: userIdToQuery
          }
        }
      })
    ]);

    // Calculate peak concurrent users (simplified - just active sessions)
    const peakConcurrentUsers = Math.min(activeSessions, 10); // Cap at reasonable number

    // Format session types
    const sessionTypes: Record<string, number> = {};
    sessionsByType.forEach(group => {
      sessionTypes[group.type] = group._count.type;
    });

    // Calculate average duration (rough estimate: 5 minutes per message)
    const averageDuration = (averageSessionDuration._avg.messageCount || 0) * 5;

    const stats = {
      totalSessions,
      activeSessions,
      averageDuration,
      totalMessages,
      peakConcurrentUsers,
      sessionTypes,
      recentSessions,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching session statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
