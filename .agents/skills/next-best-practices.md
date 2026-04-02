# Next.js Best Practices

Source: https://www.skills.sh/vercel-labs/next-skills/next-best-practices

## Core Principles

- **RSC by Default**: Keep logic on the server to protect PII and minimize client bundle.
- **Edge Runtime**: Leverage for low-latency proximity calculations in India.
- **Streaming**: Stream search results as they are found geographically.

## Key Patterns

### 1. Runtime Selection
- **Node.js (Default)**: Use for complex PDF generation or heavy SKU processing.
- **Edge Runtime**: Use for middleware and proximity-based redirects.

### 2. Async Patterns (Next.js 15+)
- Handle `params` and `searchParams` as Promises.
- Use `await cookies()` and `await headers()`.

### 3. Data & Routes
- **Route Handlers (`route.ts`)**: Use for programmatic SKU uploads or audit log exports.
- **Middleware**: Use for role-based route protection (e.g., `/contractor/*` only for Contractors).

## BuonDesizn Pattern: Geolocation Middleware
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'IN';
  if (country !== 'IN') {
    // Audit non-domestic access
  }
}
```
