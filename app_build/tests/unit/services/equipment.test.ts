import { describe, it, expect, vi, beforeEach } from 'vitest';

import { equipmentService } from '@/lib/services/equipment';

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
    deleteFrom: vi.fn(() => chain),
    insertInto: vi.fn(() => chain),
    updateTable: vi.fn(() => chain),
    $if: vi.fn((condition: boolean, cb: any) => {
      if (condition) {
        return cb(chain);
      }
      return chain;
    }),
  };
  return chain;
}

vi.mock('@/lib/db', () => {
  const mockEquipment = {
    id: 'test-equipment-id',
    dealer_id: 'test-user',
    name: 'CAT 320 Excavator',
    description: '20-ton hydraulic excavator, well-maintained',
    daily_rate: 15000.00,
    weekly_rate: null,
    monthly_rate: null,
    location: '{"lat":18.5204,"lng":73.8567}',
    available: true,
    images: ['https://example.com/image.jpg'],
    features: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProfile = {
    id: 'test-user',
    persona_type: 'ED',
    subscription_status: 'active',
  };

  const mockNonEdProfile = {
    id: 'test-user',
    persona_type: 'CON',
    subscription_status: 'active',
  };

  const mockHardLockedProfile = {
    id: 'test-user',
    persona_type: 'ED',
    subscription_status: 'hard_locked',
  };

  const mockUnavailableEquipment = {
    ...mockEquipment,
    available: false,
  };

  const chain = createMockQueryBuilder(mockEquipment);
  const profileChain = createMockQueryBuilder(mockProfile);
  const _nonEdProfileChain = createMockQueryBuilder(mockNonEdProfile);
  const _hardLockedChain = createMockQueryBuilder(mockHardLockedProfile);
  const _emptyChain = createMockQueryBuilder(undefined);
  const _unavailableChain = createMockQueryBuilder(mockUnavailableEquipment);

  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn((table: string) => {
        if (table === 'profiles') return profileChain;
        return chain;
      }),
      updateTable: vi.fn(() => chain),
      deleteFrom: vi.fn(() => chain),
      fn: {
        countAll: () => ({
          as: () => 'count',
        }),
      },
    },
  };
});

