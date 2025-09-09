# Getting Started

This project uses Next.js (App Router), TypeScript, Prisma (PostgreSQL), and Vitest.

## Prerequisites

- Node.js LTS (v20+ recommended)
- pnpm
- PostgreSQL database (local or cloud)
- SMTP account for email login (dev: Mailtrap/other)

## Quick start

1. Install dependencies

```
pnpm install
```

2. Configure environment

- Copy `.env.example` to `.env` and fill in values.
- Ensure `PRISMA_DATABASE_URL` points to a valid Postgres instance.

3. Database: generate client and run migrations

```
pnpm prisma-generate
pnpm prisma-migrate
```

4. Start the dev server (HTTPS enabled per config)

```
pnpm dev
```

Visit https://localhost:3000

## Common tasks

- Format: `pnpm format`
- Lint: `pnpm lint`
- Tests (watch): `pnpm test:watch`
- Tests (coverage): `pnpm test:coverage`
- Reset DB (dev only): `pnpm prisma-migrate-reset`

## Troubleshooting

- SSL cert warnings on localhost: trust the local certs in `./certificates/` or switch to HTTP in dev if needed.
- Prisma errors: verify `PRISMA_DATABASE_URL` and that the database is reachable; re-run `pnpm prisma-generate`.
- Email not sending: check SMTP credentials and that `EMAIL` matches the authenticated account.
