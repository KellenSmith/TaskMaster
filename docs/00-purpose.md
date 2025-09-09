# Purpose: Why TaskMaster exists

TaskMaster helps volunteer-led organizations plan events, coordinate people, and reduce admin work. It centralizes tasks, schedules, communications, knowledge sharing, memberships, ticketing and payments in one place.

## Who it is for

- Administrators
    - Configure organization settings, locations, products/memberships/tickets
    - Approve events, manage access, oversee data and operations
- Event hosts
    - Create and update events, define tasks/shifts, limit by skill badges, manage participants/reserves
    - Communicate with assignees and reviewers; keep events on track
- Members/volunteers
    - Apply/join, manage profile and preferences, view calendar, claim or reserve shifts, receive updates

## Problems it solves

- Fragmented planning across spreadsheets, chats, and docs
- Manual follow-ups for signups, reminders, assignments, and approvals
- Ad‑hoc payments and ticketing with poor traceability
- Inconsistent data sharing and privacy practices

## Core capabilities

- Events & tasks: plan events; define shifts; assign/claim tasks; filter/limit by skill badges
- Memberships & tickets: sell memberships and event tickets; manage participants and reserves
- Payments: Swedbank Pay checkout; order lifecycle and status tracking
- Communications: magic-link login emails; newsletters and paced bulk sending; transactional messages
- Files & assets: secure uploads to Vercel Blob (logos, images)
- Security & privacy: auth + middleware gating, role-based access, input validation and HTML sanitization
- Localization & UX: translatable text content; mobile-friendly MUI-based UI

## Principles

- Reduce manual work via automation and defaults
- Defense-in-depth: validate on client, revalidate on server, sanitize before persist/send
- Least-privilege access and auditability where feasible
- Accessible by default; internationalization as a first-class need
- Maintainable code: typed contracts, simple flows, clear boundaries

## Out of scope (for now)

- Real-time chat/forums, full CRM, marketing automation
- Generic plugin system; deep third-party integrations beyond payments and email

## Success indicators

- Faster staffing: time-to-fill task shifts decreases
- Fewer manual nudges: automated reminders reduce ad-hoc messaging
- Smooth payments: fewer payment errors and support requests
- Volunteer satisfaction: clearer expectations and simpler sign-in
