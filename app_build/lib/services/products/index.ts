import { db } from '@/lib/db';
import { PERSONA_TYPES, SUBSCRIPTION_STATUS, ERROR_CODES } from '@/lib/constants';

// @witness [PS-001]

// =============================================================================
// Products Service
// =============================================================================

export interface CreateProductInput {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price_per_unit: number;
  unit: string;
  min_order_quantity: number;
  images?: string[];
  specifications?: Record<string, unknown>;
  available?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price_per_unit?: number;
  unit?: string;
  min_order_quantity?: number;
  images?: string[];
  specifications?: Record<string, unknown>;
  available?: boolean;
}

export interface ListProductsFilters {
  seller_id?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export const productsService = {
  /**
   * Create a new product listing
   * @witness [PS-001]
   */
  async createProduct(sellerId: string, input: CreateProductInput) {
    const profile = await db
      .selectFrom('profiles')
      .select(['persona_type', 'subscription_status'])
      .where('id', '=', sellerId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.persona_type !== PERSONA_TYPES.PS) {
      throw new Error(ERROR_CODES.PRODUCT_CREATE_NOT_PS);
    }

    if (profile.subscription_status === SUBSCRIPTION_STATUS.HARD_LOCKED) {
      throw new Error(ERROR_CODES.PRODUCT_CREATE_SUBSCRIPTION_LOCKED);
    }

    const result = await db
      .insertInto('products')
      .values({
        seller_id: sellerId,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        subcategory: input.subcategory ?? null,
        price_per_unit: input.price_per_unit,
        unit: input.unit,
        min_order_quantity: input.min_order_quantity,
        images: input.images ?? [],
        specifications: (input.specifications as any) ?? null,
        available: input.available ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * List products with pagination and optional filters
   * @witness [PS-001]
   */
  async listProducts(filters: ListProductsFilters) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.page_size ?? 20, 50);
    const offset = (page - 1) * pageSize;

    let query = db
      .selectFrom('products')
      .selectAll()
      .where('deleted_at', 'is', null);

    if (filters.seller_id) {
      query = query.where('seller_id', '=', filters.seller_id);
    }

    if (filters.category) {
      query = query.where('category', '=', filters.category);
    }

    const items = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    const countResult = await db
      .selectFrom('products')
      .select(db.fn.countAll().as('count'))
      .where('deleted_at', 'is', null)
      .$if(!!filters.seller_id, (qb) => qb.where('seller_id', '=', filters.seller_id!))
      .$if(!!filters.category, (qb) => qb.where('category', '=', filters.category!))
      .executeTakeFirst();

    const totalCount = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      items,
      meta: {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
      },
    };
  },

  /**
   * Fetch single product by ID
   * @witness [PS-001]
   */
  async getProductById(id: string) {
    const product = await db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!product) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return product;
  },

  /**
   * Update product details (owner only)
   * @witness [PS-001]
   */
  async updateProduct(id: string, input: UpdateProductInput, userId: string) {
    const product = await this.getProductById(id);

    if (product.seller_id !== userId) {
      throw new Error('PRODUCT_UPDATE_NOT_OWNER');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.subcategory !== undefined) updates.subcategory = input.subcategory;
    if (input.price_per_unit !== undefined) updates.price_per_unit = input.price_per_unit;
    if (input.unit !== undefined) updates.unit = input.unit;
    if (input.min_order_quantity !== undefined) updates.min_order_quantity = input.min_order_quantity;
    if (input.images !== undefined) updates.images = input.images;
    if (input.specifications !== undefined) updates.specifications = input.specifications as any;
    if (input.available !== undefined) updates.available = input.available;

    const result = await db
      .updateTable('products')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Soft-delete product by setting deleted_at (owner only)
   * @witness [PS-001]
   */
  async deleteProduct(id: string, userId: string) {
    const product = await this.getProductById(id);

    if (product.seller_id !== userId) {
      throw new Error('PRODUCT_DELETE_NOT_OWNER');
    }

    await db
      .updateTable('products')
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where('id', '=', id)
      .execute();

    return { deleted: true, product_id: id };
  },
};
