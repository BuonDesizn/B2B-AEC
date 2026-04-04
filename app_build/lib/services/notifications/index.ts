import { db } from '@/lib/db';

// =============================================================================
// Notification Types
// =============================================================================

export type NotificationType =
  | 'CONNECTION_REQUESTED'
  | 'CONNECTION_ACCEPTED'
  | 'CONNECTION_REJECTED'
  | 'CONNECTION_BLOCKED'
  | 'CONNECTION_EXPIRED'
  | 'RFP_CREATED'
  | 'RFP_RESPONSE_SUBMITTED'
  | 'RFP_RESPONSE_ACCEPTED'
  | 'RFP_NEARBY'
  | 'RFP_CLOSED'
  | 'AD_PAYMENT_SUCCESS'
  | 'AD_SUSPENDED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRED';

export interface NotificationTemplates {
  [key: string]: {
    title: string;
    message: string;
  };
}

const NOTIFICATION_TEMPLATES: NotificationTemplates = {
  CONNECTION_REQUESTED: {
    title: 'New connection request',
    message: 'Someone wants to connect with you',
  },
  CONNECTION_ACCEPTED: {
    title: 'Your handshake was accepted',
    message: 'Your connection request has been accepted',
  },
  CONNECTION_REJECTED: {
    title: 'Connection request declined',
    message: 'Your connection request was declined',
  },
  CONNECTION_BLOCKED: {
    title: 'User blocked',
    message: 'You have been blocked by a user',
  },
  CONNECTION_EXPIRED: {
    title: 'Connection request expired',
    message: 'Your connection request has expired',
  },
  RFP_CREATED: {
    title: 'RFP published successfully',
    message: 'Your RFP has been published and is now live',
  },
  RFP_RESPONSE_SUBMITTED: {
    title: 'New response to your RFP',
    message: 'A professional has responded to your RFP',
  },
  RFP_RESPONSE_ACCEPTED: {
    title: 'Your RFP response was accepted',
    message: 'Your response to an RFP has been accepted',
  },
  RFP_NEARBY: {
    title: 'New RFP near your location',
    message: 'There is a new RFP matching your location',
  },
  RFP_CLOSED: {
    title: 'RFP has been closed',
    message: 'An RFP you responded to has been closed',
  },
  AD_PAYMENT_SUCCESS: {
    title: 'Your ad is now live',
    message: 'Payment confirmed, your ad is now active',
  },
  AD_SUSPENDED: {
    title: 'Your ad was flagged for review',
    message: 'Your ad has been suspended pending admin review',
  },
  SUBSCRIPTION_EXPIRING: {
    title: 'Subscription expiring soon',
    message: 'Your subscription will expire in 3 days',
  },
  SUBSCRIPTION_ACTIVATED: {
    title: 'Payment confirmed',
    message: 'Your subscription has been activated',
  },
  SUBSCRIPTION_EXPIRED: {
    title: 'Subscription renewal failed',
    message: 'Your subscription has expired',
  },
};

// =============================================================================
// Notification Service
// =============================================================================

export interface CreateNotificationInput {
  type: NotificationType;
  recipient_id: string;
  metadata?: Record<string, any>;
}

export const notificationService = {
  /**
   * Create a notification for a system event
   * @witness [COM-001]
   */
  async create(input: CreateNotificationInput) {
    const template = NOTIFICATION_TEMPLATES[input.type];

    if (!template) {
      throw new Error(`Unknown notification type: ${input.type}`);
    }

    const notification = await db
      .insertInto('notifications')
      .values({
        recipient_id: input.recipient_id,
        notification_type: input.type,
        type: input.type,
        title: template.title,
        message: template.message,
        metadata: input.metadata ?? {},
        is_read: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return notification;
  },

  /**
   * Get notifications for a user's inbox
   * Unread first, then by created_at DESC
   * @witness [COM-001]
   */
  async getInbox(
    userId: string,
    limit = 20,
    offset = 0
  ) {
    return await db
      .selectFrom('notifications')
      .selectAll()
      .where('recipient_id', '=', userId)
      .orderBy('is_read', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  /**
   * Mark a single notification as read
   * @witness [COM-001]
   */
  async markAsRead(notificationId: string, userId: string) {
    const now = new Date();

    return await db
      .updateTable('notifications')
      .set({
        is_read: true,
        read_at: now,
      })
      .where('id', '=', notificationId)
      .where('recipient_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  },

  /**
   * Mark all notifications as read for a user
   * @witness [COM-001]
   */
  async markAllAsRead(userId: string) {
    const now = new Date();

    const result = await db
      .updateTable('notifications')
      .set({
        is_read: true,
        read_at: now,
      })
      .where('recipient_id', '=', userId)
      .where('is_read', '=', false)
      .execute();

    return { marked_count: result.length };
  },

  /**
   * Get notification preferences for a user
   * @witness [COM-001]
   */
  async getPreferences(userId: string) {
    const prefs = await db
      .selectFrom('notification_preferences')
      .selectAll()
      .where('profile_id', '=', userId)
      .executeTakeFirst();

    if (!prefs) {
      // Return defaults
      return {
        profile_id: userId,
        receive_email_notifications: true,
        receive_sms_notifications: false,
        receive_push_notifications: true,
        connection_requests: true,
        rfp_responses: true,
        subscription_alerts: true,
        payment_notifications: true,
      };
    }

    return prefs;
  },

  /**
   * Update notification preferences
   * @witness [COM-001]
   */
  async updatePreferences(
    userId: string,
    updates: {
      receive_email_notifications?: boolean;
      receive_sms_notifications?: boolean;
      receive_push_notifications?: boolean;
      connection_requests?: boolean;
      rfp_responses?: boolean;
      subscription_alerts?: boolean;
      payment_notifications?: boolean;
    }
  ) {
    // Validate boolean fields only
    const validKeys = [
      'receive_email_notifications',
      'receive_sms_notifications',
      'receive_push_notifications',
      'connection_requests',
      'rfp_responses',
      'subscription_alerts',
      'payment_notifications',
    ];

    for (const key of Object.keys(updates)) {
      if (!validKeys.includes(key)) {
        throw new Error(`Invalid preference field: ${key}`);
      }
      if (typeof (updates as any)[key] !== 'boolean') {
        throw new Error(`Preference field ${key} must be a boolean`);
      }
    }

    const existing = await db
      .selectFrom('notification_preferences')
      .select('profile_id')
      .where('profile_id', '=', userId)
      .executeTakeFirst();

    if (existing) {
      return await db
        .updateTable('notification_preferences')
        .set(updates)
        .where('profile_id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      return await db
        .insertInto('notification_preferences')
        .values({
          profile_id: userId,
          ...updates,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }
  },

  /**
   * Send notifications for system events
   * This is the main orchestration method called by other services
   * @witness [COM-001]
   */
  async emitEvent(
    type: NotificationType,
    recipientId: string,
    metadata?: Record<string, any>
  ) {
    try {
      const notification = await this.create({
        type,
        recipient_id: recipientId,
        metadata,
      });

      // Check if email fallback should be triggered
      const prefs = await this.getPreferences(recipientId);

      if (prefs.receive_email_notifications && !notification.is_read) {
        // Queue email for delivery
        await db
          .insertInto('email_queue')
          .values({
            recipient_id: recipientId,
            to_email: '', // Will be populated from profile email
            notification_id: notification.id,
            subject: notification.title,
            body_html: notification.message,
            body: notification.message,
            status: 'PENDING',
          })
          .execute();
      }

      return notification;
    } catch (error) {
      console.error(`Failed to emit notification event ${type}:`, error);
      throw error;
    }
  },
};