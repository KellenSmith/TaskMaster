import { EventStatus, Prisma, TicketType } from "@prisma/client";
import { prisma } from "../../../../prisma/prisma-client";
import { sanitizeFormData } from "../../lib/html-sanitizer";
import { EventCreateSchema } from "../../lib/zod-schemas";
import GlobalConstants from "../../GlobalConstants";
import { isUserAdmin, serverRedirect } from "../../lib/utils";

export const createEvent = async (userId: string, formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = EventCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const { location_id, ...eventData } = sanitizedData;

    // Check that the location has capacity for the max_participants
    const location = await prisma.location.findUniqueOrThrow({
        where: { id: location_id },
    });

    if (location.capacity < validatedData.max_participants) {
        throw new Error("The location can't handle that many participants");
    }

    const createdEvent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create event with ticket
        const createdEvent = await tx.event.create({
            data: {
                ...eventData,
                host: {
                    connect: {
                        id: userId,
                    },
                },
                tickets: {
                    create: {
                        type: TicketType.volunteer,
                        product: {
                            create: {
                                name: `Volunteer ticket for ${validatedData.title}`,
                                description:
                                    "Admittance for one member signed up for at least one volunteer task",
                                // The event host is a participant
                                stock: validatedData.max_participants - 1,
                            },
                        },
                    },
                },
                ...(location_id && { location: { connect: { id: location_id } } }),
            },
            include: {
                tickets: true,
            },
        });

        // Create event participant
        const volunteerTicket = createdEvent.tickets[0]; // Since we just created one ticket
        await tx.eventParticipant.create({
            data: {
                user_id: userId,
                ticket_id: volunteerTicket.product_id,
            },
        });

        return createdEvent;
    });

    serverRedirect([GlobalConstants.CALENDAR_POST], {
        [GlobalConstants.EVENT_ID]: createdEvent.id,
    });
};

export const getAllEvents = async (userId: string): Promise<Prisma.EventGetPayload<true>[]> => {
    const loggedInUser = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true },
    });

    const filterParams = {} as Prisma.EventWhereInput;

    // Non-admins can only see their own event drafts and pending approval events or published events
    if (!isUserAdmin(loggedInUser)) {
        filterParams.OR = [
            {
                status: EventStatus.published,
            },
            { host_id: userId },
        ];
    }

    return await prisma.event.findMany({
        where: filterParams,
    });
};
