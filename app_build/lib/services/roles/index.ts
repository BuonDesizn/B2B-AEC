import { db } from '@/lib/db';

// =============================================================================
// Role Extension Validators
// =============================================================================

// Valid business types for product sellers
const VALID_BUSINESS_TYPES = ['Manufacturer', 'Wholesaler', 'Retailer', 'Distributor'] as const;
export type BusinessType = typeof VALID_BUSINESS_TYPES[number];

// Valid license classes for contractors
const VALID_LICENSE_CLASSES = ['Class I', 'Class II', 'Class III', 'Unlimited'] as const;
export type LicenseClass = typeof VALID_LICENSE_CLASSES[number];

// =============================================================================
// Product Seller Validator
// =============================================================================

export interface ProductSellerInput {
  profile_id: string;
  business_type: string;
  primary_category: string;
  delivery_radius_km: number;
  credit_period_days: number;
  min_order_value?: number;
  sku_capacity?: number;
}

export const productSellerValidator = {
  validate(input: ProductSellerInput) {
    const errors: string[] = [];

    if (!VALID_BUSINESS_TYPES.includes(input.business_type as BusinessType)) {
      errors.push(`business_type must be one of: ${VALID_BUSINESS_TYPES.join(', ')}`);
    }

    if (input.delivery_radius_km < 0) {
      errors.push('delivery_radius_km must be >= 0');
    }

    if (input.credit_period_days < 0) {
      errors.push('credit_period_days must be >= 0');
    }

    if (input.min_order_value !== undefined && input.min_order_value < 0) {
      errors.push('min_order_value must be >= 0');
    }

    if (input.sku_capacity !== undefined && input.sku_capacity < 0) {
      errors.push('sku_capacity must be >= 0');
    }

    return errors;
  },

  async create(input: ProductSellerInput) {
    const errors = this.validate(input);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return await db
      .insertInto('product_sellers')
      .values({
        profile_id: input.profile_id,
        business_type: input.business_type,
        primary_category: input.primary_category,
        delivery_radius_km: input.delivery_radius_km,
        credit_period_days: input.credit_period_days,
        min_order_value: input.min_order_value ?? null,
        sku_capacity: input.sku_capacity ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};

// =============================================================================
// Contractor Validator
// =============================================================================

export interface ContractorInput {
  profile_id: string;
  workforce_count: number;
  license_class: string;
  concurrent_projects_capacity: number;
  work_categories: string[];
  specializations?: string[];
  fleet_size?: number;
}

export const contractorValidator = {
  validate(input: ContractorInput) {
    const errors: string[] = [];

    if (input.workforce_count < 0) {
      errors.push('workforce_count must be >= 0');
    }

    if (!VALID_LICENSE_CLASSES.includes(input.license_class as LicenseClass)) {
      errors.push(`license_class must be one of: ${VALID_LICENSE_CLASSES.join(', ')}`);
    }

    if (input.concurrent_projects_capacity < 1) {
      errors.push('concurrent_projects_capacity must be >= 1');
    }

    if (input.fleet_size !== undefined && input.fleet_size < 0) {
      errors.push('fleet_size must be >= 0');
    }

    return errors;
  },

  async create(input: ContractorInput) {
    const errors = this.validate(input);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return await db
      .insertInto('contractors')
      .values({
        profile_id: input.profile_id,
        workforce_count: input.workforce_count,
        license_class: input.license_class,
        concurrent_projects_capacity: input.concurrent_projects_capacity,
        work_categories: input.work_categories,
        specializations: input.specializations ?? [],
        fleet_size: input.fleet_size ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};

// =============================================================================
// Equipment Dealer Validator
// =============================================================================

export interface EquipmentDealerInput {
  profile_id: string;
  business_type: string;
  total_equipment_count: number;
  equipment_categories: string[];
  park_location?: { lat: number; lng: number };
  rental_categories?: string[];
}

export const equipmentDealerValidator = {
  validate(input: EquipmentDealerInput) {
    const errors: string[] = [];

    if (input.total_equipment_count < 0) {
      errors.push('total_equipment_count must be >= 0');
    }

    if (input.park_location) {
      const { lat, lng } = input.park_location;
      if (lat < -90 || lat > 90) {
        errors.push('park_location.lat must be between -90 and 90');
      }
      if (lng < -180 || lng > 180) {
        errors.push('park_location.lng must be between -180 and 180');
      }
    }

    return errors;
  },

  async create(input: EquipmentDealerInput) {
    const errors = this.validate(input);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return await db
      .insertInto('equipment_dealers')
      .values({
        profile_id: input.profile_id,
        business_type: input.business_type,
        total_equipment_count: input.total_equipment_count,
        equipment_categories: input.equipment_categories,
        park_location: input.park_location
          ? `POINT(${input.park_location.lng} ${input.park_location.lat})`
          : null,
        rental_categories: input.rental_categories ?? [],
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};