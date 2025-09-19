"use client";

import { FC, use, useMemo, useCallback } from "react";
import { Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CalendarEvent from "./CalendarEvent";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Prisma } from "@prisma/client";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

dayjs.extend(isBetween);

interface CalendarDayProps {
    date: dayjs.Dayjs;
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
}

const CalendarDay: FC<CalendarDayProps> = ({ date, eventsPromise }) => {
    const events = use(eventsPromise);
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const shouldShowEvent = useCallback(
        (event: Prisma.EventGetPayload<true>) => {
            const startTime = dayjs.utc(event.start_time);
            let endTime = dayjs.utc(event.end_time);

            // Count events ending before 04:00 as belonging to the day before
            if (0 <= endTime.hour() && endTime.hour() <= 4) {
                const newEndTime = endTime.subtract(1, "day").hour(23).minute(59);
                if (newEndTime.isAfter(startTime)) endTime = newEndTime;
            }

            const eventInDay = date.isBetween(startTime, endTime, "day", "[]");
            if (!eventInDay) return false;
            return true;
        },
        [date],
    );

    const eventsForDay = useMemo(
        () => events.filter((event) => shouldShowEvent(event)),
        [events, shouldShowEvent],
    );

    const getEmptyDay = () => <Paper key={`empty-end-${date.date()}`} elevation={0} />;

    if (eventsForDay.length < 1 && isSmallScreen) return null;

    const getDayComp = () => {
        if (eventsForDay.length < 1) return getEmptyDay();
        return (
            <Stack spacing={0.5}>
                {eventsForDay
                    .sort((a, b) => dayjs.utc(a.start_time).unix() - dayjs.utc(b.start_time).unix())
                    .map((event) => (
                        <CalendarEvent key={event.id} event={event} />
                    ))}
            </Stack>
        );
    };

    const getDayName = () => {
        const weekdayIndex = (date.day() + 6) % 7; // map Sunday=0..Saturday=6 to Monday-first index 0..6
        return LanguageTranslations.weekDaysShort[language][weekdayIndex] ?? "";
    };

    return (
        <Paper sx={{ width: "100%", minHeight: { xs: 80, sm: "auto" } }}>
            <Stack spacing={1}>
                <Stack direction="row" alignItems="center">
                    {/* Localized short weekday (Monday-first) */}
                    <Typography padding={1} variant="subtitle2">
                        {`${date.format("D")}`}
                    </Typography>
                    {isSmallScreen && (
                        <Typography variant="subtitle2">{` - ${getDayName()}`}</Typography>
                    )}
                </Stack>
                {getDayComp()}
            </Stack>
        </Paper>
    );
};

export default CalendarDay;
