# Plan 03 - Full-screen ticket view

**Status:** proposed
**Depends on:** [Plan 00](00-shared-foundation.md), [Plan 01](01-expiry-banner-and-renewal.md)
**Size:** ~1.5 days

## Problem

### The QR is 100 x 100 px

`src/app/(pages)/dashboard/Dashboard.tsx:80-90` renders
`<Image width={100} height={100} />` inside a `width: "fit-content"` card. On a
phone, in a dim venue, on a dark-themed app, that is genuinely hard to scan.
There is no tap-to-enlarge, no full-screen, no way to stop the screen dimming.

### A lapsed member cannot reach a ticket they already paid for

`/dashboard` is `membershipRequired: true` (`auth-utils.ts:55-60`). A member
whose membership expires the day before an event they bought a ticket for is
silently redirected to `/profile` by `ProtectedPage.tsx:37-40`. **That is a hard
failure at the door.**

### Two disconnected "my events" views

Dashboard shows QR cards. Profile -> Events (`EventsTab.tsx`) shows a different
set of cards with a "Participant" chip, **no QR and no link to one**. Plan 00.4
already consolidates the query behind them.

## Outcome

A member can produce a large, scannable ticket in two taps. A lapsed member is
told plainly that they will not be admitted, with the fix one tap away.

## Files

| Action | Path                                                                |
| ------ | ------------------------------------------------------------------- |
| new    | `src/app/(pages)/my-tickets/page.tsx`                               |
| new    | `src/app/(pages)/my-tickets/MyTicketsDashboard.tsx`                 |
| new    | `src/app/(pages)/my-tickets/FullScreenTicket.tsx`                   |
| new    | `src/app/(pages)/my-tickets/LanguageTranslations.ts`                |
| new    | `src/app/(pages)/my-tickets/*.test.tsx`, `page.test.ts`             |
| edit   | `src/app/GlobalConstants.ts` - add `MY_TICKETS: "my-tickets"`       |
| edit   | `src/app/lib/auth/auth-utils.ts` - route config                     |
| edit   | `src/app/ui/LanguageTranslations.ts` - nav label                    |
| edit   | `src/app/(pages)/dashboard/Dashboard.tsx` - tap-to-enlarge          |
| edit   | `src/app/api/ticket-qrcode/[event_participant_id]/route.ts` - 600px |

## The critical route config

```ts
{
    name: GlobalConstants.MY_TICKETS,
    status: UserStatus.validated,
    role: UserRole.member,
    membershipRequired: false,   // <- the whole point
},
```

A purchased ticket must outlive the membership. This single flag fixes the hard
failure described above.

Do **not** add `MY_TICKETS` to the `hiddenRoutes` list in `NavPanel.tsx:98-108`.
It is a primary destination and belongs in the drawer as "My tickets".

## The lapsed-member treatment

When `state` is `expired` or `awaitingPayment`:

1. **A persistent `error` Alert above the QR.** Not below, not dismissible:

    > **Admission requires an active membership.**
    > Your membership expired on 14 Mar. Staff will not be able to admit you with
    > this ticket until you renew.

2. **`<RenewMembershipButton fullWidth size="large" />` immediately under the
   alert**, above the QR - impossible to miss while looking at the ticket.

3. **The QR still renders**, visually demoted: `opacity: 0.55` with a diagonal
   "MEMBERSHIP EXPIRED" ribbon. Hiding it outright would be worse. Staff need to
   scan it to resolve the situation at the door, and a missing QR looks like a
   lost ticket rather than a lapsed membership.

4. Event, time, location and holder name stay fully legible.

### The case nothing currently catches

When `state` is `expiringSoon` **and** `user_membership.expires_at` falls before
`ticket.event.start_time`, show a `warning` alert instead:

> Your membership expires on 14 Mar, before this event starts. Renew now to be
> admitted.

A member can hold a perfectly valid ticket for an event they will not be let
into, and today nothing anywhere tells them.

## The ticket itself

