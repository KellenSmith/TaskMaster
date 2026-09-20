# Testing

We use Vitest and Testing Library.

## Commands

- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage`
- UI mode: `pnpm test:ui`

## Setup

- Global setup is `src/test/setup.ts`. Shared fixtures are in `src/test/testdata.ts`
  and `src/test/test-helpers.ts`. There is no `test-utils.tsx` and no `customRender`.
- Prisma test helpers are under `src/test/prisma.ts` with the deep mock in
  `src/test/mocks/prismaMock.ts`.

## Patterns

- Prefer unit tests for server actions and helpers in `src/app/lib`.
- For components, test user interactions and rendered output, not implementation details.
- `src/test/setup.ts` already mocks `prisma`, the mail transport, `next/cache`,
  `next/server`'s `connection`, `next/navigation` (`useRouter`, `redirect`), and the
  `UserContext`, `OrganizationSettingsContext` and `ThemeContext` hooks. It also resets
  `process.env` from `testdata.env` before each test. Do not re-mock these per file.
- Client components are rendered with plain `render` from Testing Library. Context is
  provided by overriding the globally mocked hook for the case under test:
  `vi.mocked(useUserContext).mockReturnValue({ user, language: Language.english } as any)`.
  See `src/app/ui/NavPanel.test.tsx` and `src/app/ui/MembershipBanner.test.tsx`.
- `setup.ts` mocks `next/navigation` with only `useRouter` and `redirect`. A component
  that calls `usePathname` or `useSearchParams` needs a local `vi.mock("next/navigation", ...)`
  in its test file, and a component that calls `router.refresh()` needs a `useRouter`
  mock that includes it.
- For client components that `use()` a promise and suspend, render inside a `<Suspense>`
  and wrap in `await act(async () => render(...))` so the resolved state is asserted, not
  the fallback. See `src/app/ui/MembershipStepper.test.tsx`.
- Components that depend on other suspending components (for example a page that mounts
  `TextContent` or `MembershipStepper`) usually stub those with `vi.mock` and test the
  children in their own files.
- For server components, either call the function directly and assert on side effects (e.g., database updates, email sends) using the mocked Prisma client and mail transport or use the `render` method from Testing Library and mock the client children to assert on the rendered output.
