# Plan 00 - Shared foundation

**Status:** implemented
**Depends on:** nothing
**Blocks:** Plans 01, 02, 03, 04
**Size:** ~0.5 day

## Why this exists

Plans 01-04 all need the same three things: a way to ask "what state is this
user's membership in", a way to start a renewal, and a way to know whether the
user has a ticket coming up. Building those three times guarantees three
slightly different answers.

Today the same membership question is answered in at least four places with
different logic:

- `src/app/ui/NavPanel.tsx:238-246` - logo click target branches on `isMembershipExpired`
- `src/app/(pages)/profile/MembershipStatusCard.tsx:52-76` - three-way chip
- `src/app/(pages)/profile/AccountTab.tsx:56-68` - CTA, with both `if` branches
  returning the identical button
- `src/app/(pages)/profile/LanguageTranslations.ts:96-108` - prompt copy, which
  is the only place that correctly distinguishes "never had a membership" from
  "membership lapsed"

## 0.1 Membership state machine

**New file: `src/app/lib/membership-utils.ts`**

Pure and client-safe: no `"use server"`, no Prisma client import, types only.

```ts
import dayjs from "dayjs";
import { Prisma } from "../../prisma/generated/client";
import { UserStatus } from "../../prisma/generated/enums";
import { isMemberBlacklisted, isMembershipExpired } from "./utils";

export const MembershipState = {
    anonymous: "anonymous",
    blacklisted: "blacklisted",
    awaitingValidation: "awaitingValidation", // applied, admin has not approved
    awaitingPayment: "awaitingPayment", // approved, never held a membership
    expired: "expired", // held one, it lapsed
    expiringSoon: "expiringSoon", // active, inside the reminder window
    active: "active",
} as const;

export type MembershipStateType = (typeof MembershipState)[keyof typeof MembershipState];

type MembershipUser = Prisma.UserGetPayload<{
    select: { status: true; user_membership: true; blacklist_entry: true };
}> | null;

export const getMembershipState = (
    user: MembershipUser,
    remindExpiresInDays: number | null | undefined,
): MembershipStateType => {
    if (!user) return MembershipState.anonymous;
    if (isMemberBlacklisted(user)) return MembershipState.blacklisted;
    if (user.status === UserStatus.pending) return MembershipState.awaitingValidation;
    if (isMembershipExpired(user))
        return user.user_membership ? MembershipState.expired : MembershipState.awaitingPayment;

    const daysLeft = dayjs.utc(user.user_membership!.expires_at).diff(dayjs.utc(), "day");
    return daysLeft <= (remindExpiresInDays ?? 7)
        ? MembershipState.expiringSoon
        : MembershipState.active;
};

export const getDaysUntilExpiry = (user: MembershipUser): number | null =>
    user?.user_membership
        ? dayjs.utc(user.user_membership.expires_at).diff(dayjs.utc(), "day")
        : null;
```

Notes for reviewers:

- `awaitingPayment` vs `expired` is discriminated by whether `user_membership`
  exists. That is exactly the test `profile/LanguageTranslations.ts:96-108`
  already uses for its prompt copy. Reusing it keeps the two from diverging.
- `blacklisted` is checked before `awaitingValidation` on purpose. A blacklisted
  user must never be offered a renewal CTA, because `renewUserMembership` throws
  `Unauthorized` for them (`user-membership-helpers.ts:19-25`), so the button
  would dead-end.
- The default of `7` matches the cron's default at `src/app/api/cron/cron.ts:40`.
  Keep them in sync or extract a shared constant.

**New file: `src/app/lib/use-membership-state.ts`**

```ts
"use client";
import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { getMembershipState, getDaysUntilExpiry } from "./membership-utils";

export const useMembershipState = () => {
    const { user } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    return {
        state: getMembershipState(user, organizationSettings?.remind_membership_expires_in_days),
        daysLeft: getDaysUntilExpiry(user),
        user,
    };
};
```

## 0.2 One-click renewal action

> **Amendment pending (2026-09-20):** one click is only correct for
> deployments with a single membership product. See "Amendments" at the end
> of this document and the follow-up section in
> [Plan 01](01-expiry-banner-and-renewal.md).

**New file: `src/app/lib/membership-actions.ts`**

