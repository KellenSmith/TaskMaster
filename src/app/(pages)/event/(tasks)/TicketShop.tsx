"use client";
import { use, useMemo, useState } from "react";
import GlobalConstants from "../../../../GlobalConstants";
import {
    Stack,
    Typography,
    useTheme,
    Card,
    CardContent,
    CardMedia,
    Box,
    Chip,
    Button,
    Dialog,
} from "@mui/material";
import ProductCard from "../../../../ui/shop/Product";
import { createOrder } from "../../../../lib/order-actions";
import { NextURL } from "next/dist/server/web/next-url";
import { useRouter } from "next/navigation";
import { Product, Prisma, TicketType } from "@prisma/client";
import { defaultFormActionState, isUserHost } from "../../../../lib/definitions";
import { createEventTicket } from "../../../../lib/event-actions";
import Image from "next/image";
import { useUserContext } from "../../../../context/UserContext";
import Form from "../../../../ui/form/Form";
import { isUserParticipant } from "../../../event/event-utils";

interface TicketShopProps {
    event: Prisma.EventGetPayload<{ include: { host: { select: { id: true } } } }>;
    eventTicketsPromise: Promise<
        Prisma.TicketGetPayload<{
            include: { Product: true };
        }>[]
    >;
    eventParticipants: Prisma.ParticipantInEventGetPayload<{
        include: { User: { select: { id: true } } };
    }>[];
    goToOrganizeTab: () => void;
}

const TicketShop = ({
    event,
    eventTicketsPromise,
    eventParticipants,
    goToOrganizeTab,
}: TicketShopProps) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const router = useRouter();
    const tickets = use(eventTicketsPromise);
    const [dialogOpen, setDialogOpen] = useState(false);

    const createTicketOrder = async (product: Product) => {
        const orderItems = {
            [product.id]: 1,
        };
        const createTicketOrderResult = await createOrder(defaultFormActionState, orderItems);
        if (createTicketOrderResult.status === 201) {
            const orderUrl = new NextURL(`/${GlobalConstants.ORDER}`, window.location.origin);
            orderUrl.searchParams.set(GlobalConstants.ORDER_ID, createTicketOrderResult.result);
            router.push(orderUrl.toString());
        }
    };

    const isVolunteerTicketAvailable = useMemo(() => {
        return tickets.find((ticket) => ticket.type === TicketType.volunteer);
    }, [tickets]);

    const handleCreateTicket = async (currentActionState, fieldValues) => {
        try {
            await createEventTicket(event.id, fieldValues);
            setDialogOpen(false);
            return { ...currentActionState, status: 200, result: "Ticket created successfully" };
        } catch (error) {
            return { ...currentActionState, status: 500, errorMsg: error.message };
        }
    };

    // Bare bones volunteer ticket card component
    const VolunteerTicketCard = () => {
        const defaultImage = "/images/product-placeholder.svg";

        return (
            <Card
                sx={{
                    maxWidth: 250,
                    width: "fit-content",
                    opacity: 0.7,
                    cursor: "pointer",
                    position: "relative",
                    "&::after": {
                        content: '"🔒"',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "3rem",
                        zIndex: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    },
                }}
                onClick={goToOrganizeTab}
            >
                <CardMedia>
                    <Image
                        src={defaultImage}
                        alt="Volunteer Ticket"
                        width={400}
                        height={400}
                        style={{
                            objectFit: "contain",
                            maxHeight: 250,
                            maxWidth: 250,
                            filter: "grayscale(100%)",
                        }}
                    />
                </CardMedia>
                <CardContent>
                    <Typography gutterBottom variant="h6" component="h2" color="text.secondary">
                        Volunteer Ticket
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sign up for volunteer shifts to unlock the volunteer ticket
                    </Typography>
                    <Box
                        sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Free
                        </Typography>
                        <Chip label="Locked" color="warning" size="small" />
                    </Box>
                </CardContent>
            </Card>
        );
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
                    {!isVolunteerTicketAvailable && <VolunteerTicketCard />}
                    {tickets.map((ticket) => (
                        <ProductCard
                            key={ticket.id}
                            product={ticket.Product}
                            onAddToCart={createTicketOrder}
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
