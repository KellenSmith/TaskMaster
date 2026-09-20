# Plan 05 - Calendar overhaul: agenda view + real event state

**Status:** proposed
**Depends on:** [Plan 00](00-shared-foundation.md) (soft - only for the lapsed-member state)
**Size:** ~3-4 days, phased into three shippable chunks

## Problem

The calendar is the entry point for two of the five primary user jobs - "find
out what's coming up and buy a ticket" and "volunteer for a shift" - and it
currently supports neither.

### 1. The query physically cannot support the UI

`src/app/(pages)/calendar/page.tsx:9-25`:

```ts
return await prisma.event.findMany({ where: eventFilterParams });
```

No `include`, no `select`, **no date bound**. So the client receives bare Event
rows with no tickets, no participants, no reserves, no tasks and no location.

That is the root cause of the `// TODO: mark green if participating` left at
`CalendarEvent.tsx:41`. It is not an oversight anyone can fix in the component -
**the data is not there**. Every helper that would answer the user's questions
(`isUserParticipant`, `isUserReserve`, `isEventSoldOut`,
`getEventParticipantCount` in `calendar-post/event-utils.ts`) requires includes
this query does not perform.

### 2. The fetch is unbounded

Every calendar load pulls the organization's **entire event history**, forever,
and ships it to the browser to render one month. This grows without limit and is
already the most expensive query in the app for long-lived customers.

### 3. Colour encodes admin workflow, not member relevance

`CalendarEvent.tsx:26-38` colours by `EventStatus`: draft / pending_approval /
published / cancelled. For a member, every event they can see is `published`, so
the colour carries **zero information**.

### 4. Everything useful is in a tooltip, and tooltips are off on touch

`CalendarEvent.tsx:110-118` disables the `Tooltip` on small screens - correctly,
since tooltips do not fire on touch. But the tooltip is the only place the start
and end times appear. On mobile, an event is a coloured bar with a truncated
title and nothing else.

### 5. Month-at-a-time only

No agenda, no forward-looking list. On the 28th, next month's events are one
click away and completely invisible.

### 6. "Create event" is the most prominent control on the page

`CalendarDashboard.tsx:163-170` renders it top-left for **every logged-in
member**, more prominent than anything about attending.

### 7. Responsive detection by user-agent sniffing

`CalendarEvent.tsx:43-45`:

```ts
const isSmallScreen = /Mobi|Android|iPhone|iPad|iPod/.test(
    typeof navigator !== "undefined" ? navigator.userAgent : "",
);
```

Returns `false` during SSR and possibly `true` after hydration, so this is a
hydration mismatch waiting to be noticed. `CalendarDay` and `CalendarDashboard`
in the same folder both use `useMediaQuery` correctly.

### 8. Accessibility

Calendar cells are `Card` components with `onClick` (`CalendarEvent.tsx:82-104`)

- not focusable, not keyboard-activatable, no accessible name. And state is
  encoded in colour alone, which fails WCAG 1.4.1 Use of Colour.

## Outcome

A member opening the calendar can see, without clicking anything: what is
coming up, which ones they are already going to, which are sold out, which need
volunteers, what they cost, and where they are. And they can act on any of it
from the list.

## Target design

Two views, toggleable. **Agenda is the default for members; Month for admins
and hosts** (they are planning, members are browsing). Persist the choice to a
URL search param.

### Agenda view (new, default)

A rolling forward-looking list grouped by month, starting from today. Each row:

```
+------+----------------------------------------------------+
| SAT  | Spring Social                      [You're going]   |
|  14  | 19:00 - 23:00 · The Warehouse                       |
| MAR  | from 120 SEK                       [ View ticket ]  |
+------+----------------------------------------------------+
| SUN  | Bar Night                    [3 shifts need help]   |
|  22  | 18:00 - 01:00 · The Warehouse                       |
| MAR  | from 80 SEK              [ Volunteer ] [ Get ticket ]|
+------+----------------------------------------------------+
```

- date block: day-of-month, short weekday, month
- title, time range, location name
- **state chip** (see below)
- from-price
- **inline primary action**, varying by state

### Month grid (existing, fixed)

Same state chips, plus the state driving the cell colour. Keep it for
planning-minded users and for hosts. Fix the accessibility and UA-sniffing
problems here rather than rewriting it.

### Filter bar (both views)

