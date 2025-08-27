"use client";

import { FC, use } from "react";
import { Paper, Stack, Typography } from "@mui/material";
import CalendarEvent from "./CalendarEvent";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";

dayjs.extend(isBetween);

interface CalendarDayProps {
    date: dayjs.Dayjs;
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
}

const CalendarDay: FC<CalendarDayProps> = ({ date, eventsPromise }) => {
    const events = use(eventsPromise);

    const shouldShowEvent = (event: any) => {
        let startTime = dayjs(event[GlobalConstants.START_TIME]);
        let endTime = dayjs(event[GlobalConstants.END_TIME]);

        // Count events ending before 04:00 as belonging to the day before
        if (0 <= endTime.hour() && endTime.hour() <= 4) {
            const newEndTime = endTime.subtract(1, "day").hour(23).minute(59);
            if (newEndTime.isAfter(startTime)) endTime = newEndTime;
        }

        const eventInDay = date.isBetween(startTime, endTime, "day", "[]");
        if (!eventInDay) return false;
        return true;
    };

    const getEmptyDay = () => <Paper key={`empty-end-${date.date()}`} elevation={0} />;

    const getDayComp = () => {
        const eventsForDay = events.filter((event) => shouldShowEvent(event));
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
        <Paper sx={{ height: "100%" }}>
            <Stack spacing={1}>
                <Typography padding={1} variant="subtitle2">
                    {date.format("D")}
                </Typography>
                {getDayComp()}
            </Stack>
        </Paper>
    );
};

export default CalendarDay;
