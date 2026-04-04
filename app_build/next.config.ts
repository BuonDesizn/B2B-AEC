import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Linting is run separately via `npm run lint`; skip during builds to avoid
    // ESLint flat-config / legacy-API conflicts with Next.js's built-in lint step.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
