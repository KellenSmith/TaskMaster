"use client";

import { Card, Tooltip, useTheme } from "@mui/material";
import dayjs from "dayjs";
import { FC } from "react";
import { useUserContext } from "../context/UserContext";
import { usePathname, redirect } from "next/navigation";
import GlobalConstants from "../GlobalConstants";

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

    const goToEventPage = () => redirect(`${pathname}/${event[GlobalConstants.ID]}`);
    return (
        <Tooltip
            title={`${dayjs(event.startTime).format("L HH:mm")} - ${dayjs(event.endTime).format("L HH:mm")}`}
        >
            <Card
                elevation={0}
                sx={{
                    backgroundColor: theme.palette.primary.dark,
                    ...(user && { cursor: "pointer" }),
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
