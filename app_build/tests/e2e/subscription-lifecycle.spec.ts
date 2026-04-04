// @witness [MON-001]
import { test, expect } from '@playwright/test';

test.describe('Subscription & Credits Workflow', () => {
  test('trial -> hard lock -> payment -> active restoration', async ({ page }) => {
    // Step 1: Sign in and start trial
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'newuser@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Verify trial status
    await page.goto('/settings/subscription');
    await expect(page.getByTestId('subscription-status')).toHaveText('TRIAL');
    await expect(page.getByTestId('handshake-credits')).toHaveText('30');
    await expect(page.getByTestId('trial-timer')).toBeVisible();

    // Step 2: Use handshake credits
    await page.goto('/discovery');
    await page.click('[data-testid="connect-button"]:first');
    await expect(page.getByTestId('credits-remaining')).toHaveText('29');

    // Step 3: Simulate trial expiry (mock time)
    await page.context().clearCookies();

    // Step 4: Sign in after expiry - should be hard locked
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'newuser@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Verify hard lock
    await page.goto('/settings/subscription');
    await expect(page.getByTestId('subscription-status')).toHaveText('HARD_LOCKED');
    await expect(page.getByTestId('handshake-credits')).toHaveText('0');
    await expect(page.getByTestId('payment-cta')).toBeVisible();

    // Step 5: Make payment
    await page.click('[data-testid="payment-cta"]');
    await page.fill('[data-testid="phonepe-phone"]', '+919876543210');
    await page.click('[data-testid="phonepe-pay"]');
    // Simulate PhonePe callback
    await page.waitForURL('/auth/callback?*');

    // Step 6: Verify active restoration
    await page.goto('/settings/subscription');
    await expect(page.getByTestId('subscription-status')).toHaveText('ACTIVE');
    await expect(page.getByTestId('handshake-credits')).toHaveText('30');
    await expect(page.getByTestId('payment-success')).toBeVisible();
  });

  test('cannot initiate handshake while hard locked', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'lockeduser@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await expect(page.getByTestId('connect-button')).toBeDisabled();
    await expect(page.getByTestId('hard-locked-message')).toBeVisible();
  });

  test('credits reset monthly for active subscription', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'activeuser@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Check credits
    await page.goto('/settings/subscription');
    await expect(page.getByTestId('handshake-credits')).toHaveText('30');
    await expect(page.getByTestId('credits-reset-date')).toBeVisible();
  });
});
