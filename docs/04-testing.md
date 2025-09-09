# Testing

We use Vitest and Testing Library.

## Commands

- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage`
- UI mode: `pnpm test:ui`

## Setup

- Test utilities are in `src/test/` (e.g., `setup.ts`, `test-utils.tsx`).
- Prisma test helpers are under `src/test/prisma.ts` with mocks in `src/test/mocks`.
- Ensure `.env` (or `.env.test`) contains a test database URL if integration tests need DB.

## Patterns

- Prefer unit tests for server actions and helpers in `src/app/lib`.
- For components, test user interactions and rendered output, not implementation details.
- Mock network and Prisma calls where possible to keep tests fast.
