# Environment variables

Place these in a `.env` file at the project root. Never commit secrets.

See `.env.example` for a template you can copy.

## Required

- PRISMA_DATABASE_URL: Postgres connection string
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
- VERCEL_PROJECT_PRODUCTION_URL: Used to compute absolute URLs in some server redirects when deployed (e.g. my-app.vercel.app)

Notes

- Changing BLOB_HOSTNAME updates image allowlist in `next.config.mjs`.
- When VERCEL_PROJECT_PRODUCTION_URL is unset locally, absolute links fall back to `window.location` during client navigation.
