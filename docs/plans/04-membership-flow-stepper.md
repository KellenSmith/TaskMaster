# Plan 04 - Membership sign-up flow + 4-step stepper

**Status:** proposed
**Depends on:** [Plan 00](00-shared-foundation.md), [Plan 01](01-expiry-banner-and-renewal.md)
**Size:** ~2 days

## Problem

The actual membership process is:

```
apply -> magic-link login -> ADMIN MANUALLY APPROVES -> email -> buy membership -> active
```

**None of that is explained anywhere in the product.** Here is everything the
applicant is currently told:

| Moment              | What we say                                                                                                | Source                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Landing page        | An `outlined` button, "Apply for membership"                                                               | `HomeDashboard.tsx:31-38`             |
| Apply page          | "Please make sure you have read and understood the terms"                                                  | `apply/LanguageTranslations.ts:21-26` |
| On submit           | "Application submitted. A login link will arrive in your email shortly."                                   | `apply/LanguageTranslations.ts:10-15` |
| On profile          | Red `Warning` chip "Awaiting validation" + "Your membership is awaiting validation by an admin"            | `MembershipStatusCard.tsx:52-58`      |
| On approval (email) | "Your membership has been validated. Log in again to use your new permissions and access member features." | `user-actions.ts:330`                 |

Approval is never mentioned before it happens. **Payment is never mentioned at
all** until the member finds it themselves.

Three further problems:

- **The first thing an applicant meets is a disabled form.**
  `ApplyDashboard.tsx:36-130` renders a heading, two checkboxes, then a form
  with `readOnly={!(termsAccepted.termsOfMembership && termsAccepted.privacyPolicy)}`.
  Nothing explains why the fields do not respond to typing.
- **Pending users get no CTA at all.** `getMembershipActionButton()` returns
  `null` unless `status === validated` (`AccountTab.tsx:57`).
- **Pending is styled as an error.** Red chip, red border, red text
  (`MembershipStatusCard.tsx:78-95`). "We are processing your application"
  reads as "something went wrong".
- **After approval**, the user is `validated` but membership-expired. The nav
  collapses to Home / Contact / Profile / Shop and nothing says "pay now". The
  approval email contains **no link**.

## Outcome

An applicant knows the whole process before they start, always knows where they
are in it, and is never left without a next action.

## Files

| Action | Path                                                                      |
| ------ | ------------------------------------------------------------------------- |
| new    | `src/app/ui/MembershipStepper.tsx`                                        |
| new    | `src/app/ui/MembershipStepper.test.tsx`                                   |
| new    | `src/app/lib/mail-service/mail-templates/MembershipValidatedTemplate.tsx` |
| new    | `src/app/(pages)/shop/LanguageTranslations.ts`                            |
| edit   | `src/app/(pages)/apply/ApplyDashboard.tsx`                                |
| edit   | `src/app/(pages)/apply/LanguageTranslations.ts`                           |
| edit   | `src/app/(pages)/profile/MembershipStatusCard.tsx`                        |
| edit   | `src/app/lib/user-actions.ts` - `validateUserMembership` email            |
| edit   | `src/app/HomeDashboard.tsx`                                               |
| edit   | `src/app/(pages)/shop/ShopDashboard.tsx` - localize                       |
| edit   | `src/app/(pages)/ticket/TicketDashboard.tsx` - localize status titles     |

## 4.1 The stepper

```
   (1)---------(2)---------(3)---------(4)
  Apply     We review      Pay      You're in
  done       current     upcoming   upcoming
```

| Step | Key      | Icon (`@mui/icons-material`) | Sub-label                         |
| ---- | -------- | ---------------------------- | --------------------------------- |
| 0    | `apply`  | `HowToReg`                   | "Fill in the form"                |
| 1    | `review` | `PendingActions`             | "A human checks your application" |
| 2    | `pay`    | `Payments`                   | "We invite you to pay"            |
| 3    | `active` | `Celebration`                | "Book events and volunteer"       |

