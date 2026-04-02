# SDD Stage: QA Test Specification (TDD)

**Goal**: Write failing tests BEFORE implementation starts. Tests define the Definition of Done — when they pass, the feature is complete.

Before writing tests, read:
1. The spec document for your Spec ID — especially the **DoD** section
2. `docs/database/MOCK_DATA_BLUEPRINT.md` — use these exact data shapes as fixtures
3. `docs/system/STATE_MACHINES.md` — test every state transition, not just the happy path

---

## Test File Locations

```
app_build/tests/unit/<spec-id>/<feature>.test.ts   ← Vitest unit tests
app_build/tests/e2e/<spec-id>/<flow>.spec.ts        ← Playwright E2E tests
```

Every test file must start with:
```typescript
// @witness [SPEC-ID]
```

---

## 1. Unit Tests — Vitest Pattern

### File structure
```typescript
// @witness [SPEC-ID]
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('<Feature> — <SPEC-ID>', () => {
  describe('happy path', () => { ... })
  describe('edge cases', () => { ... })
  describe('security / privacy', () => { ... })
})
```

### Pattern A — Formula/Logic test (e.g., 70/30 proximity ranking)
```typescript
// @witness [RM-001]
import { describe, it, expect } from 'vitest'
import { computeRankedScore } from '@/lib/queries/discovery'

describe('computeRankedScore — RM-001', () => {
  it('ranks higher-DQS profile above closer low-DQS profile', () => {
    const profileA = { dqs_score: 0.95, distance_km: 50, radius_km: 50 }
    const profileB = { dqs_score: 0.60, distance_km: 5,  radius_km: 50 }
    const scoreA = computeRankedScore(profileA)
    const scoreB = computeRankedScore(profileB)
    expect(scoreA).toBeGreaterThan(scoreB)
  })

  it('returns 0 when profile is exactly at radius boundary', () => {
    const result = computeRankedScore({ dqs_score: 0.8, distance_km: 50, radius_km: 50 })
    expect(result).toBe(0.7 * 0.8 + 0.3 * 0)  // distance component = 0 at boundary
  })

  it('caps distance component at 0 when profile is beyond radius', () => {
    const result = computeRankedScore({ dqs_score: 1.0, distance_km: 100, radius_km: 50 })
    expect(result).toBe(0.7 * 1.0 + 0.3 * 0)
  })
})
```

### Pattern B — PII masking test (Handshake Economy)
```typescript
// @witness [HD-001]
import { describe, it, expect, vi } from 'vitest'

// Mock the Supabase RPC call
const mockRpc = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ rpc: mockRpc, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'viewer-uuid' } } }) } })
}))

describe('GET /api/profiles/[id] — HD-001 masking', () => {
  it('returns null PII when no connection exists', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { phone_primary: null, phone_secondary: null, email_business: null, is_masked: true },
      error: null
    })
    // ... call the route handler and assert
    expect(response.contact.is_masked).toBe(true)
    expect(response.contact.phone_primary).toBeNull()
  })

  it('returns real PII when ACCEPTED connection exists', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { phone_primary: '+919876543210', phone_secondary: null, email_business: 'test@firm.com', is_masked: false },
      error: null
    })
    expect(response.contact.is_masked).toBe(false)
    expect(response.contact.phone_primary).toBe('+919876543210')
  })
})
```

### Pattern C — Credit deduction test
```typescript
// @witness [HD-001]
it('deducts 1 credit when connection is requested', async () => {
  // Set up profile with 5 credits
  // Call POST /api/connections
  // Assert profile.handshake_credits === 4
})

it('returns INSUFFICIENT_CREDITS error when credits = 0', async () => {
  // Set up profile with 0 credits
  const res = await POST_connections({ target_id: 'some-uuid' })
  expect(res.status).toBe(402)
  expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS')
})
```

