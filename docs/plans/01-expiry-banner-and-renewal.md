# Plan 01 - Expiry banner + one-click renewal

**Status:** implemented
**Depends on:** [Plan 00](00-shared-foundation.md)
**Blocks:** Plans 02, 03 (both reuse the renewal CTA)
**Size:** ~1 day

## Problem

**There is no in-app expiry warning at all.** The only warning is an email from
the cron at `src/app/api/cron/cron.ts:35-76`, sent once, N days before expiry.
If it lands in spam or the member does not read email, the first signal they get
is being locked out.

`MembershipStatusCard` shows the expiry date in plain body text next to a green
"Active membership" chip, right up until the instant it flips to red "Expired"
(`MembershipStatusCard.tsx:52-76`). There is no amber pre-expiry state, even
though `remind_membership_expires_in_days` is already a per-org setting.

**Lapsing is a cliff, not a slope.** The moment `expires_at` passes,
`isMembershipExpired` (`utils.ts:74-83`) returns true and the user loses
Dashboard, Calendar, Tasks, Calendar-post and Ticket. Every blocked navigation
is a **silent redirect to `/profile`** with no toast and no reason
(`ProtectedPage.tsx:31-45`). Clicking a bookmarked calendar link just lands you
on Profile with no explanation.

**Renewal is seven steps:** Profile -> Account tab -> a `<Button>` with no
`variant` (so it renders as low-emphasis text) -> `/shop` -> Memberships tab ->
product card -> dialog -> Buy.

## Outcome

No member is surprised by a lapse, and renewing is one click from any page.

## Files

| Action | Path                                                                               |
| ------ | ---------------------------------------------------------------------------------- |
| new    | `src/app/ui/MembershipBanner.tsx`                                                  |
| new    | `src/app/ui/MembershipBanner.test.tsx`                                             |
| edit   | `src/app/layout.tsx` - mount the banner                                            |
| edit   | `src/app/(pages)/profile/MembershipStatusCard.tsx` - amber state, recolour pending |
| edit   | `src/app/(pages)/profile/AccountTab.tsx` - replace the dead-code CTA               |

## Banner behaviour

| State                                | Severity  | Message                                                                                                                   | Action                    | Dismissible          |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------- |
| `expiringSoon`                       | `warning` | "Your membership expires in N days (D MMM). Renewing now adds a full period on top - you lose nothing by renewing early." | Renew                     | Yes, per expiry date |
| `expired`                            | `error`   | "Your membership expired on D MMM. Renew to book events and use your tickets."                                            | Renew                     | **No**               |
| `awaitingPayment`                    | `info`    | "You're approved. Activate your membership to get started."                                                               | Activate                  | No                   |
| `awaitingValidation`                 | `info`    | "Your application is being reviewed. We'll email you when it's approved."                                                 | View status -> `/profile` | Yes                  |
| `active`, `anonymous`, `blacklisted` | -         | render `null`                                                                                                             | -                         | -                    |

Suppress on `/order` (mid-checkout), `/apply` and `/login` via `usePathname()`.

### Dismissal

Key on the expiry date so the next cycle re-shows automatically:

```
sessionStorage[`membership-banner-dismissed:${expires_at}`]
```

Read it in a `useEffect`, never during render, or you get a hydration mismatch.
Start in the dismissed state so there is no flash before the effect runs.

```tsx
"use client";
import { Alert, AlertTitle, Collapse } from "@mui/material";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMembershipState } from "../lib/use-membership-state";
import { MembershipState } from "../lib/membership-utils";
import RenewMembershipButton from "./RenewMembershipButton";

const HIDDEN_PATHS = ["/order", "/apply", "/login"];

const MembershipBanner = () => {
    const { state, daysLeft, user } = useMembershipState();
    const pathname = usePathname();
    const [dismissed, setDismissed] = useState(true); // start hidden, no SSR flash

    const key = `membership-banner-dismissed:${user?.user_membership?.expires_at ?? "none"}`;
    useEffect(() => {
        setDismissed(sessionStorage.getItem(key) === "true");
    }, [key]);

    // ... severity / copy / action switch on `state`
};
```

### Mount point

Inside `RootLayoutInner` in `src/app/layout.tsx:22-36`, directly after
`<NavPanel />`. It must be inside `ServerContextWrapper` to reach the contexts.

```tsx
<ServerContextWrapper>
    <NavPanel />
    <MembershipBanner />
    <Stack sx={{ padding: 4, height: "100%" }}>{children}</Stack>
</ServerContextWrapper>
```

## MembershipStatusCard changes

Replace the three-way chip at `MembershipStatusCard.tsx:52-76` with a
`getMembershipState()` switch:

| State                | Chip                                        | Change                           |
| -------------------- | ------------------------------------------- | -------------------------------- |
| `active`             | `success` + `CheckCircle`                   | unchanged                        |
| `expiringSoon`       | `warning` + `Schedule`, "Expires in N days" | **new**                          |
| `expired`            | `error` + `Warning`                         | unchanged                        |
| `awaitingValidation` | `info` + `HourglassTop`                     | **was `error`**                  |
| `awaitingPayment`    | `info` + `Payments`                         | **new, was folded into expired** |

Apply the same recolour to the prompt box at `MembershipStatusCard.tsx:78-116`,
which hardcodes `theme.palette.error.*` for both pending and expired.

Rendering "we are processing your application" in error red is the single most
misleading pixel in the current membership flow. It reads as a rejection.

