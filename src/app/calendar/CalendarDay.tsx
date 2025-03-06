"use client";

import { FC } from "react";
import { Paper, Stack, Typography } from "@mui/material";
import CalendarEvent, { ICalendarEvent } from "./CalendarEvent";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import GlobalConstants from "../GlobalConstants";
import { isUserAdmin, isUserHost } from "../lib/definitions";
import { useUserContext } from "../context/UserContext";

dayjs.extend(isBetween);

interface CalendarDayProps {
    date: dayjs.Dayjs;
    events: ICalendarEvent[];
}

const CalendarDay: FC<CalendarDayProps> = ({ date, events }) => {
    const { user } = useUserContext();

    const shouldSHowEvent = (event: any) => {
        const eventInDay = date.isBetween(
            dayjs(event[GlobalConstants.START_TIME]),
            dayjs(event[GlobalConstants.END_TIME]),
            "day",
            "[]",
        );
        if (!eventInDay) return false;
        return isUserAdmin(user) || isUserHost(user, event);
    };

    const getEmptyDay = () => <Paper key={`empty-end-${date.date()}`} elevation={0} />;

    const getDayComp = () => {
        const eventsForDay = events.filter((event: ICalendarEvent) => shouldSHowEvent(event));
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
