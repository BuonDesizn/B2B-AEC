// This file is regenerated from migrations. Do not modify manually.
// Regenerated: 2026-04-03

import type { ColumnType } from 'kysely';

export type Generated<T> = T extends string | number | Date | boolean
  ? ColumnType<T, T | undefined, T>
  : ColumnType<T, T | undefined, T>;

export type Json = { [key: string]: any };

export interface DB {
  address_book: {
    id: Generated<string>;
    owner_id: string;
    contact_id: string;
    first_handshake_id: string | null;
    added_at: Generated<Date>;
  };

  ad_analytics: {
    id: Generated<string>;
    ad_id: string;
    event_type: string;
    viewer_id: string | null;
    viewer_lat: number | null;
    viewer_lng: number | null;
    distance_meters: number | null;
    created_at: Generated<Date>;
  };

  ads: {
    id: Generated<string>;
    profile_id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    target_url: string | null;
    location: string;
    radius_meters: Generated<number> | null;
    status: Generated<string> | null;
    moderation_status: Generated<string> | null;
    placement_type: Generated<string> | null;
    target_audience_roles: Generated<string[]> | null;
    tier: Generated<string> | null;
    priority_score: Generated<number> | null;
    budget_inr: number | null;
    cost_per_click: number | null;
    expires_at: Date | null;
    is_paused: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    dealer_id: string | null;
    campaign_name: string | null;
    impressions: Generated<number> | null;
    clicks: Generated<number> | null;
    ctr: Generated<number> | null;
    cpc: Generated<number> | null;
    budget_total: number | null;
    budget_remaining: number | null;
    rejection_reason: string | null;
    payment_status: string | null;
  };

