import fs from "fs";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { parse } from "csv-parse";

const prisma = new PrismaClient();

function bool(v?: string) {
    if (v === undefined || v === null) return undefined;
    return String(v).toLowerCase() === "true";
}

async function streamCsvObjects(csvPath: string) {
    const full = path.resolve(csvPath);
    const stream = fs.createReadStream(full);
    const parser = stream.pipe(
        // csv-parse exposes named `parse`; when used as a stream it's a function
        // that returns a transform stream.
        parse({ columns: true, trim: true, skip_empty_lines: true }) as any,
    );
    const out: any[] = [];
    for await (const rec of parser as AsyncIterable<any>) out.push(rec);
    return out;
}

async function seedUsers() {
    const rows = await streamCsvObjects("prisma/seed-data/users.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            email: r.email,
            nickname: r.nickname || r.email?.split("@")[0],
            role: r.role || undefined,
            consent_to_newsletters: bool(r.consent_to_newsletters) ?? true,
            first_name: r.first_name || null,
            sur_name: r.sur_name || null,
            pronoun: r.pronoun || null,
            phone: r.phone || null,
            created_at: r.created_at ? new Date(r.created_at) : undefined,
        };

        await prisma.user.upsert({
            where: { email: payload.email },
            update: payload,
            create: payload,
        });
        console.log("Upserted user", payload.email);
    }
}

async function seedProducts() {
    const rows = await streamCsvObjects("prisma/seed-data/products.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            name: r.name,
            description: r.description || null,
            price: r.price ? Number(r.price) : 0,
            stock: r.stock ? Number(r.stock) : null,
            unlimited_stock: bool(r.unlimited_stock) ?? false,
            image_url: r.image_url || null,
        };

        await prisma.product.upsert({
            where: { id: payload.id },
            update: payload,
            create: payload,
        });
        console.log("Upserted product", payload.id);
    }
}

async function seedEvents() {
    const rows = await streamCsvObjects("prisma/seed-data/events.csv");
    for (const r of rows) {
        // Events CSV previously used a free-text `location` column.
        // Don't resolve the free-text value — instead pick any existing Location
        // and use its id as the event.locationId.
        let locationId: string | undefined = undefined;
        const anyLoc = await prisma.location.findFirst();
        if (anyLoc) locationId = anyLoc.id;

        const payload = {
            id: r.id,
            title: r.title || "",
            location: { connect: { id: locationId } },
            start_time: r.start_time ? new Date(r.start_time) : undefined,
            end_time: r.end_time ? new Date(r.end_time) : undefined,
            description: r.description || null,
            max_participants: r.max_participants ? Number(r.max_participants) : 0,
            status: r.status || undefined,
            host_id: r.host_id || undefined,
        } as Prisma.EventUpdateInput;

        await prisma.event.upsert({
            where: { id: payload.id as string },
            update: payload,
            create: payload as Prisma.EventCreateInput,
        });
        console.log("Upserted event", payload.id, "location_id:", locationId);
    }
}

async function seedLocations() {
    const rows = await streamCsvObjects("prisma/seed-data/locations.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            name: r.name,
            contact_person: r.contact_person || null,
            rental_cost: r.rental_cost ? Number(r.rental_cost) : 0,
            address: r.address || null,
            capacity: r.capacity ? Number(r.capacity) : 0,
            accessibility_info: r.accessibility_info || null,
            description: r.description || null,
        } as Prisma.LocationCreateInput;

        try {
            await prisma.location.create({ data: payload });
            console.log("Created location", payload.name);
        } catch (e) {
            console.warn("Skipping location (exists?)", payload.name);
        }
    }
}

async function seedTickets() {
    const rows = await streamCsvObjects("prisma/seed-data/tickets.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            type: r.type || undefined,
            product_id: r.product_id,
            event_id: r.event_id,
        };
        // productId is unique in schema for Ticket
        await prisma.ticket.upsert({
            where: { id: payload.id },
            update: payload,
            create: payload,
        });
        console.log("Upserted ticket", payload.id);
    }
}