```tsx
<Dialog fullScreen open={...}>
  <Stack sx={{ bgcolor: "#fff", color: "#000", minHeight: "100%", p: 3 }} spacing={2}>
    {/* membership alert + renew CTA, when applicable */}
    <Typography variant="h4">{event.title}</Typography>
    <Typography variant="h6">{start} - {end} · {location}</Typography>
    <Box sx={{ width: "min(80vw, 60vh)", mx: "auto", p: 2, bgcolor: "#fff" }}>
      <Image
        src={getRelativeUrl(["api", "ticket-qrcode", eventParticipant.id])}
        alt={...}
        width={600}
        height={600}
        unoptimized
        style={{ width: "100%", height: "auto" }}
      />
    </Box>
    <Typography variant="h5">{user.nickname}</Typography>
    <Chip label={ticketTypeLabel} />
  </Stack>
</Dialog>
```

Four details that matter in a real doorway:

- **Force a white surface.** The app is hardcoded to `mode: "dark"`
  (`ThemeContext.tsx:26`) with `backgroundColor: "#121212"` on `<body>`
  (`layout.tsx:44`). A white full-bleed panel is the single biggest
  scannability win available without native APIs.
- **`unoptimized` on the QR `<Image>`.** Next's optimizer re-encodes a pure
  black-and-white PNG and can soften module edges. Bypass it.
- **Raise the generated QR to 600px** at `route.ts:20`. It is 300 today;
  rendering that at ~500 CSS px on a 3x phone is a blurry upscale.
  `Cache-Control: immutable` is already set, so this costs nothing per scan.
  Also consider `errorCorrectionLevel: "Q"` for smudged-screen tolerance.
- **Screen wake lock** so the display does not dim while queuing:

```tsx
useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
        ?.request("screen")
        .then((l) => {
            lock = l;
        })
        .catch(() => {});
    return () => {
        lock?.release().catch(() => {});
    };
}, []);
```

Guard with `?.` - unsupported on some browsers, and it rejects outside a secure
context.

## Dashboard change

At `Dashboard.tsx:80-90`, keep the 100px QR as a thumbnail but make it the
affordance: wrap it in a button that opens `FullScreenTicket`, and add a visible
"Show ticket" label. A bare tiny image is not an interaction hint.

## Tests

| Case                                  | Assertion                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Active member, one ticket             | Large QR renders with `src` of `/api/ticket-qrcode/{id}`                                |
| **Expired member**                    | Alert text present, `RenewMembershipButton` present, QR still in the DOM                |
| Membership expires before event start | Warning alert present even though state is `expiringSoon`                               |
| No upcoming tickets                   | Empty state links to `/calendar`                                                        |
| Route guard (`page.test.ts`)          | An expired member is **not** redirected - contrast with the existing `/dashboard` guard |

Anything using `use()` needs `await act(async () => render(...))` per
`docs/04-testing.md`.

## Risks

- **`navigator.wakeLock` typing.** `WakeLockSentinel` needs `lib.dom` support;
  check `tsc --noEmit` rather than assuming, and add a minimal type if absent.
- **`unoptimized` bypasses the Next image cache.** The route already sets
  `immutable`, so the browser cache handles it.
- Making the `/my-tickets` route membership-free is a deliberate loosening of
  the guard. It is scoped to `status: validated` members viewing their own
  tickets; the existing per-record auth in `ticket/page.tsx:40-47` is unchanged.

## Acceptance criteria

- [ ] A member reaches a full-screen, white-background, large QR in two taps
      from any page.
- [ ] A member whose membership has lapsed can still open the ticket, sees
      "Admission requires an active membership", and can renew from that screen.
- [ ] A member whose membership expires before the event start is warned.
- [ ] The screen does not dim while the ticket is open, where supported.
- [ ] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass.

## Open questions for the team

1. Should the **staff-side scan result** also show the holder's membership
   status? `src/app/(pages)/ticket/TicketDashboard.tsx` shows nothing about it
   today. If admission genuinely requires an active membership, the scanner
   should say so. Belongs with the scanner work, but it is the other half of
   this problem.
Team's answer: Because any logged in user can scan a ticket (I do not believe we have a mechanism for identifying volunteers with scanning rights), there are security and privacy concerns relating to this. We prioritised minimum information leakage
2. Do we want an emailed or wallet-pass fallback for no-signal venues? The
   order confirmation email is the natural carrier.
Team's answer: If wallet-pass fallback does not require significant additional packages or external third party API sign ups it may be acceptable.
Emailing tickets was on the roadmap but did not make it to MVP, so this is acceptable to us.
3. Does `/my-tickets` replace the Dashboard ticket list entirely, or do both
   stay? Current proposal: both, with Dashboard linking through.
Team's answer: Dashboard should link through to the full screen ticket.
