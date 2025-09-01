"use client";

import { Card, Tooltip, useTheme, Typography } from "@mui/material";
import { FC } from "react";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { EventStatus, Prisma } from "@prisma/client";
import { clientRedirect } from "../../lib/definitions";

export interface CalendarEventProps {
    event: Prisma.EventGetPayload<true>;
}

const CalendarEvent: FC<CalendarEventProps> = ({ event }) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const router = useRouter();

    const goToEventPage = () =>
        clientRedirect(router, [GlobalConstants.EVENT], { [GlobalConstants.EVENT_ID]: event.id });

    // TODO: mark green if participating
    const content = (
        <Card
            elevation={0}
            sx={{
                backgroundColor:
                    event.status === EventStatus.draft
                        ? theme.palette.warning.light
                        : event.status === EventStatus.published
                          ? theme.palette.primary.dark
                          : theme.palette.error.dark,
                ...(user && { cursor: "pointer" }),
                textDecoration: event.status === EventStatus.cancelled ? "line-through" : "none",
                paddingLeft: 1,
                paddingY: 0.75,
                paddingRight: 1,
                display: "block",
            }}
            {...(user && {
                onClick: goToEventPage,
            })}
        >
            <Typography noWrap variant="body2" sx={{ color: "common.white" }}>
                {event.title}
            </Typography>
        </Card>
    );

    // Hide Tooltip on small screens to avoid interfering with touch; Tooltip provides extra info on desktop
    const isSmallScreen = /Mobi|Android|iPhone|iPad|iPod/.test(
        typeof navigator !== "undefined" ? navigator.userAgent : "",
    );
    return isSmallScreen ? (
        content
    ) : (
        <Tooltip title={`${formatDate(event.start_time)} - ${formatDate(event.end_time)}`}>
            {content}
        </Tooltip>
    );
};

export default CalendarEvent;
