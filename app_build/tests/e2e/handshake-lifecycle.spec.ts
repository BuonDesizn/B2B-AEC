// @witness [HD-001]
import { test, expect } from '@playwright/test';

test.describe('Phase 1: Handshake Lifecycle', () => {
  test('discover profile and send connection request', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/discovery');
    await page.fill('[data-testid="search-input"]', 'textile manufacturer');
    await page.click('[data-testid="search-button"]');
    await page.click('[data-testid="profile-card"]:first');
    await page.click('[data-testid="connect-button"]');
    await page.fill('[data-testid="connection-message"]', 'Interested in your manufacturing capabilities');
    await page.click('[data-testid="send-request"]');
    await expect(page.getByTestId('request-sent-confirmation')).toBeVisible();
  });

  test('accept incoming connection request', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/connections/requests');
    await expect(page.getByTestId('pending-request')).toBeVisible();
    await page.click('[data-testid="pending-request"]');
    await page.click('[data-testid="accept-request"]');
    await expect(page.getByTestId('request-accepted-confirmation')).toBeVisible();
    await expect(page.getByTestId('connection-status')).toHaveText('CONNECTED');
  });

  test('reject incoming connection request', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/connections/requests');
    await page.click('[data-testid="pending-request"]');
    await page.click('[data-testid="reject-request"]');
    await expect(page.getByTestId('request-rejected-confirmation')).toBeVisible();
  });

  test('connection permanence - appears in address book after acceptance', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/connections/address-book');
    await expect(page.getByTestId('connected-profile')).toBeVisible();
    
    // Refresh page to verify persistence
    await page.reload();
    await expect(page.getByTestId('connected-profile')).toBeVisible();
  });

  test('credit deduction verification on connection request', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/settings/subscription');
    const initialCredits = await page.getByTestId('handshake-credits').textContent();

    await page.goto('/discovery');
    await page.click('[data-testid="profile-card"]:first');
    await page.click('[data-testid="connect-button"]');
    await page.click('[data-testid="send-request"]');

    await page.goto('/settings/subscription');
    const afterCredits = await page.getByTestId('handshake-credits').textContent();
    expect(parseInt(afterCredits!)).toBe(parseInt(initialCredits!) - 1);
  });

  test('cannot send duplicate connection request', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/connections/address-book');
    await page.click('[data-testid="connected-profile"]:first');
    await expect(page.getByTestId('connect-button')).not.toBeVisible();
    await expect(page.getByTestId('already-connected-message')).toBeVisible();
  });

  test.skip('notification sent on connection acceptance', async ({ page }) => {
    // Verify notification appears for connection accepted
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'buyer@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    await page.goto('/notifications');
    await expect(page.getByTestId('notification-item"]:has-text("connection accepted"')).toBeVisible();
  });

  test.skip('connection request expires after 14 days', async ({ page }) => {
    // Requires time manipulation or test data setup
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'seller@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.goto('/connections/requests');
    await expect(page.getByTestId('pending-request')).not.toBeVisible();
  });
});
