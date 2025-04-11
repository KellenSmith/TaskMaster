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

    const goToEventPage = () => navigateToRoute(`${pathname}/${event[GlobalConstants.ID]}`, router);
    return (
        <Tooltip title={`${formatDate(event.startTime)} - ${formatDate(event.endTime)}`}>
            <Card
                elevation={0}
                sx={{
                    backgroundColor:
                        event[GlobalConstants.STATUS] === GlobalConstants.DRAFT
                            ? theme.palette.primary.light
                            : theme.palette.primary.dark,
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
