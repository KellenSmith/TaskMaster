# Environment variables

Place these in a `.env` file at the project root. Never commit secrets.

See `.env.example` for a template you can copy.

## Required

- ACCELERATE_DATABASE_URL: Prisma Accelerate URL for application runtime (for example, a `prisma://...` URL)
- DIRECT_DATABASE_URL: Direct Postgres connection string used by Prisma CLI for migrate/introspection and as a runtime fallback when `ACCELERATE_DATABASE_URL` is not an Accelerate URL
- AUTH_SECRET: Secret for signing Auth.js JWTs
- EMAIL: From-address used to send magic links (must match your SMTP auth)
- EMAIL_PASSWORD: SMTP password or app-specific password
- SMTP_HOST: SMTP server hostname
- SMTP_PORT: SMTP port (e.g. 587)
- CRON_SECRET: Bearer token to secure internal cron endpoints

## Payments (Swedbank Pay)

- SWEDBANK_BASE_URL: API base (e.g. https://api.externalintegration.payex.com)
- SWEDBANK_PAY_ACCESS_TOKEN: OAuth token
- SWEDBANK_PAY_PAYEE_ID: Your payee ID

## File uploads (Vercel Blob)

- BLOB_HOSTNAME: Your Blob public hostname (e.g. abc123.public.blob.vercel-storage.com)

## Public config (optional)

- NEXT_PUBLIC_ORG_NAME: Overrides organization name in UI
- NEXT_PUBLIC_ORG_DESCRIPTION: Meta description override
- VERCEL_URL: Used to compute absolute URLs in some server redirects when deployed (e.g. my-app.vercel.app)

## Development config (optional)

These are used by `pnpm prisma-seed` to create an initial admin user and seed the development database with realistic data for development and QA purposes.

- SEED_CONFIRM_WIPE: Set to `true` to allow `pnpm prisma-seed` to wipe the database in development. Defaults to `false`.
- SEED_ADMIN_EMAIL: Email address to create as the first admin user when seeding the database. Defaults to `admin@example.com`
- SEED_ADMIN_FIRST_NAME: First name for the first admin user. Defaults to `Admin`.
- SEED_ADMIN_LAST_NAME: Last name for the first admin user. Defaults to `User`.
- SEED_ADMIN_NICKNAME: Nickname for the first admin user. Defaults to `admin`.

## Notes

- Changing BLOB_HOSTNAME updates image allowlist in `next.config.mjs`.
- When VERCEL_URL is unset locally, absolute links fall back to `window.location` during client navigation.
- Prisma CLI commands (migrate/introspect/generate) use `DIRECT_DATABASE_URL` when set via `prisma.config.ts`.