Tags, location, "Only events I'm attending", "Only events needing volunteers".
Persist to URL search params - the app already keeps tab state in the URL, so
this matches the existing idiom and makes filtered views shareable.

## Data layer - the core of this plan

**New file: `src/app/lib/event-helpers.ts`**

The key architectural call: **compute the derived flags server-side and ship a
lean view model.** Do not ship participant rows to the client.

A naive `include: { tickets: { include: { event_participants: true } } }` sends
every participant of every event to every browser: a 200-person event times 30
events is 6000 rows on the wire, and it leaks who is attending what to anyone
with devtools.

```ts
export type CalendarEventView = {
    id: string;
    title: string;
    start_time: Date;
    end_time: Date;
    status: EventStatus;
    tags: string[];
    locationName: string | null;
    fromPrice: number | null;
    participantCount: number;
    maxParticipants: number;
    isSoldOut: boolean;
    viewerState: "none" | "participant" | "reserve" | "host" | "volunteer";
    openVolunteerShifts: number;
};
```

Roughly 12 scalar fields per event regardless of event size.

```ts
export const getCalendarEvents = async (
    userId: string | null,
    isAdmin: boolean,
    rangeStart: Date,
    rangeEnd: Date,
): Promise<CalendarEventView[]> => {
    const visibility: Prisma.EventWhereInput =
        userId && !isAdmin ? { OR: [{ status: EventStatus.published }, { host_id: userId }] } : {};

    const events = await prisma.event.findMany({
        where: {
            AND: [{ end_time: { gte: rangeStart } }, { start_time: { lt: rangeEnd } }, visibility],
        },
        select: {
            id: true,
            title: true,
            start_time: true,
            end_time: true,
            status: true,
            tags: true,
            max_participants: true,
            host_id: true,
            location: { select: { name: true } },
            tickets: {
                select: {
                    type: true,
                    product: { select: { price: true } },
                    _count: { select: { event_participants: true } },
                    // only the viewer's own row, never everyone's
                    ...(userId && {
                        event_participants: {
                            where: { user_id: userId },
                            select: { id: true },
                        },
                    }),
                },
            },
            ...(userId && {
                event_reserves: { where: { user_id: userId }, select: { user_id: true } },
            }),
            tasks: { select: { id: true, assignee_id: true } },
        },
        orderBy: { start_time: "asc" },
    });

    return events.map((event) => toCalendarEventView(event, userId));
};
```

Notes for reviewers:

- **Conditional `select` keys**: spread them in, do not pass `false`. Prisma's
  acceptance of `false` for relation selects varies by version; spreading is
  unambiguous. Confirm against the installed `@prisma/client` (7.8.x).
- `tasks` selects two scalars per shift. That gives both `openVolunteerShifts`
  (count of `assignee_id === null`) and whether the viewer is a volunteer. For
  an event with 40 shifts that is 80 scalars - acceptable. If a customer has
  events with hundreds of shifts, switch to two `_count` aggregates.
- **Anonymous users** (`userId === null`) currently cannot reach `/calendar` at
  all, but the helper handles it so Plan 01's "let lapsed members browse"
  question can be answered without a rewrite.
- `fromPrice` is the minimum `product.price` across the event's tickets. Exclude
  `TicketType.volunteer` tickets from it - a volunteer ticket is often free or
  discounted and would make every event show "from 0 SEK".

### Range and pagination

| View       | `rangeStart`                              | `rangeEnd`                                            |
| ---------- | ----------------------------------------- | ----------------------------------------------------- |
| Agenda     | `now`                                     | `now + 3 months`, extended by a `months` search param |
| Month grid | `month.startOf("month").subtract(7, "d")` | `month.endOf("month").add(7, "d")`                    |

The month grid's plus/minus 7 days covers the leading and trailing week cells
that `getDaysInFirstTzWeekButNotInMonth` / `getDaysInLastTzWeekButNotInMonth`
render (`CalendarDashboard.tsx:68-93`).

**Month navigation must move from client state to a URL search param**
(`?month=YYYY-MM`). Today it is `useState` (`CalendarDashboard.tsx:36-38`), so
the server component cannot refetch when the user pages. This is the main
refactor cost of the plan.

The alternative - keep client state and fetch a wide window up front - is
cheaper but reintroduces an unbounded-ish fetch. **Recommend the URL param**; it
also makes months linkable and shareable, and matches how tabs already work.

