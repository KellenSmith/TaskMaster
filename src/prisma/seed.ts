/**
 * Dev/local mock data seed script.
 *
 * WIPES the configured database (see `truncateAll` below) and inserts a small,
 * realistic-looking dataset built with @faker-js/faker — enough to exercise
 * every major screen/relation for manual testing and screenshots, not a
 * load-testing volume.
 *
 * Run with: `SEED_CONFIRM_WIPE=true pnpm prisma-seed`
 *
 * This is plain Node dev tooling, not app code — it intentionally does NOT
 * follow the *-actions.ts conventions in docs/07-server-action-style-conventions.md
 * (no Zod re-validation, no html-sanitizer, no localized error strings).
 */
import "dotenv/config";
import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "./generated/client";
import {
    EventStatus,
    Language,
    OrderStatus,
    TaskStatus,
    TicketType,
    UserRole,
    UserStatus,
} from "./generated/enums";

// ---------------------------------------------------------------------------
// Safety guard — this script destroys data. Require an explicit opt-in.
// ---------------------------------------------------------------------------

const getDbHostForLogging = (): string => {
    const url = process.env.DIRECT_DATABASE_URL;
    if (!url) return "(DIRECT_DATABASE_URL is not set)";
    try {
        return new URL(url).host;
    } catch {
        return "(could not parse DIRECT_DATABASE_URL)";
    }
};

