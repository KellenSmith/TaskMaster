"use client";

import { FC, use, useMemo, useCallback } from "react";
import { Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CalendarEvent from "./CalendarEvent";
import dayjs from "dayjs";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { Prisma } from "../../../prisma/generated/browser";

interface CalendarDayProps {
    tzDate: dayjs.Dayjs;
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
}

const CalendarDay: FC<CalendarDayProps> = ({ tzDate, eventsPromise }) => {
    const events = use(eventsPromise);
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const shouldShowEvent = useCallback(
        (event: Prisma.EventGetPayload<true>) => {
            // Evaluate event visibility against the displayed timezone day, then compare in UTC.
            const dayUtcStart = dayjs.utc(tzDate.startOf("day"));
            const dayUtcEnd = dayjs.utc(tzDate.add(1, "day").startOf("day"));

            const eventUtcStart = dayjs.utc(event.start_time);
            const eventUtcEnd = dayjs.utc(event.end_time);

            // Starts on this timezone day
            const startsOnDay =
                (eventUtcStart.isSame(dayUtcStart) || eventUtcStart.isAfter(dayUtcStart)) &&
                eventUtcStart.isBefore(dayUtcEnd);

            if (startsOnDay) return true;

            // Ends on this timezone day, but not exactly at midnight (start of day)
            const endsOnDayExcludingMidnight =
                eventUtcEnd.isAfter(dayUtcStart) &&
                (eventUtcEnd.isSame(dayUtcEnd) || eventUtcEnd.isBefore(dayUtcEnd));

            if (endsOnDayExcludingMidnight) return true;

            // Spans across the entire timezone day window
            const spansEntireDay =
                eventUtcStart.isBefore(dayUtcStart) && eventUtcEnd.isAfter(dayUtcEnd);

            if (spansEntireDay) return true;
            return false;
        },
        [tzDate],
    );

    const eventsForDay = useMemo(
        () => events.filter((event) => shouldShowEvent(event)),
        [events, shouldShowEvent],
    );

    console.warn(
        "events for date",
        dayjs.utc(tzDate).format(),
        eventsForDay.map((e) => [e.title, e.start_time, e.end_time]),
    );

    const getEmptyDay = () => <Paper key={`empty-end-${tzDate.date()}`} elevation={0} />;

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
        const weekdayIndex = (tzDate.day() + 6) % 7; // map Sunday=0..Saturday=6 to Monday-first index 0..6
        return LanguageTranslations.weekDaysShort[language][weekdayIndex] ?? "";
    };

    return (
        <Paper sx={{ width: "100%", minHeight: { xs: 80, sm: "auto" } }}>
            <Stack spacing={1}>
                <Stack direction="row" alignItems="center">
                    {/* Localized short weekday (Monday-first) */}
                    <Typography padding={1} variant="subtitle2">
                        {`${tzDate.format("D")}`}
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
