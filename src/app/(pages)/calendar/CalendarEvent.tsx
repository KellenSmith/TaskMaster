"use client";

import { Card, Tooltip, useTheme } from "@mui/material";
import { FC } from "react";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { formatDate, navigateToRoute } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { EventStatus, Prisma } from "@prisma/client";

export interface CalendarEventProps {
    event: Prisma.EventGetPayload<true>;
}

const CalendarEvent: FC<CalendarEventProps> = ({ event }) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const router = useRouter();

    const goToEventPage = () =>
        navigateToRoute(router, [GlobalConstants.EVENT], { eventId: event.id });
    return (
        <Tooltip title={`${formatDate(event.startTime)} - ${formatDate(event.endTime)}`}>
            <Card
                elevation={0}
                sx={{
                    backgroundColor:
                        event.status === EventStatus.draft
                            ? theme.palette.primary.light
                            : event.status === EventStatus.published
                              ? theme.palette.primary.dark
                              : theme.palette.error.dark,
                    ...(user && { cursor: "pointer" }),
                    textDecoration:
                        event.status === EventStatus.cancelled ? "line-through" : "none",
                    paddingLeft: 1,
                }}
                {...(user && {
                    onClick: goToEventPage,
                })}
            >
                {event.title}
            </Card>
        </Tooltip>
    );
};

export default CalendarEvent;
