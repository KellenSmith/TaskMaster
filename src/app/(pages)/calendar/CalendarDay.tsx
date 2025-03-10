"use client";

import { FC } from "react";
import { Paper, Stack, Typography } from "@mui/material";
import CalendarEvent, { ICalendarEvent } from "./CalendarEvent";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import GlobalConstants from "../../GlobalConstants";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";

dayjs.extend(isBetween);

interface CalendarDayProps {
    date: dayjs.Dayjs;
    events: ICalendarEvent[];
}

const CalendarDay: FC<CalendarDayProps> = ({ date, events }) => {
    const { user } = useUserContext();

    const shouldShowEvent = (event: any) => {
        const startTime = dayjs(event[GlobalConstants.START_TIME]);
        let endTime = dayjs(event[GlobalConstants.END_TIME]);

        // Count events ending before 04:00 as belonging to the day before
        if (0 <= endTime.hour() && endTime.hour() <= 4)
            endTime = endTime.subtract(1, "day").hour(23).minute(59);

        const eventInDay = date.isBetween(startTime, endTime, "day", "[]");
        if (!eventInDay) return false;
        return (
            event[GlobalConstants.STATUS] === GlobalConstants.PUBLISHED ||
            isUserAdmin(user) ||
            isUserHost(user, event)
        );
    };

    const getEmptyDay = () => <Paper key={`empty-end-${date.date()}`} elevation={0} />;

    const getDayComp = () => {
        const eventsForDay = events.filter((event: ICalendarEvent) => shouldShowEvent(event));
        if (eventsForDay.length < 1) return getEmptyDay();
        return (
            <Stack
                spacing={0.5}
                sx={{
                    overflow: "auto",
                    flex: 1,
                }}
            >
                {eventsForDay
                    .sort((a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix())
                    .map((event) => (
                        <CalendarEvent key={event.id} event={event} />
                    ))}
            </Stack>
        );
    };

    return (
        <Paper>
            <Stack spacing={1}>
                <Typography variant="subtitle2">{date.format("D")}</Typography>
                {getDayComp()}
            </Stack>
        </Paper>
    );
};

export default CalendarDay;