if (process.env.SEED_CONFIRM_WIPE !== "true") {
    console.log(
        `This script would WIPE ALL DATA on database host: ${getDbHostForLogging()}\n` +
            "Re-run with SEED_CONFIRM_WIPE=true to proceed, e.g.:\n" +
            "  SEED_CONFIRM_WIPE=true pnpm prisma-seed",
    );
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Prisma client — direct Postgres connection via driver adapter (not the
// app's Accelerate client), so a bulk wipe+seed doesn't go through the
// Accelerate proxy/cache.
// ---------------------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Configurable primary admin — always (re)created after the wipe so Charlotte
// (or whoever owns this deployment) never gets locked out of their own login.
// This account is fixed/deterministic, not faker-generated.
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || "Admin";
const ADMIN_SUR_NAME = process.env.SEED_ADMIN_SUR_NAME || "User";
const ADMIN_NICKNAME = process.env.SEED_ADMIN_NICKNAME || "admin";

// Small dataset sizing — enough for UI screenshots/manual testing.
const FAKER_USER_COUNT = 14;
const LOCATION_COUNT = 5;
const EVENT_COUNT = 8;

// ---------------------------------------------------------------------------
// Wipe
// ---------------------------------------------------------------------------

// Listed by @@map name. TRUNCATE ... CASCADE handles FK ordering for us.
const APP_TABLES = [
    "newsletter_jobs",
    "organization_settings",
    "info_pages",
    "text_contents",
    "text_translations",
    "blacklist_entries",
    "event_participants",
    "event_reserves",
    "tasks",
    "task_skill_badges",
    "user_skill_badges",
    "skill_badges",
    "tickets",
    "order_items",
    "orders",
    "user_memberships",
    "memberships",
    "products",
    "events",
    "locations",
    "accounts",
    "sessions",
    "verification_token",
    "users",
];

const truncateAll = async (): Promise<void> => {
    const tableList = APP_TABLES.map((name) => `"${name}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
    console.log(`Truncated ${APP_TABLES.length} tables.`);
};

// ---------------------------------------------------------------------------
// Seed: organization settings
// ---------------------------------------------------------------------------

const seedOrganizationSettings = async (
    adminEmail: string,
): Promise<Prisma.OrganizationSettingsGetPayload<true>> => {
    return prisma.organizationSettings.create({
        data: {
            event_manager_email: adminEmail,
            member_application_prompt:
                "Tell us a little about yourself and why you'd like to get involved.",
            payment_instructions: "Payment is completed via card checkout at the last step.",
        },
    });
};

// ---------------------------------------------------------------------------
// Seed: users (1 fixed admin + faker-generated users)
// ---------------------------------------------------------------------------

const seedUsers = async (): Promise<{
    adminUser: Prisma.UserGetPayload<true>;
    users: Prisma.UserGetPayload<true>[];
}> => {
    const adminUser = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            nickname: ADMIN_NICKNAME,
            first_name: ADMIN_FIRST_NAME,
            sur_name: ADMIN_SUR_NAME,
            role: UserRole.admin,
            status: UserStatus.validated,
            emailVerified: new Date(),
            consent_to_newsletters: true,
        },
    });

    const pronouns = ["they/them", "she/her", "he/him"];

    const users: Prisma.UserGetPayload<true>[] = [];
    for (let i = 0; i < FAKER_USER_COUNT; i++) {
        const firstName = faker.person.firstName();
        const surName = faker.person.lastName();
        // Extra admins: a couple of faker-generated users besides the fixed admin.
        const role = i < 2 ? UserRole.admin : UserRole.member;
        // Mostly validated members, a couple still pending (e.g. unreviewed applications).
        const status = i < 12 ? UserStatus.validated : UserStatus.pending;

        const user = await prisma.user.create({
            data: {
                email: `${faker.internet.email({ firstName, lastName: surName, provider: "example.com" }).split("@")[0]}+${i}@example.com`,
                nickname: `${faker.internet.username({ firstName, lastName: surName }).toLowerCase()}-${i}`,
                first_name: firstName,
                sur_name: surName,
                pronoun: faker.helpers.arrayElement(pronouns),
                phone: faker.phone.number(),
                role,
                status,
                emailVerified:
                    status === UserStatus.validated ? faker.date.past({ years: 1 }) : null,
                consent_to_newsletters: faker.datatype.boolean(),
                created_at: faker.date.past({ years: 1 }),
            },
        });
        users.push(user);
    }

    return { adminUser, users };
};

// ---------------------------------------------------------------------------
// Seed: locations
// ---------------------------------------------------------------------------

const seedLocations = async (): Promise<Prisma.LocationGetPayload<true>[]> => {
    const venueTypes = ["Community Hall", "Event Center", "Clubhouse", "Meeting House", "Arena"];

    const locations: Prisma.LocationGetPayload<true>[] = [];
    for (let i = 0; i < LOCATION_COUNT; i++) {
        const location = await prisma.location.create({
            data: {
                name: `${faker.location.city()} ${venueTypes[i % venueTypes.length]}`,
                contact_person: faker.person.fullName(),
                rental_cost: faker.helpers.arrayElement([0, 500, 1000, 1500, 2500]),
                address: faker.location.streetAddress(true),
                capacity: faker.number.int({ min: 20, max: 300 }),
                accessibility_info: faker.helpers.arrayElement([
                    null,
                    "Wheelchair accessible entrance and restrooms.",
                    "Ground floor only, no elevator.",
                ]),
                description: faker.lorem.sentences(2),
            },
        });
        locations.push(location);
    }
    return locations;
};

// ---------------------------------------------------------------------------
// Seed: skill badges
// ---------------------------------------------------------------------------

const SKILL_BADGE_NAMES = [
    "First Aid",
    "Bar License",
    "Sound Engineering",
    "Event Photography",
    "Crowd Safety",
    "Kitchen Hygiene",
];

const seedSkillBadges = async (): Promise<Prisma.SkillBadgeGetPayload<true>[]> => {
    const skillBadges: Prisma.SkillBadgeGetPayload<true>[] = [];
    for (const name of SKILL_BADGE_NAMES) {
        const skillBadge = await prisma.skillBadge.create({
            data: {
                name,
                description: faker.lorem.sentence(),
            },
        });
        skillBadges.push(skillBadge);
    }
    return skillBadges;
};

// ---------------------------------------------------------------------------
// Seed: events
// ---------------------------------------------------------------------------

const EVENT_TAG_POOL = ["fundraiser", "outdoor", "music", "family-friendly", "workshop", "social"];

type EventPlan = { dayOffset: number; status: EventStatus };

// A mix of past/future events across the EventStatus enum.
const EVENT_PLANS: EventPlan[] = [
    { dayOffset: -60, status: EventStatus.published },
    { dayOffset: -30, status: EventStatus.published },
    { dayOffset: -14, status: EventStatus.cancelled },
    { dayOffset: -7, status: EventStatus.published },
    { dayOffset: 7, status: EventStatus.published },
    { dayOffset: 14, status: EventStatus.pending_approval },
    { dayOffset: 30, status: EventStatus.draft },
    { dayOffset: 45, status: EventStatus.published },
];

const seedEvents = async (
    locations: Prisma.LocationGetPayload<true>[],
    users: Prisma.UserGetPayload<true>[],
): Promise<Prisma.EventGetPayload<true>[]> => {
    const events: Prisma.EventGetPayload<true>[] = [];
    for (let i = 0; i < EVENT_COUNT; i++) {
        const plan = EVENT_PLANS[i % EVENT_PLANS.length];
        const startTime = faker.date.soon({
            days: 1,
            refDate: new Date(Date.now() + plan.dayOffset * 24 * 60 * 60 * 1000),
        });
        const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // +3h

        const event = await prisma.event.create({
            data: {
                title: faker.company.catchPhrase(),
                description: faker.lorem.paragraph(),
                start_time: startTime,
                end_time: endTime,
                max_participants: faker.number.int({ min: 20, max: 150 }),
                status: plan.status,
                tags: faker.helpers.arrayElements(EVENT_TAG_POOL, { min: 1, max: 3 }),
                location_id: faker.helpers.arrayElement(locations).id,
                host_id: faker.helpers.arrayElement(users).id,
            },
        });
        events.push(event);
    }
    return events;
};

// ---------------------------------------------------------------------------
// Seed: products (memberships + per-event tickets)
// ---------------------------------------------------------------------------

const seedMembershipProducts = async (): Promise<
    { product: Prisma.ProductGetPayload<true>; membership: Prisma.MembershipGetPayload<true> }[]
> => {
    const plans = [
        { name: "Annual Membership", price: 300, duration: 365 },
        { name: "Supporter Membership", price: 600, duration: 365 },
    ];

    const results: {
        product: Prisma.ProductGetPayload<true>;
        membership: Prisma.MembershipGetPayload<true>;
    }[] = [];
    for (const plan of plans) {
        const product = await prisma.product.create({
            data: {
                name: plan.name,
                description: faker.lorem.sentence(),
                price: plan.price,
            },
        });
        const membership = await prisma.membership.create({
            data: {
                product_id: product.id,
                duration: plan.duration,
            },
        });
        results.push({ product, membership });
    }
    return results;
};

const seedEventTickets = async (
    events: Prisma.EventGetPayload<true>[],
): Promise<
    { product: Prisma.ProductGetPayload<true>; ticket: Prisma.TicketGetPayload<true> }[]
> => {
    const ticketPlans: { type: TicketType; namePrefix: string; price: number }[] = [
        { type: TicketType.standard, namePrefix: "Standard Ticket", price: 150 },
        { type: TicketType.volunteer, namePrefix: "Volunteer Ticket", price: 0 },
    ];

    const results: {
        product: Prisma.ProductGetPayload<true>;
        ticket: Prisma.TicketGetPayload<true>;
    }[] = [];
    for (const event of events) {
        for (const plan of ticketPlans) {
            const product = await prisma.product.create({
                data: {
                    name: `${plan.namePrefix} - ${event.title}`,
                    description: faker.lorem.sentence(),
                    price: plan.price,
                    stock: plan.type === TicketType.standard ? event.max_participants : null,
                },
            });
            const ticket = await prisma.ticket.create({
                data: {
                    product_id: product.id,
                    type: plan.type,
                    event_id: event.id,
                },
            });
            results.push({ product, ticket });
        }
    }
    return results;
};

// ---------------------------------------------------------------------------
// Seed: the fixed admin's own membership.
//
// isUserAdmin()/route auth (see src/app/lib/utils.ts, src/app/lib/auth/auth-utils.ts)
// require role === admin AND a non-expired membership — an admin with no
// membership is locked out of admin controls entirely. Since the fixed admin
// is the only account anyone can actually log in as (the faker users have
// unreachable @example.com addresses), they must always get one, deterministically.
// ---------------------------------------------------------------------------

const seedAdminMembership = async (
    adminUser: Prisma.UserGetPayload<true>,
    membershipProducts: { membership: Prisma.MembershipGetPayload<true> }[],
): Promise<Prisma.UserMembershipGetPayload<true>> => {
    const membership = membershipProducts[0].membership;
    const twoYearsFromNow = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

    return prisma.userMembership.create({
        data: {
            user_id: adminUser.id,
            membership_id: membership.product_id,
            expires_at: twoYearsFromNow,
        },
    });
};

// ---------------------------------------------------------------------------
// Seed: user memberships (a handful, so the relation isn't empty)
// ---------------------------------------------------------------------------

const seedUserMemberships = async (
    users: Prisma.UserGetPayload<true>[],
    membershipProducts: { membership: Prisma.MembershipGetPayload<true> }[],
): Promise<Prisma.UserMembershipGetPayload<true>[]> => {
    // `users` here excludes the fixed admin — seedAdminMembership already gave
    // them one, and UserMembership.user_id is unique so they can't get a second.
    const membershipUsers = faker.helpers.arrayElements(users, 6);
    const userMemberships: Prisma.UserMembershipGetPayload<true>[] = [];
    for (const [index, user] of membershipUsers.entries()) {
        const membership = faker.helpers.arrayElement(membershipProducts).membership;
        // Mostly active memberships, one expired for testing expiry-related UI.
        const expiresAt =
            index === 0
                ? faker.date.recent({ days: 10 }) // already expired
                : faker.date.soon({ days: 300 });

        const userMembership = await prisma.userMembership.create({
            data: {
                user_id: user.id,
                membership_id: membership.product_id,
                expires_at: expiresAt,
            },
        });
        userMemberships.push(userMembership);
    }
    return userMemberships;
};

// ---------------------------------------------------------------------------
// Seed: event participants + reserves
// ---------------------------------------------------------------------------

const seedEventParticipants = async (
    users: Prisma.UserGetPayload<true>[],
    eventTickets: {
        product: Prisma.ProductGetPayload<true>;
        ticket: Prisma.TicketGetPayload<true>;
    }[],
): Promise<Prisma.EventParticipantGetPayload<true>[]> => {
    const participants: Prisma.EventParticipantGetPayload<true>[] = [];
    const picks = faker.helpers.arrayElements(eventTickets, Math.min(10, eventTickets.length));
    for (const { ticket } of picks) {
        const user = faker.helpers.arrayElement(users);
        const participant = await prisma.eventParticipant.create({
            data: {
                user_id: user.id,
                ticket_id: ticket.product_id,
                checked_in_at: faker.datatype.boolean() ? faker.date.recent({ days: 30 }) : null,
            },
        });
        participants.push(participant);
    }
    return participants;
};

const seedEventReserves = async (
    users: Prisma.UserGetPayload<true>[],
    events: Prisma.EventGetPayload<true>[],
): Promise<Prisma.EventReserveGetPayload<true>[]> => {
    const reserves: Prisma.EventReserveGetPayload<true>[] = [];
    const reserveEvents = faker.helpers.arrayElements(events, 5);
    for (const event of reserveEvents) {
        const user = faker.helpers.arrayElement(users);
        const reserve = await prisma.eventReserve.create({
            data: {
                user_id: user.id,
                event_id: event.id,
            },
        });
        reserves.push(reserve);
    }
    return reserves;
};

// ---------------------------------------------------------------------------
// Seed: tasks (+ task skill badges) and user skill badges
// ---------------------------------------------------------------------------

const TASK_NAME_POOL = [
    "Set up chairs and tables",
    "Run the welcome desk",
    "Coordinate parking",
    "Operate sound system",
    "Bar service",
    "Kitchen prep",
    "Clean up after event",
    "Photography",
    "First aid coverage",
    "Ticket scanning at entrance",
];

const seedTasks = async (
    events: Prisma.EventGetPayload<true>[],
    users: Prisma.UserGetPayload<true>[],
): Promise<Prisma.TaskGetPayload<true>[]> => {
    const taskStatuses = Object.values(TaskStatus);
    const tasks: Prisma.TaskGetPayload<true>[] = [];

    // ~20 tasks distributed across events (2-3 per event).
    for (const event of events) {
        const tasksForEvent = faker.number.int({ min: 2, max: 3 });
        for (let i = 0; i < tasksForEvent; i++) {
            const hasAssignee = faker.datatype.boolean();
            const task = await prisma.task.create({
                data: {
                    name: faker.helpers.arrayElement(TASK_NAME_POOL),
                    description: faker.lorem.sentence(),
                    status: faker.helpers.arrayElement(taskStatuses),
                    start_time: event.start_time,
                    end_time: event.end_time,
                    tags: faker.helpers.arrayElements(EVENT_TAG_POOL, { min: 0, max: 2 }),
                    event_id: event.id,
                    assignee_id: hasAssignee ? faker.helpers.arrayElement(users).id : null,
                    reviewer_id: faker.datatype.boolean()
                        ? faker.helpers.arrayElement(users).id
                        : null,
                },
            });
            tasks.push(task);
        }
    }
    return tasks;
};

const seedUserSkillBadges = async (
    users: Prisma.UserGetPayload<true>[],
    skillBadges: Prisma.SkillBadgeGetPayload<true>[],
): Promise<void> => {
    const assignments = faker.helpers.arrayElements(users, 10);
    const seen = new Set<string>();
    for (const user of assignments) {
        const badge = faker.helpers.arrayElement(skillBadges);
        const key = `${user.id}:${badge.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await prisma.userSkillBadge.create({
            data: { user_id: user.id, skill_badge_id: badge.id },
        });
    }
};

const seedTaskSkillBadges = async (
    tasks: Prisma.TaskGetPayload<true>[],
    skillBadges: Prisma.SkillBadgeGetPayload<true>[],
): Promise<void> => {
    const assignments = faker.helpers.arrayElements(tasks, Math.min(15, tasks.length));
    const seen = new Set<string>();
    for (const task of assignments) {
        const badge = faker.helpers.arrayElement(skillBadges);
        const key = `${task.id}:${badge.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await prisma.taskSkillBadge.create({
            data: { task_id: task.id, skill_badge_id: badge.id },
        });
    }
};

// ---------------------------------------------------------------------------
// Seed: orders + order items
// ---------------------------------------------------------------------------

const seedOrders = async (
    users: Prisma.UserGetPayload<true>[],
    allProducts: Prisma.ProductGetPayload<true>[],
): Promise<void> => {
    const orderStatuses = Object.values(OrderStatus);

    for (let i = 0; i < 10; i++) {
        const user = faker.helpers.arrayElement(users);
        const items = faker.helpers.arrayElements(
            allProducts,
            faker.number.int({ min: 1, max: 3 }),
        );

        const order = await prisma.order.create({
            data: {
                user_id: user.id,
                status: faker.helpers.arrayElement(orderStatuses),
            },
        });

        let totalAmount = 0;
        let totalVatAmount = 0;
        for (const product of items) {
            const quantity = faker.number.int({ min: 1, max: 2 });
            const vatAmount =
                Math.round(product.price * (product.vat_percentage / 100) * 100) / 100;
            await prisma.orderItem.create({
                data: {
                    order_id: order.id,
                    product_id: product.id,
                    quantity,
                    price: product.price,
                    vat_amount: vatAmount,
                },
            });
            totalAmount += quantity * product.price;
            totalVatAmount += quantity * vatAmount;
        }

        await prisma.order.update({
            where: { id: order.id },
            data: { total_amount: totalAmount, total_vat_amount: totalVatAmount },
        });
    }
};

// ---------------------------------------------------------------------------
// Seed: info pages + translated text content
// ---------------------------------------------------------------------------

const seedContent = async (): Promise<void> => {
    const pages = [
        {
            role: UserRole.member,
            titleSwedish: "Om oss",
            titleEnglish: "About us",
            bodySwedish: faker.lorem.paragraphs(2, "\n\n"),
            bodyEnglish: faker.lorem.paragraphs(2, "\n\n"),
        },
        {
            role: UserRole.member,
            titleSwedish: "Bli volontär",
            titleEnglish: "Become a volunteer",
            bodySwedish: faker.lorem.paragraphs(2, "\n\n"),
            bodyEnglish: faker.lorem.paragraphs(2, "\n\n"),
        },
    ];

    for (const page of pages) {
        await prisma.infoPage.create({
            data: {
                lowest_allowed_user_role: page.role,
                titleText: {
                    create: {
                        category: "organization",
                        translations: {
                            create: [
                                { language: Language.swedish, text: page.titleSwedish },
                                { language: Language.english, text: page.titleEnglish },
                            ],
                        },
                    },
                },
                content: {
                    create: {
                        category: "organization",
                        translations: {
                            create: [
                                { language: Language.swedish, text: page.bodySwedish },
                                { language: Language.english, text: page.bodyEnglish },
                            ],
                        },
                    },
                },
            },
        });
    }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
    console.log(`Wiping database at ${getDbHostForLogging()}...`);
    await truncateAll();

    const orgSettings = await seedOrganizationSettings(ADMIN_EMAIL);
    const { adminUser, users } = await seedUsers();
    const allUsers = [adminUser, ...users];

    const locations = await seedLocations();
    const skillBadges = await seedSkillBadges();
    const events = await seedEvents(locations, allUsers);

    const membershipProducts = await seedMembershipProducts();
    const eventTickets = await seedEventTickets(events);
    const allProducts = [
        ...membershipProducts.map((m) => m.product),
        ...eventTickets.map((t) => t.product),
    ];

    const adminMembership = await seedAdminMembership(adminUser, membershipProducts);
    const userMemberships = [
        adminMembership,
        ...(await seedUserMemberships(users, membershipProducts)),
    ];
    const eventParticipants = await seedEventParticipants(allUsers, eventTickets);
    const eventReserves = await seedEventReserves(allUsers, events);

    const tasks = await seedTasks(events, allUsers);
    await seedUserSkillBadges(allUsers, skillBadges);
    await seedTaskSkillBadges(tasks, skillBadges);

    await seedOrders(allUsers, allProducts);
    await seedContent();

    console.log(
        [
            "Seed complete:",
            `  organizationSettings: ${orgSettings ? 1 : 0}`,
            `  users: ${allUsers.length} (1 fixed admin + ${users.length} faker-generated)`,
            `  locations: ${locations.length}`,
            `  skillBadges: ${skillBadges.length}`,
            `  events: ${events.length}`,
            `  products: ${allProducts.length} (${membershipProducts.length} membership + ${eventTickets.length} ticket)`,
            `  memberships: ${membershipProducts.length}`,
            `  tickets: ${eventTickets.length}`,
            `  userMemberships: ${userMemberships.length}`,
            `  eventParticipants: ${eventParticipants.length}`,
            `  eventReserves: ${eventReserves.length}`,
            `  tasks: ${tasks.length}`,
            "  infoPages: 2 (with title/content TextContent + swedish/english TextTranslations)",
        ].join("\n"),
    );
};

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
