"use client";

import { FC, use } from "react";
import { Stack, Typography } from "@mui/material";
import { Prisma } from "@prisma/client";
import EventCard from "./EventCard";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";

interface EventsTabProps {
    eventsPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
                tickets: { include: { event_participants: true } };
                event_reserves: true;
            };
        }>[]
    >;
}

const EventsTab: FC<EventsTabProps> = ({ eventsPromise }) => {
    const { language } = useUserContext();
    const events = use(eventsPromise);

    const getSortedEvents = () => {
        return events.sort((a, b) => {
            if (a.start_time < b.start_time) return -1;
            if (a.start_time > b.start_time) return 1;
            if (a.end_time < b.end_time) return -1;
            if (a.end_time > b.end_time) return 1;
            return 0;
        });
    };

    return (
        <Stack spacing={2}>
            {events.length === 0 ? (
                <Typography
                    variant="h5"
                    color="textSecondary"
                    sx={{ padding: 10, textAlign: "center" }}
                >
                    {LanguageTranslations.noEvents[language]}
                </Typography>
            ) : (
                getSortedEvents().map((event) => <EventCard key={event.id} event={event} />)
            )}
        </Stack>
    );
};

export default EventsTab;
