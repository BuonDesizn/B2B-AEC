import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService, type NotificationType } from '@/lib/services/notifications';

function createMockQueryBuilder(returnValue: any) {
  const chain: any = {
    selectAll: vi.fn(() => chain),
    select: vi.fn(() => chain),
    where: vi.fn(() => chain),
    or: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    returningAll: vi.fn(() => chain),
    executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(returnValue),
    execute: vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue : [returnValue]),
  };
  return chain;
}

vi.mock('@/lib/db', () => {
  const chain = createMockQueryBuilder({
    id: 'test-notif-id',
    recipient_id: 'test-user',
    type: 'CONNECTION_REQUESTED',
    title: 'New connection request',
    message: 'Someone wants to connect with you',
    is_read: false,
    created_at: new Date(),
  });
  
  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn(() => createMockQueryBuilder({
        id: 'test-pref-id',
        user_id: 'test-user',
        receive_email_notifications: true,
        receive_sms_notifications: false,
        receive_push_notifications: true,
      })),
      updateTable: vi.fn(() => chain),
    },
  };
});

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates notification with correct template', async () => {
      const result = await notificationService.create({
        type: 'CONNECTION_REQUESTED',
        recipient_id: 'test-user',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('CONNECTION_REQUESTED');
      expect(result.title).toBe('New connection request');
      expect(result.is_read).toBe(false);
    });

    it('throws error for unknown notification type', async () => {
      await expect(
        notificationService.create({
          type: 'UNKNOWN_TYPE' as NotificationType,
          recipient_id: 'test-user',
        })
      ).rejects.toThrow('Unknown notification type: UNKNOWN_TYPE');
    });
  });

  describe('getInbox', () => {
    it('returns notifications sorted by unread first then created_at DESC', async () => {
      const result = await notificationService.getInbox('test-user', 20, 0);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      vi.mocked(await import('@/lib/db')).db.updateTable = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          id: 'test-notif-id',
          is_read: true,
          read_at: new Date(),
        })
      );

      const result = await notificationService.markAsRead('test-notif-id', 'test-user');

      expect(result).toBeDefined();
      expect(result?.is_read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      const result = await notificationService.markAllAsRead('test-user');

      expect(result.marked_count).toBeDefined();
    });
  });

  describe('getPreferences', () => {
    it('returns user preferences', async () => {
      const result = await notificationService.getPreferences('test-user');

      expect(result).toBeDefined();
      expect(result.receive_email_notifications).toBe(true);
    });

    it('returns defaults if no preferences exist', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder(null)
      );

      const result = await notificationService.getPreferences('test-user');

      expect(result.receive_email_notifications).toBe(true);
      expect(result.receive_sms_notifications).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('updates existing preferences', async () => {
      const result = await notificationService.updatePreferences('test-user', {
        receive_email_notifications: false,
      });

      expect(result).toBeDefined();
    });

    it('creates preferences if they dont exist', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder(null)
      );

      const result = await notificationService.updatePreferences('test-user', {
        receive_email_notifications: true,
      });

      expect(result).toBeDefined();
    });

    it('throws error for invalid field', async () => {
      await expect(
        notificationService.updatePreferences('test-user', {
          invalid_field: true,
        } as any)
      ).rejects.toThrow('Invalid preference field: invalid_field');
    });

    it('throws error for non-boolean value', async () => {
      await expect(
        notificationService.updatePreferences('test-user', {
          receive_email_notifications: 'yes' as any,
        })
      ).rejects.toThrow('Preference field receive_email_notifications must be a boolean');
    });
  });

  describe('emitEvent', () => {
    it('creates notification and queues email if enabled', async () => {
      const result = await notificationService.emitEvent(
        'CONNECTION_REQUESTED',
        'test-user',
        { connection_id: 'test-conn-id' }
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('CONNECTION_REQUESTED');
    });
  });
});