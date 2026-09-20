# Plan 02 - Intent-driven CTAs in the AppBar

**Status:** proposed
**Depends on:** [Plan 00](00-shared-foundation.md), [Plan 01](01-expiry-banner-and-renewal.md)
**Size:** ~1-1.5 days

## Problem

Everything in the app is reachable two ways: a hamburger drawer, or drilling
through tabs. The AppBar (`NavPanel.tsx:218-247`) contains a hamburger, a logo,
and a language menu. **Zero calls to action**, on mobile and desktop alike.
There is no persistent surface where an intent-driven CTA could live, so none
exists.

Two details compound it:

- Drawer sections are grouped by _permission_ and labelled **"Members only"** /
  **"Admins only"** (`src/app/ui/LanguageTranslations.ts:19-28`). A member opens
  the drawer and the heading above their own everyday links tells them who is
  excluded.
- Route labels are system nouns: "Dashboard", "To do", "Shop", "Year Wheel",
  "Sendout". None of the five primary user jobs maps to a label a user would
  scan for.

## Outcome

The top bar always shows the one thing this user most likely came to do.

## Files

| Action | Path                                                                       |
| ------ | -------------------------------------------------------------------------- |
| new    | `src/app/ui/AppBarActions.tsx`                                             |
| new    | `src/app/ui/AppBarActions.test.tsx`                                        |
| edit   | `src/app/ui/NavPanel.tsx` - Toolbar layout, logo click target              |
| edit   | `src/app/ui/LanguageTranslations.ts` - CTA labels, drawer section headings |

## Priority ladder

First match wins. **Render at most two CTAs, and at most one on `xs`.**

| #   | Condition                                        | Label              | Icon                 | Target                  |
| --- | ------------------------------------------------ | ------------------ | -------------------- | ----------------------- |
| 1   | `anonymous`                                      | Join us            | `HowToReg`           | `/apply`                |
| 2   | `awaitingValidation`                             | Application status | `HourglassTop`       | `/profile`              |
| 3   | `awaitingPayment` or `expired`                   | Activate / Renew   | `CardMembership`     | `RenewMembershipButton` |
| 4   | has a ticket starting within 24h                 | My ticket          | `ConfirmationNumber` | `/my-tickets`           |
| 5   | `expiringSoon` or `active`, has upcoming tickets | My tickets         | `ConfirmationNumber` | `/my-tickets`           |
| 6   | `expiringSoon` or `active`, no tickets           | What's on          | `Event`              | `/calendar`             |

Rules 4 and 5 read `UpcomingTicketsContext` from Plan 00.4.

**Rule 4 deliberately outranks rule 3.** Someone standing at the door with a
lapsed membership needs the ticket first; Plan 03's screen then puts the renewal
CTA in front of them _in context_, which converts far better than a generic
banner. Plan 01's banner is still showing regardless, so the renewal path is
never hidden.

Rule 6 targets `/calendar`, which Plan 05 turns into an agenda view. Until then
it lands on the month grid, which is still better than no CTA.

## Toolbar layout

The logo currently sits in a `flexGrow: 1` centering `Box`
(`NavPanel.tsx:226-247`) and needs to yield space.

```
xs:  [hamburger]  [logo, shrinks]  [CTA icon]  [language]
md+: [hamburger]  [logo]  -------  [CTA 2 outlined] [CTA 1 contained]  [language]
```

```tsx
<Toolbar sx={{ gap: 1 }}>
    <IconButton edge="start" ... />
    <Box
        sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: { xs: "flex-start", md: "center" },
            alignItems: "center",
            minWidth: 0,       // required, or the CTA gets pushed off
            overflow: "hidden",
        }}
    >
        {/* existing logo / org-name fallback, unchanged */}
    </Box>
    <AppBarActions />
    <LanguageMenu />
</Toolbar>
```

`AppBarActions` renders `<Button variant="contained" startIcon={...}>` above
`md`, and an `<IconButton>` wrapped in a `Tooltip` **plus** an explicit
`aria-label` at `xs`. Tooltips do not fire on touch, so the `aria-label` is the
only accessible name on the devices where the icon-only variant is used.

While in this file, simplify the logo click target
(`NavPanel.tsx:238-246`) to use `getMembershipState()` instead of its inline
`isMembershipExpired` branch.

## Also fix here: drawer section headings

Two lines, disproportionate payoff. In `LanguageTranslations.ts:19-28`:

```ts
roleLabels: {
    [UserRole.member]: { english: "For you",        swedish: "För dig" },
    [UserRole.admin]:  { english: "Administration", swedish: "Administration" },
},
```

Leave `restrictedRoute` alone - "Members only" is correct _there_, on a locked
route.

## Tests

`src/app/ui/AppBarActions.test.tsx`, driven by `vi.mocked(useUserContext)` plus
a mocked upcoming-tickets context:

- one case per ladder rung
- rule 4 beats rule 3 for a lapsed member holding a ticket tonight
- exactly one CTA renders at `xs` (mock `useMediaQuery`)
- the `xs` icon button has an accessible name

## Risks

- **Crowding at 320px** with a wide `logo_url`. The `minWidth: 0` plus
  `overflow: hidden` on the logo box is what prevents the CTA being pushed off
  screen. Do not omit it. Test with the widest customer logo.
- **Suspense.** `AppBarActions` suspends on the tickets promise. Wrap it in the
  existing `ErrorBoundarySuspense` with a fixed-width skeleton so the bar does
  not jump on every navigation.
- **Every page** renders this. Same cost note as Plan 01.

## Acceptance criteria

- [ ] An anonymous visitor sees a "Join us" CTA in the AppBar on every page.
- [ ] A member with an event today sees "My ticket" without opening the drawer.
- [ ] A lapsed member sees a renewal CTA, unless they have a ticket today, in
      which case they see "My ticket".
- [ ] Drawer headings read "For you" / "Administration".
- [ ] At most one CTA renders on a 320px viewport, and it has an accessible name.
- [ ] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass.

## Open questions for the team

1. Is "within 24h" the right window for rule 4? Multi-day festivals would want
   longer; a weekly club night might want 6h. Candidate for `OrganizationSettings`.
Team's answer: Definitely configurable. For us 6h would be more appropriate. Once a ticket has been checked in it shouldn't appear as My Ticket. If there are multiple events that day it should allow the user to disambiguate.
2. Should the AppBar also surface a host-facing CTA (for example "Event night"
   when you are hosting something today)? Deliberately excluded for now to keep
   the ladder short, but hosts are a real audience.
Team's answer: Volunteer and staff affordances are a real but secondary priority that is out of scope. Eventually, if a user is a volunteer at an event, being able to immediately get information on what is required of them and be able to pull up the user manual or pull up the volunteer schedule will be needed.
3. Rule 6 sends active members with no tickets to `/calendar`. Should it instead
   surface the single next upcoming event? Depends on Plan 05.
Team's answer: Continue sending to calendar until the calendar overhaul is complete. Make a note to review this CTA after plan-05 is complete
