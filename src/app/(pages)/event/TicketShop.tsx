"use client";
import { use, useState } from "react";
import { Stack, Typography, useTheme, Button, Dialog } from "@mui/material";
import { Prisma, TicketType } from "@prisma/client";
import { useUserContext } from "../../context/UserContext";
import { createOrder } from "../../lib/order-actions";
import { createEventTicket, deleteEventTicket, updateEventTicket } from "../../lib/ticket-actions";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { isUserVolunteer } from "./event-utils";
import ProductCard from "../../ui/shop/ProductCard";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import z from "zod";
import { TicketCreateSchema, TicketUpdateSchema } from "../../lib/zod-schemas";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import ConfirmButton from "../../ui/ConfirmButton";

interface TicketShopProps {
    eventPromise: Promise<Prisma.EventGetPayload<true>>;
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
    goToOrganizeTab: () => void;
}

const TicketShop = ({
    eventPromise,
    eventTicketsPromise,
    eventTasksPromise,
    goToOrganizeTab,
}: TicketShopProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const event = use(eventPromise);
    const tickets = use(eventTicketsPromise);
    const tasks = use(eventTasksPromise);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

    const createTicketOrder = async (productId: string) => {
        const ticketOrderItems: Prisma.OrderItemCreateManyOrderInput = {
            productId: productId,
            quantity: 1,
        };
        try {
            await createOrder(user.id, [ticketOrderItems]);
        } catch (error) {
            allowRedirectException(error);
            addNotification("Failed to create ticket order", "error");
        }
    };

    const createTicketAction = async (parsedFieldValues: z.infer<typeof TicketCreateSchema>) => {
        await createEventTicket(event.id, parsedFieldValues);
        setDialogOpen(false);
        return "Created ticket";
    };

    const updateTicketAction = async (parsedFieldValues: z.infer<typeof TicketUpdateSchema>) => {
        await updateEventTicket(editingTicketId, parsedFieldValues);
        setDialogOpen(false);
        setEditingTicketId(null);
        return "Updated ticket";
    };

    const allowDeleteTicket = (ticket: Prisma.TicketGetPayload<true>) => {
        // There must always be at least one volunteer ticket
        if (ticket.type === TicketType.volunteer)
            return tickets.filter((ticket) => ticket.type === TicketType.volunteer).length >= 2;
        return true;
    };

    const deleteTicketAction = async (ticketId: string) => {
        try {
            await deleteEventTicket(ticketId);
            addNotification("Deleted ticket", "success");
        } catch {
            addNotification("Failed to delete ticket", "error");
        }
    };

    const isVolunteerTicketAvailable = () => {
        const tasksAssignedToUser = tasks.filter((task) => task.assigneeId === user.id);
        return tasksAssignedToUser.length > 0;
    };

    const handleEditTicket = (ticketId: string) => {
        setEditingTicketId(ticketId);
        setDialogOpen(true);
    };

    const getFormDefaultValues = () => {
        if (!editingTicketId) return null;
        const ticket = tickets.find((t) => t.id === editingTicketId);
        if (!ticket) return null;
        return { ...ticket, ...ticket.product };
    };

    const getSortedTickets = () => {
        return tickets.sort((ticket1, ticket2) => {
            // First sort by ticket type order (by enum index)
            if (ticket1.type !== ticket2.type) {
                const typeOrder = Object.values(TicketType);
                const index1 = typeOrder.indexOf(ticket1.type);
                const index2 = typeOrder.indexOf(ticket2.type);
                return index1 - index2;
            }
            // Then sort by price (ascending) within each type group
            return ticket1.product.price - ticket2.product.price;
        });
    };

    return (
        <Stack spacing={2} sx={{ padding: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color={theme.palette.primary.main}>
                    Tickets
                </Typography>
                {(isUserHost(user, event) || isUserAdmin(user)) && (
                    <Button variant="contained" onClick={() => setDialogOpen(true)} size="small">
                        add ticket
                    </Button>
                )}
            </Stack>

            {tickets.length === 0 ? (
                <Typography color="primary">Sorry, no tickets available for this event.</Typography>
            ) : (
                <Stack direction="row" flexWrap="wrap" gap={2}>
                    {getSortedTickets().map((ticket) => (
                        <Stack key={ticket.id}>
                            <ProductCard
                                key={ticket.id}
                                product={ticket.product}
                                onAddToCart={createTicketOrder}
                                {...(ticket.type === TicketType.volunteer && {
                                    isAvailable: isVolunteerTicketAvailable(),
                                    makeAvailableText:
                                        "Unlock the volunteer ticket by helping organize the event",
                                    onClick: isUserVolunteer(user, tasks)
                                        ? undefined
                                        : goToOrganizeTab,
                                })}
                            />
                            {(isUserHost(user, event) || isUserAdmin(user)) && (
                                <Stack>
                                    <Button onClick={() => handleEditTicket(ticket.id)}>
                                        edit
                                    </Button>
                                    {allowDeleteTicket(ticket) && (
                                        <ConfirmButton
                                            color="error"
                                            onClick={() => deleteTicketAction(ticket.id)}
                                        >
                                            delete
                                        </ConfirmButton>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    ))}
                </Stack>
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
                <Form
                    name={GlobalConstants.TICKET}
                    action={editingTicketId ? updateTicketAction : createTicketAction}
                    defaultValues={getFormDefaultValues()}
                    buttonLabel="save"
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
