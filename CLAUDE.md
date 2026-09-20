# CLAUDE.md

Guidance for agents working in this repository. Read this before making changes.

## What this is

TaskMaster is a web app for volunteer-led organizations: event planning, task/shift
coordination, memberships, ticketing, payments, and communications. See
`docs/00-purpose.md` for the full product context. It is deployed to multiple
customer environments from one codebase (see Deployment below) — changes should
stay generic/configurable rather than hardcoded for one organization.

## Stack

- **Framework**: Next.js App Router (React 19, server components + server actions), TypeScript.
- **UI**: MUI (`@mui/material`, `@mui/x-data-grid`, `@mui/x-date-pickers`) + custom components in `src/app/ui`. Rich text via Tiptap (`mui-tiptap`).
- **Auth**: Auth.js (`next-auth` v5 beta) with email/magic-link provider, Prisma adapter.
- **DB**: Prisma ORM + PostgreSQL, using `@prisma/adapter-pg` and Prisma Accelerate. Schema at `src/prisma/schema.prisma`; migrations in `src/prisma/migrations/`.
- **Email**: Nodemailer via `src/app/lib/mail-service`; templates authored with `react-email`.
- **Files**: Vercel Blob (`@vercel/blob`) for uploads, gated through `/api/file-upload`.
- **Payments**: Swedbank Pay checkout integration (`payment-actions.ts`, `payment-helpers.ts`).
- **Validation/sanitization**: Zod (`zod-schemas.ts`) + `sanitize-html`.
- **Testing**: Vitest + React Testing Library.
- **Tooling**: pnpm workspaces, ESLint (flat config), Prettier.

## Directory map

- `src/app/(pages)/**` — route groups, one folder per page/feature area (calendar, tasks, orders, shop, members, settings, etc.).
- `src/app/api/**` — route handlers: auth, cron, file-upload, payment-callback, ticket-qrcode.
- `src/app/lib/**` — server actions (`*-actions.ts`), read helpers (`*-helpers.ts`), Zod schemas, sanitizer, mail service, auth config. This is where most business logic lives.
- `src/app/ui/**` — shared client components (forms, kanban board, shop widgets).
- `src/app/context/**` — React context providers (User, OrganizationSettings, Localization, Theme, Notification).
- `src/prisma/` — Prisma client, schema, migrations, error-code helpers.
- `src/test/` — test setup, mocks (`src/test/mocks`), shared test utilities.
- `docs/` — numbered docs (purpose, setup, environment, architecture, testing, user scenarios/UAT, server-action conventions, deployment). Prefer linking here over duplicating content.
- `.github/` — CI workflow (`workflows/ci.yml`) and multi-customer deploy scripts (`scripts/`, `actions/`).

## Data model (high level)

Prisma models in `src/prisma/schema.prisma`: `User`, `OrganizationSettings`, `Location`, `Event`, `EventParticipant`, `EventReserve`, `Task`, `SkillBadge`/`UserSkillBadge`/`TaskSkillBadge`, `Product`, `Membership`/`UserMembership`, `Ticket`, `Order`/`OrderItem`, `InfoPage`, `TextContent`/`TextTranslation`, `NewsletterJob`, `BlacklistEntry`, plus Auth.js tables (`Account`, `Session`, `VerificationToken`). Check the schema directly for fields/enums rather than assuming — it changes often (see migration history).

## Key conventions (defense-in-depth, always follow)

Full spec: `docs/07-server-action-style-conventions.md`. Summary:

- Mutating logic goes in `src/app/lib/*-actions.ts`; read-only `get*` logic goes in the calling server component or a `*-helpers.ts` file — don't mix them.
- Every action re-validates input server-side with a Zod schema from `zod-schemas.ts`, even though the client also validates. Never trust client-side validation alone.
- Sanitize all user-provided strings/rich text with `html-sanitizer.ts` before persisting or rendering.
- Successful mutating actions return `Promise<void>`. On expected failure, return a **localized** error string via `getUserLanguage()` + `Languagetranslations`; rethrow unexpected errors instead of swallowing them.
- Client callers of actions either throw the returned error message (for `Form.tsx` actions) or surface it via the notification context (for button/`useEffect` callers).

Other flows: sign-in (magic link via Auth.js), payments (Swedbank Pay checkout → callback → status poll), uploads (client validates → `/api/file-upload` re-checks auth/type/size → Vercel Blob → URL saved to DB). See `docs/03-architecture.md` for the full sequence diagram.

## Commands

- `pnpm dev` — run locally (Turbopack, HTTPS).
- `pnpm build` — generates Prisma client, runs migrations, builds Next.
- `pnpm lint` / `pnpm format` / `pnpm format:check` — ESLint / Prettier.
- `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`, `pnpm test:ui` — Vitest.
- `pnpm prisma-generate`, `pnpm prisma-migrate`, `pnpm prisma-push`, `pnpm prisma-seed` — Prisma workflows.
- `tsc --noEmit` (as run in CI) for a type-check without emitting.

## Testing notes

Full spec: `docs/04-testing.md`. Prisma and mail transport are already mocked in
`src/test/setup.ts` — don't re-mock them per test. Use `customRender` from
`src/test/test-utils.tsx` to wrap client components needing context providers.
Components using the `use()` hook need `await act(async () => customRender(...))`.

## CI/CD

`.github/workflows/ci.yml` runs lint, type-check, and coverage tests on every push,
then deploys to Vercel across multiple **customer environments** (`demo`,
`clubwish`, `proteus`, configured via `.github/scripts/` and per-customer secrets).
`master` deploys to production; other branches need an open PR into `dev` to
trigger a preview deploy. Keep this multi-tenant deploy model in mind: avoid
hardcoding organization-specific values — use `OrganizationSettings` /
`NEXT_PUBLIC_ORG_*` env vars instead.

## Environment variables

See `docs/02-environment.md` and `.env.example`. Required: DB URLs (Accelerate +
direct), `AUTH_SECRET`, SMTP creds, `CRON_SECRET`, Swedbank Pay creds,
`BLOB_HOSTNAME`. Never commit `.env` or secrets.

## Docs index

- `docs/00-purpose.md` — product purpose/audience
- `docs/01-getting-started.md` — local setup
- `docs/02-environment.md` — env vars
- `docs/03-architecture.md` — architecture + sequence diagrams
- `docs/04-testing.md` — testing patterns
- `docs/05-user-scenarios.md`, `docs/06-user-acceptance-test-flows.md` — UX/UAT flows
- `docs/07-server-action-style-conventions.md` — server action rules (read before writing any `*-actions.ts`)
- `docs/08-deployment.md` — deployment details

## Agent workflow in this repo

- Model tiering and sub-agent usage policy: `.claude/agents/README.md`.
- Prefer running `pnpm lint`, `pnpm tsc --noEmit`, and relevant `pnpm test` files after changes touching `src/app/lib/**` or Prisma schema, mirroring CI.
- When touching payment, auth, or file-upload code, re-read the relevant section of `docs/03-architecture.md` first — these paths have specific security requirements (defense-in-depth validation, sanitization, auth checks).
