// @witness [UI-001]
import { test, expect } from '@playwright/test';

test.describe('Phase 1: Role-Based Dashboard UI', () => {
  test('sidebar navigation visible for all roles', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('sidebar-nav')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Dashboard")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Discovery")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Connections")')).toBeVisible();
  });

  test('hard lock overlay appears when subscription expired', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'expireduser@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('hard-lock-overlay')).toBeVisible();
    await expect(page.getByTestId('renew-subscription-cta')).toBeVisible();
    await expect(page.getByTestId('dashboard-content')).not.toBeVisible();
  });

  test('dashboard metrics display correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('metric-card"]:has-text("Connections")')).toBeVisible();
    await expect(page.getByTestId('metric-card"]:has-text("Credits")')).toBeVisible();
    await expect(page.getByTestId('metric-card"]:has-text("Active RFPs")')).toBeVisible();
  });

  test('role-specific menu items - Production Partner', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'pp_user@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('nav-item"]:has-text("My Products")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Production Orders")')).toBeVisible();
  });

  test('role-specific menu items - Creditor', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'creditor@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('nav-item"]:has-text("Loan Applications")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Credit Portfolio")')).toBeVisible();
  });

  test('role-specific menu items - Consignee', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'consignee@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('nav-item"]:has-text("Warehouses")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Storage Requests")')).toBeVisible();
  });

  test('role-specific menu items - Payment Service', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'paymentservice@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('nav-item]:has-text("Payment Gateway")')).toBeVisible();
    await expect(page.getByTestId('nav-item]:has-text("Transactions")')).toBeVisible();
  });

  test('role-specific menu items - Exporter/Distributor', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'exporter@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('nav-item"]:has-text("Shipments")')).toBeVisible();
    await expect(page.getByTestId('nav-item"]:has-text("Export Orders")')).toBeVisible();
  });

  test.skip('subscription status badge visible in sidebar', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('subscription-badge')).toBeVisible();
    await expect(page.getByTestId('subscription-badge')).toHaveText('ACTIVE');
  });

  test.skip('recent activity feed on dashboard', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await expect(page.getByTestId('activity-feed')).toBeVisible();
  });
});
