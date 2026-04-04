import { describe, it, expect } from 'vitest';
import {
  productSellerValidator,
  contractorValidator,
  equipmentDealerValidator,
} from '@/lib/services/roles';

describe('Role Extension Validators', () => {
  describe('Product Seller Validator', () => {
    it('validates correct input', () => {
      const errors = productSellerValidator.validate({
        profile_id: 'test-user',
        business_type: 'MANUFACTURER',
        delivery_radius_km: 50,
        credit_period_days: 30,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid business_type', () => {
      const errors = productSellerValidator.validate({
        profile_id: 'test-user',
        business_type: 'INVALID',
        delivery_radius_km: 50,
        credit_period_days: 30,
      });

      expect(errors).toContain('business_type must be one of: MANUFACTURER, DISTRIBUTOR, RETAILER, WHOLESALER');
    });

    it('rejects negative delivery_radius_km', () => {
      const errors = productSellerValidator.validate({
        profile_id: 'test-user',
        business_type: 'MANUFACTURER',
        delivery_radius_km: -10,
        credit_period_days: 30,
      });

      expect(errors).toContain('delivery_radius_km must be >= 0');
    });

    it('rejects negative credit_period_days', () => {
      const errors = productSellerValidator.validate({
        profile_id: 'test-user',
        business_type: 'MANUFACTURER',
        delivery_radius_km: 50,
        credit_period_days: -5,
      });

      expect(errors).toContain('credit_period_days must be >= 0');
    });

    it('allows zero values', () => {
      const errors = productSellerValidator.validate({
        profile_id: 'test-user',
        business_type: 'MANUFACTURER',
        delivery_radius_km: 0,
        credit_period_days: 0,
      });

      expect(errors).toHaveLength(0);
    });
  });

  describe('Contractor Validator', () => {
    it('validates correct input', () => {
      const errors = contractorValidator.validate({
        profile_id: 'test-user',
        workforce_count: 50,
        license_class: 'CLASS_A',
        concurrent_projects_capacity: 3,
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects negative workforce_count', () => {
      const errors = contractorValidator.validate({
        profile_id: 'test-user',
        workforce_count: -5,
        license_class: 'CLASS_A',
        concurrent_projects_capacity: 3,
      });

      expect(errors).toContain('workforce_count must be >= 0');
    });

    it('rejects invalid license_class', () => {
      const errors = contractorValidator.validate({
        profile_id: 'test-user',
        workforce_count: 50,
        license_class: 'INVALID',
        concurrent_projects_capacity: 3,
      });

      expect(errors).toContain('license_class must be one of: CLASS_A, CLASS_B, CLASS_C, CLASS_D, SPECIAL');
    });

    it('rejects concurrent_projects_capacity less than 1', () => {
      const errors = contractorValidator.validate({
        profile_id: 'test-user',
        workforce_count: 50,
        license_class: 'CLASS_A',
        concurrent_projects_capacity: 0,
      });

      expect(errors).toContain('concurrent_projects_capacity must be >= 1');
    });

    it('rejects negative fleet_size', () => {
      const errors = contractorValidator.validate({
        profile_id: 'test-user',
        workforce_count: 50,
        license_class: 'CLASS_A',
        concurrent_projects_capacity: 3,
        fleet_size: -2,
      });

      expect(errors).toContain('fleet_size must be >= 0');
    });
  });

  describe('Equipment Dealer Validator', () => {
    it('validates correct input', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: 25,
        park_location: { lat: 19.076, lng: 72.8777 },
      });

      expect(errors).toHaveLength(0);
    });

    it('rejects negative total_equipment_count', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: -5,
      });

      expect(errors).toContain('total_equipment_count must be >= 0');
    });

    it('rejects invalid latitude', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: 25,
        park_location: { lat: 91, lng: 72.8777 },
      });

      expect(errors).toContain('park_location.lat must be between -90 and 90');
    });

    it('rejects invalid longitude', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: 25,
        park_location: { lat: 19.076, lng: 181 },
      });

      expect(errors).toContain('park_location.lng must be between -180 and 180');
    });

    it('allows zero equipment count', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: 0,
      });

      expect(errors).toHaveLength(0);
    });

    it('allows missing park_location', () => {
      const errors = equipmentDealerValidator.validate({
        profile_id: 'test-user',
        total_equipment_count: 25,
      });

      expect(errors).toHaveLength(0);
    });
  });
});