// @witness [ID-001]
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  canTransitionVerification,
  profileService,
} from '@/lib/services/profiles';

function createMockQueryBuilder(returnValue: any) {
  const chain: any = {
    selectAll: vi.fn(() => chain),
    select: vi.fn(() => chain),
    where: vi.fn(() => chain),
    or: vi.fn(() => chain),
    and: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    returningAll: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    on: vi.fn(() => chain),
    onRef: vi.fn(() => chain),
    orOn: vi.fn(() => chain),
    executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(returnValue),
    execute: vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue : [returnValue]),
  };
  return chain;
}

const mockDb = {
  insertInto: vi.fn(),
  selectFrom: vi.fn(),
  updateTable: vi.fn(),
  fn: {
    count: vi.fn(() => ({ as: vi.fn(() => 'count') })),
  },
  transaction: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  get db() {
    return mockDb;
  },
  sql: {
    raw: vi.fn((str) => str),
  },
}));

describe('Verification State Machine', () => {
  describe('canTransitionVerification', () => {
    it('allows PENDING_VERIFICATION to PENDING_ADMIN', () => {
      expect(canTransitionVerification('PENDING_VERIFICATION', 'PENDING_ADMIN')).toBe(true);
    });

    it('allows PENDING_VERIFICATION to REJECTED', () => {
      expect(canTransitionVerification('PENDING_VERIFICATION', 'REJECTED')).toBe(true);
    });

    it('allows PENDING_ADMIN to VERIFIED', () => {
      expect(canTransitionVerification('PENDING_ADMIN', 'VERIFIED')).toBe(true);
    });

    it('allows PENDING_ADMIN to REJECTED', () => {
      expect(canTransitionVerification('PENDING_ADMIN', 'REJECTED')).toBe(true);
    });

    it('allows VERIFIED to SUSPENDED', () => {
      expect(canTransitionVerification('VERIFIED', 'SUSPENDED')).toBe(true);
    });

    it('allows REJECTED to PENDING_ADMIN', () => {
      expect(canTransitionVerification('REJECTED', 'PENDING_ADMIN')).toBe(true);
    });

    it('allows SUSPENDED to VERIFIED', () => {
      expect(canTransitionVerification('SUSPENDED', 'VERIFIED')).toBe(true);
    });

    it('does not allow VERIFIED to PENDING_ADMIN', () => {
      expect(canTransitionVerification('VERIFIED', 'PENDING_ADMIN')).toBe(false);
    });

    it('does not allow PENDING_ADMIN to PENDING_VERIFICATION', () => {
      expect(canTransitionVerification('PENDING_ADMIN', 'PENDING_VERIFICATION')).toBe(false);
    });

    it('does not allow REJECTED to VERIFIED directly', () => {
      expect(canTransitionVerification('REJECTED', 'VERIFIED')).toBe(false);
    });
  });
});

