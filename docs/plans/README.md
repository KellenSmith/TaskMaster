# UX overhaul plans

Proposals for review. Nothing here is implemented yet.

## Why

TaskMaster's front end was largely LLM-generated and has drifted away from the
jobs its users actually come to do. An audit (Sep 2026) found that none of the
five primary user tasks has a discoverable path:

| User               | Job to be done                         | Current path                                                                    |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------- |
| Member at the door | Show staff my ticket                   | Hamburger -> Dashboard -> 100x100px QR                                          |
| Member             | Find events, buy a ticket or volunteer | Hamburger -> Calendar -> event -> Tickets tab -> card -> dialog                 |
| Prospective member | Join the club                          | Outlined button on the landing page; process never explained                    |
| Lapsed member      | Renew                                  | Hamburger -> Profile -> Account -> text button -> Shop -> tab -> card -> dialog |
| Event staff        | Print schedules / scan tickets         | Buried in a kanban filter drawer / no scanner exists                            |

Every one of these is reachable only through a hidden hamburger drawer whose
section headings read "Members only" and "Admins only".

## The plans

Read in order. Plan 00 is a hard dependency for 01-04.

| Plan                                  | Title                                                                 | Depends on | Rough size       |
| ------------------------------------- | --------------------------------------------------------------------- | ---------- | ---------------- |
| [00](00-shared-foundation.md)         | Shared foundation: membership state, renewal action, upcoming tickets | -          | 0.5 day          |
| [01](01-expiry-banner-and-renewal.md) | Expiry banner + one-click renewal                                     | 00         | 1 day            |
| [02](02-appbar-intent-ctas.md)        | Intent-driven CTAs in the AppBar                                      | 00, 01     | 1-1.5 days       |
| [03](03-full-screen-ticket.md)        | Full-screen ticket view                                               | 00, 01     | 1.5 days         |
| [04](04-membership-flow-stepper.md)   | Membership sign-up flow + 4-step stepper                              | 00, 01     | 2 days           |
| [05](05-calendar-overhaul.md)         | Calendar overhaul: agenda view + real event state                     | 00 (soft)  | 3-4 days, phased |

Sizes are for one engineer familiar with the repo, including tests.

## Ground rules for all plans

These come from `CLAUDE.md` and `docs/07-server-action-style-conventions.md`
and are not restated in each plan.

- **Multi-tenant.** One codebase deploys to `demo`, `clubwish` and `proteus`.
  No organization-specific copy, timings or values. Use `OrganizationSettings`,
  `TextContent` or `NEXT_PUBLIC_ORG_*`.
- **Localized.** Every user-facing string goes in a `LanguageTranslations.ts`
  with `english` and `swedish`. Several plans fix existing hardcoded English.
- **Server actions.** Mutating logic in `src/app/lib/*-actions.ts`, re-validated
  with a Zod schema, sanitized, returning `Promise<void>` on success and a
  localized string on expected failure. Read-only `get*` goes in `*-helpers.ts`.
- **Verification.** `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test` must pass;
  CI runs all three on every push.

## Repo facts worth knowing before you review

Found during the audit. They change what these plans can assume.

- `renewUserMembership` and `getMembershipProduct` already exist in
  `src/app/lib/user-membership-helpers.ts`. Renewal is wiring, not new logic.
- **`getMembershipProduct()` creates a `Product` as a side effect** if none
  exists (`user-membership-helpers.ts:71-85`). Never call it from a render path.
- **Membership subscriptions are not implemented.**
  `userHasActiveMembershipSubscription` is commented out at `src/app/ui/utils.ts:80-88`,
  and the `startMembershipSubscription` / `cancelSubscription` strings in
  `src/app/(pages)/profile/LanguageTranslations.ts:41-70` are dead. Renewal is a
  one-off purchase.
- **`docs/04-testing.md` is stale.** It tells you to use `customRender` from
  `src/test/test-utils.tsx`. Neither exists. The real pattern is plain `render`
  plus `vi.mocked(useUserContext).mockReturnValue(...)`, because `src/test/setup.ts`
  mocks the context globally. See `src/app/ui/NavPanel.test.tsx` for the idiom.
- `isUserAdmin()` returns `false` when a membership has expired
  (`src/app/lib/utils.ts:90`). **A lapsed admin loses every admin page**,
  including the Members page they would use to fix it.
- Pre-existing bug, not in scope but adjacent to Plan 03:
  `const isVolunteer = event.tasks.length || 0 > 0;` duplicated at
  `src/app/(pages)/ticket/page.tsx:44` and
  `src/app/(pages)/ticket/TicketDashboard.tsx:72`. `||` binds tighter than `>`,
  so it evaluates as `tasks.length || false`. It happens to work only because
  the query pre-filters tasks to the logged-in user. It gates both page
  authorization and auto-check-in.

## Out of scope

Logged during the audit, deliberately not planned yet:

- **In-app QR scanner.** There is no camera dependency in `package.json`. Door
  staff use the phone's native camera, which opens the link in the OS default
  browser, frequently not the one they are logged into. Plus
  `src/app/(pages)/ticket/TicketDashboard.tsx:129-146` checks people in
  automatically on render with no confirmation, and a re-scan renders a red
  "error" state that at a door reads as "reject this person".
- **Volunteer schedule printing.** Currently a button inside the _Filter_ tab of
  the kanban side drawer (`src/app/ui/kanban-board/KanBanBoardMenu.tsx:348-350`),
  in a `<form>` whose submit button says "Apply". Participant list printing is
  in an unrelated icon-only menu. Both want an "Event night" panel.
- **Replacing the kanban board as the member-facing way to claim a shift.**
  Referenced by Plan 05 but not solved by it.