### Pattern D — RLS isolation test (integration, runs against local Supabase)
```typescript
// @witness [ID-001]
// Integration test — requires supabase to be running locally
import { createClient } from '@supabase/supabase-js'

const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

it('company_personnel PII is NULL for unconnected viewer', async () => {
  // Sign in as viewer (no connection to target)
  await anonClient.auth.signInWithPassword({ email: 'viewer@test.com', password: 'test' })
  const { data } = await anonClient.from('company_personnel').select('*').eq('id', 'target-personnel-uuid').single()
  // RLS should return the row (visible) but PII omitted at API layer
  expect(data).not.toBeNull()
  // Confirm no row returned at all if RLS blocks entirely:
  // expect(data).toBeNull()  ← use this form if RLS is row-blocking, not just column-masking
})

it('company_personnel full row visible after ACCEPTED handshake', async () => {
  // Sign in as connected viewer
  await anonClient.auth.signInWithPassword({ email: 'connected@test.com', password: 'test' })
  const { data } = await anonClient.rpc('get_visible_contact_info', {
    p_viewer_id: 'connected-uuid',
    p_target_id: 'target-profile-uuid'
  })
  expect(data.is_masked).toBe(false)
  expect(data.phone_primary).toMatch(/^\+91[0-9]{10}$/)
})
```

### Pattern E — Audit trail immutability
```typescript
// @witness [QA-001]
it('unmasking_audit row cannot be updated', async () => {
  // Insert an audit row via service role
  // Attempt UPDATE as authenticated user
  const { error } = await anonClient
    .from('unmasking_audit')
    .update({ trigger_event: 'ADMIN_ACCESS' })
    .eq('id', 'audit-row-uuid')
  expect(error).not.toBeNull()
  expect(error!.message).toContain('Modification of audit records is prohibited')
})
```

---

## 2. E2E Tests — Playwright Pattern

### File structure
```typescript
// @witness [SPEC-ID]
import { test, expect } from '@playwright/test'

test.describe('<Feature> — <SPEC-ID>', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as test user
    await page.goto('/login')
    await page.fill('[name=email]', 'test@buondesizn.com')
    await page.fill('[name=password]', 'test-password')
    await page.click('[type=submit]')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### Pattern F — Masked vs Unmasked Profile Card (Handshake flow)
```typescript
// @witness [HD-001]
test('profile card shows masked contact before handshake', async ({ page }) => {
  await page.goto('/discover')
  const card = page.locator('[data-testid="profile-card-target-uuid"]')
  await expect(card.locator('[data-testid="contact-phone"]')).toHaveText('Hidden')
  await expect(card.locator('[data-testid="contact-masked-badge"]')).toBeVisible()
})

test('profile card reveals contact after accepted handshake', async ({ page }) => {
  // Pre-condition: connection status is ACCEPTED in test DB
  await page.goto('/address-book')
  const card = page.locator('[data-testid="profile-card-target-uuid"]')
  await expect(card.locator('[data-testid="contact-phone"]')).toHaveText('+919876543210')
  await expect(card.locator('[data-testid="contact-masked-badge"]')).not.toBeVisible()
})
```

### Pattern G — Manual pin-drop geocoding
```typescript
// @witness [RM-001]
test('manual pin-drop updates search center', async ({ page }) => {
  await page.goto('/discover')
  // Click map to drop a pin at different location
  const map = page.locator('[data-testid="location-map"]')
  await map.click({ position: { x: 200, y: 300 } })
  await expect(page.locator('[data-testid="search-radius-center"]')).not.toHaveText('Auto-detect')
  // Results should re-fetch from new pin location
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
})
```

---

## 3. Governance Checklist

- [ ] Tests written BEFORE implementation (verify they FAIL first: `npm test -- --run`)
- [ ] Every test file has `// @witness [SPEC-ID]` on line 1
- [ ] Happy path covered
- [ ] Every state machine transition tested (not just `REQUESTED → ACCEPTED`, also `REQUESTED → REJECTED`, `REQUESTED → EXPIRED`)
- [ ] PII masked in default state (explicit assertion: `expect(contact.phone_primary).toBeNull()`)
- [ ] PII unmasked after ACCEPTED (explicit assertion: `expect(contact.is_masked).toBe(false)`)
- [ ] `unmasking_audit` row exists after PII reveal (query the table and assert)
- [ ] `hard_locked` user cannot initiate handshake
- [ ] Credit deduction tested at boundary (0 credits → error)
- [ ] At least one integration test hitting real local Supabase (not all mocked)
- [ ] WITNESS_REPORT_<SPEC-ID>.md written to `production_artifacts/` with test result links
