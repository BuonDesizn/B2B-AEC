// @witness [MON-001]
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChecksum, verifyCallbackSignature, buildPaymentPayload, getPhonePeBaseUrl } from '@/lib/utils/phonepe';

vi.mock('@/lib/db', () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
    insertInto: vi.fn(),
    transaction: vi.fn(),
  },
}));

describe('phonepe utils', () => {
  describe('generateChecksum', () => {
    it('should generate correct checksum format', () => {
      const payload = '{"test":"data"}';
      const salt = 'test_salt';
      const saltIndex = '1';

      const result = generateChecksum(payload, salt, saltIndex);

      expect(result).toContain('###');
      const [hash, index] = result.split('###');
      expect(hash).toHaveLength(64);
      expect(index).toBe(saltIndex);
    });

    it('should use base64 encoding of payload', () => {
      const payload = 'hello';
      const salt = 'salt';
      const saltIndex = '1';

      const result = generateChecksum(payload, salt, saltIndex);

      const base64Payload = Buffer.from(payload).toString('base64');
      const crypto = require('crypto');
      const expectedHash = crypto
        .createHash('sha256')
        .update(base64Payload + salt + saltIndex)
        .digest('hex');

      expect(result).toBe(`${expectedHash}###${saltIndex}`);
    });

    it('should produce different checksums for different payloads', () => {
      const salt = 'salt';
      const saltIndex = '1';

      const result1 = generateChecksum('{"a":1}', salt, saltIndex);
      const result2 = generateChecksum('{"a":2}', salt, saltIndex);

      expect(result1).not.toBe(result2);
    });

    it('should produce different checksums for different salt indices', () => {
      const payload = '{"test":"data"}';
      const salt = 'salt';

      const result1 = generateChecksum(payload, salt, '1');
      const result2 = generateChecksum(payload, salt, '2');

      expect(result1).not.toBe(result2);
    });
  });

  describe('verifyCallbackSignature', () => {
    it('should return true for valid signature', () => {
      const payload = '{"state":"COMPLETED"}';
      const salt = 'test_salt';
      const crypto = require('crypto');
      const base64Payload = Buffer.from(payload).toString('base64');
      const validSignature = crypto
        .createHash('sha256')
        .update(base64Payload + salt)
        .digest('hex');

      const result = verifyCallbackSignature(payload, validSignature, salt);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = '{"state":"COMPLETED"}';
      const salt = 'test_salt';
      const invalidSignature = 'invalid_signature_hash';

      const result = verifyCallbackSignature(payload, invalidSignature, salt);

      expect(result).toBe(false);
    });

    it('should return false for tampered payload', () => {
      const originalPayload = '{"state":"COMPLETED"}';
      const tamperedPayload = '{"state":"FAILED"}';
      const salt = 'test_salt';
      const crypto = require('crypto');
      const base64Payload = Buffer.from(originalPayload).toString('base64');
      const signature = crypto
        .createHash('sha256')
        .update(base64Payload + salt)
        .digest('hex');

      const result = verifyCallbackSignature(tamperedPayload, signature, salt);

      expect(result).toBe(false);
    });
  });

  describe('buildPaymentPayload', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://test.example.com');
      vi.stubEnv('PHONEPE_MERCHANT_ID', 'TEST_MERCHANT');
    });

    it('should build correct payment payload structure', () => {
      const result = buildPaymentPayload(
        'MERCHANT123',
        'txn_123',
        99900,
        'https://redirect.example.com'
      );

      expect(result).toEqual({
        merchantId: 'MERCHANT123',
        merchantTransactionId: 'txn_123',
        merchantOrderId: 'txn_123',
        amount: 99900,
        redirectUrl: 'https://redirect.example.com',
        redirectMode: 'REDIRECT',
        callbackUrl: 'https://test.example.com/api/payment/phonepe/callback',
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      });
    });

    it('should use environment variable for callback URL', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://myapp.com');

      const result = buildPaymentPayload('M1', 'T1', 1000, 'https://r.com');

      expect(result.callbackUrl).toBe('https://myapp.com/api/payment/phonepe/callback');
    });
  });

  describe('getPhonePeBaseUrl', () => {
    it('should return UAT URL by default', () => {
      vi.stubEnv('PHONEPE_ENVIRONMENT', undefined);

      const result = getPhonePeBaseUrl();

      expect(result).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox');
    });

    it('should return UAT URL when environment is UAT', () => {
      vi.stubEnv('PHONEPE_ENVIRONMENT', 'UAT');

      const result = getPhonePeBaseUrl();

      expect(result).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox');
    });

    it('should return PROD URL when environment is PROD', () => {
      vi.stubEnv('PHONEPE_ENVIRONMENT', 'PROD');

      const result = getPhonePeBaseUrl();

      expect(result).toBe('https://api.phonepe.com/apis/hermes');
    });

    it('should fallback to UAT for unknown environment', () => {
      vi.stubEnv('PHONEPE_ENVIRONMENT', 'UNKNOWN');

      const result = getPhonePeBaseUrl();

      expect(result).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox');
    });
  });
});
