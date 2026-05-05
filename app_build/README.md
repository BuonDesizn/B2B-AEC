# BuonDesizn B2B App

> Production Next.js 15 application for the BuonDesizn AEC marketplace.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **State**: React hooks + SWR
- **Maps**: Leaflet
- **Testing**: Vitest + Playwright

## 📁 Structure

```
app_build/
├── app/              # Next.js App Router pages
├── components/        # Reusable UI components
├── lib/              # Utilities and Supabase clients
├── public/            # Static assets
└── tests/            # Unit & E2E tests
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test           # Unit tests
npm run test:e2e   # E2E tests

# Lint & typecheck
npm run validate
```

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📖 Docs

- Main repo: [../../README.md](../../README.md)
- Database schema: [../docs/database/db_schema.md](../docs/database/db_schema.md)
- API contract: [../docs/api/API_CONTRACT.md](../docs/api/API_CONTRACT.md)