  async_jobs: {
    id: Generated<string>;
    job_type: string;
    status: Generated<string> | null;
    payload: Json;
    result: Json | null;
    attempts: Generated<number> | null;
    max_attempts: Generated<number> | null;
    last_error: string | null;
    scheduled_at: Date | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  audit_purge_queue: {
    id: Generated<string>;
    profile_id: string;
    reason: string;
    requested_by: string | null;
    approved_by: string | null;
    status: Generated<string> | null;
    created_at: Generated<Date>;
    completed_at: Date | null;
  };

  company_personnel: {
    id: Generated<string>;
    profile_id: string;
    company_gstin: string;
    full_name: string;
    designation: string;
    qualification: string | null;
    specialty: Generated<string[]> | null;
    experience_years: number | null;
    email: string | null;
    phone: string | null;
    detailed_bio: string | null;
    profile_image_url: string | null;
    linkedin_url: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  connections: {
    id: Generated<string>;
    requester_id: string;
    target_id: string;
    status: Generated<string>;
    connection_source: string | null;
    requester_message: string | null;
    requester_shares_email: Generated<boolean> | null;
    requester_shares_phone: Generated<boolean> | null;
    target_shares_email: Generated<boolean> | null;
    target_shares_phone: Generated<boolean> | null;
    initiated_at: Generated<Date>;
    responded_at: Date | null;
    expires_at: Generated<Date> | null;
    updated_at: Generated<Date> | null;
  };

  consultants: {
    id: Generated<string>;
    profile_id: string;
    company_type: string | null;
    annual_turnover_range: string | null;
    employee_count_range: string | null;
    services_offered: string[];
    design_software: Generated<string[]> | null;
    iso_9001: Generated<boolean> | null;
    iso_14001: Generated<boolean> | null;
    iso_45001: Generated<boolean> | null;
    other_certifications: string[] | null;
    largest_project_value: number | null;
    typical_project_size: string | null;
    accepting_new_projects: Generated<boolean> | null;
    min_project_value: number | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  contractors: {
    id: Generated<string>;
    profile_id: string;
    company_type: string | null;
    annual_turnover_range: string | null;
    permanent_employees: Generated<number> | null;
    skilled_workers: Generated<number> | null;
    owned_equipment: Generated<Json> | null;
    pf_registration_number: string | null;
    esic_registration_number: string | null;
    iso_9001: Generated<boolean> | null;
    safety_incidents_last_year: Generated<number> | null;
    work_categories: string[];
    contractor_license_number: string | null;
    license_class: string | null;
    license_expiry_date: Date | null;
    concurrent_projects_capacity: Generated<number> | null;
    largest_project_completed: number | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    workforce_count: number | null;
    specializations: Generated<string[]> | null;
    fleet_size: number | null;
  };

  email_queue: {
    id: Generated<string>;
    recipient_id: string | null;
    to_email: string;
    subject: string;
    body_html: string;
    notification_id: string | null;
    status: Generated<string> | null;
    attempts: Generated<number> | null;
    max_attempts: Generated<number> | null;
    last_error: string | null;
    scheduled_at: Date | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    body: string | null;
  };

  equipment: {
    id: Generated<string>;
    dealer_id: string;
    name: string;
    description: string | null;
    category: string;
    type: string | null;
    rental_rate_per_day: number | null;
    operator_included: Generated<boolean> | null;
    location: string | null;
    images: Generated<string[]> | null;
    available: Generated<boolean> | null;
    is_active: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    features: Generated<string[]> | null;
    deleted_at: Date | null;
  };

  equipment_dealers: {
    id: Generated<string>;
    profile_id: string;
    business_type: string;
    total_equipment_count: Generated<number> | null;
    equipment_categories: string[];
    park_location: string | null;
    park_address: string | null;
    hourly_rental_available: Generated<boolean> | null;
    daily_rental_available: Generated<boolean> | null;
    provides_operators: Generated<boolean> | null;
    provides_transportation: Generated<boolean> | null;
    breakdown_support_24x7: Generated<boolean> | null;
    all_rc_updated: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    rental_categories: Generated<string[]> | null;
  };

  invoices: {
    id: Generated<string>;
    subscription_id: string;
    profile_id: string;
    phonepe_transaction_id: string;
    amount: number;
    currency: Generated<string>;
    billing_period_start: Date;
    billing_period_end: Date;
    invoice_pdf_url: string | null;
    status: Generated<string>;
    generated_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  notification_preferences: {
    profile_id: string;
    connection_requests: Generated<boolean> | null;
    connection_accepted: Generated<boolean> | null;
    connection_rejected: Generated<boolean> | null;
    rfp_responses: Generated<boolean> | null;
    rfp_nearby: Generated<boolean> | null;
    ad_moderation: Generated<boolean> | null;
    subscription_alerts: Generated<boolean> | null;
    payment_notifications: Generated<boolean> | null;
    system_announcements: Generated<boolean> | null;
    receive_email_notifications: Generated<boolean> | null;
    receive_sms_notifications: Generated<boolean> | null;
    updated_at: Generated<Date> | null;
    user_id: string | null;
    receive_push_notifications: Generated<boolean> | null;
    connection_requested: Generated<boolean> | null;
    rfp_response_submitted: Generated<boolean> | null;
    ad_payment_success: Generated<boolean> | null;
    subscription_expiring: Generated<boolean> | null;
  };

  notifications: {
    id: Generated<string>;
    recipient_id: string;
    notification_type: string;
    title: string;
    message: string;
    action_url: string | null;
    action_text: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    is_read: Generated<boolean> | null;
    read_at: Date | null;
    sent_via_app: Generated<boolean> | null;
    sent_via_email: Generated<boolean> | null;
    sent_via_sms: Generated<boolean> | null;
    created_at: Generated<Date>;
    type: string | null;
    metadata: Generated<Json> | null;
  };

  portfolio_items: {
    id: Generated<string>;
    profile_id: string;
    title: string;
    description: string | null;
    images: Generated<string[]> | null;
    drawings_url: string | null;
    is_active: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  product_sellers: {
    id: Generated<string>;
    profile_id: string;
    business_type: string;
    brand_names: string[] | null;
    primary_category: string;
    secondary_categories: string[] | null;
    min_order_value: number | null;
    accepts_bulk_orders: Generated<boolean> | null;
    delivery_available: Generated<boolean> | null;
    delivery_radius_km: Generated<number> | null;
    warehouse_locations: Generated<Json> | null;
    total_skus: Generated<number> | null;
    offers_credit: Generated<boolean> | null;
    credit_period_days: Generated<number> | null;
    iso_certified: Generated<boolean> | null;
    bis_certified: Generated<boolean> | null;
    warranty_offered: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    sku_capacity: number | null;
  };

  products: {
    id: Generated<string>;
    seller_id: string;
    name: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    price_per_unit: number;
    unit: Generated<string> | null;
    min_order_quantity: Generated<number> | null;
    images: Generated<string[]> | null;
    available: Generated<boolean> | null;
    is_active: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    specifications: Json | null;
    deleted_at: Date | null;
  };

  profiles: {
    id: string;
    email: string;
    persona_type: string;
    pan: string;
    gstin: string | null;
    org_name: string | null;
    tagline: string | null;
    city: string | null;
    state: string | null;
    is_individual: Generated<boolean> | null;
    establishment_year: number | null;
    location: string | null;
    address_line1: string | null;
    address_line2: string | null;
    pincode: string | null;
    msme_number: string | null;
    phone_primary: string | null;
    phone_secondary: string | null;
    email_business: string | null;
    linkedin_url: string | null;
    verification_status: Generated<string>;
    subscription_status: Generated<string>;
    trial_started_at: Date | null;
    handshake_credits: Generated<number>;
    last_credit_reset_at: Date | null;
    has_india_access: Generated<boolean> | null;
    dqs_score: Generated<number> | null;
    dqs_responsiveness: Generated<number> | null;
    dqs_trust_loops: Generated<number> | null;
    dqs_verification: Generated<number> | null;
    dqs_profile_depth: Generated<number> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    deleted_at: Date | null;
    last_active_at: Generated<Date> | null;
    role: Generated<string>;
    avatar_url: string | null;
    phone_number: string | null;
    address: string | null;
    postal_code: string | null;
    credits_reset_at: Date | null;
  };

  project_professionals: {
    id: Generated<string>;
    profile_id: string;
    designation: string | null;
    experience_years: number | null;
    qualification: string | null;
    specialization: string[] | null;
    coa_number: string | null;
    coa_expiry_date: Date | null;
    portfolio_summary: string | null;
    total_projects: Generated<number> | null;
    featured_project_ids: string[] | null;
    awards: Generated<Json> | null;
    software_skills: Generated<string[]> | null;
    available_for_hire: Generated<boolean> | null;
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  rfp_invitations: {
    id: Generated<string>;
    rfp_id: string;
    invitee_id: string;
    status: Generated<string> | null;
    created_at: Generated<Date>;
  };

  rfp_responses: {
    id: Generated<string>;
    rfp_id: string;
    responder_id: string;
    proposal_text: string;
    bid_amount: number | null;
    estimated_days: number | null;
    attachments_url: string[] | null;
    status: Generated<string> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    proposal: string | null;
    estimated_cost: number | null;
  };

  rfps: {
    id: Generated<string>;
    creator_id: string;
    request_type: Generated<string> | null;
    title: string;
    description: string;
    sector_of_application: string;
    category: string;
    requirements: Json;
    attachments: string[] | null;
    project_location: string;
    project_address: string | null;
    project_city: string;
    project_state: string;
    notification_radius_meters: Generated<number> | null;
    target_personas: string[];
    status: Generated<string> | null;
    is_public: Generated<boolean> | null;
    allow_direct_responses: Generated<boolean> | null;
    budget_min: number | null;
    budget_max: number | null;
    currency: Generated<string> | null;
    estimated_duration_days: number | null;
    min_dqs_score: Generated<number> | null;
    verified_only: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    published_at: Date | null;
    closes_at: Date | null;
    expires_at: Generated<Date> | null;
    views_count: Generated<number> | null;
    responses_count: Generated<number> | null;
    subcategory: string | null;
    expiry_date: Date | null;
    requester_id: string | null;
    location: string | null;
  };

  subscription_plans: {
    id: Generated<string>;
    plan_name: string;
    plan_code: string;
    display_name: string;
    price_monthly: number;
    features: Generated<Json> | null;
    is_active: Generated<boolean> | null;
    is_public: Generated<boolean> | null;
    created_at: Generated<Date> | null;
    updated_at: Generated<Date> | null;
  };

  subscriptions: {
    id: Generated<string>;
    profile_id: string;
    plan_name: Generated<string>;
    status: string;
    activated_at: Date | null;
    expires_at: Date | null;
    phonepe_order_id: string | null;
    phonepe_transaction_id: string | null;
    created_at: Generated<Date>;
    plan: string | null;
    amount: number | null;
    trial_starts_at: Date | null;
    trial_ends_at: Date | null;
    current_period_start: Date | null;
    current_period_end: Date | null;
    last_payment_id: string | null;
    updated_at: Generated<Date> | null;
    downgrade_scheduled_at: Date | null;
  };

  services: {
    id: Generated<string>;
    profile_id: string;
    title: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    price_per_hour: number | null;
    price_per_project: number | null;
    delivery_time_days: number | null;
    requires_site_visit: Generated<boolean> | null;
    images: Generated<string[]> | null;
    is_active: Generated<boolean> | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };

  system_audit_log: {
    id: Generated<string>;
    actor_id: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    old_value: Json | null;
    new_value: Json | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Generated<Date>;
  };

  system_config: {
    key: string;
    value: Json;
    description: string | null;
    updated_at: Generated<Date> | null;
  };

  unmasking_audit: {
    id: Generated<string>;
    viewer_id: string;
    viewed_id: string;
    trigger_event: Generated<string>;
    revealed_fields: string[];
    unmasked_at: Generated<Date>;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Generated<Json> | null;
    retention_expires_at: Generated<Date> | null;
  };
}
