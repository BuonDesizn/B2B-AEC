// @witness [AD-001]
import { test, expect } from '@playwright/test';

test.describe('Phase 3: Ad Campaign Lifecycle', () => {
  test('create ad campaign with details', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/create');
    await page.fill('[data-testid="ad-title"]', 'Premium Cotton Fabric - Bulk Orders');
    await page.fill('[data-testid="ad-description"]', '100% organic cotton fabric available for immediate delivery');
    await page.selectOption('[data-testid="ad-category"]', 'textiles');
    await page.fill('[data-testid="ad-budget"]', '50000');
    await page.fill('[data-testid="ad-duration-days"]', '30');
    await page.click('[data-testid="target-roles"]:has-text("Buyer")');
    await page.click('[data-testid="create-ad-button"]');
    await expect(page).toHaveURL(/\/ads\/.*/);
    await expect(page.getByTestId('ad-status')).toHaveText('PENDING_PAYMENT');
  });

  test('initiate payment for ad campaign', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/my-ads');
    await page.click('[data-testid="ad-card"]:first');
    await page.click('[data-testid="pay-ad-button"]');
    await expect(page.getByTestId('payment-modal')).toBeVisible();
    await page.fill('[data-testid="phonepe-phone"]', '+919876543210');
    await page.click('[data-testid="phonepe-pay"]');
    await expect(page).toHaveURL('/ads/payment/callback*');
  });

  test('ad goes active after successful payment', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/my-ads');
    await page.click('[data-testid="ad-card"]:first');
    await expect(page.getByTestId('ad-status')).toHaveText('ACTIVE');
    await expect(page.getByTestId('payment-confirmation')).toBeVisible();
  });

  test('connect from ad card', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/browse');
    await page.click('[data-testid="ad-card"]:first');
    await page.click('[data-testid="connect-from-ad"]');
    await page.fill('[data-testid="connection-message"]', 'Interested in your ad for cotton fabric');
    await page.click('[data-testid="send-request"]');
    await expect(page.getByTestId('request-sent-confirmation')).toBeVisible();
  });

  test.skip('ad performance metrics tracked', async ({ page }) => {
    // Verify impressions, clicks, and connections are tracked
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/ads/my-ads');
    await page.click('[data-testid="ad-card"]:first');
    await expect(page.getByTestId('impressions-count')).toBeVisible();
    await expect(page.getByTestId('clicks-count')).toBeVisible();
  });

  test.skip('pause and resume ad campaign', async ({ page }) => {
    // Requires ad to be in ACTIVE state
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/ads/my-ads');
    await page.click('[data-testid="ad-card"]:first');
    await page.click('[data-testid="pause-ad"]');
    await expect(page.getByTestId('ad-status')).toHaveText('PAUSED');
    await page.click('[data-testid="resume-ad"]');
    await expect(page.getByTestId('ad-status')).toHaveText('ACTIVE');
  });

  test('cannot create ad with insufficient credits', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'lowcredits@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/create');
    await expect(page.getByTestId('create-ad-button')).toBeDisabled();
    await expect(page.getByTestId('insufficient-credits-message')).toBeVisible();
  });

  test('ad expires after duration', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/ads/my-ads');
    await page.click('[data-testid="ad-card"]:has-text("Expired Campaign")');
    await expect(page.getByTestId('ad-status')).toHaveText('EXPIRED');
    await expect(page.getByTestId('renew-ad-button')).toBeVisible();
  });
});