async function seedTextContents() {
    const rows = await streamCsvObjects("prisma/seed-data/text_contents.csv");
    for (const r of rows) {
        // id + language is unique per schema; use createMany fallback if possible
        try {
            await prisma.textContent.create({
                data: {
                    id: r.id,
                    language: r.language,
                    content: r.content,
                    category: r.category || undefined,
                },
            });
            console.log("Created textContent", r.id, r.language);
        } catch (e) {
            console.warn("Skipping existing textContent", r.id, r.language);
        }
    }
}

async function seedUserCredentials() {
    const rows = await streamCsvObjects("prisma/seed-data/user_credentials.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            salt: r.salt,
            hashed_password: r.hashed_password,
            user_id: r.user_id,
        };
        try {
            await prisma.userCredentials.create({ data: payload });
            console.log("Created userCredentials", payload.id);
        } catch (e) {
            console.warn("Skipping userCredentials (exists?)", payload.id);
        }
    }
}

async function seedMemberships() {
    const rows = await streamCsvObjects("prisma/seed-data/memberships.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            product_id: r.product_id,
            duration: r.duration ? Number(r.duration) : 365,
        };
        try {
            await prisma.membership.create({ data: payload });
            console.log("Created membership", payload.id);
        } catch (e) {
            console.warn("Skipping membership", payload.id);
        }
    }
}

async function seedUserMemberships() {
    const rows = await streamCsvObjects("prisma/seed-data/user_memberships.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            user_id: r.user_id,
            membership_id: r.membership_id,
            expires_at: r.expires_at ? new Date(r.expires_at) : undefined,
        };
        try {
            // userId is unique in schema; upsert so existing records are updated
            await prisma.userMembership.upsert({
                where: { user_id: payload.user_id },
                update: payload,
                create: payload,
            });
            console.log("Upserted userMembership", payload.id);
        } catch (e) {
            console.warn("Skipping userMembership", payload.id, e?.message);
        }
    }
}

async function seedOrdersAndItems() {
    const orders = await streamCsvObjects("prisma/seed-data/orders.csv");
    for (const r of orders) {
        const payload = {
            id: r.id,
            status: r.status || undefined,
            total_amount: r.total_amount ? Number(r.total_amount) : 0,
            payment_request_id: r.payment_request_id || null,
            payee_ref: r.payee_ref || null,
            created_at: r.created_at ? new Date(r.created_at) : undefined,
            updated_at: r.updated_at ? new Date(r.updated_at) : undefined,
            user_id: r.user_id,
        };
        try {
            await prisma.order.create({ data: payload });
            console.log("Created order", payload.id);
        } catch (e) {
            console.warn("Skipping order (exists?)", payload.id);
        }
    }

    const items = await streamCsvObjects("prisma/seed-data/order_items.csv");
    for (const r of items) {
        const payload = {
            id: r.id,
            quantity: r.quantity ? Number(r.quantity) : 1,
            price: r.price ? Number(r.price) : 0,
            order_id: r.order_id,
            product_id: r.product_id,
        };
        try {
            await prisma.orderItem.create({ data: payload });
            console.log("Created orderItem", payload.id);
        } catch (e) {
            console.warn("Skipping orderItem (exists?)", payload.id);
        }
    }
}

async function seedEventParticipants() {
    const rows = await streamCsvObjects("prisma/seed-data/event_participants.csv");
    for (const r of rows) {
        try {
            await prisma.eventParticipant.create({
                data: { user_id: r.user_id, ticket_id: r.ticket_id },
            });
            console.log("Created eventParticipant", r.userId, r.ticketId);
        } catch (e) {
            console.warn("Skipping eventParticipant (exists?)", r.userId, r.ticketId);
        }
    }
}

async function seedEventReserves() {
    const rows = await streamCsvObjects("prisma/seed-data/event_reserves.csv");
    for (const r of rows) {
        const data = {
            user_id: r.user_id,
            event_id: r.event_id,
            queueing_since: r.queueing_since ? new Date(r.queueing_since) : undefined,
        };
        try {
            await prisma.eventReserve.create({ data });
            console.log("Created eventReserve", r.userId, r.eventId);
        } catch (e) {
            console.warn("Skipping eventReserve (exists?)", r.userId, r.eventId);
        }
    }
}

