import { Job } from '@/lib/scrapers/types';

interface EmailConfig {
  from: string;
  apiKey: string;
  provider: 'sendgrid' | 'resend' | 'nodemailer';
}

interface JobAlertEmailData {
  recipientEmail: string;
  recipientName: string;
  alertName: string;
  jobs: Job[];
  alertId: string;
  unsubscribeUrl: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      from: process.env.EMAIL_FROM || 'noreply@sebenza-ai.com',
      apiKey: process.env.EMAIL_SERVICE_API_KEY || '',
      provider: (process.env.EMAIL_PROVIDER as EmailConfig['provider']) || 'resend',
    };
  }

  async sendJobAlertEmail(data: JobAlertEmailData): Promise<boolean> {
    if (!this.config.apiKey) {
      console.warn('Email service not configured. Skipping email notification.');
      return false;
    }

    try {
      const emailHtml = this.generateJobAlertHtml(data);
      const emailText = this.generateJobAlertText(data);

      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend({
            to: data.recipientEmail,
            subject: `New jobs matching "${data.alertName}" - Sebenza AI`,
            html: emailHtml,
            text: emailText,
          });
        
        case 'sendgrid':
          return await this.sendViaSendGrid({
            to: data.recipientEmail,
            subject: `New jobs matching "${data.alertName}" - Sebenza AI`,
            html: emailHtml,
            text: emailText,
          });
        
        default:
          console.warn(`Email provider ${this.config.provider} not implemented`);
          return false;
      }
    } catch (error) {
      console.error('Failed to send job alert email:', error);
      return false;
    }
  }

  private async sendViaResend(emailData: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.from,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send via Resend:', error);
      return false;
    }
  }

  private async sendViaSendGrid(emailData: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }],
          }],
          from: { email: this.config.from },
          subject: emailData.subject,
          content: [
            { type: 'text/plain', value: emailData.text },
            { type: 'text/html', value: emailData.html },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send via SendGrid:', error);
      return false;
    }
  }

  private generateJobAlertHtml(data: JobAlertEmailData): string {
    const jobsHtml = data.jobs.map(job => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${job.title}</h3>
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
          <strong>${job.company}</strong> • ${job.location}
        </p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
          ${job.salary || 'Salary not specified'} • ${job.jobType || 'Full-time'}
        </p>
        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          ${job.description ? job.description.substring(0, 200) + '...' : 'No description available'}
        </p>
        <a href="${job.url || '#'}" style="display: inline-block; padding: 8px 16px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          View Job
        </a>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Job Alert - Sebenza AI</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Sebenza AI</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Your AI-Powered Career Assistant</p>
            </div>
            
            <!-- Content -->
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937;">Hi ${data.recipientName},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                We found <strong>${data.jobs.length} new job${data.jobs.length !== 1 ? 's' : ''}</strong> matching your alert "<strong>${data.alertName}</strong>".
              </p>
              
              ${jobsHtml}
              
              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                  You're receiving this because you created a job alert on Sebenza AI.
                </p>
                <a href="${data.unsubscribeUrl}" style="color: #7c3aed; font-size: 12px; text-decoration: none;">
                  Manage alerts
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateJobAlertText(data: JobAlertEmailData): string {
    const jobsText = data.jobs.map(job => 
      `${job.title}\n${job.company} • ${job.location}\n${job.salary || 'Salary not specified'}\n${job.url || 'No URL'}\n`
    ).join('\n---\n\n');

    return `Hi ${data.recipientName},

We found ${data.jobs.length} new job${data.jobs.length !== 1 ? 's' : ''} matching your alert "${data.alertName}".

${jobsText}

---
Manage your alerts: ${data.unsubscribeUrl}

Sebenza AI - Your AI-Powered Career Assistant`;
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    if (!this.config.apiKey) {
      console.warn('Email service not configured. Skipping welcome email.');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Sebenza AI</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed;">Welcome to Sebenza AI, ${name}!</h1>
            <p>Thank you for joining Sebenza AI, your AI-powered career assistant.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Search for jobs with AI-powered matching</li>
              <li>Create personalized job alerts</li>
              <li>Track your applications</li>
              <li>Get AI assistance with resumes and cover letters</li>
              <li>Prepare for interviews with AI coaching</li>
            </ul>
            <p>Get started by <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #7c3aed;">visiting your dashboard</a>.</p>
            <p>Best regards,<br>The Sebenza AI Team</p>
          </div>
        </body>
      </html>
    `;

    const text = `Welcome to Sebenza AI, ${name}!

Thank you for joining Sebenza AI, your AI-powered career assistant.

Here's what you can do:
- Search for jobs with AI-powered matching
- Create personalized job alerts
- Track your applications
- Get AI assistance with resumes and cover letters
- Prepare for interviews with AI coaching

Get started by visiting your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Best regards,
The Sebenza AI Team`;

    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend({
            to: email,
            subject: 'Welcome to Sebenza AI',
            html,
            text,
          });
        
        case 'sendgrid':
          return await this.sendViaSendGrid({
            to: email,
            subject: 'Welcome to Sebenza AI',
            html,
            text,
          });
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