**The sub-labels are the point, not decoration.** Step 1's "A human checks your
application" and step 2's "We invite you to pay" are the two facts that are
currently nowhere in the UI.

```tsx
"use client";
import { Stepper, Step, StepLabel, Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { StepIconProps } from "@mui/material/StepIcon";
import { HowToReg, PendingActions, Payments, Celebration, Check } from "@mui/icons-material";
import { FC } from "react";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "../lib/membership-language-translations";

const STEP_ICONS = [HowToReg, PendingActions, Payments, Celebration];

const MembershipStepIcon = ({ active, completed, icon }: StepIconProps) => {
    const theme = useTheme();
    const index = Number(icon) - 1;
    const Icon = completed ? Check : STEP_ICONS[index];
    return (
        <Box
            sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${
                    completed
                        ? theme.palette.success.main
                        : active
                          ? theme.palette.primary.main
                          : theme.palette.divider
                }`,
                bgcolor: active ? theme.palette.primary.main : "transparent",
                color: completed
                    ? theme.palette.success.main
                    : active
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.disabled,
                transition: "all .2s",
            }}
        >
            <Icon fontSize="small" />
        </Box>
    );
};

export const MEMBERSHIP_STEPS = ["apply", "review", "pay", "active"] as const;

const MembershipStepper: FC<{ activeStep: number }> = ({ activeStep }) => {
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Stepper
            activeStep={activeStep}
            alternativeLabel={!isSmall}
            orientation={isSmall ? "vertical" : "horizontal"}
            sx={{ width: "100%", py: 2 }}
        >
            {MEMBERSHIP_STEPS.map((step) => (
                <Step key={step}>
                    <StepLabel slots={{ stepIcon: MembershipStepIcon }}>
                        <Typography variant="subtitle2">
                            {LanguageTranslations.steps[step].label[language]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {LanguageTranslations.steps[step].hint[language]}
                        </Typography>
                    </StepLabel>
                </Step>
            ))}
        </Stepper>
    );
};

