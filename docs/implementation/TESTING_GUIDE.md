# Integration & E2E Testing Guide

## Local Environment Setup

Copy `.env.example` to `.env.local` before running tests. Key flags for local/test environments:

| Variable | Value | Purpose |
|----------|-------|---------|
| `PHONEPE_SKIP_SIGNATURE_VERIFY` | `true` | Bypasses PhonePe callback signature check — **must be `false` in production** |
| `PHONEPE_ENVIRONMENT` | `UAT` | Points to PhonePe sandbox |
| `QSTASH_CURRENT_SIGNING_KEY` | (from Upstash dashboard) | Required for `verifyQStashSignature()` to pass |

---

## Overview

This project uses a three-tier testing strategy:

| Tier | Tool | Location | Purpose |
|------|------|----------|---------|
| Unit | Vitest | `tests/unit/` | Test individual functions, state machines, validators |
| Integration | Vitest | `tests/integration/` | Test API routes with mocked dependencies |
| E2E | Playwright | `tests/e2e/` | Test complete user workflows in browser |

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- tests/unit/

# Integration tests only
npm test -- tests/integration/

# E2E tests (headless)
npm run test:e2e

# E2E tests (with UI)
npm run test:e2e:ui

# Watch mode
npm run test:watch
```

## Unit Tests

**Location**: `tests/unit/services/`

**What they test**:
- State machine transitions (RFP, Subscription, Moderation)
- Validation logic (role extensions, DQS components)
- Service method behavior with mocked DB

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rfpService } from '@/lib/services/rfp';

vi.mock('@/lib/db', () => ({
  db: { /* mock chain */ },
}));

describe('RFP Service', () => {
  it('creates RFP in DRAFT state', async () => {
    const result = await rfpService.create({ ... });
    expect(result.status).toBe('DRAFT');
  });
});
```

## Integration Tests

**Location**: `tests/integration/api/`

**What they test**:
- API route request/response contracts
- Auth enforcement (401 on missing session)
- Validation errors (400 on bad input)
- Success responses (200/201 with correct shape)

**Pattern**:
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'test-user', role: 'user' }),
  AuthError: class AuthError extends Error { ... },
}));

describe('RFP API Integration', () => {
  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/rfps/route');
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

## E2E Tests

**Location**: `tests/e2e/`

**What they test**:
- Complete user workflows across multiple pages
- State transitions visible in UI
- Cross-feature interactions (RFP → Response → Connection)

**Current E2E Tests**:

### `rfp-lifecycle.spec.ts`
- Create RFP → Publish → Respond → Accept → Connection created
- Cannot respond to expired RFP
- Cannot respond twice to same RFP

### `subscription-lifecycle.spec.ts`
- Trial → Hard lock → Payment → Active restoration
- Cannot initiate handshake while hard locked
- Credits reset monthly for active subscription

**Pattern**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('RFP Lifecycle Workflow', () => {
  test('create -> publish -> respond -> accept', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    
    // Perform workflow steps
    await page.goto('/rfps/new');
    // ... fill form, submit, verify
    
    // Verify expected state
    await expect(page.getByTestId('rfp-status')).toHaveText('OPEN');
  });
});
```

## Test Data Attributes

All interactive elements should have `data-testid` attributes:

```tsx
<button data-testid="rfp-submit">Submit</button>
<span data-testid="rfp-status">OPEN</span>
<input data-testid="rfp-title" />
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          # ... other env vars
```

## Coverage Requirements

| Tier | Minimum Coverage |
|------|-----------------|
| Unit | 90% lines, 100% state transitions |
| Integration | All API routes, all auth paths |
| E2E | All critical workflows |

## Adding New Tests

1. **New service**: Add unit test in `tests/unit/services/`
2. **New API route**: Add integration test in `tests/integration/api/`
3. **New user flow**: Add E2E test in `tests/e2e/`
4. Update this doc if adding new test categories
