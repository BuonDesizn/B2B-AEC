// @witness [MON-001]
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paymentService } from '@/lib/services/payments';

const mockSelectFrom = vi.fn();
const mockUpdateTable = vi.fn();
const mockInsertInto = vi.fn();
const mockTransaction = vi.fn();
const mockWhere = vi.fn();
const mockSelect = vi.fn();
const mockExecuteTakeFirst = vi.fn();
const mockExecute = vi.fn();
const mockSet = vi.fn();
const mockReturnAll = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    selectFrom: vi.fn(() => ({
      select: vi.fn(() => ({
        where: vi.fn(() => ({
          executeTakeFirst: mockExecuteTakeFirst,
        })),
      })),
      where: vi.fn(() => ({
        executeTakeFirst: mockExecuteTakeFirst,
        execute: mockExecute,
      })),
    })),
    updateTable: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: mockExecute,
        })),
      })),
    })),
    transaction: vi.fn(() => ({
      execute: mockTransaction,
    })),
  },
}));

vi.mock('@/lib/utils/phonepe', () => ({
  generateChecksum: vi.fn(() => 'fake_checksum###1'),
  buildPaymentPayload: vi.fn(() => ({
    merchantId: 'TEST_MERCHANT',
    merchantTransactionId: 'txn_test_123',
    amount: 99900,
    redirectUrl: 'https://test.com/callback',
    redirectMode: 'REDIRECT',
    callbackUrl: 'https://test.com/api/payment/phonepe/callback',
    paymentInstrument: { type: 'PAY_PAGE' },
  })),
  getPhonePeBaseUrl: vi.fn(() => 'https://api-preprod.phonepe.com/apis/pg-sandbox'),
}));