export default MembershipStepper;
```

Two implementation notes:

- MUI v9 prefers `slots={{ stepIcon }}` over the deprecated `StepIconComponent`.
  Verify against the installed `@mui/material` version before writing it.
- **Go vertical on `xs`.** Four horizontal labels with sub-text is unreadable at
  320px, and vertical genuinely reads better as a process.

### Step derivation

| Membership state (Plan 00) | `activeStep`                                                  |
| -------------------------- | ------------------------------------------------------------- |
| `anonymous`, on `/apply`   | 0                                                             |
| `awaitingValidation`       | 1                                                             |
| `awaitingPayment`          | 2                                                             |
| `active`, `expiringSoon`   | 3                                                             |
| `expired`                  | **do not render the stepper** - show the renewal card instead |

A lapsed member is not a new applicant. Showing them a four-step onboarding
would be insulting and confusing.

## 4.2 `/apply` rework

Current order: heading, two checkboxes, form locked until both ticked. Change to:

1. `<MembershipStepper activeStep={0} />` - **all four steps visible before they
   commit to anything.**
2. A short "What happens next" paragraph sourced from `TextContent`, so each
   customer environment words it themselves. Do **not** hardcode a review SLA
   like "within 3 days" - that varies per organization.
3. The form, **enabled**.
4. The terms checkboxes immediately above the submit button.

Drop `readOnly={!(termsAccepted...)}`. Validate the checkboxes on submit and
surface a field-level error instead. A user's first contact with the club should
not be a form that silently ignores typing.

### After submit

`submitMemberApplication` calls `signIn("email", { redirect: false })`
(`user-actions.ts:125-130`), so **no session is created** until the applicant
clicks the emailed link. They are still anonymous on this screen.

So derive the post-submit view from local submit state, not from `user`. Replace
the current one-line toast with a confirmation panel at `activeStep={1}`:

> Check your email for a login link. We'll review your application and email you
> when it's approved - then you'll be able to pay, and you're in.

## 4.3 The approval email

`user-actions.ts:329-332` currently sends one bare sentence with no link:

> "Your membership has been validated. Log in again to use your new permissions
> and access member features."

Replace with `MembershipValidatedTemplate`, shaped like
`MembershipExpiresReminderTemplate.tsx`:

```tsx
const MembershipValidatedTemplate: FC = async () => (
    <MailTemplate>
        <Text>Good news - your application has been approved.</Text>
        <Text>One step left: activate your membership by paying the fee.</Text>
        <Button
            style={mailTheme.components.button}
            href={getAbsoluteUrl([GlobalConstants.PROFILE])}
        >
            Activate my membership
        </Button>
    </MailTemplate>
);
```

**Watch out:** `MailTemplate` already appends a generic "visit us" button
(`MailTemplate.tsx:64-66`). Two stacked buttons compete. Either make the CTA
visually distinct, or add a `primaryAction` prop to `MailTemplate` and let it
own the button.

## 4.4 Landing page

`HomeDashboard.tsx:31-38`: change `variant="outlined"` to `variant="contained"`,
add `size="large"`, and drop `fullWidth` in favour of `alignSelf: "center"` with
a sane `maxWidth`. A full-bleed outlined button reads as a divider on desktop.

## 4.5 Localize hardcoded English

A Swedish-language organization currently hits English mid-purchase.

- `ShopDashboard.tsx:50-56` hardcodes `"Memberships"` and `"Merch"`, plus
  `"No products available"`, `"Shop"`, `"Add Membership"` / `"Add Product"`,
  and `"Failed to create order"`. The `shop/` directory has no
  `LanguageTranslations.ts` at all - create one.
- `ticket/TicketDashboard.tsx:101-140` hardcodes the status titles `"Error"`,
  `"Valid"` and `"Checked in"`.

## 4.6 Clean-up while in these files

- Delete the dead subscription strings at
  `profile/LanguageTranslations.ts:41-70`. Subscriptions are not implemented
  (`ui/utils.ts:80-88` is commented out) and the next person will assume they are.
- Fix `docs/04-testing.md`, which documents a `customRender` / `test-utils.tsx`
  that does not exist in the repo.

## Tests

- `MembershipStepper.test.tsx`: correct step active per membership state;
  completed steps render the check icon; vertical orientation at `xs`; no render
  for `expired`.
- `ApplyDashboard.test.tsx` (extend the existing file): form inputs are
  **enabled** before terms are ticked; submitting without terms shows an error
  and does not call the action; success renders the step-1 confirmation panel.
- `user-actions.test.ts`: `validateUserMembership` sends
  `MembershipValidatedTemplate`.

## Acceptance criteria

- [ ] A visitor on `/apply` can see all four steps, including that a human
      reviews the application and that payment follows approval, before filling
      anything in.
- [ ] The apply form accepts typing before the terms checkboxes are ticked.
- [ ] A pending applicant sees an informational (not error-red) status and a
      stepper showing them at step 2 of 4.
- [ ] The approval email contains a working CTA link to activate.
- [ ] No hardcoded English remains in the shop or the ticket status titles.
- [ ] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass.

## Open questions for the team

1. **Does every customer environment use manual approval?** The stepper asserts
   apply -> approve -> pay. An environment that auto-approves, or has a free
   membership product, would see a stepper that lies. Options: gate step 2 on
   whether a membership product with `price > 0` exists, or add an explicit
   `OrganizationSettings` flag. **Needs a decision before implementation.**
Team's answer: No, this is configurable, and membership can be free.
2. Should the "what happens next" text be a new `TextContent` key, or an
   `InfoPage`? `TextContent` is simpler; `InfoPage` gives admins the existing
   edit-mode UI.
Team's answer: TextContent is simpler. Edit-mode UI makes accessing those text fields difficult.
3. Do we want to show applicants a queue position or expected wait? Requires
   data we do not currently collect.
Team's answer: No, but allow this to be a configuration parameter with a useful example.
