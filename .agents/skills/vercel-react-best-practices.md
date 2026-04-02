# Vercel React Best Practices

Source: https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices

## Core Principles

- **Eliminate Waterfalls**: Use `Promise.all` or Parallel Routes to fetch data.
- **Bundle Optimization**: Use `next/dynamic` for heavy components (e.g., maps, charts).
- **Server Actions**: Use for all mutations to ensure zero-JS overhead for simple forms.

## High-Impact Rules

### 1. Data Fetching
- **RSC Boundaries**: Keep data fetching in Server Components where possible.
- **Suspense**: Wrap slow components (like distance calculations) in `<Suspense>`.
- **Preloading**: Call data fetching functions early in the component tree.

### 2. Rendering
- **LCP Optimization**: Use `next/image` with `priority` for hero images.
- **CLS Prevention**: Set explicit dimensions for image/ad placeholders.
- **Shimmer Effects**: Use skeletons instead of spinners for a premium feel.

### 3. Vercel Deployment
- **Edge Functions**: Use for high-frequency geolocation-based redirects or light A/B testing.
- **ISR/On-Demand Revalidation**: Use for product catalogs and equipment fleet availability.

## BuonDesizn Pattern: Parallel Handshake Discovery
```javascript
// Fetch both connections and RFPs in parallel to avoid waterfalls
const [connections, rfps] = await Promise.all([
  getConnections(userId),
  getLocalRFPs(userLocation)
]);
```