global.fetch = vi.fn();

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PHONEPE_MERCHANT_ID', 'TEST_MERCHANT');
    vi.stubEnv('PHONEPE_MERCHANT_KEY', 'test_key');
    vi.stubEnv('PHONEPE_SALT_INDEX', '1');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://test.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('initPayment', () => {
    it('should throw error if profile not found', async () => {
      mockExecuteTakeFirst.mockResolvedValue(null);

      await expect(paymentService.initPayment('user123', 'national_pro'))
        .rejects.toThrow('Profile not found');
    });

    it('should throw error if subscription already active', async () => {
      mockExecuteTakeFirst.mockResolvedValue({ subscription_status: 'ACTIVE' });

      await expect(paymentService.initPayment('user123', 'national_pro'))
        .rejects.toThrow('Subscription already active');
    });

    it('should throw error for unknown plan', async () => {
      mockExecuteTakeFirst.mockResolvedValue({ subscription_status: 'TRIAL' });

      await expect(paymentService.initPayment('user123', 'unknown_plan'))
        .rejects.toThrow('Unknown plan: unknown_plan');
    });

    it('should return payment initialization result', async () => {
      mockExecuteTakeFirst.mockResolvedValue({ subscription_status: 'TRIAL' });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            merchantTransactionId: 'txn_user123_1234567890',
            instrumentResponse: {
              redirectInfo: {
                url: 'https://phonepe-redirect-url.com',
              },
            },
          },
        }),
      });

      const result = await paymentService.initPayment('user123', 'national_pro');

      expect(result).toHaveProperty('phonepe_order_id');
      expect(result).toHaveProperty('redirect_url');
      expect(result).toHaveProperty('expires_at');
      expect(result.redirect_url).toBe('https://phonepe-redirect-url.com');
    });
  });

  describe('verifyPhonePeSignature', () => {
    it('should return true for valid signature', () => {
      const payload = '{"state":"COMPLETED"}';
      const salt = 'test_salt';
      const crypto = require('crypto');
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + salt)
        .digest('hex');

      const result = paymentService.verifyPhonePeSignature(payload, validSignature, salt);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = '{"state":"COMPLETED"}';
      const salt = 'test_salt';
      const invalidSignature = 'invalid_signature';

      const result = paymentService.verifyPhonePeSignature(payload, invalidSignature, salt);

      expect(result).toBe(false);
    });
  });

  describe('handleCallback', () => {
    it('should throw error for invalid signature', async () => {
      const webhookBody = {
        merchantTransactionId: 'txn_user123_123',
        state: 'COMPLETED',
      };

      await expect(paymentService.handleCallback(webhookBody, 'invalid_signature'))
        .rejects.toThrow('Invalid webhook signature');
    });

    it('should return existing result for idempotent transaction', async () => {
      const webhookBody = {
        merchantTransactionId: 'txn_user123_123',
        state: 'COMPLETED',
      };

      const crypto = require('crypto');
      const payload = JSON.stringify(webhookBody);
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + 'test_key')
        .digest('hex');

      mockExecuteTakeFirst.mockResolvedValue({
        phonepe_transaction_id: 'txn_user123_123',
        status: 'active',
      });

      const result = await paymentService.handleCallback(webhookBody, validSignature);

      expect(result.merchantTransactionId).toBe('txn_user123_123');
      expect(result.status).toBe('active');
      expect(result.subscription_activated).toBe(true);
    });

    it('should call activateSubscription on COMPLETED state', async () => {
      const webhookBody = {
        merchantTransactionId: 'txn_user123_123',
        state: 'COMPLETED',
        amount: 99900,
        responseCode: 'SUCCESS',
        paymentInstrument: { type: 'UPI', utr: '123456' },
        transactionId: 'T260402100000',
      };

      const crypto = require('crypto');
      const payload = JSON.stringify(webhookBody);
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + 'test_key')
        .digest('hex');

      mockExecuteTakeFirst.mockResolvedValue(null);
      mockExecute.mockResolvedValue(undefined);
      mockTransaction.mockImplementation(async (cb) => {
        await cb({
          updateTable: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                execute: mockExecute,
              })),
            })),
          })),
        });
      });

      const result = await paymentService.handleCallback(webhookBody, validSignature);

      expect(result.status).toBe('COMPLETED');
      expect(result.subscription_activated).toBe(true);
    });

    it('should call failSubscription on FAILED state', async () => {
      const webhookBody = {
        merchantTransactionId: 'txn_user123_123',
        state: 'FAILED',
        responseCode: 'FAILURE',
      };

      const crypto = require('crypto');
      const payload = JSON.stringify(webhookBody);
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + 'test_key')
        .digest('hex');

      mockExecuteTakeFirst.mockResolvedValue(null);
      mockExecute.mockResolvedValue(undefined);
      mockTransaction.mockImplementation(async (cb) => {
        await cb({
          updateTable: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                execute: mockExecute,
              })),
            })),
          })),
        });
      });

      const result = await paymentService.handleCallback(webhookBody, validSignature);

      expect(result.status).toBe('FAILED');
      expect(result.subscription_activated).toBe(false);
    });

    it('should throw error for unhandled state', async () => {
      const webhookBody = {
        merchantTransactionId: 'txn_user123_123',
        state: 'PENDING',
      };

      const crypto = require('crypto');
      const payload = JSON.stringify(webhookBody);
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + 'test_key')
        .digest('hex');

      mockExecuteTakeFirst.mockResolvedValue(null);

      await expect(paymentService.handleCallback(webhookBody, validSignature))
        .rejects.toThrow('Unhandled payment state: PENDING');
    });
  });

  describe('activateSubscription', () => {
    it('should activate subscription and reset credits', async () => {
      mockExecute.mockResolvedValue(undefined);
      mockTransaction.mockImplementation(async (cb) => {
        await cb({
          updateTable: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                execute: mockExecute,
              })),
            })),
          })),
        });
      });

      const result = await paymentService.activateSubscription('txn_user123_123');

      expect(result.merchantTransactionId).toBe('txn_user123_123');
      expect(result.status).toBe('COMPLETED');
      expect(result.subscription_activated).toBe(true);
    });
  });

  describe('failSubscription', () => {
    it('should mark subscription as expired', async () => {
      mockExecute.mockResolvedValue(undefined);
      mockTransaction.mockImplementation(async (cb) => {
        await cb({
          updateTable: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                execute: mockExecute,
              })),
            })),
          })),
        });
      });

      const result = await paymentService.failSubscription('txn_user123_123');

      expect(result.merchantTransactionId).toBe('txn_user123_123');
      expect(result.status).toBe('FAILED');
      expect(result.subscription_activated).toBe(false);
    });
  });
});