```ts
"use server";

import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { getMembershipProduct } from "./user-membership-helpers";
import { createAndRedirectToOrder } from "./order-actions";
import { isMemberBlacklisted } from "./utils";
import { UserStatus } from "../../prisma/generated/enums";
import { prisma } from "../../prisma/prisma-client";
import LanguageTranslations from "./membership-language-translations";

/**
 * Creates an order for the user's membership and redirects to checkout.
 * @throws NEXT_REDIRECT on success - callers must use allowRedirectException.
 */
export const startMembershipRenewal = async (): Promise<string | undefined> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to renew a membership");

    const language = await getUserLanguage();

    if (isMemberBlacklisted(loggedInUser)) return LanguageTranslations.notEligible[language];
    if (loggedInUser.status !== UserStatus.validated)
        return LanguageTranslations.awaitingValidation[language];

    // Prefer renewing the product they already hold; fall back to the org default.
    let productId = loggedInUser.user_membership?.membership_id ?? null;
    if (productId) {
        const stillExists = await prisma.membership.findUnique({
            where: { product_id: productId },
            select: { product_id: true },
        });
        if (!stillExists) productId = null;
    }
    if (!productId) productId = (await getMembershipProduct()).id;

    // Throws NEXT_REDIRECT. Deliberately NOT wrapped in try/catch.
    await createAndRedirectToOrder([{ product_id: productId, quantity: 1 }]);
};
```

### Three traps, all load-bearing

1. `createAndRedirectToOrder` calls `serverRedirect` then `redirect()`, which
   throws `NEXT_REDIRECT`. **Do not wrap it in a try block.** Every client caller
   must use `allowRedirectException` from `src/app/ui/utils.ts`, the same way
   `ShopDashboard.tsx:104-111` does.
2. `getMembershipProduct()` **creates a Product** when none exists. It is only
   reached here on the fallback path, inside a click handler. Never import it
   into anything that runs during render.
3. This works unchanged when `handlePaymentsManually` is true (Swedbank not
   configured, see `ServerContextWrapper.tsx:55`). `PaymentHandler.tsx` already
   branches on that flag, so no extra work is needed.

### Why renewing early does not cost the user days

`renewUserMembership` extends from the existing expiry rather than from today,
when the product is unchanged and the membership is still active
(`user-membership-helpers.ts:27-32`). So renewing during `expiringSoon` loses
nothing. **Say this in the banner copy** (Plan 01) - users will not assume it.

**New file: `src/app/lib/membership-language-translations.ts`**

Shared strings used by all four plans: `renewMembership`, `activateMembership`,
`notEligible`, `awaitingValidation`, `failedStartRenewal`, `expiresInDays`,
`expiredOn`, `admissionRequiresMembership`, `renewingExtendsFromExpiry`, plus
the Plan 04 stepper labels and hints. English and Swedish.

One file, because the same sentence otherwise gets written four times in four
wordings.

## 0.3 Shared renewal button

> **Amendment pending (2026-09-20):** with several membership products the
> button must prompt for a tier before ordering. See "Amendments" below.

**New file: `src/app/ui/RenewMembershipButton.tsx`**

Used by Plans 01, 02, 03 and 04. Nobody re-implements the call.

```tsx
"use client";
import { Button, ButtonProps } from "@mui/material";
import { useTransition } from "react";
import { startMembershipRenewal } from "../lib/membership-actions";
import { allowRedirectException } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "../lib/membership-language-translations";
import { MembershipState, MembershipStateType } from "../lib/membership-utils";

interface Props extends ButtonProps {
    state: MembershipStateType;
}

const RenewMembershipButton = ({ state, ...buttonProps }: Props) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    const label =
        state === MembershipState.awaitingPayment
            ? LanguageTranslations.activateMembership[language]
            : LanguageTranslations.renewMembership[language];

    const onClick = () =>
        startTransition(async () => {
            let errorMsg: string | undefined;
            try {
                errorMsg = await startMembershipRenewal();
                if (!errorMsg) return;
            } catch (error) {
                allowRedirectException(error); // rethrows NEXT_REDIRECT
                errorMsg = LanguageTranslations.failedStartRenewal[language];
            }
            addNotification(errorMsg, "error");
        });

    return (
        <Button
            variant="contained"
            color="warning"
            disabled={isPending}
            onClick={onClick}
            {...buttonProps}
        >
            {label}
        </Button>
    );
};

export default RenewMembershipButton;
```

