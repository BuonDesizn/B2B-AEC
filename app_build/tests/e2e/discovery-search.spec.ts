// @witness [RM-001]
import { test, expect } from '@playwright/test';

test.describe('Phase 1: Discovery & Search', () => {
  test('search by keyword returns relevant results', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'textile manufacturer');
    await page.click('[data-testid="search-button"]');
    await expect(page.getByTestId('search-results-count')).toBeVisible();
    const results = await page.locator('[data-testid="profile-card"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test('70/30 proximity ranking - nearby profiles ranked higher', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'cotton fabric');
    await page.click('[data-testid="search-button"]');

    const firstResultLocation = await page.locator('[data-testid="profile-card"]:first [data-testid="profile-location"]').textContent();
    const lastResultLocation = await page.locator('[data-testid="profile-card"]:last [data-testid="profile-location"]').textContent();
    expect(firstResultLocation).toContain('Mumbai');
  });

  test('hard-locked profiles excluded from search results', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'manufacturer');
    await page.click('[data-testid="search-button"]');

    const lockedProfiles = await page.locator('[data-testid="profile-card"][data-locked="true"]').count();
    expect(lockedProfiles).toBe(0);
  });

  test('filter by role - Production Partner', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await page.click('[data-testid="filter-role"]');
    await page.click('[data-testid="role-option"]:has-text("Production Partner")');
    await page.click('[data-testid="apply-filters"]');

    const roleBadges = await page.locator('[data-testid="profile-card"] [data-testid="role-badge"]').allTextContents();
    expect(roleBadges.every(badge => badge === 'Production Partner')).toBe(true);
  });

  test('filter by role - Creditor', async ({ page }) => {
    await page.goto('/discovery');
    await page.click('[data-testid="filter-role"]');
    await page.click('[data-testid="role-option"]:has-text("Creditor")');
    await page.click('[data-testid="apply-filters"]');

    const roleBadges = await page.locator('[data-testid="profile-card"] [data-testid="role-badge"]').allTextContents();
    expect(roleBadges.every(badge => badge === 'Creditor')).toBe(true);
  });

  test('filter by role - Exporter/Distributor', async ({ page }) => {
    await page.goto('/discovery');
    await page.click('[data-testid="filter-role"]');
    await page.click('[data-testid="role-option"]:has-text("Exporter/Distributor")');
    await page.click('[data-testid="apply-filters"]');

    const roleBadges = await page.locator('[data-testid="profile-card"] [data-testid="role-badge"]').allTextContents();
    expect(roleBadges.every(badge => badge === 'Exporter/Distributor')).toBe(true);
  });

  test.skip('combined search with proximity and role filter', async ({ page }) => {
    // Complex test: verify ranking algorithm with multiple filters
    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'cotton yarn');
    await page.click('[data-testid="filter-role"]');
    await page.click('[data-testid="role-option"]:has-text("Production Partner")');
    await page.fill('[data-testid="radius-input"]', '100');
    await page.click('[data-testid="apply-filters"]');
  });

  test('empty search results shows appropriate message', async ({ page }) => {
    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'xyznonexistent123456');
    await page.click('[data-testid="search-button"]');
    await expect(page.getByTestId('no-results-message')).toBeVisible();
  });
});
