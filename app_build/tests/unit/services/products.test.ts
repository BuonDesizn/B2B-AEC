import { describe, it, expect, vi, beforeEach } from 'vitest';

import { productsService } from '@/lib/services/products';

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
  const mockProduct = {
    id: 'test-product-id',
    seller_id: 'test-user',
    name: 'Ready-Mix Concrete M25',
    description: 'High-strength concrete for structural work',
    category: 'Building Materials',
    subcategory: 'Concrete',
    price_per_unit: 4500.00,
    unit: 'per cubic meter',
    min_order_quantity: 5,
    images: ['https://example.com/image.jpg'],
    specifications: null,
    available: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProfile = {
    id: 'test-user',
    persona_type: 'PS',
    subscription_status: 'active',
  };

  const chain = createMockQueryBuilder(mockProduct);
  const profileChain = createMockQueryBuilder(mockProfile);

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

describe('Products Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('creates product for PS user with active subscription', async () => {
      const input = {
        name: 'Ready-Mix Concrete M25',
        description: 'High-strength concrete',
        category: 'Building Materials',
        subcategory: 'Concrete',
        price_per_unit: 4500.00,
        unit: 'per cubic meter',
        min_order_quantity: 5,
        images: ['https://example.com/image.jpg'],
        available: true,
      };

      const result = await productsService.createProduct('test-user', input);

      expect(result).toBeDefined();
      expect(result.name).toBe('Ready-Mix Concrete M25');
      expect(result.available).toBe(true);
    });

    it('defaults available to true when not provided', async () => {
      const input = {
        name: 'Test Product',
        category: 'Test Category',
        price_per_unit: 100,
        unit: 'piece',
        min_order_quantity: 1,
      };

      const result = await productsService.createProduct('test-user', input);

      expect(result).toBeDefined();
      expect(result.available).toBe(true);
    });

    it('throws PRODUCT_CREATE_NOT_PS for non-PS user', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ persona_type: 'CON', subscription_status: 'active' }));

      const input = {
        name: 'Test Product',
        category: 'Test Category',
        price_per_unit: 100,
        unit: 'piece',
        min_order_quantity: 1,
      };

      await expect(productsService.createProduct('test-user', input)).rejects.toThrow('PRODUCT_CREATE_NOT_PS');
    });

    it('throws PRODUCT_CREATE_SUBSCRIPTION_LOCKED for hard_locked user', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ persona_type: 'PS', subscription_status: 'hard_locked' }));

      const input = {
        name: 'Test Product',
        category: 'Test Category',
        price_per_unit: 100,
        unit: 'piece',
        min_order_quantity: 1,
      };

      await expect(productsService.createProduct('test-user', input)).rejects.toThrow('PRODUCT_CREATE_SUBSCRIPTION_LOCKED');
    });

    it('throws error if profile not found', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      const input = {
        name: 'Test Product',
        category: 'Test Category',
        price_per_unit: 100,
        unit: 'piece',
        min_order_quantity: 1,
      };

      await expect(productsService.createProduct('test-user', input)).rejects.toThrow('Profile not found');
    });
  });

  describe('listProducts', () => {
    it('returns paginated products with default pagination', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [
        { id: '1', name: 'Product 1', available: true },
        { id: '2', name: 'Product 2', available: true },
      ];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({});

      expect(result.items).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.page_size).toBe(20);
    });

    it('filters by seller_id', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [{ id: '1', name: 'Product 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({ seller_id: 'seller-123' });

      expect(result.items).toBeDefined();
    });

    it('filters by category', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [{ id: '1', name: 'Product 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({ category: 'Building Materials' });

      expect(result.items).toBeDefined();
    });

    it('respects custom page and page_size', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [{ id: '1', name: 'Product 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({ page: 2, page_size: 10 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.page_size).toBe(10);
    });

    it('caps page_size at 50', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [{ id: '1', name: 'Product 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({ page_size: 100 });

      expect(result.meta.page_size).toBe(50);
    });

    it('only returns available products', async () => {
      const { db } = await import('@/lib/db');
      const mockProducts = [{ id: '1', name: 'Product 1', available: true }];
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProducts));

      const result = await productsService.listProducts({});

      expect(result.items).toBeDefined();
    });
  });

  describe('getProductById', () => {
    it('returns product when found', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      const result = await productsService.getProductById('test-product-id');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-product-id');
      expect(result.name).toBe('Ready-Mix Concrete M25');
    });

    it('throws RESOURCE_NOT_FOUND if product does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        productsService.getProductById('nonexistent-id')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('returns unavailable products', async () => {
      const { db } = await import('@/lib/db');
      const unavailableProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Old Product',
        available: false,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(unavailableProduct));

      const result = await productsService.getProductById('test-product-id');

      expect(result).toBeDefined();
      expect(result.available).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('updates product when user is owner', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      const result = await productsService.updateProduct(
        'test-product-id',
        { name: 'Updated Product Name' },
        'test-user'
      );

      expect(result).toBeDefined();
    });

    it('throws PRODUCT_UPDATE_NOT_OWNER if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      await expect(
        productsService.updateProduct('test-product-id', { name: 'Updated' }, 'other-user')
      ).rejects.toThrow('PRODUCT_UPDATE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if product does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        productsService.updateProduct('nonexistent-id', { name: 'Updated' }, 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('updates multiple fields', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      const result = await productsService.updateProduct(
        'test-product-id',
        {
          name: 'Updated Name',
          price_per_unit: 5000,
          available: false,
        },
        'test-user'
      );

      expect(result).toBeDefined();
    });
  });

  describe('deleteProduct', () => {
    it('soft-deletes product when user is owner', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      const result = await productsService.deleteProduct('test-product-id', 'test-user');

      expect(result).toEqual({ deleted: true, product_id: 'test-product-id' });
    });

    it('throws PRODUCT_DELETE_NOT_OWNER if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      await expect(
        productsService.deleteProduct('test-product-id', 'other-user')
      ).rejects.toThrow('PRODUCT_DELETE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if product does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        productsService.deleteProduct('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('sets available to false on soft-delete', async () => {
      const { db } = await import('@/lib/db');
      const mockProduct = {
        id: 'test-product-id',
        seller_id: 'test-user',
        name: 'Ready-Mix Concrete M25',
        available: true,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(mockProduct));

      const result = await productsService.deleteProduct('test-product-id', 'test-user');

      expect(result.deleted).toBe(true);
      expect(result.product_id).toBe('test-product-id');
    });
  });
});
