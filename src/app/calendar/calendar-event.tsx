"use client";

import { Card, Tooltip } from "@mui/material";
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
    const pathname = usePathname();

    const goToEventPage = () => redirect(`${pathname}/${event[GlobalConstants.ID]}`);
    return (
        <Tooltip
            title={`${dayjs(event.startTime).format("L HH:mm")} - ${dayjs(event.endTime).format("L HH:mm")}`}
        >
            <Card
                elevation={0}
                {...(user && {
                    onClick: goToEventPage,
                    sx: {
                        cursor: "pointer",
                    },
                })}
            >
                {event.title}
            </Card>
        </Tooltip>
    );
};

export default CalendarEvent;