## EventStateChip - one source of truth

**New file: `src/app/(pages)/calendar/EventStateChip.tsx`**

Precedence, first match wins:

| #   | Condition                       | Colour      | Label                    |
| --- | ------------------------------- | ----------- | ------------------------ |
| 1   | `status === cancelled`          | `error`     | Cancelled                |
| 2   | `status === draft`              | `warning`   | Draft                    |
| 3   | `status === pending_approval`   | `info`      | Awaiting approval        |
| 4   | `viewerState === "host"`        | `secondary` | You're hosting           |
| 5   | `viewerState === "participant"` | `success`   | You're going             |
| 6   | `viewerState === "volunteer"`   | `success`   | You're volunteering      |
| 7   | `viewerState === "reserve"`     | `warning`   | On reserve list          |
| 8   | `isSoldOut`                     | `default`   | Sold out                 |
| 9   | `openVolunteerShifts > 0`       | `info`      | N shifts need volunteers |
| 10  | spots left <= 5                 | `warning`   | N spots left             |
| 11  | otherwise                       | none        | render nothing           |

Use this chip in the agenda row, the month grid cell, **and**
`profile/EventCard.tsx` - which has its own near-duplicate
`getStatusChipColor` / `getStatusLabel` at lines 27-38. Consolidating removes
the third copy of this logic.

## Inline actions in the agenda

Derived from the same state, so the chip and the button never disagree:

| State                       | Primary action                               |
| --------------------------- | -------------------------------------------- |
| participant                 | View ticket -> `/my-tickets` (Plan 03)       |
| volunteer                   | View shifts -> event page, organize tab      |
| host                        | Manage -> event page                         |
| reserve                     | Leave reserve list                           |
| sold out, not participating | Join reserve list                            |
| open volunteer shifts       | Volunteer (secondary) + Get ticket (primary) |
| otherwise                   | Get ticket                                   |

**Note on "Volunteer":** it currently routes into the kanban board, which is an
admin tool shown to a member who wants to say "I'll do the bar, 18:00-22:00".
Replacing that with a plain shift-picker is listed as out of scope in
`README.md` and is the natural follow-up to this plan. This plan only makes the
entry point discoverable.

## Files

| Action | Path                                                                        |
| ------ | --------------------------------------------------------------------------- |
| new    | `src/app/lib/event-helpers.ts` - `getCalendarEvents`, `toCalendarEventView` |
| new    | `src/app/lib/event-helpers.test.ts`                                         |
| new    | `src/app/(pages)/calendar/AgendaList.tsx`                                   |
| new    | `src/app/(pages)/calendar/AgendaRow.tsx`                                    |
| new    | `src/app/(pages)/calendar/EventStateChip.tsx`                               |
| new    | `src/app/(pages)/calendar/CalendarFilters.tsx`                              |
| new    | `src/app/(pages)/calendar/ViewToggle.tsx`                                   |
| new    | corresponding `*.test.tsx`                                                  |
| edit   | `src/app/(pages)/calendar/page.tsx` - bounded query, search params          |
| edit   | `src/app/(pages)/calendar/CalendarDashboard.tsx` - view toggle, URL month   |
| edit   | `src/app/(pages)/calendar/CalendarDay.tsx` - consume the view model         |
| edit   | `src/app/(pages)/calendar/CalendarEvent.tsx` - chip, a11y, drop UA sniffing |
| edit   | `src/app/(pages)/calendar/LanguageTranslations.ts`                          |
| edit   | `src/app/(pages)/profile/EventCard.tsx` - use `EventStateChip`              |

## Also fix here

- **Drop the UA sniffing** at `CalendarEvent.tsx:43-45`; use
  `useMediaQuery(theme.breakpoints.down("sm"))` like its siblings.
- **Keyboard and screen reader access**: calendar cells become `ButtonBase`
  (or `role="button" tabIndex={0}` with an `onKeyDown` handler) carrying an
  `aria-label` of title + date + time + state.
- **Colour is no longer the only state encoding** - the chip adds text. Keep
  the chip visible even when colour is applied.
- **Demote "Create event"** from the top-left primary position. See open
  question 3 - this needs a product decision, not just a CSS change.
- Stop colouring published events by status. Use the org primary for all
  published events and let the chip carry state.

## Phasing

Three independently shippable chunks. Ship in order; each is useful alone.