async function seedTasks() {
    const rows = await streamCsvObjects("prisma/seed-data/tasks.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            name: r.name || "",
            status: r.status || undefined,
            start_time: r.start_time ? new Date(r.start_time) : undefined,
            end_time: r.end_time ? new Date(r.end_time) : undefined,
            description: r.description || null,
            tags: r.tags ? JSON.parse(r.tags) : [],
            assignee_id: r.assignee_id || null,
            reviewer_id: r.reviewer_id || null,
            event_id: r.event_id || null,
        };
        try {
            await prisma.task.create({ data: payload });
            console.log("Created task", payload.id);
        } catch (e) {
            console.warn("Skipping task (exists?)", payload.id);
        }
    }
}

async function seedOrganizationSettings() {
    const rows = await streamCsvObjects("prisma/seed-data/organization_settings.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            organization_name: r.organization_name || undefined,
            organization_email: r.organization_email || undefined,
            remind_membership_expires_in_days: r.remind_membership_expires_in_days
                ? Number(r.remind_membership_expires_in_days)
                : undefined,
            purge_members_after_days_unvalidated: r.purge_members_after_days_unvalidated
                ? Number(r.purge_members_after_days_unvalidated)
                : undefined,
            member_application_prompt: r.member_application_prompt || null,
            default_task_shift_length: r.default_task_shift_length
                ? Number(r.default_task_shift_length)
                : undefined,
            ticket_instructions: r.ticket_instructions || null,
        };
        try {
            await prisma.organizationSettings.create({ data: payload });
            console.log("Created organizationSettings", payload.id);
        } catch (e) {
            console.warn("Skipping organizationSettings (exists?)", payload.id);
        }
    }
}

async function seedSkillBadges() {
    const rows = await streamCsvObjects("prisma/seed-data/skill_badges.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            name: r.name,
            description: r.description || null,
            image_url: r.image_url || null,
        } as Prisma.SkillBadgeCreateInput;
        try {
            await prisma.skillBadge.upsert({
                where: { id: payload.id },
                update: payload,
                create: payload,
            });
            console.log("Upserted skillBadge", payload.id);
        } catch (e) {
            console.warn("Skipping skillBadge (exists?)", payload.id);
        }
    }
}

async function seedUserSkillBadges() {
    const rows = await streamCsvObjects("prisma/seed-data/user_skill_badges.csv");
    for (const r of rows) {
        try {
            await prisma.userSkillBadge.create({
                data: { user_id: r.user_id, skill_badge_id: r.skill_badge_id },
            });
            console.log("Created userSkillBadge", r.userId, r.skillBadgeId);
        } catch (e) {
            console.warn("Skipping userSkillBadge (exists?)", r.userId, r.skillBadgeId);
        }
    }
}

async function seedTaskSkillBadges() {
    const rows = await streamCsvObjects("prisma/seed-data/task_skill_badges.csv");
    for (const r of rows) {
        try {
            await prisma.taskSkillBadge.create({
                data: { task_id: r.task_id, skill_badge_id: r.skill_badge_id },
            });
            console.log("Created taskSkillBadge", r.taskId, r.skillBadgeId);

            // Ensure the badge is also associated with the task's assignee
            const task = await prisma.task.findUnique({ where: { id: r.task_id } });
            const assigneeId = task?.assignee_id;
            if (assigneeId) {
                try {
                    // Upsert user badge (userId unique combined with skillBadgeId via composite PK)
                    await prisma.userSkillBadge.create({
                        data: { user_id: assigneeId, skill_badge_id: r.skill_badge_id },
                    });
                    console.log(
                        "Also created userSkillBadge for assignee",
                        assigneeId,
                        r.skill_badge_id,
                    );
                } catch (e) {
                    // ignore if already exists
                }
            }
        } catch (e) {
            console.warn("Skipping taskSkillBadge (exists?)", r.taskId, r.skillBadgeId);
        }
    }
}

async function main() {
    console.log("Starting seed");
    // order matters: seed parents before dependents
    await seedOrganizationSettings();
    await seedUsers();
    await seedUserCredentials();
    await seedProducts();
    await seedMemberships();
    await seedUserMemberships();
    await seedLocations();
    await seedEvents();
    await seedTickets();
    await seedEventParticipants();
    await seedEventReserves();
    await seedTasks();
    await seedSkillBadges();
    await seedUserSkillBadges();
    await seedTaskSkillBadges();
    await seedOrdersAndItems();
    await seedTextContents();
    console.log("Done seeding");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
