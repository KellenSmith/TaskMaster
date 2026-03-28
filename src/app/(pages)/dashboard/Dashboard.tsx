"use client";

import { use } from "react";
import { Prisma } from "../../../prisma/generated/browser";
import { useUserContext } from "../../context/UserContext";
import { Card, CardHeader, CardMedia, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { clientRedirect, getRelativeUrl } from "../../lib/utils";
import Link from "next/link";
import GlobalConstants from "../../GlobalConstants";
import LanguageTranslations from "./LanguageTranslations";
import { formatDate } from "../../ui/utils";
import { useRouter } from "next/navigation";

interface DashboardProps {
    ticketInfoPromise: Promise<
        Prisma.EventParticipantGetPayload<{
            include: {
                ticket: {
                    include: {
                        event: {
                            select: {
                                id: true;
                                title: true;
                                start_time: true;
                                end_time: true;
                                location: { select: { name: true } };
                            };
                        };
                    };
                    user: { select: { id: true; nickname: true } };
                };
            };
        }>[]
    >;
}

const Dashboard: React.FC<DashboardProps> = ({ ticketInfoPromise }) => {
    const { user, language } = useUserContext();
    const router = useRouter();
    const ticketInfo = use(ticketInfoPromise);

    return (
        <Stack width="100%" spacing={4}>
            <Typography variant="h4">{`${LanguageTranslations.welcomeBack[language]}, ${user!.nickname}!`}</Typography>
            <Stack width="100%" spacing={2}>
                <Typography variant="h5">
                    {LanguageTranslations.upcomingEventTickets[language]}
                </Typography>
                {ticketInfo.length > 0 ? (
                    ticketInfo.map((eventParticipant) => (
                        <Card
                            key={eventParticipant.id}
                            sx={{ width: "fit-content", padding: 2, cursor: "pointer" }}
                            onClick={() =>
                                clientRedirect(router, [GlobalConstants.CALENDAR_POST], {
                                    [GlobalConstants.EVENT_ID]: eventParticipant.ticket.event.id,
                                })
                            }
                        >
                            <CardHeader title={eventParticipant.ticket.event.title} />
                            <Typography variant="body2">
                                {eventParticipant.ticket.event.location?.name ||
                                    LanguageTranslations.noLocation[language]}
                            </Typography>
                            <Typography
                                sx={{ paddingBottom: 2 }}
                                variant="body2"
                            >{`${formatDate(eventParticipant.ticket.event.start_time)} - ${formatDate(eventParticipant.ticket.event.end_time)}`}</Typography>
                            <CardMedia sx={{ display: "flex", justifyContent: "center" }}>
                                <Image
                                    src={getRelativeUrl([
                                        "api",
                                        "ticket-qrcode",
                                        eventParticipant.id,
                                    ])}
                                    alt={`${LanguageTranslations.qrImageAlt[language]} ${eventParticipant.id}`}
                                    width={100}
                                    height={100}
                                />
                            </CardMedia>
                        </Card>
                    ))
                ) : (
                    <Link href={getRelativeUrl([GlobalConstants.CALENDAR])}>
                        {LanguageTranslations.checkCalendarForEvents[language]}
                    </Link>
                )}
            </Stack>
        </Stack>
    );
};

export default Dashboard;