### Phase 1 - data layer and honest state (~1.5 days)

`event-helpers.ts`, `EventStateChip`, bounded query, month grid consuming the
view model, a11y and UA-sniffing fixes. **No agenda yet.**

Delivers the highest-value signal ("am I going to this?") at the lowest risk,
and fixes the unbounded fetch. If the team ships nothing else, ship this.

### Phase 2 - agenda view (~1.5 days)

`AgendaList`, `AgendaRow`, `ViewToggle`, default-by-role, inline actions.

### Phase 3 - filters and pagination (~1 day)

`CalendarFilters`, URL persistence, "load more" for the agenda.

## Tests

| File                      | Assertions                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `event-helpers.test.ts`   | Range bounds include events that straddle `rangeStart`; non-admin sees only `published` plus own drafts; `viewerState` precedence; `openVolunteerShifts` counts only `assignee_id === null`; `isSoldOut` true at exactly `max_participants`; `fromPrice` excludes volunteer tickets; anonymous user gets `viewerState: "none"` |
| `EventStateChip.test.tsx` | The full precedence table above                                                                                                                                                                                                                                                                                                |
| `AgendaRow.test.tsx`      | Correct chip and correct primary action for each `viewerState`                                                                                                                                                                                                                                                                 |
| `CalendarDay.test.tsx`    | **Existing multi-day-spanning assertions must stay green** - `shouldShowEvent` logic is deliberately unchanged                                                                                                                                                                                                                 |
| `page.test.ts`            | Query is called with a bounded range                                                                                                                                                                                                                                                                                           |

## Risks

- **The month-to-URL refactor** touches `CalendarDashboard` state and its
  existing tests. Largest single source of churn in this plan.
- **Payload size** under the largest customer's data. Validate the view-model
  mapping against a realistic dataset before Phase 2, not after.
- **Timezone handling.** `shouldShowEvent` (`CalendarDay.tsx:22-56`) has
  carefully worked-out UTC-vs-display-timezone logic for events spanning
  midnight. Do not touch it. The range filter in the new query operates in UTC
  and must be widened by at least a day on each side of the displayed window so
  boundary events are not dropped before `shouldShowEvent` ever sees them.
- **Cross-plan dependency**: if the team decides lapsed members get read-only
  calendar access (Plan 01, open question 2), `membershipRequired` on the
  CALENDAR route changes and the agenda needs a "Renew to book" action state.
  The helper already supports `userId === null`; the UI would need one more
  branch.

## Acceptance criteria

- [ ] The calendar query is bounded by a date range; no query returns the full
      event history.
- [ ] A member can see, without clicking: which upcoming events they are going
      to, which are sold out, which need volunteers, and what they cost.
- [ ] Agenda view is the default for members and shows a rolling forward list,
      not a single month.
- [ ] Every event affordance is keyboard reachable and has an accessible name.
- [ ] No event state is communicated by colour alone.
- [ ] No participant rows are shipped to the client for events the viewer is
      not part of.
- [ ] `pnpm lint && pnpm tsc --noEmit && pnpm test` pass, including the existing
      `CalendarDay` spanning-event tests.

## Open questions for the team

1. **Agenda or month as the default?** Proposal: agenda for members, month for
   admins and hosts, with the choice remembered in the URL. Is per-role
   defaulting worth the complexity versus one default for everyone?
Team's answer: Agenda view by default for everyone.
2. **How far forward should the agenda load initially?** Proposal: 3 months.
   Organizations that publish a year ahead may want more; ones that publish two
   weeks ahead will want an empty-state message rather than a long blank list.
Team's answer: 3 months
3. **Who can create events?** Today any logged-in member can
   (`CalendarDashboard.tsx:163-170`). If that is intentional, the button stays
   but gets demoted to a FAB or overflow. If it is not, gate it on host/admin.
   **This is a product decision and blocks that part of the work.**
Team's answer: It should be deployment configurable whether ordinary members can create events. However we want to rethink the 'Create Event' flow for ordinary members vs admins. Demoting it now for ordinary members is fine.
4. **Should past events be reachable?** The agenda is forward-only by design.
   Members may want "events I attended"; that is arguably Profile -> Events,
   which already exists and already has this data.
Team's answer: Agenda is future only. Stretch goal: A separate past events version of the agenda that allows admins and event hosts to get key metrics - attendees, financials, plus the ability to clone the event for a new event.