describe('Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProfile', () => {
    it('creates profile for organization with GSTIN', async () => {
      const insertChain = createMockQueryBuilder({
        id: 'user-1',
        persona_type: 'CON',
        org_name: 'Test Corp',
        gstin: '27ABCDE1234F1Z5',
        verification_status: 'PENDING_VERIFICATION',
        subscription_status: 'trial',
        handshake_credits: 30,
        created_at: new Date(),
      });

      mockDb.insertInto = vi.fn(() => insertChain);

      const result = await profileService.createProfile(
        { persona_type: 'CON', org_name: 'Test Corp', gstin: '27ABCDE1234F1Z5', pan: 'ABCDE1234F' },
        'user-1',
        'test@example.com'
      );

      expect(result).toBeDefined();
      expect(result.persona_type).toBe('CON');
      expect(result.verification_status).toBe('PENDING_VERIFICATION');
    });

    it('creates profile for individual (PP) without GSTIN', async () => {
      const insertChain = createMockQueryBuilder({
        id: 'user-2',
        persona_type: 'PP',
        org_name: 'John Doe',
        gstin: null,
        verification_status: 'PENDING_VERIFICATION',
        subscription_status: 'trial',
        handshake_credits: 30,
        created_at: new Date(),
      });

      mockDb.insertInto = vi.fn(() => insertChain);

      const result = await profileService.createProfile(
        { persona_type: 'PP', org_name: 'John Doe', gstin: undefined, pan: 'ABCDE1234F' },
        'user-2',
        'john@example.com'
      );

      expect(result).toBeDefined();
      expect(result.persona_type).toBe('PP');
    });

    it('throws IDENTITY_VERIFY_INVALID_GSTIN when org missing GSTIN', async () => {
      await expect(
        profileService.createProfile(
          { persona_type: 'CON', org_name: 'Test Corp', pan: 'ABCDE1234F' },
          'user-1',
          'test@example.com'
        )
      ).rejects.toThrow('IDENTITY_VERIFY_INVALID_GSTIN');
    });

    it('throws IDENTITY_VERIFY_INVALID_GSTIN for invalid GSTIN format', async () => {
      await expect(
        profileService.createProfile(
          { persona_type: 'CON', org_name: 'Test Corp', gstin: 'INVALID', pan: 'ABCDE1234F' },
          'user-1',
          'test@example.com'
        )
      ).rejects.toThrow('IDENTITY_VERIFY_INVALID_GSTIN');
    });
  });

  describe('getProfileById', () => {
    it('returns profile with masked contact for non-owner', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'profile-1',
        persona_type: 'CON',
        org_name: 'Test Corp',
        city: 'Pune',
        state: 'Maharashtra',
        verification_status: 'VERIFIED',
        dqs_score: 0.85,
        handshake_credits: 24,
        subscription_status: 'active',
      });
      const blockedChain = createMockQueryBuilder(null);
      const fullProfileChain = createMockQueryBuilder({
        email_business: 'contact@test.com',
        phone_primary: '+919876543210',
      });
      const locationChain = createMockQueryBuilder({
        location: { lat: 18.5204, lng: 73.8567 },
      });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) return profileChain;
        if (callCount === 2) return blockedChain;
        if (callCount === 3) return fullProfileChain;
        return locationChain;
      });

      const result = await profileService.getProfileById('profile-1', 'viewer-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('profile-1');
      expect(result.contact.email).toBe('***@***');
    });

    it('returns RESOURCE_NOT_FOUND for blocked profile', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'profile-1',
        persona_type: 'CON',
        org_name: 'Test Corp',
        city: 'Pune',
        state: 'Maharashtra',
        verification_status: 'VERIFIED',
        dqs_score: 0.85,
        handshake_credits: 24,
        subscription_status: 'active',
      });
      const blockedChain = createMockQueryBuilder({ id: 'blocked-conn' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? profileChain : blockedChain;
      });

      await expect(
        profileService.getProfileById('profile-1', 'viewer-1')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('returns RESOURCE_NOT_FOUND for deleted profile', async () => {
      const profileChain = createMockQueryBuilder(null);
      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        profileService.getProfileById('deleted-profile', 'viewer-1')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('updateProfile', () => {
    it('updates profile fields when owner', async () => {
      const existingChain = createMockQueryBuilder({
        id: 'user-1',
        gstin: '27ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
      });
      const updateChain = createMockQueryBuilder({
        id: 'user-1',
        org_name: 'Updated Corp',
        tagline: 'New Tagline',
        city: 'Mumbai',
        state: 'Maharashtra',
        verification_status: 'VERIFIED',
        updated_at: new Date(),
      });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return existingChain;
      });
      mockDb.updateTable = vi.fn(() => updateChain);

      const result = await profileService.updateProfile('user-1', {
        org_name: 'Updated Corp',
        tagline: 'New Tagline',
        city: 'Mumbai',
        state: 'Maharashtra',
      }, 'user-1');

      expect(result).toBeDefined();
      expect(result.org_name).toBe('Updated Corp');
      expect(callCount).toBe(1);
    });

    it('throws AUTH_INSUFFICIENT_ROLE when not owner', async () => {
      await expect(
        profileService.updateProfile('user-1', { org_name: 'Hacked' }, 'user-2')
      ).rejects.toThrow('AUTH_INSUFFICIENT_ROLE');
    });

    it('throws RESOURCE_NOT_FOUND for non-existent profile', async () => {
      const existingChain = createMockQueryBuilder(null);
      mockDb.selectFrom = vi.fn(() => existingChain);

      await expect(
        profileService.updateProfile('nonexistent', { org_name: 'Test' }, 'nonexistent')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('submitVerification', () => {
    it('submits verification and transitions to PENDING_ADMIN', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        pan: null,
        gstin: null,
        verification_status: 'PENDING_VERIFICATION',
        persona_type: 'CON',
      });
      const panCheckChain = createMockQueryBuilder(null);
      const gstinCheckChain = createMockQueryBuilder(null);
      const updateChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'PENDING_ADMIN',
        pan: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5',
      });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) return profileChain;
        if (callCount === 2) return panCheckChain;
        return gstinCheckChain;
      });
      mockDb.updateTable = vi.fn(() => updateChain);

      const result = await profileService.submitVerification('user-1', {
        pan: 'ABCDE1234F',
        gstin: '27ABCDE1234F1Z5',
        org_name: 'Test Corp',
        establishment_year: 2015,
      });

      expect(result).toBeDefined();
      expect(result.verification_status).toBe('PENDING_ADMIN');
    });

    it('throws IDENTITY_VERIFY_INVALID_GSTIN for invalid PAN', async () => {
      await expect(
        profileService.submitVerification('user-1', {
          pan: 'INVALID',
          gstin: '27ABCDE1234F1Z5',
          org_name: 'Test Corp',
          establishment_year: 2015,
        })
      ).rejects.toThrow('IDENTITY_VERIFY_INVALID_GSTIN');
    });

    it('throws IDENTITY_VERIFY_INVALID_GSTIN for invalid GSTIN', async () => {
      await expect(
        profileService.submitVerification('user-1', {
          pan: 'ABCDE1234F',
          gstin: 'INVALID',
          org_name: 'Test Corp',
          establishment_year: 2015,
        })
      ).rejects.toThrow('IDENTITY_VERIFY_INVALID_GSTIN');
    });

    it('throws IDENTITY_CREATE_DUPLICATE_PAN when PAN already exists', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        pan: null,
        gstin: null,
        verification_status: 'PENDING_VERIFICATION',
        persona_type: 'CON',
      });
      const panCheckChain = createMockQueryBuilder({ id: 'existing-pan' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? profileChain : panCheckChain;
      });

      await expect(
        profileService.submitVerification('user-1', {
          pan: 'ABCDE1234F',
          gstin: '27ABCDE1234F1Z5',
          org_name: 'Test Corp',
          establishment_year: 2015,
        })
      ).rejects.toThrow('IDENTITY_CREATE_DUPLICATE_PAN');
    });

    it('throws IDENTITY_VERIFY_DUPLICATE_GSTIN when GSTIN already linked', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        pan: null,
        gstin: null,
        verification_status: 'PENDING_VERIFICATION',
        persona_type: 'CON',
      });
      const panCheckChain = createMockQueryBuilder(null);
      const gstinCheckChain = createMockQueryBuilder({ id: 'existing-gstin' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) return profileChain;
        if (callCount === 2) return panCheckChain;
        return gstinCheckChain;
      });

      await expect(
        profileService.submitVerification('user-1', {
          pan: 'ABCDE1234F',
          gstin: '27ABCDE1234F1Z5',
          org_name: 'Test Corp',
          establishment_year: 2015,
        })
      ).rejects.toThrow('IDENTITY_VERIFY_DUPLICATE_GSTIN');
    });
  });

  describe('adminVerifyProfile', () => {
    it('approves profile and transitions to VERIFIED', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'PENDING_ADMIN',
      });
      const updateChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'VERIFIED',
      });

      mockDb.selectFrom = vi.fn(() => profileChain);
      mockDb.updateTable = vi.fn(() => updateChain);

      const result = await profileService.adminVerifyProfile('user-1', 'approve', 'admin-1');

      expect(result).toBeDefined();
      expect(result.verification_status).toBe('VERIFIED');
    });

    it('rejects profile and transitions to REJECTED', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'PENDING_ADMIN',
      });
      const updateChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'REJECTED',
      });

      mockDb.selectFrom = vi.fn(() => profileChain);
      mockDb.updateTable = vi.fn(() => updateChain);

      const result = await profileService.adminVerifyProfile('user-1', 'reject', 'admin-1');

      expect(result).toBeDefined();
      expect(result.verification_status).toBe('REJECTED');
    });

    it('throws RESOURCE_NOT_FOUND for non-existent profile', async () => {
      const profileChain = createMockQueryBuilder(null);
      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        profileService.adminVerifyProfile('nonexistent', 'approve', 'admin-1')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('throws VALIDATION_FAILED for invalid state transition', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        verification_status: 'VERIFIED',
      });
      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        profileService.adminVerifyProfile('user-1', 'approve', 'admin-1')
      ).rejects.toThrow('VALIDATION_FAILED');
    });
  });

  describe('requestGstinChange', () => {
    it('creates GSTIN change request', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        gstin: '27ABCDE1234F1Z5',
        verification_status: 'VERIFIED',
      });
      const gstinCheckChain = createMockQueryBuilder(null);
      const pendingCheckChain = createMockQueryBuilder(null);
      const insertChain = createMockQueryBuilder({ id: 'request-1' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) return profileChain;
        if (callCount === 2) return gstinCheckChain;
        return pendingCheckChain;
      });
      mockDb.insertInto = vi.fn(() => insertChain);

      const result = await profileService.requestGstinChange('user-1', '27FGHIJ5678K1Z9', 'Business restructuring');

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING_ADMIN');
    });

    it('throws IDENTITY_VERIFY_INVALID_GSTIN for invalid format', async () => {
      await expect(
        profileService.requestGstinChange('user-1', 'INVALID', 'reason')
      ).rejects.toThrow('IDENTITY_VERIFY_INVALID_GSTIN');
    });

    it('throws VALIDATION_FAILED when GSTIN not verified', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        gstin: '27ABCDE1234F1Z5',
        verification_status: 'PENDING_VERIFICATION',
      });
      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        profileService.requestGstinChange('user-1', '27FGHIJ5678K1Z9', 'reason')
      ).rejects.toThrow('VALIDATION_FAILED');
    });

    it('throws IDENTITY_VERIFY_DUPLICATE_GSTIN when new GSTIN already linked', async () => {
      const profileChain = createMockQueryBuilder({
        id: 'user-1',
        gstin: '27ABCDE1234F1Z5',
        verification_status: 'VERIFIED',
      });
      const gstinCheckChain = createMockQueryBuilder({ id: 'other-profile' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? profileChain : gstinCheckChain;
      });

      await expect(
        profileService.requestGstinChange('user-1', '27FGHIJ5678K1Z9', 'reason')
      ).rejects.toThrow('IDENTITY_VERIFY_DUPLICATE_GSTIN');
    });
  });

  describe('approveGstinChange', () => {
    it('approves GSTIN change and updates profile', async () => {
      const requestChain = createMockQueryBuilder({
        id: 'request-1',
        action: 'GSTIN_CHANGE_REQUEST',
        target_type: 'profile',
        target_id: 'user-1',
        new_value: { new_gstin: '27FGHIJ5678K1Z9', reason: 'restructuring' },
      });
      const updateProfileChain = createMockQueryBuilder(1);
      const updateLogChain = createMockQueryBuilder(1);

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => requestChain);
      mockDb.updateTable = vi.fn(() => {
        callCount++;
        return callCount === 1 ? updateProfileChain : updateLogChain;
      });

      const result = await profileService.approveGstinChange('request-1', 'approve', 'admin-1', 'Approved');

      expect(result).toBeDefined();
      expect(result.action).toBe('approve');
      expect(result.profile_id).toBe('user-1');
    });

    it('rejects GSTIN change without updating profile', async () => {
      const requestChain = createMockQueryBuilder({
        id: 'request-1',
        action: 'GSTIN_CHANGE_REQUEST',
        target_type: 'profile',
        target_id: 'user-1',
        new_value: { new_gstin: '27FGHIJ5678K1Z9', reason: 'restructuring' },
      });
      const updateLogChain = createMockQueryBuilder(1);

      mockDb.selectFrom = vi.fn(() => requestChain);
      mockDb.updateTable = vi.fn(() => updateLogChain);

      const result = await profileService.approveGstinChange('request-1', 'reject', 'admin-1', 'Not enough docs');

      expect(result).toBeDefined();
      expect(result.action).toBe('reject');
    });

    it('throws RESOURCE_NOT_FOUND for non-existent request', async () => {
      const requestChain = createMockQueryBuilder(null);
      mockDb.selectFrom = vi.fn(() => requestChain);

      await expect(
        profileService.approveGstinChange('nonexistent', 'approve', 'admin-1')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });
});
