import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NotificationPayload {
  type: 'evaluation_completed' | 'report_generated' | 'action_reminder';
  userId: string;
  tenantId: string;
  data: {
    evaluationId?: string;
    assetName?: string;
    reportUrl?: string;
    [key: string]: any;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly slackWebhookUrl?: string;
  private readonly emailEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.slackWebhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    this.emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED') || false;
  }

  /**
   * Send notification via all enabled channels
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send email if enabled
    if (this.emailEnabled) {
      promises.push(this.sendEmail(payload).catch((err) => {
        this.logger.error(`Email notification failed: ${err.message}`);
      }));
    }

    // Send Slack if configured
    if (this.slackWebhookUrl) {
      promises.push(this.sendSlack(payload).catch((err) => {
        this.logger.error(`Slack notification failed: ${err.message}`);
      }));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send email notification (mock implementation - can be replaced with SendGrid/Nodemailer)
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    // TODO: Integrate with actual email service (SendGrid, Nodemailer, etc.)
    this.logger.log(`[Email] ${payload.type} notification for user ${payload.userId}`);
    
    const subject = this.getEmailSubject(payload);
    const body = this.getEmailBody(payload);
    
    // In a real implementation, you would use an email service here
    // Example with Nodemailer:
    // await this.mailerService.sendMail({
    //   to: userEmail,
    //   subject,
    //   html: body,
    // });
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(payload: NotificationPayload): Promise<void> {
    if (!this.slackWebhookUrl) {
      return;
    }

    const message = this.buildSlackMessage(payload);

    try {
      await axios.post(this.slackWebhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Slack notification sent for ${payload.type}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Slack API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build Slack message payload
   */
  private buildSlackMessage(payload: NotificationPayload): any {
    const title = this.getNotificationTitle(payload);
    const description = this.getNotificationDescription(payload);
    const color = this.getNotificationColor(payload.type);

    return {
      text: title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: description,
          },
        },
        ...(payload.data.reportUrl
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View Report',
                      emoji: true,
                    },
                    style: 'primary',
                    url: payload.data.reportUrl,
                  },
                ],
              },
            ]
          : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Tenant: ${payload.tenantId} | Time: ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
      attachments: [
        {
          color,
          fields: this.buildSlackFields(payload),
        },
      ],
    };
  }

  /**
   * Build Slack fields from payload data
   */
  private buildSlackFields(payload: NotificationPayload): Array<{ title: string; value: string; short: boolean }> {
    const fields: Array<{ title: string; value: string; short: boolean }> = [];

    if (payload.data.assetName) {
      fields.push({
        title: 'Asset',
        value: payload.data.assetName,
        short: true,
      });
    }

    if (payload.data.evaluationId) {
      fields.push({
        title: 'Evaluation ID',
        value: payload.data.evaluationId.substring(0, 8) + '...',
        short: true,
      });
    }

    return fields;
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(payload: NotificationPayload): string {
    const titles: Record<string, string> = {
      evaluation_completed: '✅ Evaluation Completed',
      report_generated: '📊 Report Generated',
      action_reminder: '⏰ Action Reminder',
    };
    return titles[payload.type] || '📬 Notification';
  }

  /**
   * Get notification description
   */
  private getNotificationDescription(payload: NotificationPayload): string {
    const descriptions: Record<string, string> = {
      evaluation_completed: `The evaluation for *${payload.data.assetName || 'your asset'}* has been completed.`,
      report_generated: `A detailed report has been generated for *${payload.data.assetName || 'your asset'}*.`,
      action_reminder: `Don't forget to review the action items for *${payload.data.assetName || 'your asset'}*.`,
    };
    return descriptions[payload.type] || 'You have a new notification.';
  }

  /**
   * Get notification color for Slack
   */
  private getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      evaluation_completed: 'good',
      report_generated: '#4f46e5',
      action_reminder: 'warning',
    };
    return colors[type] || '#36a64f';
  }

  /**
   * Get email subject
   */
  private getEmailSubject(payload: NotificationPayload): string {
    const subjects: Record<string, string> = {
      evaluation_completed: `Evaluation Completed: ${payload.data.assetName || 'Your Asset'}`,
      report_generated: `Report Generated: ${payload.data.assetName || 'Your Asset'}`,
      action_reminder: `Action Reminder: ${payload.data.assetName || 'Your Asset'}`,
    };
    return subjects[payload.type] || 'Notification from Asset Rating Platform';
  }

  /**
   * Get email body (HTML)
   */
  private getEmailBody(payload: NotificationPayload): string {
    const title = this.getNotificationTitle(payload);
    const description = this.getNotificationDescription(payload);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${description}</p>
      ${payload.data.reportUrl ? `<a href="${payload.data.reportUrl}" class="button">View Report</a>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated notification from Asset Rating Platform.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

