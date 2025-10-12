This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment and Database

We use Prisma + PostgreSQL (Supabase). Create a `.env` with:

```
# Supabase Postgres URLs
POSTGRES_PRISMA_URL=postgres://postgres:...@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
POSTGRES_URL_NON_POOLING=postgres://postgres:...@<db-host>:5432/postgres?sslmode=require

# App secrets
ADMIN_SECRET=change-me

# Optional
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Prisma commands:

```
# Generate client
npm run prisma:generate

# Create and apply a migration to your dev DB
npx prisma migrate dev --name <change>

# Seed dev data (reads prisma/seed.js)
npm run prisma:seed
```

Deployment on Vercel:
- Project Settings → Environment Variables (Production): set `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `ADMIN_SECRET` (and public Supabase keys if used).
- Build Command: `npm run vercel-build` (package.json runs `prisma migrate deploy && next build --turbopack`).

## Architecture Overview

- UI: Next.js App Router. Public site lives under `app/[locale]/*`; admin at `app/[locale]/admin`.
- i18n: `next-intl` via `app/[locale]/layout.js`.
- Data access: Prisma Client from `lib/prisma.js`.
  - Local dev prefers the non-pooled URL (5432) to avoid pooler issues.
  - Production uses the pooled URL (6543) for efficient serverless connections.
- Database models (`prisma/schema.prisma`):
  - `User { id, username, passwordHash, role, createdAt }`
  - `Product { id, name Json, description Json, image, active, createdAt, sizes[] }`
  - `ProductSize { productId -> Product, sizeKg Float, price Int }`
  - `Setting { key, value Json }`
  - `Order { id, createdAt, status, customer Json, address Json, items Json, total Int }`
- API routes (server actions/route handlers):
  - `/api/products` CRUD via Prisma (`Product` + `ProductSize`)
  - `/api/orders` create/list/update via Prisma (`Order`)
  - `/api/settings` key/value via Prisma (`Setting`)
  - `/api/users` admin-only CRUD via Prisma (`User`)
  - `/api/auth/*` cookie-based admin session using `lib/auth.js`

## Local Development Tips

- If Prisma client regeneration fails on Windows with EPERM, close dev server, then:

```
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .\node_modules\.prisma -ErrorAction SilentlyContinue
npm run prisma:generate
```

- To reset your dev DB quickly:

```
npx prisma migrate reset --force
npx prisma migrate dev --name init
npm run prisma:seed
```