## AccountTab changes

Replace `getMembershipActionButton` (`AccountTab.tsx:56-68`) entirely. Both its
`if` branches return the identical button today, and it routes to `/shop`
rather than to checkout.

```tsx
const membershipState = getMembershipState(
    user,
    organizationSettings?.remind_membership_expires_in_days,
);
const showRenew = [
    MembershipState.awaitingPayment,
    MembershipState.expired,
    MembershipState.expiringSoon,
].includes(membershipState);

// ...
{
    showRenew && <RenewMembershipButton state={membershipState} fullWidth />;
}
```

~~Keep a secondary text button "Browse other memberships" pointing at `/shop`, so
multi-tier organizations are not locked into the default product.~~

**Superseded (2026-09-20).** A user holds exactly one membership and cannot
switch type while it is active, so a "browse" link is redundant in every state.
The button shipped with this plan and should be removed when the follow-up
below lands. Choosing a type belongs at the moment of renewal, not in a side
link. See "Follow-up: multi-tier renewal".

## Tests

`src/app/ui/MembershipBanner.test.tsx`:

- one case per membership state, including the two that render `null`
- dismiss writes to `sessionStorage` and hides the banner
- `expired` renders no close button
- hidden on `/order`, `/apply`, `/login`
- mock `usePathname` locally, following `src/app/ui/NavPanel.test.tsx:14-18`

Extend the existing profile tests for the new chip states.

## Edge cases and risks

- **Lapsed admins.** `isUserAdmin` returns false when the membership has expired
  (`utils.ts:90`), so a lapsed admin loses `/members` - the page they would use
  to fix it. This plan does not solve that, but the banner at least makes the
  cause visible instead of a silent redirect. Decoupling role from membership
  validity is a separate decision. **Flagged for the team.**
- **Blacklisted users** get no banner and no CTA, per Plan 00.
- **Layout shift.** The banner appears after hydration once the contexts
  resolve. Reserve height or accept the shift - it only affects members who
  need to act.
- **Every page** now renders this component. Keep it cheap; it reads two
  contexts and one `sessionStorage` key.

## Acceptance criteria

- [x] A member inside the reminder window sees a warning banner on every page
      except checkout, and can renew from it in one click.
- [x] A lapsed member sees a non-dismissible error banner with a renew CTA.
- [x] A pending applicant sees an informational banner, not an error-red one.
- [x] `MembershipStatusCard` shows an amber "expires in N days" state.
- [x] Renewing from the banner lands on `/order?order_id=...`.
- [ ] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass.

## Open questions for the team

1. Should the `expiringSoon` banner be dismissible for the whole session, or
   re-appear each page load? Current proposal: dismissible per session, keyed on
   expiry date.
   Team's answer: Dismissable per session
2. Do we want the silent `ProtectedPage` redirects replaced with an explicit
   "your membership expired" interstitial in this plan, or as separate work?
   The banner mitigates but does not remove the confusion.
   Team's answer: Redirecting to an interstitial is preferred if it does not require a significant amount of work
   Implemented as: `ProtectedPage` redirects lapsed members to
   `/profile?membership_required=true`; the banner reads the flag and prefixes its
   message with "That page requires an active membership." No new route.

## Follow-up: multi-tier renewal (pending product decision)

**Status:** proposed, awaiting a product rethink. Not started.
**Amends:** Plan 00 (0.2 action, 0.3 button), this plan (AccountTab).

### Why

Two facts surfaced after implementation:

- A user holds exactly one membership at a time and cannot switch type while
  it is active.
- At least one deployment offers several membership tiers, and members are
  allowed to change tier at renewal time.

Together they mean one-click renewal is only correct for deployments with a
single membership product. With more than one, the click must open a choice,
preselected to the member's current type, before any order is created. The
never-paid case (`awaitingPayment`) needs the same prompt, since those members
have no current type to default to.

### Proposed design

1. **Membership products in context.** Load the list of membership products
   once per page as a promise in `ServerContextWrapper`, threaded through
   `ContextWrapper` into a thin provider, mirroring `upcomingTicketsPromise`
   and `infopagesPromise`. One cheap indexed query for logged-in users.
2. **`RenewMembershipButton` branches on the count.** One product: unchanged,
   one click to checkout. Several: open a small dialog listing each tier with
   name, price and duration, current type preselected, with a confirm button.
   Confirm calls the action with the chosen product id.
3. **`startMembershipRenewal(productId?)`.** Optional argument, validated with
   a Zod schema from `zod-schemas.ts` and checked against the `Membership`
   table server-side. Absent or invalid falls back to the current logic
   (existing product, else org default). Blacklist and pending checks are
   unchanged.
4. **Remove "Browse other memberships"** from `AccountTab`.
5. Every surface that uses the button gets the behaviour for free: the banner,
   the account tab, and Plans 02 and 03.

### Tests to add

- Dialog: renders one row per product, preselects the current type, confirm
  calls the action with the selected id, cancel creates no order.
- Button: one product skips the dialog; several products open it.
- Action: unknown or non-membership `productId` falls back rather than
  ordering an arbitrary product.

### Open questions for the product rethink

1. Should a downgrade or upgrade mid-term ever be allowed, or strictly at
   renewal? The proposal assumes strictly at renewal.
2. When the member's current product has been deleted, preselect the org
   default or force an explicit choice?
3. Does the dialog need to show what changes between tiers, or is name, price
   and duration enough?
