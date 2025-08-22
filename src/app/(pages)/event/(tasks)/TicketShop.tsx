"use client";
import { use, useState } from "react";
import { Stack, Typography, useTheme, Button, Dialog } from "@mui/material";
import { Prisma, TicketType } from "@prisma/client";
import { useUserContext } from "../../../context/UserContext";
import { createOrder } from "../../../lib/order-actions";
import { createEventTicket } from "../../../lib/ticket-actions";
import { isUserHost } from "../../../lib/definitions";
import { isUserParticipant } from "../event-utils";
import ProductCard from "../../../ui/shop/Product";
import Form from "../../../ui/form/Form";
import GlobalConstants from "../../../GlobalConstants";
import z from "zod";
import { TicketCreateSchema } from "../../../lib/zod-schemas";
import { allowRedirectException } from "../../../ui/utils";
import { useNotificationContext } from "../../../context/NotificationContext";

interface TicketShopProps {
    event: Prisma.EventGetPayload<{ include: { host: { select: { id: true } } } }>;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { product: true };
        }>[]
    >;
    eventTasksPromise: Promise<
        Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }>[]
    >;
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { user: { select: { id: true } } };
    }>[];
    goToOrganizeTab: () => void;
}

const TicketShop = ({
    event,
    eventTicketsPromise,
    eventTasksPromise,
    eventParticipants,
    goToOrganizeTab,
}: TicketShopProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const tickets = use(eventTicketsPromise);
    const tasks = use(eventTasksPromise);
    const [dialogOpen, setDialogOpen] = useState(false);

    const createTicketOrder = async (productId: string) => {
        const ticketOrderItems: Prisma.OrderItemCreateManyOrderInput = {
            productId: productId,
            quantity: 1,
        };
        try {
            await createOrder([ticketOrderItems]);
        } catch (error) {
            allowRedirectException(error);
            addNotification("Failed to create ticket order", "error");
        }
    };

    const handleCreateTicket = async (parsedFieldValues: z.infer<typeof TicketCreateSchema>) => {
        await createEventTicket(event.id, parsedFieldValues);
        setDialogOpen(false);
        return "Created ticket";
    };

    const isVolunteerTicketAvailable = () => {
        const tasksAssignedToUser = tasks.filter((task) => task.assigneeId === user.id);
        return tasksAssignedToUser.length > 0;
    };

    if (!isUserHost(user, event) && isUserParticipant(user, eventParticipants))
        return (
            <Typography color="primary">You have a ticket to this event. See you there!</Typography>
        );

    return (
        <Stack spacing={2} sx={{ padding: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color={theme.palette.primary.main}>
                    Tickets
                </Typography>
                {isUserHost(user, event) && (
                    <Button variant="contained" onClick={() => setDialogOpen(true)} size="small">
                        add ticket
                    </Button>
                )}
            </Stack>

            {tickets.length === 0 ? (
                <Typography color="primary">Sorry, no tickets available for this event.</Typography>
            ) : (
                <Stack direction="row" flexWrap="wrap" gap={2}>
                    {tickets.map((ticket) => (
                        <ProductCard
                            key={ticket.id}
                            product={ticket.product}
                            onAddToCart={createTicketOrder}
                            {...(ticket.type === TicketType.volunteer && {
                                isAvailable: isVolunteerTicketAvailable(),
                                makeAvailableText:
                                    "Unlock the volunteer ticket by helping organize the event",
                                onClick: goToOrganizeTab,
                            })}
                        />
                    ))}
                </Stack>
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <Form
                    name={GlobalConstants.TICKET}
                    action={handleCreateTicket}
                    buttonLabel="Create Ticket"
                    readOnly={false}
                    editable={false}
                />
                <Button onClick={() => setDialogOpen(false)} sx={{ m: 2 }}>
                    Cancel
                </Button>
            </Dialog>
        </Stack>
    );
};

export default TicketShop;