## 0.4 Upcoming tickets in context

Plans 02 and 03 both need "does this user have a ticket soon". That query exists
today only inside `src/app/(pages)/dashboard/page.tsx:29-53`, which is also why
Profile -> Events and Dashboard show two different versions of "my events".

1. **Move it** to a new `src/app/lib/event-participant-helpers.ts` as
   `getUpcomingEventParticipants()`. The query is unchanged: `end_time > now`,
   ordered by `start_time asc`, with the existing `dashboardTicketInclude`.
2. Point `dashboard/page.tsx` at it instead of its private copy.
3. Add `upcomingTicketsPromise` to `ServerContextWrapper.tsx`, through
   `ContextWrapper.tsx`, into a new thin `UpcomingTicketsContext` that `use()`s
   the promise. This mirrors how `infopagesPromise` already reaches `NavPanel`.

### Cost

One extra indexed query per page load for logged-in users. Acceptable. If it
shows up in Speed Insights it is a trivially cacheable candidate, but measure
before optimising.

Note the existing function is named `getCachedUserEventParticipants` but has no
cache directive. Do not carry the misleading name across.

## Tests

| File                                        | Assertions                                                                                                                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/lib/membership-utils.test.ts`      | All 7 states. Boundaries: expiry exactly now; `daysLeft === remindDays` (inclusive, is `expiringSoon`); blacklisted-but-unexpired resolves to `blacklisted`; pending-with-membership resolves to `awaitingValidation`                                           |
| `src/app/lib/membership-actions.test.ts`    | Not logged in throws; blacklisted returns localized string and creates no order; pending returns localized string; stale `membership_id` falls back to `getMembershipProduct`; happy path calls `createAndRedirectToOrder` with `[{ product_id, quantity: 1 }]` |
| `src/app/ui/RenewMembershipButton.test.tsx` | Label switches on `awaitingPayment`; error string reaches `addNotification`; `NEXT_REDIRECT` is not swallowed                                                                                                                                                   |

Use plain `render` plus `vi.mocked(useUserContext).mockReturnValue(...)`. The
`customRender` helper that `docs/04-testing.md` describes does not exist.

## Acceptance criteria

- [x] `getMembershipState` is the only place membership state is derived; the
      four sites listed under "Why this exists" all call it.
- [x] `startMembershipRenewal` lands the user on `/order?order_id=...` in one click.
- [x] No render path imports `getMembershipProduct`.
- [x] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass.

## Open questions for the team

1. Should the reminder-window default live in one constant shared by
   `membership-utils.ts` and `cron.ts:40`? Both currently hardcode `7`.
   Team's answer: Yes
2. Blacklisted users get no CTA and no explanation anywhere today. Do we want a
   "contact us" affordance, or is silence deliberate?
   Team's answer: Allow organisations to have a fallback affordance, with a default something like "It is not possible to renew your membership at this time. If you believe this is a mistake, contact us at ... " etc.

## Amendments

### Multi-tier renewal (2026-09-20, pending product decision)

Two facts surfaced after Plan 01 shipped: a user holds exactly one membership
and cannot switch type while it is active, and at least one deployment offers
several tiers that members may switch between at renewal. So the one-click
promise in 0.2 and 0.3 holds only when `prisma.membership.count() === 1`.

Proposed changes to this foundation, not yet started:

- **0.2** `startMembershipRenewal(productId?)`: optional argument, validated
  with a Zod schema and checked against the `Membership` table. Absent or
  invalid falls back to the current logic. Blacklist and pending checks are
  unchanged.
- **0.3** `RenewMembershipButton` reads a membership-products promise from
  context. One product: unchanged. Several: opens a dialog listing each tier,
  current type preselected, and passes the chosen id to the action.
- **New context** `membershipProductsPromise`, threaded through
  `ServerContextWrapper` and `ContextWrapper` like `upcomingTicketsPromise`.

Full rationale, tests and open questions live in the follow-up section of
[Plan 01](01-expiry-banner-and-renewal.md). Plans 02 and 03 inherit the
behaviour through the shared button and need no changes of their own.
