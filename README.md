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

# WhatsApp Cloud API (manager notifications)
WHATSAPP_ENABLED=false
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_MANAGER_PHONE=
# Optional template (recommended for business-initiated messages)
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANG=en_US
WHATSAPP_TEMPLATE_WITH_BODY=false
# Structured parameters (optional)
# Comma-separated tokens for body params. Available tokens:
# orderId,date,customerName,customerFirstName,customerLastName,customerPhone,addressText,
# locationLat,locationLng,locationUrl,items,itemsCount,total,currency,summary
WHATSAPP_TEMPLATE_BODY_PARAMS=
# Header param token (one of the same tokens above)
WHATSAPP_TEMPLATE_HEADER_PARAM=
# Currency code used when token "currency" is referenced
WHATSAPP_CURRENCY=GEL
# Summary language for 1-variable templates (en|ka)
WHATSAPP_SUMMARY_LANG=ka
# Optional Graph API version (default v22.0)
WHATSAPP_GRAPH_VERSION=v22.0
# Debug: await send and log details on server
WHATSAPP_DEBUG=false
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
  - `Order { id, createdAt, status, customer Json, address Json, items Json, total Int, payment Json? }`
- API routes (server actions/route handlers):
  - `/api/products` CRUD via Prisma (`Product` + `ProductSize`)
  - `/api/orders` create/list/update via Prisma (`Order`)
  - `/api/settings` key/value via Prisma (`Setting`)
  - `/api/users` admin-only CRUD via Prisma (`User`)
  - iPay integration:
    - POST `/api/payments/ipay/create` → body `{ orderId }` returns `{ redirectUrl }`
    - POST `/api/payments/ipay/webhook` → bank callback (configure at BOG)
    - Return page: `app/[locale]/checkout/ipay/return/page.jsx`

### iPay (Bank of Georgia) setup

Add to `.env`:

```
# iPay API
IPAY_CLIENT_ID=
IPAY_CLIENT_SECRET=
IPAY_API_BASE=https://ipay.ge/opay/api/v1
IPAY_TOKEN_URL=https://ipay.ge/opay/oauth2/token

# Redirects
IPAY_RETURN_URL=https://your-domain.com/checkout/ipay/return
IPAY_CALLBACK_URL=https://your-domain.com/api/payments/ipay/webhook
```

Flow:
- Create an `Order` (status `pending`).
- Call POST `/api/payments/ipay/create` with `{ orderId }`.
- Redirect user to the returned `redirectUrl`.
- iPay calls `/api/payments/ipay/webhook`; we update order status to `paid`/`failed`.
- Show the return page while status settles; optionally poll your own order status.

Important:
- Implement real webhook signature/JWT verification based on BOG docs in `app/api/payments/ipay/webhook/route.js`.
- Use sandbox/test credentials first; switch to production after approval.
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