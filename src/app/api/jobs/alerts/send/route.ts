import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import type { Job } from '@/lib/scrapers/types';

// This endpoint can be called by a cron job to send job alert emails
// In production, use Vercel Cron or similar service
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active job alerts that need to be sent
    const now = new Date();
    const alerts = await prisma.jobAlert.findMany({
      where: {
        isActive: true,
        OR: [
          { lastSent: null },
          {
            AND: [
              { frequency: 'daily', lastSent: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
            ]
          },
          {
            AND: [
              { frequency: 'weekly', lastSent: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            ]
          },
          {
            AND: [
              { frequency: 'monthly', lastSent: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
            ]
          },
        ]
      },
      include: {
        user: true
      }
    });

    console.log(`Processing ${alerts.length} job alerts`);

    let successCount = 0;
    let errorCount = 0;

    for (const alert of alerts) {
      try {
        // Search for jobs matching the alert criteria
        const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape-fallback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: alert.keywords,
            location: alert.location,
            maxPages: 1
          })
        });

        if (!searchResponse.ok) {
          console.error(`Failed to search jobs for alert ${alert.id}`);
          errorCount++;
          continue;
        }

        const searchData = await searchResponse.json();
        const jobs: Job[] = searchData.jobs || [];

        if (jobs.length === 0) {
          console.log(`No new jobs found for alert ${alert.id}`);
          // Update lastSent even if no jobs found
          await prisma.jobAlert.update({
            where: { id: alert.id },
            data: { lastSent: now }
          });
          continue;
        }

        // Send email notification
        const emailSent = await emailService.sendJobAlertEmail({
          recipientEmail: alert.user.email,
          recipientName: alert.user.name || 'User',
          alertName: alert.name,
          jobs: jobs.slice(0, 10), // Limit to 10 jobs per email
          alertId: alert.id,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/alerts`
        });

        if (emailSent) {
          // Update alert with last sent time and new matches count
          await prisma.jobAlert.update({
            where: { id: alert.id },
            data: {
              lastSent: now,
              newMatches: jobs.length
            }
          });
          successCount++;
          console.log(`Sent job alert email for ${alert.id} with ${jobs.length} jobs`);
        } else {
          errorCount++;
          console.error(`Failed to send email for alert ${alert.id}`);
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${alerts.length} alerts`,
      results: {
        total: alerts.length,
        successful: successCount,
        failed: errorCount
      }
    });

  } catch (error) {
    console.error('Error in job alerts send process:', error);
    return NextResponse.json(
      { error: 'Failed to process job alerts' },
      { status: 500 }
    );
  }
}

// GET endpoint to check the status
export async function GET(request: NextRequest) {
  try {
    // Get statistics about pending alerts
    const now = new Date();
    const pendingAlerts = await prisma.jobAlert.count({
      where: {
        isActive: true,
        OR: [
          { lastSent: null },
          {
            AND: [
              { frequency: 'daily', lastSent: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
            ]
          },
          {
            AND: [
              { frequency: 'weekly', lastSent: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            ]
          },
          {
            AND: [
              { frequency: 'monthly', lastSent: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
            ]
          },
        ]
      }
    });

    const totalAlerts = await prisma.jobAlert.count();
    const activeAlerts = await prisma.jobAlert.count({ where: { isActive: true } });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalAlerts,
        active: activeAlerts,
        pending: pendingAlerts
      }
    });

  } catch (error) {
    console.error('Error getting alert stats:', error);
    return NextResponse.json(
      { error: 'Failed to get alert statistics' },
      { status: 500 }
    );
  }
}
