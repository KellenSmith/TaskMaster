"use client";

import { Card, Tooltip, useTheme, Typography, Box, Chip } from "@mui/material";
import { FC } from "react";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { EventStatus, Prisma } from "@prisma/client";
import { clientRedirect } from "../../lib/utils";

export interface CalendarEventProps {
    event: Prisma.EventGetPayload<true>;
}

const CalendarEvent: FC<CalendarEventProps> = ({ event }) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const router = useRouter();

    const goToEventPage = () =>
        clientRedirect(router, [GlobalConstants.CALENDAR_POST], {
            [GlobalConstants.EVENT_ID]: event.id,
        });

    const getEventColor = () => {
        switch (event.status) {
            case EventStatus.draft:
                return theme.palette.warning.light;
            case EventStatus.pending_approval:
                return theme.palette.info.light;
            case EventStatus.published:
                return theme.palette.primary.dark;
            case EventStatus.cancelled:
                return theme.palette.error.dark;
            default:
                return theme.palette.grey[500];
        }
    };

    // TODO: mark green if participating
    const uniqueTags = [...new Set(event.tags || [])];

    // Detect small screen (used only for tag sizing and tooltip behavior)
    const isSmallScreen = /Mobi|Android|iPhone|iPad|iPod/.test(
        typeof navigator !== "undefined" ? navigator.userAgent : "",
    );

    const renderCompactTags = (isSmall: boolean) => {
        if (!uniqueTags || uniqueTags.length === 0) return null;
        const maxShown = 2;
        const shown = uniqueTags.slice(0, maxShown);
        const remaining = uniqueTags.length - shown.length;

        return (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", ml: 1 }}>
                {shown.map((t) => (
                    <Chip
                        key={t}
                        label={t}
                        size={isSmall ? "small" : "small"}
                        variant="filled"
                        sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            bgcolor: "rgba(255,255,255,0.12)",
                            color: "common.white",
                            px: 0.5,
                        }}
                    />
                ))}
                {remaining > 0 && (
                    <Chip
                        label={`+${remaining}`}
                        size={isSmall ? "small" : "small"}
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.6rem", px: 0.5 }}
                    />
                )}
            </Box>
        );
    };

    const content = (
        <Card
            elevation={0}
            sx={{
                backgroundColor: getEventColor(),
                ...(user && { cursor: "pointer" }),
                textDecoration: event.status === EventStatus.cancelled ? "line-through" : "none",
                paddingLeft: 1,
                paddingY: 0.5,
                paddingRight: 1,
                display: "block",
                width: "100%",
                mb: 0.5,
            }}
            {...(user && {
                onClick: goToEventPage,
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography noWrap variant="body2" sx={{ color: "common.white", mr: 1 }}>
                    {event.title}
                </Typography>
                {renderCompactTags(isSmallScreen)}
            </Box>
        </Card>
    );

    // Hide Tooltip on small screens to avoid interfering with touch; Tooltip provides extra info on desktop
    return isSmallScreen ? (
        content
    ) : (
        <Tooltip title={`${formatDate(event.start_time)} - ${formatDate(event.end_time)}`}>
            {content}
        </Tooltip>
    );
};

export default CalendarEvent;