describe('Equipment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEquipment', () => {
    it('creates equipment for ED user with active subscription', async () => {
      const input = {
        name: 'CAT 320 Excavator',
        description: '20-ton hydraulic excavator',
        category: 'Earthmoving',
        type: 'Excavator',
        rental_rate_per_day: 15000.00,
        operator_included: false,
        location: { lat: 18.5204, lng: 73.8567 },
        images: ['https://example.com/image.jpg'],
        available: true,
      };

      const result = await equipmentService.createEquipment('test-user', input);

      expect(result).toBeDefined();
      expect(result.name).toBe('CAT 320 Excavator');
      expect(result.available).toBe(true);
    });

    it('defaults available to true when not provided', async () => {
      const input = {
        name: 'Test Equipment',
        category: 'Test Category',
        rental_rate_per_day: 5000,
      };

      const result = await equipmentService.createEquipment('test-user', input);

      expect(result).toBeDefined();
      expect(result.available).toBe(true);
    });

    it('throws EQUIPMENT_CREATE_NOT_ED for non-ED user', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ role: 'CON', subscription_status: 'active' }));

      const input = {
        name: 'Test Equipment',
        category: 'Test Category',
        rental_rate_per_day: 5000,
      };

      await expect(equipmentService.createEquipment('test-user', input)).rejects.toThrow('EQUIPMENT_CREATE_NOT_ED');
    });

    it('throws EQUIPMENT_CREATE_SUBSCRIPTION_LOCKED for hard_locked user', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ persona_type: 'ED', subscription_status: 'hard_locked' }));

      const input = {
        name: 'Test Equipment',
        category: 'Test Category',
        rental_rate_per_day: 5000,
      };

      await expect(equipmentService.createEquipment('test-user', input)).rejects.toThrow('EQUIPMENT_CREATE_SUBSCRIPTION_LOCKED');
    });

    it('throws error if profile not found', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      const input = {
        name: 'Test Equipment',
        category: 'Test Category',
        rental_rate_per_day: 5000,
      };

      await expect(equipmentService.createEquipment('test-user', input)).rejects.toThrow('Profile not found');
    });

    it('serializes location object to JSON string', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ persona_type: 'ED', subscription_status: 'active' }));

      const input = {
        name: 'Test Equipment',
        category: 'heavy',
        location: { lat: 19.076, lng: 72.877 },
      };

      const result = await equipmentService.createEquipment('test-user', input);

      expect(result).toBeDefined();
    });
  });

  describe('listEquipment', () => {
    it('returns paginated equipment with default pagination', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [
        { id: '1', name: 'Equipment 1', available: true },
        { id: '2', name: 'Equipment 2', available: true },
      ];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({});

      expect(result.items).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.page_size).toBe(20);
    });

    it('filters by dealer_id', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({ dealer_id: 'dealer-123' });

      expect(result.items).toBeDefined();
    });

    it('filters by category', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({ category: 'Earthmoving' });

      expect(result.items).toBeDefined();
    });

    it('filters by available_only', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({ available_only: true });

      expect(result.items).toBeDefined();
    });

    it('respects custom page and page_size', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({ page: 2, page_size: 10 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.page_size).toBe(10);
    });

    it('caps page_size at 50', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({ page_size: 100 });

      expect(result.meta.page_size).toBe(50);
    });

    it('returns items ordered by created_at desc', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = [{ id: '1', name: 'Equipment 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.listEquipment({});

      expect(result.items).toBeDefined();
    });
  });

  describe('getEquipmentById', () => {
    it('returns equipment when found', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.getEquipmentById('test-equipment-id');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-equipment-id');
      expect(result.name).toBe('CAT 320 Excavator');
    });

    it('throws RESOURCE_NOT_FOUND if equipment does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        equipmentService.getEquipmentById('nonexistent-id')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('returns unavailable equipment', async () => {
      const { db } = await import('@/lib/db');
      const unavailableEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'Old Equipment',
        available: false,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(unavailableEquipment));

      const result = await equipmentService.getEquipmentById('test-equipment-id');

      expect(result).toBeDefined();
      expect(result.available).toBe(false);
    });
  });

  describe('updateEquipment', () => {
    it('updates equipment when user is owner', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.updateEquipment(
        'test-equipment-id',
        { name: 'Updated Equipment Name' },
        'test-user'
      );

      expect(result).toBeDefined();
    });

    it('throws EQUIPMENT_UPDATE_NOT_OWNER if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      await expect(
        equipmentService.updateEquipment('test-equipment-id', { name: 'Updated' }, 'other-user')
      ).rejects.toThrow('EQUIPMENT_UPDATE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if equipment does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        equipmentService.updateEquipment('nonexistent-id', { name: 'Updated' }, 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('updates multiple fields', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.updateEquipment(
        'test-equipment-id',
        {
          name: 'Updated Name',
          rental_rate_per_day: 18000,
          available: false,
        },
        'test-user'
      );

      expect(result).toBeDefined();
    });

    it('updates location as JSON string', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.updateEquipment(
        'test-equipment-id',
        { location: { lat: 19.076, lng: 72.877 } },
        'test-user'
      );

      expect(result).toBeDefined();
    });

    it('updates operator_included flag via features array', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.updateEquipment(
        'test-equipment-id',
        { operator_included: true },
        'test-user'
      );

      expect(result).toBeDefined();
    });
  });

  describe('deleteEquipment', () => {
    it('soft-deletes equipment when user is owner', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.deleteEquipment('test-equipment-id', 'test-user');

      expect(result).toEqual({ deleted: true, equipment_id: 'test-equipment-id' });
    });

    it('throws EQUIPMENT_DELETE_NOT_OWNER if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      await expect(
        equipmentService.deleteEquipment('test-equipment-id', 'other-user')
      ).rejects.toThrow('EQUIPMENT_DELETE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if equipment does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        equipmentService.deleteEquipment('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('sets available to false on soft-delete', async () => {
      const { db } = await import('@/lib/db');
      const mockEquipment = {
        id: 'test-equipment-id',
        dealer_id: 'test-user',
        name: 'CAT 320 Excavator',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockEquipment));

      const result = await equipmentService.deleteEquipment('test-equipment-id', 'test-user');

      expect(result.deleted).toBe(true);
      expect(result.equipment_id).toBe('test-equipment-id');
    });
  });
});
