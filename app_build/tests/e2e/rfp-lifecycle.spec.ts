// @witness [RFP-001]
import { test, expect } from '@playwright/test';

test.describe('RFP Lifecycle Workflow', () => {
  test('create RFP -> publish -> respond -> accept -> connection created', async ({ page }) => {
    // Step 1: Sign in as RFP creator
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'creator@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Step 2: Create a new RFP
    await page.goto('/rfps/new');
    await page.fill('[data-testid="rfp-title"]', 'Office Building Construction - Mumbai');
    await page.fill('[data-testid="rfp-description"]', 'Looking for contractor for 5-story office building');
    await page.selectOption('[data-testid="rfp-category"]', 'construction');
    await page.fill('[data-testid="rfp-budget-min"]', '5000000');
    await page.fill('[data-testid="rfp-budget-max"]', '10000000');
    await page.fill('[data-testid="rfp-expiry-date"]', '2026-06-01');
    await page.click('[data-testid="rfp-submit"]');
    await page.waitForURL('/rfps/*');

    // Verify RFP is created in DRAFT state
    await expect(page.getByTestId('rfp-status')).toHaveText('DRAFT');

    // Step 3: Publish the RFP
    await page.click('[data-testid="rfp-publish"]');
    await expect(page.getByTestId('rfp-status')).toHaveText('OPEN');

    // Step 4: Sign in as responder
    await page.context().clearCookies();
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'contractor@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Step 5: Browse and respond to RFP
    await page.goto('/rfps/browse');
    await page.click('[data-testid="rfp-card"]:has-text("Office Building Construction")');
    await page.click('[data-testid="rfp-respond"]');
    await page.fill('[data-testid="response-proposal"]', 'We can complete this in 8 months with our experienced team');
    await page.fill('[data-testid="response-estimated-cost"]', '7500000');
    await page.fill('[data-testid="response-estimated-days"]', '240');
    await page.click('[data-testid="response-submit"]');
    await expect(page.getByTestId('response-success')).toBeVisible();

    // Step 6: Sign back in as creator
    await page.context().clearCookies();
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'creator@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Step 7: View responses and accept one
    await page.goto('/rfps');
    await page.click('[data-testid="rfp-card"]:has-text("Office Building Construction")');
    await page.click('[data-testid="view-responses"]');
    await expect(page.getByTestId('response-count')).toHaveText('1');
    await page.click('[data-testid="accept-response"]');
    await page.click('[data-testid="confirm-accept"]');

    // Verify connection created
    await expect(page.getByTestId('connection-created')).toBeVisible();
    await expect(page.getByTestId('rfp-status')).toHaveText('CLOSED');
  });

  test('cannot respond to expired RFP', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'contractor@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to expired RFP (simulated)
    await page.goto('/rfps/expired-rfp-id');
    await expect(page.getByTestId('rfp-status')).toHaveText('EXPIRED');
    await expect(page.getByTestId('rfp-respond')).not.toBeVisible();
  });

  test('cannot respond twice to same RFP', async ({ page }) => {
    // Sign in as contractor who already responded
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'contractor@buondesizn.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');

    // Try to respond to RFP already responded to
    await page.goto('/rfps/already-responded-id');
    await expect(page.getByTestId('already-responded-message')).toBeVisible();
    await expect(page.getByTestId('rfp-respond')).not.toBeVisible();
  });
});
