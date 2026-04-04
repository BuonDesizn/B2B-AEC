import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'super_admin',
  }),
  AuthError: class AuthError extends Error {
    constructor(public code: string, public status: number, message: string) {
      super(message);
    }
  },
}));

// Mock the db module with chainable query builder
function createMockDb(returnValue: any) {
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
  const mockRfp = {
    id: 'test-rfp-id',
    requester_id: 'test-user-id',
    title: 'Test RFP',
    category: 'construction',
    status: 'DRAFT',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const chain = createMockDb(mockRfp);

  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn(() => chain),
      updateTable: vi.fn(() => chain),
      transaction: vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          return cb({
            insertInto: vi.fn(() => chain),
            updateTable: vi.fn(() => chain),
          });
        }),
      })),
    },
  };
});

describe('RFP API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/rfps', () => {
    it('returns 401 when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockRejectedValueOnce(
        new (await import('@/lib/auth')).AuthError('AUTH_MISSING', 401, 'Authentication required')
      );

      const { POST } = await import('@/app/api/rfps/route');
      const request = new Request('http://localhost/api/rfps', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', category: 'construction', expiry_date: '2026-05-01' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTH_MISSING');
    });

    it('returns 400 when missing required fields', async () => {
      const { POST } = await import('@/app/api/rfps/route');
      const request = new Request('http://localhost/api/rfps', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });

    it('creates RFP successfully with auth', async () => {
      const { POST } = await import('@/app/api/rfps/route');
      const request = new Request('http://localhost/api/rfps', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test RFP',
          category: 'construction',
          expiry_date: '2026-05-01',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe('GET /api/rfps', () => {
    it('returns RFPs for authenticated user', async () => {
      const { GET } = await import('@/app/api/rfps/route');
      const request = new Request('http://localhost/api/rfps');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('GET /api/rfps/browse', () => {
    it('returns open RFPs', async () => {
      const { GET } = await import('@/app/api/rfps/browse/route');
      const request = new Request('http://localhost/api/rfps/browse');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/rfps/:id/respond', () => {
    it('returns 401 when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth');
      vi.mocked(requireAuth).mockRejectedValueOnce(
        new (await import('@/lib/auth')).AuthError('AUTH_MISSING', 401, 'Authentication required')
      );

      const { POST } = await import('@/app/api/rfps/[id]/respond/route');
      const request = new Request('http://localhost/api/rfps/test-id/respond', {
        method: 'POST',
        body: JSON.stringify({ proposal: 'My proposal' }),
      });

      const response = await POST(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 400 when missing proposal', async () => {
      const { POST } = await import('@/app/api/rfps/[id]/respond/route');
      const request = new Request('http://localhost/api/rfps/test-id/respond', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: { id: 'test-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });
  });
});
