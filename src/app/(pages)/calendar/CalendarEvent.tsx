"use client";

import { Card, Tooltip, useTheme } from "@mui/material";
import { FC } from "react";
import { useUserContext } from "../../context/UserContext";
import { usePathname } from "next/navigation";
import GlobalConstants from "../../GlobalConstants";
import { formatDate, navigateToRoute } from "../../ui/utils";
import { useRouter } from "next/navigation";

export interface ICalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
}

export interface CalendarEventProps {
    event: ICalendarEvent;
}

const CalendarEvent: FC<CalendarEventProps> = ({ event }) => {
    const { user } = useUserContext();
    const theme = useTheme();
    const pathname = usePathname();
    const router = useRouter();

    const goToEventPage = () =>
        navigateToRoute(
            `${pathname}/${GlobalConstants.EVENT}?${GlobalConstants.EVENT_ID}=${event[GlobalConstants.ID]}`,
            router,
        );
    return (
        <Tooltip
            title={`${formatDate(event[GlobalConstants.START_TIME])} - ${formatDate(event[GlobalConstants.END_TIME])}`}
        >
            <Card
                elevation={0}
                sx={{
                    backgroundColor:
                        event[GlobalConstants.STATUS] === GlobalConstants.DRAFT
                            ? theme.palette.primary.light
                            : event[GlobalConstants.STATUS] === GlobalConstants.PUBLISHED
                              ? theme.palette.primary.dark
                              : theme.palette.error.dark,
                    ...(user && { cursor: "pointer" }),
                    textDecoration:
                        event[GlobalConstants.STATUS] === GlobalConstants.CANCELLED
                            ? "line-through"
                            : "none",
                    paddingLeft: 1,
                }}
                {...(user && {
                    onClick: goToEventPage,
                })}
            >
                {event[GlobalConstants.TITLE]}
            </Card>
        </Tooltip>
    );
};

export default CalendarEvent;
