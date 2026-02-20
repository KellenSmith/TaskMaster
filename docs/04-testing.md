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

## Patterns

- Prefer unit tests for server actions and helpers in `src/app/lib`.
- For components, test user interactions and rendered output, not implementation details.
- Critical mocks and cleanup have already been implemented in `src/test/setup.ts` (e.g., `prisma`, `mail-transport`, `next/navigation`, `next/navigation`, `process.env`, ...).
- Use `customRender` from `src/test/test-utils.tsx` to wrap client components with necessary providers (e.g., `UserContext`, `OrganizationSettingsContext`, `ThemeContext`).
- For client components which use the `use`-hook and thus suspend, use `await act(async () => customRender(...))` to ensure all updates are processed before assertions. This removes the warning "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result: await act(() => ...)"
- For server components, either call the function directly and assert on side effects (e.g., database updates, email sends) using the mocked Prisma client and mail transport or use the `render` method from Testing Library and mock the client children to assert on the rendered output.
