import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
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
            consentToNewsletters: bool(r.consentToNewsletters) ?? true,
            firstName: r.firstName || null,
            surName: r.surName || null,
            pronoun: r.pronoun || null,
            phone: r.phone || null,
            createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
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
            unlimitedStock: bool(r.unlimitedStock) ?? false,
            imageUrl: r.imageUrl || null,
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
        const payload = {
            id: r.id,
            title: r.title || "",
            location: r.location || "",
            startTime: r.startTime ? new Date(r.startTime) : undefined,
            endTime: r.endTime ? new Date(r.endTime) : undefined,
            description: r.description || null,
            maxParticipants: r.maxParticipants ? Number(r.maxParticipants) : 0,
            status: r.status || undefined,
            hostId: r.hostId || undefined,
        };

        await prisma.event.upsert({
            where: { id: payload.id },
            update: payload,
            create: payload,
        });
        console.log("Upserted event", payload.id);
    }
}

async function seedTickets() {
    const rows = await streamCsvObjects("prisma/seed-data/tickets.csv");
    for (const r of rows) {
        const payload = {
            id: r.id,
            type: r.type || undefined,
            productId: r.productId,
            eventId: r.eventId,
        };
        // productId is unique in schema for Ticket
        await prisma.ticket.upsert({ where: { id: payload.id }, update: payload, create: payload });
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
            hashedPassword: r.hashedPassword,
            userId: r.userId,
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
            productId: r.productId,
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

async function seedOrdersAndItems() {
    const orders = await streamCsvObjects("prisma/seed-data/orders.csv");
    for (const r of orders) {
        const payload = {
            id: r.id,
            status: r.status || undefined,
            totalAmount: r.totalAmount ? Number(r.totalAmount) : 0,
            paymentRequestId: r.paymentRequestId || null,
            payeeRef: r.payeeRef || null,
            createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
            userId: r.userId,
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
            orderId: r.orderId,
            productId: r.productId,
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
                data: { userId: r.userId, ticketId: r.ticketId },
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
            userId: r.userId,
            eventId: r.eventId,
            queueingSince: r.queueingSince ? new Date(r.queueingSince) : undefined,
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
            phase: r.phase || undefined,
            name: r.name || "",
            status: r.status || undefined,
            startTime: r.startTime ? new Date(r.startTime) : undefined,
            endTime: r.endTime ? new Date(r.endTime) : undefined,
            description: r.description || null,
            tags: r.tags ? JSON.parse(r.tags) : [],
            assigneeId: r.assigneeId || null,
            reviewerId: r.reviewerId || null,
            eventId: r.eventId || null,
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
            organizationName: r.organizationName || undefined,
            organizationEmail: r.organizationEmail || undefined,
            remindMembershipExpiresInDays: r.remindMembershipExpiresInDays
                ? Number(r.remindMembershipExpiresInDays)
                : undefined,
            purgeMembersAfterDaysUnvalidated: r.purgeMembersAfterDaysUnvalidated
                ? Number(r.purgeMembersAfterDaysUnvalidated)
                : undefined,
            memberApplicationPrompt: r.memberApplicationPrompt || null,
            defaultTaskShiftLength: r.defaultTaskShiftLength
                ? Number(r.defaultTaskShiftLength)
                : undefined,
            ticketInstructions: r.ticketInstructions || null,
        };
        try {
            await prisma.organizationSettings.create({ data: payload });
            console.log("Created organizationSettings", payload.id);
        } catch (e) {
            console.warn("Skipping organizationSettings (exists?)", payload.id);
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
    await seedEvents();
    await seedTickets();
    await seedEventParticipants();
    await seedEventReserves();
    await seedTasks();
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
