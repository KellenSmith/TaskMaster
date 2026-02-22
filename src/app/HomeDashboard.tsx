"use client";
import { Button, Card, CardHeader, CardMedia, Stack, Typography } from "@mui/material";
import React, { use } from "react";
import GlobalConstants from "./GlobalConstants";
import TextContent from "./ui/TextContent";
import { Prisma } from "@/prisma/generated/browser";
import LanguageTranslations from "./ui/LanguageTranslations";
import { useUserContext } from "./context/UserContext";
import { useRouter } from "next/navigation";
import { clientRedirect, getAbsoluteUrl, getRelativeUrl } from "./lib/utils";
import Image from "next/image";
import Link from "next/link";
import { TicketInfoType } from "./page";

interface LoggedOutHomeDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const LoggedOutHomeDashboard: React.FC<LoggedOutHomeDashboardProps> = ({ textContentPromise }) => {
    const { language } = useUserContext();
    const router = useRouter();
    return (
        <>
            <Button
                fullWidth
                variant="outlined"
                onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}
            >
                {LanguageTranslations.routeLabel[GlobalConstants.APPLY][language]}
            </Button>
            <TextContent id={"home"} textContentPromise={textContentPromise} />
        </>
    );
};

interface LoggedInHomeDashboardProps {
    ticketInfoPromise: TicketInfoType;
}

const LoggedInHomeDashboard: React.FC<LoggedInHomeDashboardProps> = ({ ticketInfoPromise }) => {
    const { user, language } = useUserContext();
    const ticketInfo = use(ticketInfoPromise);

    const getTicketCard = (eventParticipant: (typeof ticketInfo)[0]) => {
        return (
            <Card
                key={eventParticipant.ticket.event.title}
                sx={{ width: "fit-content", padding: 2 }}
            >
                <CardHeader title={eventParticipant.ticket.event.title} />
                <CardMedia sx={{ display: "flex", justifyContent: "center" }}>
                    <Image
                        src={getAbsoluteUrl(["api", "ticket-qrcode", eventParticipant.id])}
                        alt={`${LanguageTranslations.qrImageAlt[language]} ${eventParticipant.id}`}
                        width={100}
                        height={100}
                    />
                </CardMedia>
            </Card>
        );
    };

    if (ticketInfo.length) {
        return (
            <Stack width="100%" spacing={4}>
                <Typography variant="h4">{`${LanguageTranslations.welcomeBack[language]}, ${user!.nickname}!`}</Typography>
                <Stack width="100%" spacing={2}>
                    <Typography variant="h5">
                        {LanguageTranslations.upcomingEventTickets[language]}
                    </Typography>
                    {ticketInfo.map((ticket) => getTicketCard(ticket))}
                </Stack>
            </Stack>
        );
    } else {
        return (
            <Link href={getRelativeUrl([GlobalConstants.CALENDAR])}>
                {LanguageTranslations.checkCalendarForEvents[language]}
            </Link>
        );
    }
};

interface HomeDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
    ticketInfoPromise: TicketInfoType | null;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ textContentPromise, ticketInfoPromise }) => {
    const { user } = useUserContext();
    return (
        <Stack width="100%">
            <Stack
                spacing={4}
                sx={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {user && ticketInfoPromise ? (
                    <LoggedInHomeDashboard ticketInfoPromise={ticketInfoPromise} />
                ) : (
                    <LoggedOutHomeDashboard textContentPromise={textContentPromise} />
                )}
            </Stack>
        </Stack>
    );
};

export default HomeDashboard;
